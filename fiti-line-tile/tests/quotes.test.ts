import { execSync } from "child_process";
import path from "path";
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/lib/db";
import { resetDemo } from "../src/server/seed-demo";
import { confirmField } from "../src/server/matching-service";
import { addCustomerMessage } from "../src/server/inbound";
import { closeUnresolved, proposeSubstitute, verifyReplacement } from "../src/server/decisions";
import { approveQuote, createDraftQuote, sendQuote, updateDraft } from "../src/server/quote-service";

const database = path.resolve(process.cwd(), "data/test.db");

beforeAll(async () => {
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: `file:${database}` },
    stdio: "pipe",
  });
  await resetDemo();
}, 120_000);

describe("quote approval", () => {
  it("sends a substitute once and keeps the approved revision immutable", async () => {
    await confirmField({ inquiryId: "inq-sub", key: "quantity", value: "10" });
    const sub = await prisma.product.findUniqueOrThrow({ where: { sku: "FT-600-SUB" } });
    await proposeSubstitute("inq-sub", sub.id);
    const draft = await createDraftQuote("inq-sub");
    expect(draft.requestedQty).toBe(10);
    expect(draft.boxes).toBe(2);
    expect(draft.suppliedQty).toBe(16);
    expect(draft.classification).toBe("substitute");
    await expect(updateDraft({ quoteId: draft.id, deliveryNote: "到府", requestedQty: 10 })).resolves.toBeUndefined();
    await approveQuote(draft.id);
    await expect(updateDraft({ quoteId: draft.id, deliveryNote: "改地址", requestedQty: 8 })).rejects.toThrow(/不能修改/);
    let calls = 0;
    const adapter = {
      channel: "simulator" as const,
      async send() {
        calls += 1;
        return { ok: true as const };
      },
    };
    const first = await sendQuote(draft.id, adapter);
    const second = await sendQuote(draft.id, adapter);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    expect(calls).toBe(1);
    const stored = await prisma.quote.findUniqueOrThrow({ where: { id: draft.id } });
    expect(stored.status).toBe("sent");
    const messages = await prisma.message.count({ where: { quoteId: draft.id, kind: "quote" } });
    expect(messages).toBe(1);
  });

  it("does not create a verified quote for the unresolved scenario", async () => {
    await expect(closeUnresolved("inq-open", "照片與尺寸衝突")).resolves.toBeUndefined();
    await expect(createDraftQuote("inq-open")).rejects.toThrow();
    const quotes = await prisma.quote.count({ where: { inquiryId: "inq-open", classification: "verified_replacement" } });
    expect(quotes).toBe(0);
  });

  it("reranks the exact scenario through the same pipeline", async () => {
    const before = await prisma.candidate.findMany({ where: { inquiryId: "inq-exact" }, orderBy: { rank: "asc" } });
    const beforeSku = await prisma.product.findUniqueOrThrow({ where: { id: before[0].productId } });
    expect(beforeSku.sku).toBe("FT-3030-MAT-B");
    await addCustomerMessage({
      inquiryId: "inq-exact",
      body: "量過是 300x300 mm，背面印 FT-A30",
      channel: "simulator",
    });
    const after = await prisma.candidate.findMany({ where: { inquiryId: "inq-exact" }, orderBy: { rank: "asc" } });
    const afterSku = await prisma.product.findUniqueOrThrow({ where: { id: after[0].productId } });
    expect(afterSku.sku).toBe("FT-3030-MAT-A");
    await confirmField({ inquiryId: "inq-exact", key: "widthMm", value: "300" });
    await confirmField({ inquiryId: "inq-exact", key: "heightMm", value: "300" });
    await confirmField({ inquiryId: "inq-exact", key: "marking", value: "FT-A30" });
    await confirmField({ inquiryId: "inq-exact", key: "quantity", value: "6" });
    const product = await prisma.product.findUniqueOrThrow({ where: { sku: "FT-3030-MAT-A" } });
    await verifyReplacement("inq-exact", product.id);
    const quote = await createDraftQuote("inq-exact");
    expect(quote.classification).toBe("verified_replacement");
    expect(quote.boxes).toBe(1);
    expect(quote.suppliedQty).toBe(8);
    const failed = {
      channel: "simulator" as const,
      async send() {
        return { ok: false as const, error: "down" };
      },
    };
    await approveQuote(quote.id);
    const attempt = await sendQuote(quote.id, failed);
    expect(attempt.ok).toBe(false);
    const rolled = await prisma.quote.findUniqueOrThrow({ where: { id: quote.id } });
    expect(rolled.status).toBe("approved");
    expect(await prisma.message.count({ where: { quoteId: quote.id } })).toBe(0);
  });
});
