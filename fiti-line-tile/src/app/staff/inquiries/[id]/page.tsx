import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { StaffWorkspace, type WorkspaceData } from "@/components/StaffWorkspace";
import { missingLabels } from "@/server/matching-service";

export default async function InquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: "asc" }, include: { attachment: true } },
      fields: true,
      candidates: { orderBy: { rank: "asc" } },
      quotes: { orderBy: { revision: "asc" } },
      audits: { orderBy: { at: "asc" } },
    },
  });
  if (!inquiry) notFound();
  const products = await prisma.product.findMany({ where: { id: { in: inquiry.candidates.map((item) => item.productId) } } });
  const byId = new Map(products.map((product) => [product.id, product]));
  const data: WorkspaceData = {
    inquiry: {
      id: inquiry.id,
      title: inquiry.title,
      status: inquiry.status,
      category: inquiry.category,
      matchClass: inquiry.matchClass,
      sampleChecked: inquiry.sampleChecked,
      draftFollowUp: inquiry.draftFollowUp,
      closeReason: inquiry.closeReason,
      customer: inquiry.customer.displayName,
      phone: inquiry.customer.phone,
    },
    missing: missingLabels(inquiry.fields, inquiry.sampleChecked),
    messages: inquiry.messages.map((message) => ({
      id: message.id,
      direction: message.direction,
      body: message.body,
      kind: message.kind,
      createdAt: message.createdAt.toISOString(),
      image: message.attachment?.publicPath ?? (message.attachment ? `/api/media/${message.attachment.id}` : null),
    })),
    fields: inquiry.fields.map((field) => ({
      key: field.key,
      extractedValue: field.extractedValue,
      confirmedValue: field.confirmedValue,
      status: field.status,
      sourceMessageId: field.sourceMessageId,
    })),
    candidates: inquiry.candidates.map((candidate) => {
      const product = byId.get(candidate.productId);
      return {
        productId: candidate.productId,
        rank: candidate.rank,
        score: candidate.score,
        sku: product?.sku ?? "",
        name: product?.name ?? "",
        imagePath: product?.imagePath ?? "",
        widthMm: product?.widthMm ?? 0,
        heightMm: product?.heightMm ?? 0,
        finish: product?.finish ?? "",
        stockBoxes: product?.stockBoxes ?? 0,
        unitPriceTwd: product?.unitPriceTwd ?? 0,
        marking: product?.marking ?? "",
        evidence: JSON.parse(candidate.evidenceJson),
        conflicts: JSON.parse(candidate.conflictsJson),
        exactBlockedReason: candidate.exactBlockedReason,
        stockNote: candidate.stockNote,
        classification: candidate.classification,
        differences: candidate.differences,
      };
    }),
    quotes: inquiry.quotes.map((quote) => ({
      id: quote.id,
      number: quote.number,
      revision: quote.revision,
      status: quote.status,
      classification: quote.classification,
      requestedQty: quote.requestedQty,
      suppliedQty: quote.suppliedQty,
      boxes: quote.boxes,
      unitsPerBox: quote.unitsPerBox,
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      deliveryNote: quote.deliveryNote,
      stockWarning: quote.stockWarning,
      differences: quote.differences,
      sku: quote.sku,
      sendError: quote.sendError,
    })),
    audits: inquiry.audits.map((event) => ({
      id: event.id,
      at: event.at.toISOString(),
      actor: event.actor,
      action: event.action,
      detail: event.detail,
    })),
  };
  return <StaffWorkspace data={data} />;
}
