"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { customerPhotoAction, customerReplyAction, quoteDecisionAction } from "@/app/actions";
import { formatTaipei } from "@/lib/format";

export function LineSimulator(props: {
  inquiryId: string;
  customer: string;
  replies: string[];
  messages: { id: string; direction: string; body: string; createdAt: string; image: string | null; kind: string; quoteId: string | null }[];
  pendingSubstituteQuoteId: string | null;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  async function send(body: string) {
    setError(null);
    try {
      const result = await customerReplyAction(props.inquiryId, body);
      if (!result.ok) {
        setError(result.error);
        return;
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "送出失敗");
      return;
    }
    setText("");
    router.refresh();
  }

  return (
    <div data-hydrated={ready ? "yes" : "no"} className="mx-auto max-w-md">
      <p className="text-xs text-stone-500">LINE simulator / LINE 模擬器。這不是官方帳號，訊息不會送到真實 LINE。</p>
      <h1 className="text-xl font-semibold">{props.customer}</h1>
      <div data-testid="line-thread" className="mt-3 space-y-2 rounded-2xl bg-[#7494a5] p-3">
        {props.messages.map((message) => (
          <div key={message.id} className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${message.direction === "inbound" ? "bg-white" : "ml-auto bg-[#d6f5c8]"}`}>
            <p className="whitespace-pre-wrap break-words">{message.body}</p>
            {message.image ? (
              <img src={message.image} alt="磁磚照片" className="mt-2 h-24 w-24 rounded object-cover" />
            ) : null}
            <p className="mt-1 text-[10px] text-stone-500">{formatTaipei(message.createdAt)}</p>
          </div>
        ))}
      </div>
      {props.pendingSubstituteQuoteId ? (
        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm">
          <p>這張是替代品報價，請明示接受或拒絕。</p>
          <div className="mt-2 flex gap-2">
            <button data-testid="accept-substitute" className="rounded bg-emerald-800 px-3 py-1 text-white" type="button" onClick={() => quoteDecisionAction(props.pendingSubstituteQuoteId as string, props.inquiryId, true).then(() => router.refresh())}>接受替代品</button>
            <button data-testid="decline-substitute" className="rounded bg-rose-800 px-3 py-1 text-white" type="button" onClick={() => quoteDecisionAction(props.pendingSubstituteQuoteId as string, props.inquiryId, false).then(() => router.refresh())}>拒絕</button>
          </div>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {props.replies.map((reply) => (
          <button data-testid="suggested-reply" key={reply} type="button" className="rounded-full bg-white px-3 py-1 text-left text-sm" onClick={() => send(reply)}>{reply}</button>
        ))}
      </div>
      <form className="mt-3 space-y-2" onSubmit={(event) => { event.preventDefault(); void send(text); }}>
        <textarea aria-label="手動回覆" value={text} onChange={(event) => setText(event.target.value)} className="w-full rounded border bg-white p-2" rows={2} placeholder="手動輸入回覆" />
        <button className="rounded bg-stone-900 px-3 py-1 text-white" type="submit">送出文字</button>
      </form>
      <form className="mt-3 space-y-2" action={async (formData) => {
        const result = await customerPhotoAction(props.inquiryId, formData);
        if (!result.ok) setError(result.error);
        router.refresh();
      }}>
        <p className="text-xs">未設定 OCR。任意上傳不會顯示捏造的印字，請在人員畫面手動填印字。</p>
        <input name="note" defaultValue="補上一張照片" className="w-full rounded border bg-white px-2 py-1" />
        <input data-testid="photo-upload" name="photo" type="file" accept="image/png,image/jpeg" className="block w-full text-sm" />
        <button className="rounded border bg-white px-3 py-1" type="submit">上傳照片</button>
        <div className="flex gap-2 text-xs">
          <a className="underline" href="/tiles/photo-exact.png">範例照片：類似淺灰</a>
          <a className="underline" href="/tiles/photo-wood.png">深色木紋</a>
        </div>
      </form>
      {error ? <p data-testid="line-error" className="mt-2 text-sm text-rose-800" role="alert">{error}</p> : null}
    </div>
  );
}
