import {
  parseDelivery,
  parseFinish,
  parseMarking,
  parseMeasurement,
  parseQuantity,
} from "./normalize";

export type FieldKey =
  | "widthMm"
  | "heightMm"
  | "sizeHintMm"
  | "measurementKind"
  | "finish"
  | "marking"
  | "quantity"
  | "quantityUnit"
  | "delivery";

export type Extracted = {
  key: FieldKey;
  value: string;
};

export interface OcrProvider {
  readonly name: string;
  readMarking(image: Buffer, mime: string): Promise<{ marking: string | null }>;
}

/**
 * No OCR provider is bundled. Callers must show a staff marking-entry control
 * and must not display a fabricated reading for an arbitrary upload.
 */
export function getOcrProvider(): OcrProvider | null {
  const name = process.env.OCR_PROVIDER;
  if (!name || name === "none") return null;
  return null;
}

export async function readImageMarking(): Promise<{
  marking: string | null;
  provider: "none";
  fabricated: false;
  staffEntryRequired: true;
}> {
  return {
    marking: null,
    provider: "none",
    fabricated: false,
    staffEntryRequired: true,
  };
}

export function extractFromText(text: string): Extracted[] {
  const out: Extracted[] = [];
  const measure = parseMeasurement(text);
  if (measure.kind !== "unknown" && (measure.widthMm || measure.hintMm)) {
    out.push({ key: "measurementKind", value: measure.kind });
  }
  if (measure.widthMm != null) out.push({ key: "widthMm", value: String(measure.widthMm) });
  if (measure.heightMm != null) out.push({ key: "heightMm", value: String(measure.heightMm) });
  if (measure.hintMm != null) out.push({ key: "sizeHintMm", value: String(measure.hintMm) });
  const finish = parseFinish(text);
  if (finish) out.push({ key: "finish", value: finish });
  const marking = parseMarking(text);
  if (marking) out.push({ key: "marking", value: marking });
  const qty = parseQuantity(text);
  if (qty.amount != null) out.push({ key: "quantity", value: String(qty.amount) });
  if (qty.unit) out.push({ key: "quantityUnit", value: qty.unit });
  const delivery = parseDelivery(text);
  if (delivery) out.push({ key: "delivery", value: delivery });
  return out;
}
