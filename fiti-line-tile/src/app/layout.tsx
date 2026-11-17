import type { Metadata } from "next";
import { connection } from "next/server";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "台灣磁磚建材行 LINE 智慧辨識與報價助手",
  description: "FITI 2027-1 demo. Synthetic shop data. LINE simulator, not an official account.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection();
  return (
    <html lang="zh-Hant">
      <body>
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
