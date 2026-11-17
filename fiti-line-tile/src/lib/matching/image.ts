import { PNG } from "pngjs";

export const IMAGE_LIMITATION =
  "Image similarity compares a coarse 4×4 color layout only. It cannot identify a tile, read printed markings, or separate products that share a color family. Human-entered markings and confirmed measurements outrank it.";

export function cosine(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export type Recipe = {
  base: [number, number, number];
  vein: [number, number, number];
  direction: "horizontal" | "vertical" | "speckle";
  period: number;
};

export function paintPng(recipe: Recipe, size = 64): { png: Buffer; vector: number[] } {
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const stripe =
        recipe.direction === "horizontal"
          ? y % recipe.period < 2
          : recipe.direction === "vertical"
            ? x % recipe.period < 2
            : (x * 3 + y * 5) % recipe.period < 2;
      const rgb = stripe ? recipe.vein : recipe.base;
      const i = (size * y + x) << 2;
      png.data[i] = rgb[0];
      png.data[i + 1] = rgb[1];
      png.data[i + 2] = rgb[2];
      png.data[i + 3] = 255;
    }
  }
  return { png: PNG.sync.write(png), vector: vectorFromPng(png) };
}

export function vectorFromPng(png: PNG): number[] {
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  const count = png.width * png.height;
  for (let p = 0; p < png.data.length; p += 4) {
    rSum += png.data[p];
    gSum += png.data[p + 1];
    bSum += png.data[p + 2];
  }
  const mean = [rSum / count / 255, gSum / count / 255, bSum / count / 255];
  const cells = 4;
  const layout: number[] = [];
  const cw = png.width / cells;
  const ch = png.height / cells;
  for (let cy = 0; cy < cells; cy++) {
    for (let cx = 0; cx < cells; cx++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      const x0 = Math.floor(cx * cw);
      const x1 = Math.floor((cx + 1) * cw);
      const y0 = Math.floor(cy * ch);
      const y1 = Math.floor((cy + 1) * ch);
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (png.width * y + x) << 2;
          r += png.data[i];
          g += png.data[i + 1];
          b += png.data[i + 2];
          n++;
        }
      }
      layout.push(r / n / 255 - mean[0], g / n / 255 - mean[1], b / n / 255 - mean[2]);
    }
  }
  const color = Array.from({ length: 12 }, () => mean).flat();
  return [...color, ...layout];
}

export function vectorFromImageBuffer(buf: Buffer): number[] | null {
  try {
    const png = PNG.sync.read(buf);
    return vectorFromPng(png);
  } catch {
    return null;
  }
}

export const RECIPES = {
  stoneBeige: {
    base: [214, 196, 166],
    vein: [168, 142, 110],
    direction: "horizontal",
    period: 10,
  },
  stoneGray: {
    base: [186, 186, 180],
    vein: [120, 124, 128],
    direction: "vertical",
    period: 9,
  },
  stoneGrayPhoto: {
    base: [190, 188, 182],
    vein: [126, 128, 132],
    direction: "vertical",
    period: 9,
  },
  woodDark: {
    base: [112, 72, 42],
    vein: [72, 44, 26],
    direction: "horizontal",
    period: 14,
  },
  woodLight: {
    base: [186, 142, 96],
    vein: [140, 98, 60],
    direction: "horizontal",
    period: 16,
  },
  speckBlue: {
    base: [176, 196, 206],
    vein: [90, 120, 140],
    direction: "speckle",
    period: 7,
  },
} as const satisfies Record<string, Recipe>;
