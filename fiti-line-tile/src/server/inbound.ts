import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { vectorFromImageBuffer } from "@/lib/matching/image";
import { readImageMarking } from "@/lib/matching/extract";
import { applyExtraction, recomputeInquiry } from "./matching-service";

const MAX_IMAGE = 5 * 1024 * 1024;

export async function addCustomerMessage(input: {
  inquiryId: string;
  body: string;
  channel: "simulator" | "line";
  externalId?: string;
  image?: { buffer: Buffer; mime: string; originalName?: string };
  publicPath?: string;
}) {
  if (input.externalId) {
    const existing = await prisma.message.findUnique({ where: { externalId: input.externalId } });
    if (existing) return existing;
  }
  let attachmentId: string | undefined;
  if (input.image) {
    if (input.image.buffer.length > MAX_IMAGE) throw new Error("圖片超過 5 MB");
    if (!["image/png", "image/jpeg"].includes(input.image.mime)) throw new Error("只接受 PNG 或 JPEG");
    const reading = await readImageMarking();
    if (reading.fabricated) throw new Error("refusing fabricated OCR");
    const vector = input.image.mime === "image/png" ? vectorFromImageBuffer(input.image.buffer) : null;
    const id = crypto.randomUUID();
    const dir = path.join(process.cwd(), "data", "private");
    await mkdir(dir, { recursive: true });
    const storagePath = path.join(dir, `${id}.png`);
    if (!input.publicPath) await writeFile(storagePath, input.image.buffer);
    const attachment = await prisma.attachment.create({
      data: {
        id,
        inquiryId: input.inquiryId,
        storagePath: input.publicPath ? input.publicPath : storagePath,
        publicPath: input.publicPath ?? null,
        mime: input.image.mime,
        sizeBytes: input.image.buffer.length,
        source: input.channel,
        visualVector: vector ? JSON.stringify(vector) : null,
      },
    });
    attachmentId = attachment.id;
  }
  const message = await prisma.message.create({
    data: {
      id: crypto.randomUUID(),
      inquiryId: input.inquiryId,
      direction: "inbound",
      sender: "customer",
      body: input.body,
      kind: input.image ? "image" : "text",
      channel: input.channel,
      status: "received",
      externalId: input.externalId,
      attachmentId,
      createdAt: new Date(),
    },
  });
  await applyExtraction(input.inquiryId, input.body, message.id);
  const inquiry = await prisma.inquiry.findUniqueOrThrow({ where: { id: input.inquiryId } });
  if (inquiry.status === "waiting_customer" || inquiry.status === "quoted") {
    await prisma.inquiry.update({
      where: { id: input.inquiryId },
      data: { status: "pending_review", updatedAt: new Date() },
    });
  }
  await recomputeInquiry(input.inquiryId, "customer");
  return message;
}

export async function sendFollowUp(inquiryId: string, body: string) {
  const text = body.trim();
  if (!text) throw new Error("請輸入追問");
  await prisma.message.create({
    data: {
      id: crypto.randomUUID(),
      inquiryId,
      direction: "outbound",
      sender: "staff",
      body: text,
      kind: "followup",
      channel: "simulator",
      status: "sent",
      createdAt: new Date(),
    },
  });
  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: {
      status: "waiting_customer",
      draftFollowUp: text,
      draftEdited: true,
      handlingSeconds: { increment: 120 },
      updatedAt: new Date(),
    },
  });
  await prisma.auditEvent.create({
    data: {
      id: crypto.randomUUID(),
      inquiryId,
      at: new Date(),
      actor: "林承翰（示範帳號）",
      action: "followup_sent",
      detail: text,
    },
  });
}
