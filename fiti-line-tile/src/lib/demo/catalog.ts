import type { Recipe } from "../matching/image";
import { RECIPES } from "../matching/image";

export type ProductSeed = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  widthMm: number;
  heightMm: number;
  finish: "matte" | "glossy" | "textured";
  color: string;
  marking: string;
  unitsPerBox: number;
  stockBoxes: number;
  active: boolean;
  discontinued: boolean;
  unitPriceTwd: number;
  similarGroup: string;
  recipe: Recipe;
};

export const SHOP = {
  id: "shop-hesheng",
  name: "和盛磁磚建材行（示範合成資料）",
  code: "HS",
  phone: "02-0000-0000",
  address: "台北市中山區示範路 1 號",
  taxId: "00000000",
  taxRateBps: 500,
  quoteValidDays: 14,
};

export const STAFF = { id: "staff-demo", name: "林承翰（示範帳號）", role: "counter" };

export const PRODUCTS: ProductSeed[] = [
  {
    id: "prd-a",
    sku: "FT-3030-MAT-A",
    name: "岩紋米白",
    brand: "岩川磁磚",
    widthMm: 300,
    heightMm: 300,
    finish: "matte",
    color: "米白",
    marking: "FT-A30",
    unitsPerBox: 8,
    stockBoxes: 20,
    active: true,
    discontinued: false,
    unitPriceTwd: 86,
    similarGroup: "stone-30",
    recipe: RECIPES.stoneBeige,
  },
  {
    id: "prd-b",
    sku: "FT-3030-MAT-B",
    name: "岩紋淺灰",
    brand: "岩川磁磚",
    widthMm: 300,
    heightMm: 300,
    finish: "matte",
    color: "淺灰",
    marking: "FT-B30",
    unitsPerBox: 8,
    stockBoxes: 14,
    active: true,
    discontinued: false,
    unitPriceTwd: 86,
    similarGroup: "stone-30",
    recipe: RECIPES.stoneGray,
  },
  {
    id: "prd-oos",
    sku: "FT-3030-OOS",
    name: "岩紋米白（缺貨批次）",
    brand: "岩川磁磚",
    widthMm: 300,
    heightMm: 300,
    finish: "matte",
    color: "米白",
    marking: "FT-OOS",
    unitsPerBox: 8,
    stockBoxes: 0,
    active: true,
    discontinued: false,
    unitPriceTwd: 86,
    similarGroup: "stone-30",
    recipe: RECIPES.stoneBeige,
  },
  {
    id: "prd-disc",
    sku: "FT-600-DISC",
    name: "橡木霧面（停產）",
    brand: "禾木磁磚",
    widthMm: 600,
    heightMm: 600,
    finish: "matte",
    color: "深橡木",
    marking: "OLD-60",
    unitsPerBox: 8,
    stockBoxes: 0,
    active: false,
    discontinued: true,
    unitPriceTwd: 120,
    similarGroup: "wood-60",
    recipe: RECIPES.woodDark,
  },
  {
    id: "prd-sub",
    sku: "FT-600-SUB",
    name: "橡木淺色霧面",
    brand: "禾木磁磚",
    widthMm: 600,
    heightMm: 600,
    finish: "matte",
    color: "淺橡木",
    marking: "SUB-60",
    unitsPerBox: 8,
    stockBoxes: 9,
    active: true,
    discontinued: false,
    unitPriceTwd: 120,
    similarGroup: "wood-60",
    recipe: RECIPES.woodLight,
  },
  {
    id: "prd-glz",
    sku: "FT-3045-GLZ",
    name: "木紋亮面",
    brand: "禾木磁磚",
    widthMm: 300,
    heightMm: 450,
    finish: "glossy",
    color: "橡木亮面",
    marking: "GLZ-45",
    unitsPerBox: 6,
    stockBoxes: 7,
    active: true,
    discontinued: false,
    unitPriceTwd: 95,
    similarGroup: "wood-45",
    recipe: RECIPES.woodLight,
  },
  {
    id: "prd-blue",
    sku: "FT-3030-BLU",
    name: "點紋淺藍",
    brand: "岩川磁磚",
    widthMm: 300,
    heightMm: 300,
    finish: "textured",
    color: "淺藍",
    marking: "BLU-30",
    unitsPerBox: 8,
    stockBoxes: 5,
    active: true,
    discontinued: false,
    unitPriceTwd: 78,
    similarGroup: "blue-30",
    recipe: RECIPES.speckBlue,
  },
];

export const SCENARIOS = {
  exact: {
    id: "inq-exact",
    customerId: "cus-chen",
    customer: "陳先生",
    phone: "0912-000-001",
    title: "浴室補磚",
    truthSku: "FT-3030-MAT-A",
    text: "浴室地磚裂了，約 30 公分，要補 6 片",
    photo: "exact",
    replies: ["量過是 300x300 mm，背面印 FT-A30"],
  },
  substitute: {
    id: "inq-sub",
    customerId: "cus-lin",
    customer: "林小姐",
    phone: "0912-000-002",
    title: "客廳補磚",
    truthSku: "FT-600-DISC",
    text: "客廳地磚確認 600x600 mm 霧面，要 10 片，背面印 OLD-60，希望送到",
    photo: "wood",
    replies: ["可以，我接受這個替代品報價"],
  },
  unresolved: {
    id: "inq-open",
    customerId: "cus-wang",
    customer: "王師傅",
    phone: "0912-000-003",
    title: "尺寸與照片不一致",
    truthSku: null as string | null,
    text: "這片我確認是 60×60 公分，補 4 片",
    photo: "conflict",
    replies: ["包裝早就丟了，沒有印字"],
  },
} as const;
