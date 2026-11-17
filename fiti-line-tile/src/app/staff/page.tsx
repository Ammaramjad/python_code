import Link from "next/link";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { formatTaipei } from "@/lib/format";
import { missingLabels } from "@/server/matching-service";
import { freshInquiryAction } from "../actions";

const FILTERS = [
  ["pending_review", "待審核", "Pending"],
  ["waiting_customer", "等待客戶", "Waiting"],
  ["quoted", "已報價", "Quoted"],
  ["accepted", "已接受", "Accepted"],
  ["unresolved", "未成交", "Unresolved"],
];

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const where =
    status === "unresolved"
      ? { status: { in: ["unresolved", "declined"] } }
      : status
        ? { status }
        : {};
  const inquiries = await prisma.inquiry.findMany({
    where,
    include: { customer: true, messages: { orderBy: { createdAt: "desc" }, take: 1 }, fields: true },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">人員收件匣</h1>
        <p className="en">Staff inbox · synthetic customers</p>
      </header>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link className="rounded border bg-white px-2 py-1" href="/staff">全部 All</Link>
        {FILTERS.map(([value, zh, en]) => (
          <Link key={value} className="rounded border bg-white px-2 py-1" href={`/staff?status=${value}`}>{zh} / {en}</Link>
        ))}
      </div>
      {inquiries.length === 0 ? <p className="rounded bg-white p-4">這個篩選沒有案件。</p> : null}
      <ul className="space-y-2">
        {inquiries.map((inquiry) => {
          const missing = missingLabels(inquiry.fields, inquiry.sampleChecked);
          const latest = inquiry.messages[0];
          return (
            <li key={inquiry.id} className="rounded-xl bg-white p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Link className="font-semibold underline" href={`/staff/inquiries/${inquiry.id}`}>{inquiry.customer.displayName}</Link>
                <StatusBadge value={inquiry.status} />
                <span className="text-sm">{inquiry.category}</span>
              </div>
              <p className="break-words text-sm text-stone-700">{latest ? latest.body : "尚無訊息"}</p>
              <p className="text-xs text-stone-500">{latest ? formatTaipei(latest.createdAt) : ""} · 尚缺 {missing.join("、") || "無"}</p>
            </li>
          );
        })}
      </ul>
      <form
        className="space-y-2 rounded-xl bg-white p-4"
        action={async (formData) => {
          "use server";
          const result = await freshInquiryAction(String(formData.get("name") ?? ""), String(formData.get("body") ?? ""));
          if (result.ok) {
            const { redirect } = await import("next/navigation");
            redirect(`/staff/inquiries/${result.id}`);
          }
        }}
      >
        <h2 className="font-semibold">新詢問 / New inquiry</h2>
        <input name="name" required placeholder="客戶名稱" className="w-full rounded border px-2 py-1" />
        <textarea name="body" required placeholder="例如：約 30 公分，要補 6 片" className="w-full rounded border px-2 py-1" rows={3} />
        <button className="rounded bg-stone-900 px-3 py-2 text-white" type="submit">建立並進入管道 / Create</button>
      </form>
      <p className="text-sm"><a className="underline" href="/api/export/inquiries">下載詢問 CSV</a> · <a className="underline" href="/api/export/quotes">下載報價 CSV</a></p>
    </div>
  );
}
