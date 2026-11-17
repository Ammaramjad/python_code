import { describe, expect, it } from "vitest";
import { PRODUCTS } from "../src/lib/demo/catalog";
import { validateCatalogCsv } from "../src/lib/csv";
import { signLineBody, verifyLineSignature } from "../src/lib/channel/line-signature";
import { paintPng } from "../src/lib/matching/image";
import { extractFromText } from "../src/lib/matching/extract";
import { parseMeasurement } from "../src/lib/matching/normalize";
import { rankCandidates, type FieldMap } from "../src/lib/matching/rank";
import { packPieces, taxTwd } from "../src/lib/quote/money";
import { beginSend, canEdit } from "../src/lib/quote/send-state";
import { RECIPES } from "../src/lib/matching/image";

function fieldsOf(text: string): FieldMap {
  const map: FieldMap = {};
  for (const item of extractFromText(text)) {
    map[item.key] = {
      value: item.value,
      kind: item.key === "measurementKind" && item.value === "confirmed" ? "confirmed" : "approximate",
    };
  }
  if (map.measurementKind?.value === "confirmed") map.measurementKind.kind = "confirmed";
  return map;
}

const products = PRODUCTS.map((product) => ({
  ...product,
  visualVector: paintPng(product.recipe).vector,
}));

describe("measurements", () => {
  it("normalizes centimetres and millimetres", () => {
    expect(parseMeasurement("３０ × ３０ 公分")).toMatchObject({ kind: "confirmed", widthMm: 300, heightMm: 300 });
    expect(parseMeasurement("300x300 mm")).toMatchObject({ kind: "confirmed", widthMm: 300, heightMm: 300 });
    expect(parseMeasurement("約 30 公分")).toMatchObject({ kind: "approximate", hintMm: 300, widthMm: null });
    expect(parseMeasurement("12 吋")).toMatchObject({ kind: "unknown", widthMm: null });
    expect(parseMeasurement("30x30")).toMatchObject({ kind: "unknown" });
  });
});

describe("ranking", () => {
  it("moves the marked SKU ahead of the lookalike", () => {
    const photo = paintPng(RECIPES.stoneGrayPhoto).vector;
    const initial = rankCandidates({
      products,
      fields: fieldsOf("浴室地磚裂了，約 30 公分，要補 6 片"),
      imageVector: photo,
    });
    expect(initial[0]?.sku).toBe("FT-3030-MAT-B");
    expect(initial[0]?.exactBlockedReason).toBeTruthy();
    const after = rankCandidates({
      products,
      fields: fieldsOf("約 30 公分，要補 6 片。量過是 300x300 mm，背面印 FT-A30"),
      imageVector: photo,
    });
    expect(after[0]?.sku).toBe("FT-3030-MAT-A");
    expect(after.find((item) => item.sku === "FT-3030-MAT-B")?.conflicts.some((item) => item.code === "marking")).toBe(true);
  });

  it("blocks exact verification when confirmed size conflicts", () => {
    const photo = paintPng(RECIPES.stoneBeige).vector;
    const ranked = rankCandidates({
      products,
      fields: fieldsOf("這片我確認是 60×60 公分，補 4 片"),
      imageVector: photo,
      limit: 10,
    });
    expect(ranked.every((item) => item.exactBlockedReason)).toBe(true);
    const beige = ranked.find((item) => item.sku === "FT-3030-MAT-A");
    expect(beige?.conflicts.some((item) => item.code === "size")).toBe(true);
  });
});

describe("packs and send rules", () => {
  it("rounds pieces up to whole boxes", () => {
    expect(packPieces(10, 8)).toEqual({ requestedPieces: 10, unitsPerBox: 8, boxes: 2, suppliedPieces: 16 });
    expect(taxTwd(688, 500)).toBe(34);
    expect(() => packPieces(0, 8)).toThrow();
  });

  it("blocks duplicate sends and edits after approval", () => {
    expect(beginSend("approved").ok).toBe(true);
    expect(beginSend("sent")).toMatchObject({ ok: false, reason: "duplicate" });
    expect(beginSend("sending")).toMatchObject({ ok: false, reason: "duplicate" });
    expect(beginSend("draft")).toMatchObject({ ok: false, reason: "not_approved" });
    expect(canEdit("approved")).toBe(false);
    expect(canEdit("draft")).toBe(true);
  });
});

describe("csv and LINE signature", () => {
  it("reports duplicate and invalid rows before import", () => {
    const csv = `sku,name,brand,widthMm,heightMm,finish,color,marking,unitsPerBox,stockBoxes,active,discontinued,unitPriceTwd
FT-3030-MAT-A,重複,岩川,300,300,matte,米白,FT-A30,8,1,true,false,90
NEW-1,新,岩川,300,300,shiny,藍,X,0,1,true,false,10
`;
    const result = validateCatalogCsv(csv, ["FT-3030-MAT-A"]);
    expect(result.rows).toHaveLength(0);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("verifies the raw LINE body", () => {
    const body = "{\"events\":[]}";
    const signature = signLineBody(body, "secret");
    expect(verifyLineSignature(body, "secret", signature)).toBe(true);
    expect(verifyLineSignature(body + " ", "secret", signature)).toBe(false);
  });
});
