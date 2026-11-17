export type QuoteStatus = "draft" | "approved" | "sending" | "sent" | "accepted" | "declined" | "superseded";

export function beginSend(status: QuoteStatus): { ok: true } | { ok: false; reason: "duplicate" | "not_approved" } {
  if (status === "sent" || status === "sending" || status === "accepted" || status === "declined") {
    return { ok: false, reason: "duplicate" };
  }
  if (status !== "approved") return { ok: false, reason: "not_approved" };
  return { ok: true };
}

export function afterAdapter(result: { ok: true } | { ok: false }): QuoteStatus {
  return result.ok ? "sent" : "approved";
}

export function canEdit(status: QuoteStatus): boolean {
  return status === "draft";
}

export function canApprove(status: QuoteStatus): boolean {
  return status === "draft";
}
