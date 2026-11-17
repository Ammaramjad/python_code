import { prisma } from "@/lib/db";
import { adapterFor, type OutboundAdapter } from "@/lib/channel/types";
import { SHOP, STAFF } from "@/lib/demo/catalog";
import { packPieces, quoteTotals } from "@/lib/quote/money";
import { beginSend } from "@/lib/quote/send-state";

function quoteText(quote: {
  number: string;
  revision: number;
  classification: string;
  sku: string;
  productName: string;
  requestedQty: number;
  suppliedQty: number;
  boxes: number;
  unitsPerBox: number;
  unitPriceTwd: number;
  subtotal: number;
  tax: number;
  total: number;
  deliveryNote: string;
  validUntil: Date;
  differences: string | null;
  stockWarning: string | null;
}) {
  const kind = quote.classification === "substitute" ? "替代品提案" : "相同品報價";
  const lines = [
    `【${SHOP.name}】${kind}`,
    `報價單 ${quote.number} 第 ${quote.revision} 版`,
    `${quote.sku} ${quote.productName}`,
    `需要 ${quote.requestedQty} 片，每箱 ${quote.unitsPerBox} 片，報價 ${quote.boxes} 箱（供應 ${quote.suppliedQty} 片）`,
    `單價 ${quote.unitPriceTwd} 元，小計 ${quote.subtotal} 元，稅額 ${quote.tax} 元，合計 ${quote.total} 元`,
    `交貨：${quote.deliveryNote}`,
    `有效期限 ${quote.validUntil.toISOString().slice(0, 10)}（Asia/Taipei 計算）`,
  ];
  if (quote.classification === "substitute") {
    lines.push(`這是替代品，不是已驗證的相同品。差異：${quote.differences ?? "請看人員說明"}。`);
    lines.push("請明示接受或拒絕。未接受前不會記成成交。");
  }
  if (quote.stockWarning) lines.push(`庫存提醒：${quote.stockWarning}`);
  return lines.join("\n");
}

export async function createDraftQuote(inquiryId: string) {
  const inquiry = await prisma.inquiry.findUniqueOrThrow({
    where: { id: inquiryId },
    include: { fields: true, customer: true, candidates: true },
  });
  if (inquiry.status === "unresolved") throw new Error("未成交的詢問不能開立相同品報價");
  if (!inquiry.matchClass || !inquiry.selectedProductId) throw new Error("請先驗證相同品或指定替代品");
  if (inquiry.matchClass === "verified_replacement" && inquiry.status === "unresolved") {
    throw new Error("不能為未成交案件建立相同品報價");
  }
  const product = await prisma.product.findUniqueOrThrow({ where: { id: inquiry.selectedProductId } });
  const candidate = inquiry.candidates.find((item) => item.productId === product.id);
  if (inquiry.matchClass === "verified_replacement") {
    if (candidate?.exactBlockedReason) throw new Error(candidate.exactBlockedReason);
    if (product.discontinued || product.stockBoxes <= 0) {
      throw new Error("停產或缺貨不能報價為現貨相同品");
    }
    const marking = inquiry.fields.find((field) => field.key === "marking")?.confirmedValue;
    if (!inquiry.sampleChecked && marking?.toUpperCase() !== product.marking.toUpperCase()) {
      throw new Error("相同品報價需要人員確認的印字，或勾選實體樣品比對");
    }
  }
  const qtyField = inquiry.fields.find((field) => field.key === "quantity");
  if (!qtyField?.confirmedValue) throw new Error("請人員先確認數量");
  const unit = inquiry.fields.find((field) => field.key === "quantityUnit")?.confirmedValue ?? "piece";
  let pieces = Number(qtyField.confirmedValue);
  if (unit === "box") pieces *= product.unitsPerBox;
  const pack = packPieces(pieces, product.unitsPerBox);
  if (inquiry.matchClass === "substitute" && product.stockBoxes < pack.boxes) {
    throw new Error("替代品庫存不足，不能送出提案");
  }
  const shop = await prisma.shop.findUniqueOrThrow({ where: { id: SHOP.id } });
  const totals = quoteTotals({
    suppliedPieces: pack.suppliedPieces,
    unitPriceTwd: product.unitPriceTwd,
    taxRateBps: shop.taxRateBps,
  });
  const stockWarning =
    product.stockBoxes < pack.boxes ? `需求 ${pack.boxes} 箱，庫存 ${product.stockBoxes} 箱` : null;
  const delivery =
    inquiry.fields.find((field) => field.key === "delivery")?.confirmedValue ??
    inquiry.fields.find((field) => field.key === "delivery")?.extractedValue ??
    "自取";
  const existing = await prisma.quote.findFirst({
    where: { inquiryId, status: { in: ["draft", "approved", "sending"] } },
    orderBy: { revision: "desc" },
  });
  if (existing) return existing;
  const numberBase = await prisma.quote.findFirst({ where: { inquiryId }, orderBy: { revision: "desc" } });
  const distinct = await prisma.quote.findMany({ distinct: ["number"], select: { number: true } });
  const number = numberBase?.number ?? `${shop.code}-202611-${String(distinct.length + 1).padStart(3, "0")}`;
  const revision = (numberBase?.revision ?? 0) + 1;
  const validUntil = new Date(Date.now() + shop.quoteValidDays * 86_400_000);
  const quote = await prisma.quote.create({
    data: {
      id: crypto.randomUUID(),
      inquiryId,
      number,
      revision,
      status: "draft",
      classification: inquiry.matchClass,
      customerRef: `${inquiry.customer.displayName} / ${inquiry.id}`,
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      requestedQty: pack.requestedPieces,
      suppliedQty: pack.suppliedPieces,
      boxes: pack.boxes,
      unitsPerBox: pack.unitsPerBox,
      qtyUnit: "箱",
      unitPriceTwd: product.unitPriceTwd,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      taxRateBps: shop.taxRateBps,
      deliveryNote: delivery,
      stockWarning,
      differences: candidate?.differences ?? null,
      validUntil,
      createdAt: new Date(),
      lines: {
        create: {
          id: crypto.randomUUID(),
          sku: product.sku,
          name: product.name,
          qty: pack.suppliedPieces,
          unit: "片",
          unitPrice: product.unitPriceTwd,
          lineTotal: totals.subtotal,
        },
      },
    },
  });
  await prisma.auditEvent.create({
    data: {
      id: crypto.randomUUID(),
      inquiryId,
      at: new Date(),
      actor: STAFF.name,
      action: "quote_draft",
      detail: `${quote.number} 第 ${quote.revision} 版草稿，${quote.classification}`,
    },
  });
  return quote;
}

export async function updateDraft(input: { quoteId: string; deliveryNote: string; requestedQty: number }) {
  const quote = await prisma.quote.findUniqueOrThrow({ where: { id: input.quoteId } });
  if (quote.status !== "draft") throw new Error("已核准的版本不能修改，請開新版本");
  const product = await prisma.product.findUniqueOrThrow({ where: { id: quote.productId } });
  const pack = packPieces(input.requestedQty, product.unitsPerBox);
  const totals = quoteTotals({
    suppliedPieces: pack.suppliedPieces,
    unitPriceTwd: product.unitPriceTwd,
    taxRateBps: quote.taxRateBps,
  });
  const stockWarning = product.stockBoxes < pack.boxes ? `需求 ${pack.boxes} 箱，庫存 ${product.stockBoxes} 箱` : null;
  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      requestedQty: pack.requestedPieces,
      suppliedQty: pack.suppliedPieces,
      boxes: pack.boxes,
      deliveryNote: input.deliveryNote,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      stockWarning,
    },
  });
  await prisma.quoteLine.updateMany({
    where: { quoteId: quote.id },
    data: { qty: pack.suppliedPieces, lineTotal: totals.subtotal },
  });
}

export async function approveQuote(quoteId: string) {
  const quote = await prisma.quote.findUniqueOrThrow({ where: { id: quoteId }, include: { inquiry: { include: { fields: true } } } });
  if (quote.status !== "draft") throw new Error("只有草稿可以核准");
  if (quote.inquiry.status === "unresolved") throw new Error("未成交案件不能核准報價");
  const qty = quote.inquiry.fields.find((field) => field.key === "quantity")?.confirmedValue;
  if (!qty) throw new Error("請先確認數量");
  if (quote.classification === "verified_replacement" && quote.inquiry.matchClass !== "verified_replacement") {
    throw new Error("相同品報價需要人員驗證");
  }
  const payload = JSON.stringify({
    number: quote.number,
    revision: quote.revision,
    sku: quote.sku,
    total: quote.total,
    suppliedQty: quote.suppliedQty,
    classification: quote.classification,
  });
  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: "approved", approvedAt: new Date(), approvedBy: STAFF.name, payloadJson: payload },
  });
  await prisma.inquiry.update({
    where: { id: quote.inquiryId },
    data: { handlingSeconds: { increment: 120 }, updatedAt: new Date() },
  });
  await prisma.auditEvent.create({
    data: {
      id: crypto.randomUUID(),
      inquiryId: quote.inquiryId,
      at: new Date(),
      actor: STAFF.name,
      action: "quote_approved",
      detail: `${quote.number} 第 ${quote.revision} 版已核准，內容已凍結`,
    },
  });
}

export async function reviseQuote(quoteId: string) {
  const quote = await prisma.quote.findUniqueOrThrow({ where: { id: quoteId } });
  if (quote.status === "draft") throw new Error("草稿可直接修改");
  if (quote.payloadJson == null && quote.status === "approved") {
    throw new Error("缺少凍結內容");
  }
  const copy = await prisma.quote.create({
    data: {
      id: crypto.randomUUID(),
      inquiryId: quote.inquiryId,
      number: quote.number,
      revision: quote.revision + 1,
      status: "draft",
      classification: quote.classification,
      customerRef: quote.customerRef,
      productId: quote.productId,
      sku: quote.sku,
      productName: quote.productName,
      requestedQty: quote.requestedQty,
      suppliedQty: quote.suppliedQty,
      boxes: quote.boxes,
      unitsPerBox: quote.unitsPerBox,
      qtyUnit: quote.qtyUnit,
      unitPriceTwd: quote.unitPriceTwd,
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      taxRateBps: quote.taxRateBps,
      deliveryNote: quote.deliveryNote,
      stockWarning: quote.stockWarning,
      differences: quote.differences,
      validUntil: quote.validUntil,
      createdAt: new Date(),
      lines: {
        create: {
          id: crypto.randomUUID(),
          sku: quote.sku,
          name: quote.productName,
          qty: quote.suppliedQty,
          unit: "片",
          unitPrice: quote.unitPriceTwd,
          lineTotal: quote.subtotal,
        },
      },
    },
  });
  await prisma.quote.update({ where: { id: quote.id }, data: { replacedById: copy.id } });
  await prisma.auditEvent.create({
    data: {
      id: crypto.randomUUID(),
      inquiryId: quote.inquiryId,
      at: new Date(),
      actor: STAFF.name,
      action: "quote_revised",
      detail: `${quote.number} 第 ${quote.revision} 版保留不變，新草稿為第 ${copy.revision} 版`,
    },
  });
  return copy;
}

export async function sendQuote(quoteId: string, adapter?: OutboundAdapter) {
  const current = await prisma.quote.findUniqueOrThrow({ where: { id: quoteId }, include: { inquiry: { include: { customer: true } } } });
  if (current.replacedById) {
    return { ok: false as const, reason: "duplicate" as const, quote: current };
  }
  const decision = beginSend(current.status as "approved");
  if (!decision.ok) {
    return { ok: false as const, reason: decision.reason, quote: current };
  }
  const idempotencyKey = `send:${current.id}:r${current.revision}`;
  const locked = await prisma.quote.updateMany({
    where: { id: quoteId, status: "approved" },
    data: { status: "sending", idempotencyKey },
  });
  if (locked.count === 0) {
    const again = await prisma.quote.findUniqueOrThrow({ where: { id: quoteId } });
    return { ok: false as const, reason: "duplicate" as const, quote: again };
  }
  const channel = adapter ?? adapterFor("simulator");
  if (channel.channel === "line" && !current.inquiry.customer.lineUserId) {
    await prisma.quote.update({ where: { id: quoteId }, data: { status: "approved", sendError: "沒有 LINE 使用者" } });
    return { ok: false as const, reason: "no_line_user" as const, quote: current };
  }
  let result: { ok: true } | { ok: false; error: string };
  try {
    result = await channel.send({
      to: channel.channel === "line" ? (current.inquiry.customer.lineUserId as string) : `simulator:${current.inquiryId}`,
      text: quoteText(current),
      idempotencyKey,
    });
  } catch {
    result = { ok: false, error: "adapter threw" };
  }
  if (!result.ok) {
    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: "approved", sendError: result.error, idempotencyKey: null },
    });
    await prisma.auditEvent.create({
      data: {
        id: crypto.randomUUID(),
        inquiryId: current.inquiryId,
        at: new Date(),
        actor: STAFF.name,
        action: "quote_send_failed",
        detail: result.error,
      },
    });
    return { ok: false as const, reason: result.error, quote: current };
  }
  await prisma.message.create({
    data: {
      id: crypto.randomUUID(),
      inquiryId: current.inquiryId,
      direction: "outbound",
      sender: "staff",
      body: quoteText(current),
      kind: "quote",
      channel: channel.channel,
      status: "sent",
      quoteId: current.id,
      externalId: `out-${idempotencyKey}`,
      createdAt: new Date(),
    },
  });
  const sent = await prisma.quote.update({
    where: { id: quoteId },
    data: { status: "sent", sentAt: new Date(), sendError: null },
  });
  await prisma.inquiry.update({
    where: { id: current.inquiryId },
    data: { status: "quoted", updatedAt: new Date() },
  });
  await prisma.auditEvent.create({
    data: {
      id: crypto.randomUUID(),
      inquiryId: current.inquiryId,
      at: new Date(),
      actor: STAFF.name,
      action: "quote_sent",
      detail: `${sent.number} 經 ${channel.channel} 送出`,
    },
  });
  return { ok: true as const, quote: sent };
}

export async function respondToQuote(input: { quoteId: string; accept: boolean }) {
  const quote = await prisma.quote.findUniqueOrThrow({ where: { id: input.quoteId } });
  if (quote.status !== "sent" && quote.status !== "accepted" && quote.status !== "declined") {
    throw new Error("報價尚未送出");
  }
  if (quote.status === "accepted" || quote.status === "declined") return quote;
  if (quote.classification === "substitute" && input.accept === false) {
    await prisma.quote.update({ where: { id: quote.id }, data: { status: "declined", respondedAt: new Date() } });
    await prisma.inquiry.update({ where: { id: quote.inquiryId }, data: { status: "declined", updatedAt: new Date() } });
  } else if (input.accept) {
    await prisma.quote.update({ where: { id: quote.id }, data: { status: "accepted", respondedAt: new Date() } });
    await prisma.inquiry.update({ where: { id: quote.inquiryId }, data: { status: "accepted", updatedAt: new Date() } });
  } else {
    await prisma.quote.update({ where: { id: quote.id }, data: { status: "declined", respondedAt: new Date() } });
    await prisma.inquiry.update({ where: { id: quote.inquiryId }, data: { status: "declined", updatedAt: new Date() } });
  }
  await prisma.message.create({
    data: {
      id: crypto.randomUUID(),
      inquiryId: quote.inquiryId,
      direction: "inbound",
      sender: "customer",
      body: input.accept ? "我接受這張報價。" : "我先不接受這張報價。",
      kind: "text",
      channel: "simulator",
      status: "received",
      createdAt: new Date(),
    },
  });
  await prisma.auditEvent.create({
    data: {
      id: crypto.randomUUID(),
      inquiryId: quote.inquiryId,
      at: new Date(),
      actor: "customer",
      action: input.accept ? "customer_accept" : "customer_decline",
      detail: quote.classification === "substitute" ? "替代品須明示同意" : "客戶回覆報價",
    },
  });
  return prisma.quote.findUniqueOrThrow({ where: { id: quote.id } });
}
