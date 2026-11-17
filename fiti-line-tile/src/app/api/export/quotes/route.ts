import { prisma } from "@/lib/db";

export async function GET() {
  const quotes = await prisma.quote.findMany();
  const header = ["number", "revision", "status", "classification", "sku", "requestedQty", "suppliedQty", "boxes", "total"];
  const lines = quotes.map((quote) =>
    [quote.number, quote.revision, quote.status, quote.classification, quote.sku, quote.requestedQty, quote.suppliedQty, quote.boxes, quote.total].join(","),
  );
  return new Response([header.join(","), ...lines].join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=quotes.csv" },
  });
}
