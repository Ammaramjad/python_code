import { z } from "zod";

export const PRODUCT_CSV_HEADERS = [
  "sku",
  "name",
  "brand",
  "widthMm",
  "heightMm",
  "finish",
  "color",
  "marking",
  "unitsPerBox",
  "stockBoxes",
  "active",
  "discontinued",
  "unitPriceTwd",
] as const;

const rowSchema = z.object({
  sku: z.string().min(3).max(40),
  name: z.string().min(1),
  brand: z.string().min(1),
  widthMm: z.coerce.number().int().positive(),
  heightMm: z.coerce.number().int().positive(),
  finish: z.enum(["matte", "glossy", "textured"]),
  color: z.string().min(1),
  marking: z.string().min(2),
  unitsPerBox: z.coerce.number().int().positive(),
  stockBoxes: z.coerce.number().int().min(0),
  active: z.enum(["true", "false", "1", "0", "yes", "no"]),
  discontinued: z.enum(["true", "false", "1", "0", "yes", "no"]),
  unitPriceTwd: z.coerce.number().int().positive(),
});

export type CatalogCsvRow = z.infer<typeof rowSchema>;

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') {
      quoted = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += ch;
  }
  row.push(cell.trim());
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

export function catalogTemplateCsv(): string {
  const sample = [
    "FT-NEW-01",
    "示範新磚",
    "岩川磁磚",
    "300",
    "300",
    "matte",
    "米白",
    "FT-NEW",
    "8",
    "12",
    "true",
    "false",
    "90",
  ];
  return `${PRODUCT_CSV_HEADERS.join(",")}\n${sample.join(",")}\n`;
}

export type CsvIssue = { row: number; message: string };

export function validateCatalogCsv(
  text: string,
  existingSkus: string[],
): { rows: CatalogCsvRow[]; issues: CsvIssue[] } {
  const table = parseCsv(text);
  if (table.length === 0) return { rows: [], issues: [{ row: 1, message: "檔案是空的。" }] };
  const header = table[0].map((value) => value.trim());
  const missing = PRODUCT_CSV_HEADERS.filter((key) => !header.includes(key));
  if (missing.length) {
    return { rows: [], issues: [{ row: 1, message: `缺少欄位：${missing.join(", ")}` }] };
  }
  const index = new Map(header.map((key, i) => [key, i]));
  const issues: CsvIssue[] = [];
  const rows: CatalogCsvRow[] = [];
  const seen = new Set<string>();
  const existing = new Set(existingSkus.map((sku) => sku.toUpperCase()));
  table.slice(1).forEach((cells, offset) => {
    const rowNumber = offset + 2;
    const record: Record<string, string> = {};
    for (const key of PRODUCT_CSV_HEADERS) {
      record[key] = cells[index.get(key) ?? -1] ?? "";
    }
    const parsed = rowSchema.safeParse(record);
    if (!parsed.success) {
      issues.push({
        row: rowNumber,
        message: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
      });
      return;
    }
    const sku = parsed.data.sku.toUpperCase();
    if (seen.has(sku)) issues.push({ row: rowNumber, message: `檔案內 SKU 重複：${sku}` });
    if (existing.has(sku)) issues.push({ row: rowNumber, message: `目錄已有 SKU：${sku}` });
    seen.add(sku);
    rows.push({ ...parsed.data, sku });
  });
  return { rows: issues.length ? [] : rows, issues };
}
