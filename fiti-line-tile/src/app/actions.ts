"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { validateCatalogCsv } from "@/lib/csv";
import { paintPng, RECIPES } from "@/lib/matching/image";
import { closeUnresolved, proposeSubstitute, setDraft, setSampleChecked, verifyReplacement } from "@/server/decisions";
import { addCustomerMessage, sendFollowUp } from "@/server/inbound";
import { confirmField } from "@/server/matching-service";
import { approveQuote, createDraftQuote, respondToQuote, reviseQuote, sendQuote, updateDraft } from "@/server/quote-service";
import { createFreshInquiry, resetDemo } from "@/server/seed-demo";

function fail(error: unknown) {
  return { ok: false as const, error: error instanceof Error ? error.message : "操作失敗" };
}

function refresh(inquiryId?: string) {
  revalidatePath("/");
  revalidatePath("/staff");
  revalidatePath("/metrics");
  revalidatePath("/catalog");
  if (inquiryId) {
    revalidatePath(`/staff/inquiries/${inquiryId}`);
    revalidatePath(`/line/${inquiryId}`);
  }
}

export async function resetDemoAction() {
  await resetDemo();
  refresh();
}

export async function confirmFieldAction(inquiryId: string, key: string, value: string) {
  try {
    await confirmField({ inquiryId, key, value });
    refresh(inquiryId);
    return { ok: true as const };
  } catch (error) {
    return fail(error);
  }
}

export async function saveDraftAction(inquiryId: string, text: string) {
  await setDraft(inquiryId, text);
  refresh(inquiryId);
  return { ok: true as const };
}

export async function sendFollowUpAction(inquiryId: string, text: string) {
  try {
    await sendFollowUp(inquiryId, text);
    refresh(inquiryId);
    return { ok: true as const };
  } catch (error) {
    return fail(error);
  }
}

export async function verifyAction(inquiryId: string, productId: string) {
  try {
    await verifyReplacement(inquiryId, productId);
    refresh(inquiryId);
    return { ok: true as const };
  } catch (error) {
    return fail(error);
  }
}

export async function substituteAction(inquiryId: string, productId: string) {
  try {
    await proposeSubstitute(inquiryId, productId);
    refresh(inquiryId);
    return { ok: true as const };
  } catch (error) {
    return fail(error);
  }
}

export async function unresolvedAction(inquiryId: string, reason: string) {
  try {
    await closeUnresolved(inquiryId, reason);
    refresh(inquiryId);
    return { ok: true as const };
  } catch (error) {
    return fail(error);
  }
}

export async function sampleAction(inquiryId: string, checked: boolean) {
  await setSampleChecked(inquiryId, checked);
  refresh(inquiryId);
  return { ok: true as const };
}

export async function draftQuoteAction(inquiryId: string) {
  try {
    const quote = await createDraftQuote(inquiryId);
    refresh(inquiryId);
    return { ok: true as const, quoteId: quote.id };
  } catch (error) {
    return fail(error);
  }
}

export async function updateQuoteAction(quoteId: string, inquiryId: string, deliveryNote: string, requestedQty: number) {
  try {
    await updateDraft({ quoteId, deliveryNote, requestedQty });
    refresh(inquiryId);
    return { ok: true as const };
  } catch (error) {
    return fail(error);
  }
}

export async function approveQuoteAction(quoteId: string, inquiryId: string) {
  try {
    await approveQuote(quoteId);
    refresh(inquiryId);
    return { ok: true as const };
  } catch (error) {
    return fail(error);
  }
}

export async function reviseQuoteAction(quoteId: string, inquiryId: string) {
  try {
    await reviseQuote(quoteId);
    refresh(inquiryId);
    return { ok: true as const };
  } catch (error) {
    return fail(error);
  }
}

export async function sendQuoteAction(quoteId: string, inquiryId: string) {
  try {
    const result = await sendQuote(quoteId);
    refresh(inquiryId);
    if (!result.ok) return { ok: false as const, error: result.reason };
    return { ok: true as const };
  } catch (error) {
    return fail(error);
  }
}

export async function customerReplyAction(inquiryId: string, body: string) {
  try {
    await addCustomerMessage({ inquiryId, body, channel: "simulator" });
    refresh(inquiryId);
    return { ok: true as const };
  } catch (error) {
    return fail(error);
  }
}

export async function customerPhotoAction(inquiryId: string, formData: FormData) {
  try {
    const file = formData.get("photo");
    const note = String(formData.get("note") ?? "客戶補了一張照片");
    if (!(file instanceof File)) return { ok: false as const, error: "請選擇圖片" };
    const mime = file.type === "image/jpeg" ? "image/jpeg" : "image/png";
    const buffer = Buffer.from(await file.arrayBuffer());
    await addCustomerMessage({
      inquiryId,
      body: note,
      channel: "simulator",
      image: { buffer, mime },
    });
    refresh(inquiryId);
    return { ok: true as const };
  } catch (error) {
    return fail(error);
  }
}

export async function quoteDecisionAction(quoteId: string, inquiryId: string, accept: boolean) {
  try {
    await respondToQuote({ quoteId, accept });
    refresh(inquiryId);
    return { ok: true as const };
  } catch (error) {
    return fail(error);
  }
}

const freshSchema = z.object({
  name: z.string().min(1),
  body: z.string().min(2),
});

export async function freshInquiryAction(name: string, body: string) {
  const parsed = freshSchema.safeParse({ name, body });
  if (!parsed.success) return { ok: false as const, error: "請填寫客戶名稱與詢問內容" };
  const id = await createFreshInquiry(parsed.data);
  refresh(id);
  return { ok: true as const, id };
}

const productSchema = z.object({
  sku: z.string().min(3),
  name: z.string().min(1),
  brand: z.string().min(1),
  widthMm: z.coerce.number().int().positive(),
  heightMm: z.coerce.number().int().positive(),
  finish: z.enum(["matte", "glossy", "textured"]),
  color: z.string().min(1),
  marking: z.string().min(2),
  unitsPerBox: z.coerce.number().int().positive(),
  stockBoxes: z.coerce.number().int().min(0),
  unitPriceTwd: z.coerce.number().int().positive(),
  active: z.boolean(),
  discontinued: z.boolean(),
});

export async function saveProductAction(input: z.infer<typeof productSchema> & { id?: string }) {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "請檢查必填欄位" };
  const dup = await prisma.product.findUnique({ where: { sku: parsed.data.sku.toUpperCase() } });
  if (dup && dup.id !== input.id) return { ok: false as const, error: "SKU 重複" };
  const painted = paintPng(parsed.data.finish === "glossy" ? RECIPES.woodLight : parsed.data.finish === "textured" ? RECIPES.speckBlue : RECIPES.stoneBeige);
  const data = {
    ...parsed.data,
    sku: parsed.data.sku.toUpperCase(),
    imagePath: dup?.imagePath ?? "/tiles/FT-3030-MAT-A.png",
    visualVector: dup?.visualVector ?? JSON.stringify(painted.vector),
    similarGroup: dup?.similarGroup ?? "manual",
    isDemo: true,
  };
  if (input.id) {
    await prisma.product.update({ where: { id: input.id }, data });
  } else {
    await prisma.product.create({ data: { ...data, id: crypto.randomUUID() } });
  }
  refresh();
  return { ok: true as const };
}

export async function previewCsvAction(csv: string) {
  const existing = await prisma.product.findMany({ select: { sku: true } });
  const result = validateCatalogCsv(csv, existing.map((item) => item.sku));
  return result;
}

export async function applyCsvAction(csv: string) {
  const existing = await prisma.product.findMany({ select: { sku: true } });
  const result = validateCatalogCsv(csv, existing.map((item) => item.sku));
  if (result.issues.length || result.rows.length === 0) {
    return { ok: false as const, issues: result.issues, error: "尚未套用。請先修正列錯誤。" };
  }
  for (const row of result.rows) {
    const painted = paintPng(RECIPES.stoneBeige);
    await prisma.product.create({
      data: {
        id: crypto.randomUUID(),
        sku: row.sku,
        name: row.name,
        brand: row.brand,
        widthMm: row.widthMm,
        heightMm: row.heightMm,
        finish: row.finish,
        color: row.color,
        marking: row.marking,
        unitsPerBox: row.unitsPerBox,
        stockBoxes: row.stockBoxes,
        active: row.active === "true" || row.active === "1" || row.active === "yes",
        discontinued: row.discontinued === "true" || row.discontinued === "1" || row.discontinued === "yes",
        unitPriceTwd: row.unitPriceTwd,
        imagePath: "/tiles/FT-3030-MAT-A.png",
        visualVector: JSON.stringify(painted.vector),
        similarGroup: "import",
        isDemo: true,
      },
    });
  }
  refresh();
  return { ok: true as const, count: result.rows.length, issues: [] as { row: number; message: string }[] };
}
