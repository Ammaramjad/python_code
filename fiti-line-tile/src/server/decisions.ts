import { prisma } from "@/lib/db";
import { STAFF } from "@/lib/demo/catalog";
import { recomputeInquiry } from "./matching-service";

export async function verifyReplacement(inquiryId: string, productId: string) {
  const candidate = await prisma.candidate.findFirstOrThrow({ where: { inquiryId, productId } });
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  const inquiry = await prisma.inquiry.findUniqueOrThrow({ where: { id: inquiryId }, include: { fields: true } });
  if (inquiry.status === "unresolved") throw new Error("未成交案件不能驗證為相同品");
  if (candidate.exactBlockedReason && !inquiry.sampleChecked) throw new Error(candidate.exactBlockedReason);
  const conflicts = JSON.parse(candidate.conflictsJson) as unknown[];
  if (conflicts.length > 0) throw new Error("確認屬性互相矛盾，不能驗證為相同品");
  if (!product.active || product.discontinued || product.stockBoxes <= 0) {
    throw new Error(candidate.stockNote ?? "沒有現貨，不能驗證為可報價的相同品");
  }
  const marking = inquiry.fields.find((field) => field.key === "marking")?.confirmedValue;
  const width = inquiry.fields.find((field) => field.key === "widthMm")?.confirmedValue;
  const height = inquiry.fields.find((field) => field.key === "heightMm")?.confirmedValue;
  const qty = inquiry.fields.find((field) => field.key === "quantity")?.confirmedValue;
  if (!qty) throw new Error("請先確認數量");
  if (!width || !height) throw new Error("請先確認尺寸");
  if (!inquiry.sampleChecked && marking?.toUpperCase() !== product.marking.toUpperCase()) {
    throw new Error("請確認與產品一致的印字，或勾選實體樣品比對");
  }
  const top3 = JSON.parse(inquiry.top3Snapshot) as string[];
  await prisma.candidate.updateMany({ where: { inquiryId }, data: { classification: "candidate" } });
  await prisma.candidate.update({ where: { id: candidate.id }, data: { classification: "verified_replacement" } });
  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: {
      verifiedSku: product.sku,
      selectedProductId: product.id,
      matchClass: "verified_replacement",
      status: "pending_review",
      handlingSeconds: { increment: 180 },
      updatedAt: new Date(),
    },
  });
  await prisma.auditEvent.create({
    data: {
      id: crypto.randomUUID(),
      inquiryId,
      at: new Date(),
      actor: STAFF.name,
      action: "verified_replacement",
      detail: `人員驗證 ${product.sku}。當時前三名：${top3.join(", ")}。印字 ${marking ?? "（實體樣品）"}`,
    },
  });
}

export async function proposeSubstitute(inquiryId: string, productId: string) {
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  const candidate = await prisma.candidate.findFirstOrThrow({ where: { inquiryId, productId } });
  if (product.stockBoxes <= 0 || product.discontinued || !product.active) {
    throw new Error("替代品必須是有庫存的在售產品");
  }
  await prisma.candidate.updateMany({ where: { inquiryId }, data: { classification: "candidate" } });
  await prisma.candidate.update({ where: { id: candidate.id }, data: { classification: "substitute" } });
  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: {
      selectedProductId: product.id,
      matchClass: "substitute",
      verifiedSku: null,
      handlingSeconds: { increment: 120 },
      updatedAt: new Date(),
    },
  });
  await prisma.auditEvent.create({
    data: {
      id: crypto.randomUUID(),
      inquiryId,
      at: new Date(),
      actor: STAFF.name,
      action: "propose_substitute",
      detail: `提案替代 ${product.sku}。差異：${candidate.differences ?? "見候選卡"}。這不是相同品驗證。`,
    },
  });
}

export async function closeUnresolved(inquiryId: string, reason: string) {
  const text = reason.trim();
  if (text.length < 2) throw new Error("請填寫未成交原因");
  const quotes = await prisma.quote.count({
    where: { inquiryId, classification: "verified_replacement", status: { in: ["approved", "sent", "accepted"] } },
  });
  if (quotes > 0) throw new Error("已有相同品報價");
  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: {
      status: "unresolved",
      closeReason: text,
      matchClass: null,
      verifiedSku: null,
      updatedAt: new Date(),
    },
  });
  await prisma.auditEvent.create({
    data: {
      id: crypto.randomUUID(),
      inquiryId,
      at: new Date(),
      actor: STAFF.name,
      action: "unresolved",
      detail: text,
    },
  });
}

export async function setSampleChecked(inquiryId: string, checked: boolean) {
  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: { sampleChecked: checked, handlingSeconds: { increment: 30 }, updatedAt: new Date() },
  });
  await prisma.auditEvent.create({
    data: {
      id: crypto.randomUUID(),
      inquiryId,
      at: new Date(),
      actor: STAFF.name,
      action: "sample_check",
      detail: checked ? "人員勾選已做實體樣品比對" : "取消實體樣品比對",
    },
  });
  await recomputeInquiry(inquiryId, STAFF.name);
}

export async function setDraft(inquiryId: string, text: string) {
  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: { draftFollowUp: text, draftEdited: true },
  });
}
