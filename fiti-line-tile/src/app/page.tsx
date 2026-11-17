import Link from "next/link";
import { resetDemoAction } from "./actions";

const steps = [
  ["打開相同品案件", "/staff/inquiries/inq-exact", "客戶只說約 30 公分並附上照片。"],
  ["看候選與阻擋原因", "/staff/inquiries/inq-exact", "外觀接近的淺灰磚會排在前面。"],
  ["送出追問並用模擬器回覆", "/line/inq-exact", "回覆實測尺寸與背面印字後，正確 SKU 會升到第一。"],
  ["人員驗證並送出報價", "/staff/inquiries/inq-exact", "報價回到模擬對話。"],
  ["替代品", "/staff/inquiries/inq-sub", "停產磚改提案有庫存的淺色替代，客戶須明示接受。"],
  ["未成交", "/staff/inquiries/inq-open", "照片和確認尺寸衝突，不會產生相同品報價。"],
];

export default function HomePage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-stone-500">FITI 2027-1 · 合成資料 · Asia/Taipei · TWD</p>
        <h1 className="text-3xl font-semibold">台灣磁磚建材行 LINE 智慧辨識與報價助手</h1>
        <p className="mt-2 max-w-3xl text-stone-700">
          LINE Quotation Assistant for Taiwan’s Tile Suppliers. 給建材行人員處理不知道型號的補磚詢問：排序候選、說明證據、追問、再區分相同品與替代品。
        </p>
      </header>
      <div className="flex flex-wrap gap-3">
        <Link data-testid="run-demo" href="/staff/inquiries/inq-exact" className="rounded-lg bg-stone-900 px-4 py-3 text-white">
          開始示範
          <span className="en">Run demo</span>
        </Link>
        <form action={resetDemoAction}>
          <button data-testid="reset-demo" className="rounded-lg border border-stone-400 bg-white px-4 py-3" type="submit">
            重設示範資料
            <span className="en">Reset demo</span>
          </button>
        </form>
      </div>
      <section className="grid gap-3 md:grid-cols-3">
        {[
          ["/staff/inquiries/inq-exact", "相同品", "Exact replacement", "約 30 公分的照片。追問後印字讓正確 SKU 升到第一。"],
          ["/staff/inquiries/inq-sub", "替代品", "Substitute", "原磚停產。有庫存的淺色木紋必須標成替代品。"],
          ["/staff/inquiries/inq-open", "未成交", "Unresolved", "確認尺寸和照片衝突，不能驗證為相同品。"],
        ].map(([href, zh, en, copy]) => (
          <Link key={href} href={href} className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">{zh}</h2>
            <p className="en">{en}</p>
            <p className="mt-2 text-sm text-stone-700">{copy}</p>
          </Link>
        ))}
      </section>
      <section className="rounded-xl bg-white p-4">
        <h2 className="font-semibold">示範路線 <span className="en">Walkthrough</span></h2>
        <ol className="mt-3 space-y-2 text-sm">
          {steps.map(([label, href, copy]) => (
            <li key={label}>
              <Link className="font-medium underline" href={href}>{label}</Link>
              <span className="text-stone-600"> — {copy}</span>
            </li>
          ))}
        </ol>
      </section>
      <p className="text-sm">
        <Link className="underline" href="/compare">同業公開資料對照</Link>
        {" · "}
        <Link className="underline" href="/metrics">試點指標</Link>
      </p>
    </div>
  );
}
