import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatTaipei, formatTaipeiDate, formatTwd } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { SHOP } from "@/lib/demo/catalog";

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { inquiry: { include: { customer: true, audits: { orderBy: { at: "asc" } } } }, lines: true },
  });
  if (!quote) notFound();
  const shop = await prisma.shop.findUnique({ where: { id: SHOP.id } });
  return (
    <article className="mx-auto max-w-3xl bg-white p-6">
      <div className="no-print mb-4 flex gap-3 text-sm">
        <Link href={`/staff/inquiries/${quote.inquiryId}`}>返回案件</Link>
        <a href="/api/export/quotes">CSV</a>
      </div>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold">{shop?.name}</h1>
          <p className="text-sm">{shop?.address} · {shop?.phone} · 統編 {shop?.taxId}</p>
        </div>
        <div className="text-sm">
          <p>報價單 {quote.number}</p>
          <p>版本 {quote.revision}</p>
          <p>日期 {formatTaipeiDate(quote.createdAt)}</p>
          <p>有效至 {formatTaipeiDate(quote.validUntil)}</p>
          <p>客戶 {quote.customerRef}</p>
        </div>
      </header>
      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge value={quote.classification} />
        <StatusBadge value={quote.status} />
      </div>
      {quote.classification === "substitute" ? (
        <p className="mt-3 rounded bg-amber-50 p-3 text-sm">替代品提案。差異：{quote.differences ?? "見人員說明"}。客戶明示接受前，不算成交。</p>
      ) : (
        <p className="mt-3 text-sm">分類：人員驗證的相同品。</p>
      )}
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th>SKU</th><th>品名</th><th>數量</th><th>單價</th><th>金額</th>
          </tr>
        </thead>
        <tbody>
          {quote.lines.map((line) => (
            <tr key={line.id} className="border-b">
              <td className="py-2">{line.sku}</td>
              <td>{line.name}</td>
              <td>{line.qty} {line.unit}</td>
              <td>{formatTwd(line.unitPrice)}</td>
              <td>{formatTwd(line.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-sm">需要 {quote.requestedQty} 片 · 每箱 {quote.unitsPerBox} 片 · 報價 {quote.boxes} 箱 · 供應 {quote.suppliedQty} 片</p>
      <p className="text-sm">交貨：{quote.deliveryNote}</p>
      {quote.stockWarning ? <p className="text-sm text-rose-800">庫存不足，請人員處理：{quote.stockWarning}</p> : null}
      <dl className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between"><dt>小計</dt><dd>{formatTwd(quote.subtotal)}</dd></div>
        <div className="flex justify-between"><dt>稅額（{quote.taxRateBps / 100}%）</dt><dd>{formatTwd(quote.tax)}</dd></div>
        <div className="flex justify-between font-semibold"><dt>合計</dt><dd>{formatTwd(quote.total)}</dd></div>
      </dl>
      <section className="mt-6">
        <h2 className="font-semibold">狀態時間軸</h2>
        <ol className="mt-2 space-y-1 text-sm">
          <li>建立草稿 {formatTaipei(quote.createdAt)}</li>
          <li>人員核准 {quote.approvedAt ? `${formatTaipei(quote.approvedAt)} ${quote.approvedBy}` : "尚未"}</li>
          <li>送出 {quote.sentAt ? formatTaipei(quote.sentAt) : quote.sendError ? `失敗：${quote.sendError}` : "尚未"}</li>
          <li>客戶回覆 {quote.respondedAt ? `${formatTaipei(quote.respondedAt)} ${quote.status}` : "尚未"}</li>
          {quote.inquiry.audits.filter((event) => event.action.startsWith("quote") || event.action.startsWith("customer")).map((event) => (
            <li key={event.id}>{formatTaipei(event.at)} · {event.action} · {event.detail}</li>
          ))}
        </ol>
      </section>
      <p className="no-print mt-6 text-xs text-stone-500">列印時使用瀏覽器列印。金額為整數新台幣。</p>
    </article>
  );
}
