import { prisma } from "@/lib/db";
import { extractFromText } from "@/lib/matching/extract";
import { nextFollowUp } from "@/lib/matching/followup";
import { cosine } from "@/lib/matching/image";
import { rankCandidates, type FieldMap } from "@/lib/matching/rank";
import { STAFF } from "@/lib/demo/catalog";

const FIELD_KEYS = [
  "widthMm",
  "heightMm",
  "sizeHintMm",
  "measurementKind",
  "finish",
  "marking",
  "quantity",
  "quantityUnit",
  "delivery",
] as const;

export async function applyExtraction(inquiryId: string, text: string, sourceMessageId: string) {
  const extracted = extractFromText(text);
  for (const item of extracted) {
    const existing = await prisma.extractedField.findUnique({
      where: { inquiryId_key: { inquiryId, key: item.key } },
    });
    if (!existing) {
      await prisma.extractedField.create({
        data: {
          id: `fld-${inquiryId}-${item.key}`,
          inquiryId,
          key: item.key,
          extractedValue: item.value,
          status: "extracted",
          sourceMessageId,
        },
      });
      continue;
    }
    if (existing.confirmedValue) continue;
    await prisma.extractedField.update({
      where: { id: existing.id },
      data: { extractedValue: item.value, status: "extracted", sourceMessageId },
    });
  }
}

export async function recomputeInquiry(inquiryId: string, actor = "system") {
  const inquiry = await prisma.inquiry.findUniqueOrThrow({
    where: { id: inquiryId },
    include: { fields: true, attachments: true },
  });
  const products = await prisma.product.findMany();
  const fields: FieldMap = {};
  for (const field of inquiry.fields) {
    const value = field.confirmedValue ?? field.extractedValue;
    if (!value) continue;
    const kind =
      field.key === "measurementKind"
        ? (value as "confirmed" | "approximate")
        : field.confirmedValue
          ? "confirmed"
          : "approximate";
    fields[field.key] = { value, kind };
  }
  if (fields.widthMm?.kind === "confirmed" && fields.heightMm?.kind === "confirmed") {
    fields.measurementKind = { value: "confirmed", kind: "confirmed" };
  }
  const latestImage = [...inquiry.attachments].reverse().find((item) => item.visualVector);
  const imageVector = latestImage?.visualVector ? (JSON.parse(latestImage.visualVector) as number[]) : null;
  const ranked = rankCandidates({
    products: products.map((product) => ({
      ...product,
      visualVector: JSON.parse(product.visualVector) as number[],
    })),
    fields,
    imageVector,
  });
  const previous = await prisma.candidate.findMany({
    where: { inquiryId },
    orderBy: { rank: "asc" },
  });
  const kept = new Map(previous.map((item) => [item.productId, item.classification]));
  await prisma.candidate.deleteMany({ where: { inquiryId } });
  await prisma.candidate.createMany({
    data: ranked.map((item, index) => ({
      id: `cand-${inquiryId}-${item.productId}`,
      inquiryId,
      productId: item.productId,
      rank: index + 1,
      score: item.score,
      evidenceJson: JSON.stringify(item.signals),
      conflictsJson: JSON.stringify(item.conflicts),
      exactBlockedReason: item.exactBlockedReason,
      stockNote: item.stockNote,
      classification: kept.get(item.productId) ?? "candidate",
      differences: item.differences,
    })),
  });
  const imageWeak =
    !imageVector ||
    Math.max(
      ...products.map((product) => cosine(imageVector, JSON.parse(product.visualVector) as number[])),
      0,
    ) < 0.55;
  const follow = nextFollowUp({ fields, candidates: ranked, imageWeak });
  const top3 = ranked.map((item) => item.sku);
  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: {
      top3Snapshot: JSON.stringify(top3),
      draftFollowUp: inquiry.draftEdited ? inquiry.draftFollowUp : follow.question,
      updatedAt: new Date(),
    },
  });
  await prisma.auditEvent.create({
    data: {
      id: crypto.randomUUID(),
      inquiryId,
      at: new Date(),
      actor,
      action: "rerank",
      detail: `候選順序：${top3.join(" > ") || "（無）"}。追問理由：${follow.reason}`,
    },
  });
  return { top3, follow };
}

export async function confirmField(input: {
  inquiryId: string;
  key: string;
  value: string;
  actor?: string;
}) {
  if (!FIELD_KEYS.includes(input.key as (typeof FIELD_KEYS)[number])) {
    throw new Error("Unknown field");
  }
  const value = input.value.trim();
  if (!value) throw new Error("請輸入內容");
  const existing = await prisma.extractedField.findUnique({
    where: { inquiryId_key: { inquiryId: input.inquiryId, key: input.key } },
  });
  const extracted = existing?.extractedValue ?? null;
  const status = extracted && extracted !== value ? "corrected" : "confirmed";
  if (!existing) {
    await prisma.extractedField.create({
      data: {
        id: `fld-${input.inquiryId}-${input.key}`,
        inquiryId: input.inquiryId,
        key: input.key,
        extractedValue: null,
        confirmedValue: value,
        status,
      },
    });
  } else {
    await prisma.extractedField.update({
      where: { id: existing.id },
      data: { confirmedValue: value, status },
    });
  }
  await prisma.auditEvent.create({
    data: {
      id: crypto.randomUUID(),
      inquiryId: input.inquiryId,
      at: new Date(),
      actor: input.actor ?? STAFF.name,
      action: status === "corrected" ? "correct_field" : "confirm_field",
      detail: `${input.key}：擷取「${extracted ?? "（無）"}」→ 人員「${value}」`,
    },
  });
  await prisma.inquiry.update({
    where: { id: input.inquiryId },
    data: { handlingSeconds: { increment: 60 }, updatedAt: new Date() },
  });
  await recomputeInquiry(input.inquiryId, input.actor ?? STAFF.name);
}

export function missingLabels(fields: { key: string; confirmedValue: string | null; extractedValue: string | null }[], sampleChecked: boolean) {
  const map = new Map(fields.map((field) => [field.key, field]));
  const missing: string[] = [];
  const measure = map.get("measurementKind");
  const width = map.get("widthMm")?.confirmedValue;
  const height = map.get("heightMm")?.confirmedValue;
  const kind = measure?.confirmedValue ?? measure?.extractedValue;
  if (!(width && height) || kind !== "confirmed") missing.push("確認尺寸");
  if (!map.get("marking")?.confirmedValue && !sampleChecked) missing.push("印字或實體樣品");
  if (!map.get("quantity")?.confirmedValue) missing.push("數量");
  return missing;
}
