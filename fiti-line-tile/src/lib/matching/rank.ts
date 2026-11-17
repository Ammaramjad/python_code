import { cosine } from "./image";
import { sizesClose } from "./normalize";

export type CatalogProduct = {
  id: string;
  sku: string;
  name: string;
  widthMm: number;
  heightMm: number;
  finish: string;
  marking: string;
  stockBoxes: number;
  active: boolean;
  discontinued: boolean;
  visualVector: number[];
  color: string;
};

export type FieldMap = Partial<Record<string, { value: string; kind: "confirmed" | "approximate" | "unknown" }>>;

export type Signal = {
  code: string;
  polarity: "agree" | "conflict" | "neutral";
  detail: string;
};

export type RankedCandidate = {
  productId: string;
  sku: string;
  score: number;
  imageScore: number;
  signals: Signal[];
  conflicts: Signal[];
  exactBlockedReason: string | null;
  stockNote: string | null;
  differences: string | null;
};

const FINISH_ZH: Record<string, string> = {
  matte: "霧面",
  glossy: "亮面",
  textured: "止滑",
};

function field(fields: FieldMap, key: string): string | null {
  return fields[key]?.value ?? null;
}

export function rankCandidates(input: {
  products: CatalogProduct[];
  fields: FieldMap;
  imageVector: number[] | null;
  limit?: number;
}): RankedCandidate[] {
  const width = num(field(input.fields, "widthMm"));
  const height = num(field(input.fields, "heightMm"));
  const hint = num(field(input.fields, "sizeHintMm"));
  const measureKind = field(input.fields, "measurementKind");
  const sizeConfirmed = measureKind === "confirmed" && width != null && height != null;
  const finish = field(input.fields, "finish");
  const marking = field(input.fields, "marking")?.toUpperCase() ?? null;

  const ranked = input.products.map((product) => {
    const signals: Signal[] = [];
    const conflicts: Signal[] = [];
    let raw = 0;
    const imageScore = input.imageVector ? cosine(input.imageVector, product.visualVector) : 0;
    if (input.imageVector) {
      raw += imageScore * 25;
      signals.push({
        code: "image",
        polarity: imageScore >= 0.85 ? "agree" : "neutral",
        detail: `圖像版面相似度 ${imageScore.toFixed(2)}（排序訊號，不是身份證明），計 ${(imageScore * 25).toFixed(1)} 分。`,
      });
    } else {
      signals.push({
        code: "image",
        polarity: "neutral",
        detail: "沒有可用的比較照片。",
      });
    }

    if (input.imageVector && imageScore < 0.45 && !marking) {
      conflicts.push({
        code: "image",
        polarity: "conflict",
        detail: "照片版面和這個產品差很多，而且沒有印字可以核對。",
      });
    }

    if (marking) {
      if (marking === product.marking.toUpperCase()) {
        raw += 50;
        signals.push({
          code: "marking",
          polarity: "agree",
          detail: `印字 ${marking} 與 ${product.sku} 一致。`,
        });
      } else {
        raw -= 40;
        conflicts.push({
          code: "marking",
          polarity: "conflict",
          detail: `確認印字 ${marking} 與產品印字 ${product.marking} 不同。`,
        });
      }
    } else {
      signals.push({
        code: "marking",
        polarity: "neutral",
        detail: "尚未取得背面或包裝印字。",
      });
    }

    const sameSize =
      width != null &&
      height != null &&
      sizesClose(width, product.widthMm) &&
      sizesClose(height, product.heightMm);
    const hintOk =
      hint != null &&
      (sizesClose(hint, product.widthMm, 0.15) || sizesClose(hint, product.heightMm, 0.15));
    if (sizeConfirmed && width != null && height != null) {
      if (sameSize) {
        raw += 20;
        signals.push({
          code: "size",
          polarity: "agree",
          detail: `確認尺寸 ${width}×${height} mm 與 ${product.widthMm}×${product.heightMm} mm 相符。`,
        });
      } else {
        raw -= 50;
        conflicts.push({
          code: "size",
          polarity: "conflict",
          detail: `確認尺寸 ${width}×${height} mm 與 ${product.widthMm}×${product.heightMm} mm 矛盾。`,
        });
      }
    } else if (hintOk) {
      raw += 8;
      signals.push({
        code: "size",
        polarity: "neutral",
        detail: `大約 ${hint} mm 與這個尺寸接近，但仍是近似值。`,
      });
    } else if (hint != null || (width != null && height != null)) {
      signals.push({
        code: "size",
        polarity: "neutral",
        detail: "尺寸線索與這個產品不明顯相符。",
      });
    } else {
      signals.push({
        code: "size",
        polarity: "neutral",
        detail: "還沒有可用尺寸。",
      });
    }

    if (finish) {
      if (finish === product.finish) {
        raw += 10;
        signals.push({
          code: "finish",
          polarity: "agree",
          detail: `表面 ${FINISH_ZH[finish] ?? finish} 一致。`,
        });
      } else {
        raw -= 30;
        conflicts.push({
          code: "finish",
          polarity: "conflict",
          detail: `表面 ${FINISH_ZH[finish] ?? finish} 與產品 ${FINISH_ZH[product.finish] ?? product.finish} 不同。`,
        });
      }
    }

    let exactBlockedReason: string | null = null;
    if (conflicts.length > 0) {
      exactBlockedReason = "確認屬性互相矛盾，在人員排除衝突前不能驗證為相同品。";
    } else if (!marking) {
      exactBlockedReason =
        "相同品驗證需要一致的產品印字，或由人員勾選實體樣品比對。圖像相似度只是排序訊號。";
    } else if (!sizeConfirmed) {
      exactBlockedReason = "尺寸仍是近似或未知，確認尺寸後才能驗證為相同品。";
    }

    let stockNote: string | null = null;
    if (!product.active || product.discontinued || product.stockBoxes <= 0) {
      stockNote = product.discontinued
        ? "此 SKU 已停產。庫存不影響身份判斷，但不能報價為現貨相同品。"
        : "庫存不足。庫存不影響身份判斷，但不能報價為現貨相同品。";
    }

    const differences = [
      marking && marking !== product.marking.toUpperCase() ? `印字 ${product.marking}` : null,
      finish && finish !== product.finish ? `表面改為${FINISH_ZH[product.finish] ?? product.finish}` : null,
      sizeConfirmed && !sameSize ? `尺寸 ${product.widthMm}×${product.heightMm} mm` : null,
      product.color ? `色澤 ${product.color}` : null,
    ]
      .filter(Boolean)
      .join("、");

    return {
      productId: product.id,
      sku: product.sku,
      score: raw,
      imageScore,
      signals,
      conflicts,
      exactBlockedReason,
      stockNote,
      differences: differences || null,
    };
  });

  if (sizeConfirmed && input.imageVector) {
    const bestImage = Math.max(...ranked.map((item) => item.imageScore));
    for (const item of ranked) {
      const sizeAgree = item.signals.some((signal) => signal.code === "size" && signal.polarity === "agree");
      if (sizeAgree && bestImage - item.imageScore > 0.12) {
        item.conflicts.push({
          code: "image",
          polarity: "conflict",
          detail: "確認尺寸對到這個產品，但照片版面比較接近另一個尺寸。",
        });
        item.exactBlockedReason = "確認屬性互相矛盾，在人員排除衝突前不能驗證為相同品。";
      }
    }
  }

  ranked.sort((a, b) => b.score - a.score || a.sku.localeCompare(b.sku));
  const top = ranked.slice(0, input.limit ?? 3);
  const max = Math.max(...top.map((item) => item.score), 1);
  return top.map((item) => ({
    ...item,
    score: Math.max(0, Math.min(100, Math.round((item.score / max) * 100))),
  }));
}

function num(value: string | null): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
