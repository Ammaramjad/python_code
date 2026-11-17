import { prisma } from "@/lib/db";

export async function GET() {
  const inquiries = await prisma.inquiry.findMany({ include: { customer: true } });
  const header = ["id", "customer", "status", "category", "verifiedSku", "matchClass"];
  const lines = inquiries.map((inquiry) =>
    [inquiry.id, inquiry.customer.displayName, inquiry.status, inquiry.category, inquiry.verifiedSku ?? "", inquiry.matchClass ?? ""].join(","),
  );
  return new Response([header.join(","), ...lines].join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=inquiries.csv" },
  });
}
