import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyLineSignature } from "@/lib/channel/line-signature";
import { addCustomerMessage } from "@/server/inbound";

export const runtime = "nodejs";

const MAX_IMAGE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  if (process.env.LINE_ENABLED !== "true") {
    return NextResponse.json({ error: "LINE adapter disabled" }, { status: 503 });
  }
  const raw = await request.text();
  const valid = verifyLineSignature(raw, process.env.LINE_CHANNEL_SECRET ?? "", request.headers.get("x-line-signature"));
  if (!valid) return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  const payload = JSON.parse(raw) as {
    events?: {
      webhookEventId?: string;
      type?: string;
      replyToken?: string;
      source?: { userId?: string };
      message?: { id?: string; type?: string; text?: string };
    }[];
  };
  for (const event of payload.events ?? []) {
    const dedupeKey = event.webhookEventId || event.message?.id;
    if (!dedupeKey) continue;
    try {
      await prisma.webhookEvent.create({
        data: { id: crypto.randomUUID(), dedupeKey, receivedAt: new Date() },
      });
    } catch {
      continue;
    }
    if (event.type !== "message" || !event.source?.userId || !event.message) continue;
    const userId = event.source.userId;
    let customer = await prisma.customer.findFirst({ where: { lineUserId: userId } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { id: crypto.randomUUID(), displayName: "LINE 客戶", lineUserId: userId, isSynthetic: false },
      });
    }
    let inquiry = await prisma.inquiry.findFirst({
      where: { customerId: customer.id, status: { notIn: ["unresolved", "accepted", "declined"] } },
      orderBy: { updatedAt: "desc" },
    });
    if (!inquiry) {
      inquiry = await prisma.inquiry.create({
        data: {
          id: crypto.randomUUID(),
          customerId: customer.id,
          title: "LINE 詢問",
          category: "補磚",
          status: "pending_review",
          isDemo: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    if (event.message.type === "text" && event.message.text) {
      await addCustomerMessage({
        inquiryId: inquiry.id,
        body: event.message.text,
        channel: "line",
        externalId: event.message.id,
      });
    }
    if (event.message.type === "image" && event.message.id) {
      const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
      if (!token) continue;
      const media = await fetch(`https://api-data.line.me/v2/bot/message/${event.message.id}/content`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!media.ok) continue;
      const mime = media.headers.get("content-type") ?? "";
      if (!["image/png", "image/jpeg"].includes(mime)) continue;
      const buffer = Buffer.from(await media.arrayBuffer());
      if (buffer.length > MAX_IMAGE) continue;
      await addCustomerMessage({
        inquiryId: inquiry.id,
        body: "（LINE 照片）",
        channel: "line",
        externalId: event.message.id,
        image: { buffer, mime },
      });
    }
  }
  return NextResponse.json({ ok: true });
}
