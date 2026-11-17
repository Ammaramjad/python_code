"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  approveQuoteAction,
  confirmFieldAction,
  draftQuoteAction,
  reviseQuoteAction,
  sampleAction,
  saveDraftAction,
  sendFollowUpAction,
  sendQuoteAction,
  substituteAction,
  unresolvedAction,
  updateQuoteAction,
  verifyAction,
} from "@/app/actions";
import { StatusBadge } from "./StatusBadge";
import { formatTaipei, formatTwd } from "@/lib/format";

type Signal = { code: string; polarity: string; detail: string };

export type WorkspaceData = {
  inquiry: {
    id: string;
    title: string;
    status: string;
    category: string;
    matchClass: string | null;
    sampleChecked: boolean;
    draftFollowUp: string;
    closeReason: string | null;
    customer: string;
    phone: string | null;
  };
  missing: string[];
  messages: {
    id: string;
    direction: string;
    body: string;
    kind: string;
    createdAt: string;
    image: string | null;
  }[];
  fields: {
    key: string;
    extractedValue: string | null;
    confirmedValue: string | null;
    status: string;
    sourceMessageId: string | null;
  }[];
  candidates: {
    productId: string;
    rank: number;
    score: number;
    sku: string;
    name: string;
    imagePath: string;
    widthMm: number;
    heightMm: number;
    finish: string;
    stockBoxes: number;
    unitPriceTwd: number;
    marking: string;
    evidence: Signal[];
    conflicts: Signal[];
    exactBlockedReason: string | null;
    stockNote: string | null;
    classification: string;
    differences: string | null;
  }[];
  quotes: {
    id: string;
    number: string;
    revision: number;
    status: string;
    classification: string;
    requestedQty: number;
    suppliedQty: number;
    boxes: number;
    unitsPerBox: number;
    subtotal: number;
    tax: number;
    total: number;
    deliveryNote: string;
    stockWarning: string | null;
    differences: string | null;
    sku: string;
    sendError: string | null;
  }[];
  audits: { id: string; at: string; actor: string; action: string; detail: string }[];
};

const FIELD_LABEL: Record<string, string> = {
  widthMm: "寬度 mm / Width",
  heightMm: "高度 mm / Height",
  sizeHintMm: "大約尺寸 mm / Approx.",
  measurementKind: "尺寸性質 / Measure",
  finish: "表面 / Finish",
  marking: "印字 / Marking",
  quantity: "數量 / Qty",
  quantityUnit: "單位 / Unit",
  delivery: "交貨 / Delivery",
};

export function StaffWorkspace({ data }: { data: WorkspaceData }) {
  const router = useRouter();
  const [tab, setTab] = useState<"chat" | "review">("review");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState(data.inquiry.draftFollowUp);
  const [reason, setReason] = useState("照片與確認尺寸矛盾，目錄沒有可驗證的相同品。");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  async function run(task: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    try {
      const result = await task();
      if (!result.ok) setError(result.error ?? "失敗");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "操作失敗");
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  const chat = (
    <div data-testid="conversation" className="space-y-3">
      {data.messages.map((message) => (
        <article id={`msg-${message.id}`} key={message.id} className={`max-w-full rounded-2xl px-3 py-2 ${message.direction === "inbound" ? "bg-white" : "ml-6 bg-lime-100"}`}>
          <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
          {message.image ? (
            <img src={message.image} alt="客戶傳來的磁磚照片" className="mt-2 h-28 w-28 rounded-md border border-stone-300 object-cover" />
          ) : null}
          <p className="mt-1 text-xs text-stone-500">{formatTaipei(message.createdAt)} · {message.kind}</p>
        </article>
      ))}
      <Link className="inline-block text-sm underline" href={`/line/${data.inquiry.id}`}>
        打開 LINE 模擬器 / LINE simulator
      </Link>
    </div>
  );

  const review = (
    <div data-testid="review-panel" className="space-y-4">
      <section className="rounded-xl bg-white p-3">
        <h2 className="font-semibold">擷取欄位 <span className="en">Extracted fields</span></h2>
        <p className="text-sm text-stone-600">尚缺：{data.missing.length ? data.missing.join("、") : "報價前的必要欄位已確認"}</p>
        <ul className="mt-2 space-y-2">
          {data.fields.map((field) => (
            <li key={field.key} className="grid gap-1 border-t border-stone-100 pt-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <strong>{FIELD_LABEL[field.key] ?? field.key}</strong>
                <span className="text-xs text-stone-500">{field.status}</span>
                {field.sourceMessageId ? (
                  <a className="text-xs underline" href={`#msg-${field.sourceMessageId}`}>來源訊息</a>
                ) : null}
              </div>
              <p className="break-words text-stone-600">擷取：{field.extractedValue ?? "（無）"}</p>
              <form
                className="flex flex-wrap gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  void run(() => confirmFieldAction(data.inquiry.id, field.key, String(form.get("value") ?? "")));
                }}
              >
                <input name="value" defaultValue={field.confirmedValue ?? field.extractedValue ?? ""} className="min-w-0 flex-1 rounded border border-stone-300 px-2 py-1" aria-label={FIELD_LABEL[field.key] ?? field.key} />
                <button className="rounded bg-stone-900 px-2 py-1 text-white" type="submit" disabled={busy}>確認 / Confirm</button>
              </form>
            </li>
          ))}
        </ul>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.inquiry.sampleChecked}
            onChange={(event) => void run(() => sampleAction(data.inquiry.id, event.target.checked))}
          />
          已做實體樣品比對 / Physical sample checked
        </label>
      </section>

      <section>
        <h2 className="font-semibold">候選（最多三筆）<span className="en">Ranking signal, not a probability</span></h2>
        <p className="mb-2 text-xs text-stone-600">圖像比對只看 4×4 色塊版面，不能證明是同一片磚。印字與確認尺寸的權重更高。</p>
        <div className="space-y-3">
          {data.candidates.map((candidate) => (
            <article key={candidate.productId} data-testid="candidate-card" className="overflow-hidden rounded-xl border border-stone-200 bg-white">
              <div className="flex gap-3 p-3">
                <img src={candidate.imagePath} alt="" className="h-20 w-20 shrink-0 rounded object-cover" />
                <div className="min-w-0">
                  <p className="text-xs text-stone-500">#{candidate.rank} · 排序分數 {candidate.score}</p>
                  <p data-testid="candidate-sku" className="break-words font-semibold">{candidate.sku} {candidate.name}</p>
                  <p className="text-sm">{candidate.widthMm}×{candidate.heightMm} mm · {candidate.finish} · 印字 {candidate.marking}</p>
                  <p className="text-sm">庫存 {candidate.stockBoxes} 箱 · {formatTwd(candidate.unitPriceTwd)} / 片</p>
                  <StatusBadge value={candidate.classification} />
                </div>
              </div>
              <div className="space-y-1 px-3 pb-3 text-sm">
                {candidate.evidence.map((signal) => (
                  <p key={signal.detail} className="break-words text-stone-700">相符／參考：{signal.detail}</p>
                ))}
                {candidate.conflicts.map((signal) => (
                  <p key={signal.detail} className="break-words text-rose-800">衝突：{signal.detail}</p>
                ))}
                {candidate.exactBlockedReason ? (
                  <p data-testid="exact-blocked" className="break-words rounded bg-rose-50 p-2 text-rose-900">不能驗證為相同品：{candidate.exactBlockedReason}</p>
                ) : (
                  <p className="rounded bg-emerald-50 p-2">身份條件目前沒有阻擋；仍須人員確認後才算驗證。</p>
                )}
                {candidate.stockNote ? <p className="break-words rounded bg-amber-50 p-2">{candidate.stockNote}</p> : null}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button type="button" disabled={busy} className="rounded bg-emerald-800 px-2 py-1 text-white" onClick={() => void run(() => verifyAction(data.inquiry.id, candidate.productId))}>
                    驗證為相同品 <span className="en">Verify exact</span>
                  </button>
                  <button type="button" disabled={busy} className="rounded bg-amber-700 px-2 py-1 text-white" onClick={() => void run(() => substituteAction(data.inquiry.id, candidate.productId))}>
                    提案替代品 <span className="en">Propose substitute</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-white p-3">
        <h2 className="font-semibold">追問 <span className="en">Follow-up</span></h2>
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} className="mt-2 w-full rounded border border-stone-300 p-2" rows={4} />
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="rounded border border-stone-400 px-2 py-1" disabled={busy} onClick={() => void run(() => saveDraftAction(data.inquiry.id, draft))}>儲存草稿</button>
          <button data-testid="send-followup" type="button" className="rounded bg-stone-900 px-2 py-1 text-white" disabled={busy} onClick={() => void run(() => sendFollowUpAction(data.inquiry.id, draft))}>送出追問 / Send</button>
        </div>
      </section>

      <section className="rounded-xl bg-white p-3" data-testid="quote-preview">
        <h2 className="font-semibold">報價 <span className="en">Quote</span></h2>
        <p className="text-sm">分類：{data.inquiry.matchClass ?? "尚未決定"}</p>
        <button data-testid="create-quote" type="button" className="mt-2 rounded bg-stone-900 px-3 py-1 text-white" disabled={busy} onClick={() => void run(() => draftQuoteAction(data.inquiry.id))}>
          產生報價草稿 / Draft quote
        </button>
        {data.quotes.map((quote) => (
          <form
            key={quote.id}
            className="mt-3 space-y-1 border-t border-stone-200 pt-2 text-sm"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void run(() => updateQuoteAction(quote.id, data.inquiry.id, String(form.get("delivery") ?? ""), Number(form.get("qty"))));
            }}
          >
            <p className="break-words font-medium">{quote.number} 第 {quote.revision} 版 · {quote.sku}</p>
            <StatusBadge value={quote.classification} /> <StatusBadge value={quote.status} />
            <p>需要 {quote.requestedQty} 片，每箱 {quote.unitsPerBox} 片，{quote.boxes} 箱，供應 {quote.suppliedQty} 片</p>
            <p>小計 {formatTwd(quote.subtotal)}，稅 {formatTwd(quote.tax)}，合計 {formatTwd(quote.total)}</p>
            {quote.classification === "substitute" ? <p className="rounded bg-amber-50 p-2">替代品，送出後須客戶明示接受。差異：{quote.differences}</p> : null}
            {quote.stockWarning ? <p className="text-rose-800">庫存不足：{quote.stockWarning}</p> : null}
            {quote.sendError ? <p className="text-rose-800">送出失敗：{quote.sendError}</p> : null}
            <label className="block">交貨
              <input name="delivery" defaultValue={quote.deliveryNote} className="mt-1 w-full rounded border px-2 py-1" />
            </label>
            <label className="block">需求片數
              <input name="qty" type="number" min={1} defaultValue={quote.requestedQty} className="mt-1 w-full rounded border px-2 py-1" />
            </label>
            <div className="flex flex-wrap gap-2">
              {quote.status === "draft" ? <button className="rounded border px-2 py-1" type="submit">更新草稿</button> : null}
              {quote.status === "draft" ? (
                <button data-testid="approve-quote" type="button" className="rounded bg-stone-800 px-2 py-1 text-white" onClick={() => void run(() => approveQuoteAction(quote.id, data.inquiry.id))}>核准 / Approve</button>
              ) : null}
              <button type="button" className="rounded border px-2 py-1" onClick={() => void run(() => reviseQuoteAction(quote.id, data.inquiry.id))}>新版本</button>
              <button data-testid="send-quote" type="button" disabled={busy || quote.status === "sending" || quote.status === "sent"} className="rounded bg-lime-800 px-2 py-1 text-white" onClick={() => void run(() => sendQuoteAction(quote.id, data.inquiry.id))}>
                送出 / Send
              </button>
              <Link className="rounded border px-2 py-1" href={`/quotes/${quote.id}`}>預覽列印</Link>
            </div>
          </form>
        ))}
      </section>

      <section className="rounded-xl bg-white p-3">
        <h2 className="font-semibold">未成交 <span className="en">Unresolved</span></h2>
        {data.inquiry.closeReason ? <p>原因：{data.inquiry.closeReason}</p> : null}
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 w-full rounded border p-2" rows={2} />
        <button data-testid="close-unresolved" type="button" className="mt-2 rounded bg-rose-800 px-2 py-1 text-white" disabled={busy} onClick={() => void run(() => unresolvedAction(data.inquiry.id, reason))}>
          結案為未成交 / Close unresolved
        </button>
      </section>

      <section>
        <h2 className="font-semibold">紀錄 <span className="en">Audit</span></h2>
        <ol className="mt-2 space-y-1 text-xs text-stone-700">
          {data.audits.map((event) => (
            <li key={event.id} className="break-words">{formatTaipei(event.at)} · {event.actor} · {event.action} · {event.detail}</li>
          ))}
        </ol>
      </section>
    </div>
  );

  return (
    <div data-hydrated={ready ? "yes" : "no"}>
      <header className="mb-4">
        <p className="text-sm text-stone-500">合成客戶，未連接正式 LINE 帳號</p>
        <h1 className="text-2xl font-semibold">{data.inquiry.customer} · {data.inquiry.title}</h1>
        <p className="text-sm">{data.inquiry.phone} · {data.inquiry.category}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <StatusBadge value={data.inquiry.status} />
          {data.inquiry.matchClass ? (
            <span data-testid="match-class">
              <StatusBadge value={data.inquiry.matchClass} />
            </span>
          ) : null}
        </div>
      </header>
      {error ? <p data-testid="action-error" className="mb-3 rounded bg-rose-100 p-2 text-sm text-rose-900" role="alert">{error}</p> : null}
      <div className="mb-3 flex gap-2 lg:hidden">
        <button type="button" className="rounded border px-3 py-1" onClick={() => setTab("chat")}>對話 Conversation</button>
        <button type="button" data-testid="tab-review" className="rounded border px-3 py-1" onClick={() => setTab("review")}>審核 Review</button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={tab === "chat" ? "block" : "hidden lg:block"}>{chat}</div>
        <div className={tab === "review" ? "block" : "hidden lg:block"}>{review}</div>
      </div>
    </div>
  );
}
