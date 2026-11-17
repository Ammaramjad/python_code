import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { LineSimulator } from "@/components/LineSimulator";

export default async function LinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: "asc" }, include: { attachment: true } },
      quotes: { orderBy: { revision: "desc" } },
    },
  });
  if (!inquiry) notFound();
  const pending = inquiry.quotes.find((quote) => quote.status === "sent" && quote.classification === "substitute");
  return (
    <LineSimulator
      inquiryId={inquiry.id}
      customer={inquiry.customer.displayName}
      replies={JSON.parse(inquiry.suggestedReplies) as string[]}
      pendingSubstituteQuoteId={pending?.id ?? null}
      messages={inquiry.messages.map((message) => ({
        id: message.id,
        direction: message.direction,
        body: message.body,
        createdAt: message.createdAt.toISOString(),
        image: message.attachment?.publicPath ?? (message.attachment ? `/api/media/${message.attachment.id}` : null),
        kind: message.kind,
        quoteId: message.quoteId,
      }))}
    />
  );
}
