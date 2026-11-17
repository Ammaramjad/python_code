import { prisma } from "@/lib/db";

export default async function MetricsPage() {
  const inquiries = await prisma.inquiry.findMany({ include: { quotes: true } });
  const verified = inquiries.filter((inquiry) => inquiry.verifiedSku && inquiry.truthSku);
  const hits = verified.filter((inquiry) => {
    const top = JSON.parse(inquiry.top3Snapshot) as string[];
    return inquiry.truthSku ? top.includes(inquiry.truthSku) : false;
  });
  const handling = inquiries.map((inquiry) => inquiry.handlingSeconds).filter((value) => value > 0).sort((a, b) => a - b);
  const median = handling.length ? handling[Math.floor((handling.length - 1) / 2)] : null;
  const falseVerified = inquiries.filter((inquiry) => inquiry.verifiedSku && inquiry.truthSku && inquiry.verifiedSku !== inquiry.truthSku).length;
  const unresolved = inquiries.filter((inquiry) => inquiry.status === "unresolved").length;
  const substituteOffers = inquiries.filter((inquiry) => inquiry.quotes.some((quote) => quote.classification === "substitute" && ["sent", "accepted", "declined"].includes(quote.status))).length;
  const acceptedSubs = inquiries.filter((inquiry) => inquiry.quotes.some((quote) => quote.classification === "substitute" && quote.status === "accepted")).length;
  const quotes = inquiries.flatMap((inquiry) => inquiry.quotes);
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">FITI 試點指標</h1>
        <p className="en">Pilot metrics. Seeded rows are simulated. No live pilot is loaded.</p>
      </header>
      <section className="rounded-xl bg-white p-4">
        <h2 className="font-semibold">實際試點</h2>
        <p className="mt-2 text-lg">Pilot data pending.</p>
        <p className="text-sm text-stone-600">目前沒有真實試點店鋪的計時或召回資料。</p>
      </section>
      <section className="rounded-xl bg-white p-4 text-sm">
        <h2 className="font-semibold">目標（與結果分開）</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>10 間供應商訪談</li>
          <li>2 間試點店</li>
          <li>符合條件的試點案件，前三名召回至少 80%</li>
          <li>可比較詢問的主動處理時間中位數降低 30%</li>
        </ul>
      </section>
      <section className="rounded-xl bg-amber-50 p-4 text-sm">
        <h2 className="font-semibold">本機示範資料庫（simulated）</h2>
        <p className="mt-1">這些數字來自重設後的合成案件，不是試點成果。</p>
        <ul className="mt-2 space-y-1">
          <li>主動處理時間中位數：{median == null ? "尚無人員操作" : `${(median / 60).toFixed(1)} 分`}（不含客戶等待）。樣本 {handling.length}。</li>
          <li>前三名召回：{hits.length} / {verified.length}（分母是已驗證、且標準答案 SKU 在目錄中的示範案件）。</li>
          <li>錯誤的相同品驗證：{falseVerified}</li>
          <li>未成交：{unresolved}</li>
          <li>已送出的替代品提案：{substituteOffers}</li>
          <li>客戶接受的替代品：{acceptedSubs}</li>
          <li>報價張數：{quotes.length}；草稿 {quotes.filter((quote) => quote.status === "draft").length}；已核准 {quotes.filter((quote) => quote.status === "approved").length}；已送出 {quotes.filter((quote) => quote.status === "sent").length}；接受 {quotes.filter((quote) => quote.status === "accepted").length}；拒絕 {quotes.filter((quote) => quote.status === "declined").length}</li>
        </ul>
      </section>
    </div>
  );
}
