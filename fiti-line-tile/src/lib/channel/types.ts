export type OutboundMessage = {
  to: string;
  text: string;
  idempotencyKey: string;
};

export type SendResult = { ok: true; providerMessageId?: string } | { ok: false; error: string };

export interface OutboundAdapter {
  channel: "simulator" | "line";
  send(message: OutboundMessage): Promise<SendResult>;
}

export const simulatorAdapter: OutboundAdapter = {
  channel: "simulator",
  async send() {
    return { ok: true, providerMessageId: "simulator" };
  },
};

export function lineConfigured(): boolean {
  return process.env.LINE_ENABLED === "true" && Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN);
}

export function lineAdapter(): OutboundAdapter {
  return {
    channel: "line",
    async send(message) {
      if (!lineConfigured()) {
        return { ok: false, error: "LINE adapter is disabled. Simulator messages stay in the demo." };
      }
      const token = process.env.LINE_CHANNEL_ACCESS_TOKEN as string;
      const response = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": message.idempotencyKey,
        },
        body: JSON.stringify({
          to: message.to,
          messages: [{ type: "text", text: message.text.slice(0, 5000) }],
        }),
      });
      if (!response.ok) {
        return { ok: false, error: `LINE push failed (${response.status})` };
      }
      return { ok: true };
    },
  };
}

export function adapterFor(channel: "simulator" | "line"): OutboundAdapter {
  return channel === "line" ? lineAdapter() : simulatorAdapter;
}
