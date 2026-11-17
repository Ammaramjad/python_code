export type MeasureKind = "confirmed" | "approximate" | "unknown";

export type NormalizedMeasurement = {
  kind: MeasureKind;
  widthMm: number | null;
  heightMm: number | null;
  /** A single approximate length, not evidence of a square size. */
  hintMm: number | null;
  raw: string | null;
};

const DIGIT: Record<string, string> = {
  "０": "0",
  "１": "1",
  "２": "2",
  "３": "3",
  "４": "4",
  "５": "5",
  "６": "6",
  "７": "7",
  "８": "8",
  "９": "9",
};

export function normalizeText(input: string): string {
  return input
    .trim()
    .replace(/[０-９]/g, (ch) => DIGIT[ch] ?? ch)
    .replace(/[Ｘｘ×＊*]/g, "x")
    .replace(/\s+/g, " ");
}

function toMm(value: number, unit: string | undefined): number | null {
  const u = (unit ?? "").toLowerCase();
  if (u === "mm" || u === "毫米" || u === "公釐" || u === "公厘") return Math.round(value);
  if (u === "cm" || u === "公分" || u === "厘米") return Math.round(value * 10);
  return null;
}

function hedge(text: string): MeasureKind {
  if (/(約|大约|大約|大概|左右|差不多)/.test(text)) return "approximate";
  if (/(確認|量過|實際|精确|精確|實測)/.test(text)) return "confirmed";
  return "confirmed";
}

export function parseMeasurement(input: string): NormalizedMeasurement {
  const text = normalizeText(input);
  if (!text) {
    return { kind: "unknown", widthMm: null, heightMm: null, hintMm: null, raw: null };
  }
  const pair = text.match(
    /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)(?:\s*(mm|毫米|公釐|公厘|cm|公分|厘米))?/i,
  );
  if (pair) {
    const unit = pair[3];
    const width = toMm(Number(pair[1]), unit);
    const height = toMm(Number(pair[2]), unit);
    if (width == null || height == null) {
      return { kind: "unknown", widthMm: null, heightMm: null, hintMm: null, raw: pair[0] };
    }
    const kind = hedge(text);
    return {
      kind: kind === "approximate" ? "approximate" : "confirmed",
      widthMm: width,
      heightMm: height,
      hintMm: null,
      raw: pair[0],
    };
  }
  const single = text.match(/(\d+(?:\.\d+)?)\s*(mm|毫米|公釐|公厘|cm|公分|厘米)/i);
  if (single) {
    const mm = toMm(Number(single[1]), single[2]);
    if (mm == null) {
      return { kind: "unknown", widthMm: null, heightMm: null, hintMm: null, raw: single[0] };
    }
    return {
      kind: "approximate",
      widthMm: null,
      heightMm: null,
      hintMm: mm,
      raw: single[0],
    };
  }
  return { kind: "unknown", widthMm: null, heightMm: null, hintMm: null, raw: null };
}

export type QuantityParse = {
  amount: number | null;
  unit: "piece" | "box" | null;
};

export function parseQuantity(input: string): QuantityParse {
  const text = normalizeText(input);
  const match = text.match(/(\d+)\s*(片|塊|箱|盒)/);
  if (!match) return { amount: null, unit: null };
  const amount = Number(match[1]);
  const unit = match[2] === "箱" || match[2] === "盒" ? "box" : "piece";
  return { amount, unit };
}

export function parseFinish(input: string): "matte" | "glossy" | "textured" | null {
  const text = normalizeText(input);
  if (/(止滑|粗糙|紋理)/.test(text)) return "textured";
  if (/(亮面|拋光|亮光)/.test(text)) return "glossy";
  if (/(霧面|平光|消光)/.test(text)) return "matte";
  return null;
}

export function parseMarking(input: string): string | null {
  const text = normalizeText(input);
  const labeled = text.match(
    /(?:背面|印字|印有|型號|編號|貨號)[:：\s]*([A-Za-z]{1,6}-[A-Za-z0-9]{2,10})/,
  );
  if (labeled) return labeled[1].toUpperCase();
  const bare = text.match(/\b([A-Z]{2,6}-[A-Z0-9]{2,10})\b/);
  return bare ? bare[1].toUpperCase() : null;
}

export function parseDelivery(input: string): string | null {
  const text = normalizeText(input);
  if (/自取|自提/.test(text)) return "自取";
  if (/送到|到府|送貨|配送/.test(text)) return "到府";
  return null;
}

export function sizesClose(a: number, b: number, tolerance = 0.08): boolean {
  return Math.abs(a - b) / Math.max(b, 1) <= tolerance;
}
