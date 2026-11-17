import { BadgeCheck, CircleHelp, Replace, Timer, Check, X } from "lucide-react";

const MAP: Record<string, { zh: string; en: string; className: string; icon: "exact" | "sub" | "open" | "wait" | "ok" | "no" }> = {
  pending_review: { zh: "待審核", en: "Pending review", className: "bg-stone-200 text-stone-900", icon: "wait" },
  waiting_customer: { zh: "等待客戶", en: "Waiting", className: "bg-sky-100 text-sky-950", icon: "wait" },
  draft: { zh: "草稿", en: "Draft", className: "bg-stone-100 text-stone-800", icon: "wait" },
  approved: { zh: "已核准", en: "Approved", className: "bg-indigo-100 text-indigo-950", icon: "ok" },
  sending: { zh: "送出中", en: "Sending", className: "bg-sky-100 text-sky-950", icon: "wait" },
  sent: { zh: "已送出", en: "Sent", className: "bg-indigo-100 text-indigo-950", icon: "ok" },
  quoted: { zh: "已報價", en: "Quoted", className: "bg-indigo-100 text-indigo-950", icon: "ok" },
  accepted: { zh: "已接受", en: "Accepted", className: "bg-emerald-100 text-emerald-950", icon: "exact" },
  unresolved: { zh: "未成交", en: "Unresolved", className: "bg-rose-100 text-rose-950", icon: "open" },
  declined: { zh: "客戶拒絕", en: "Declined", className: "bg-rose-100 text-rose-950", icon: "no" },
  verified_replacement: { zh: "相同品", en: "Exact", className: "bg-emerald-100 text-emerald-950", icon: "exact" },
  substitute: { zh: "替代品", en: "Substitute", className: "bg-amber-100 text-amber-950", icon: "sub" },
  candidate: { zh: "候選", en: "Candidate", className: "bg-stone-100 text-stone-800", icon: "wait" },
};

export function StatusBadge({ value }: { value: string }) {
  const item = MAP[value] ?? { zh: value, en: value, className: "bg-stone-100", icon: "wait" as const };
  const Icon =
    item.icon === "exact" ? BadgeCheck : item.icon === "sub" ? Replace : item.icon === "open" ? CircleHelp : item.icon === "ok" ? Check : item.icon === "no" ? X : Timer;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${item.className}`}>
      <Icon aria-hidden size={14} />
      <span>{item.zh}</span>
      <span className="text-[10px] opacity-70">{item.en}</span>
    </span>
  );
}
