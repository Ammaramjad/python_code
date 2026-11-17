import { createHmac, timingSafeEqual } from "crypto";

export function signLineBody(rawBody: string, channelSecret: string): string {
  return createHmac("sha256", channelSecret).update(rawBody).digest("base64");
}

export function verifyLineSignature(rawBody: string, channelSecret: string, header: string | null): boolean {
  if (!header || !channelSecret) return false;
  const expected = signLineBody(rawBody, channelSecret);
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
