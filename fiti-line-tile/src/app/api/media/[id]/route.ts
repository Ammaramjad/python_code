import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment || attachment.publicPath) return NextResponse.json({ error: "not found" }, { status: 404 });
  const bytes = await readFile(attachment.storagePath);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": attachment.mime,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
