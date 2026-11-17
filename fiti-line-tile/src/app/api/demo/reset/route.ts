import { NextResponse } from "next/server";
import { resetDemo } from "@/server/seed-demo";

export async function POST() {
  await resetDemo();
  return NextResponse.json({ ok: true });
}
