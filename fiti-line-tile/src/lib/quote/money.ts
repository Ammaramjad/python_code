export type PackResult = {
  requestedPieces: number;
  unitsPerBox: number;
  boxes: number;
  suppliedPieces: number;
};

export function packPieces(requestedPieces: number, unitsPerBox: number): PackResult {
  if (!Number.isInteger(requestedPieces) || requestedPieces <= 0) {
    throw new Error("Requested quantity must be a positive whole number of pieces");
  }
  if (!Number.isInteger(unitsPerBox) || unitsPerBox <= 0) {
    throw new Error("Units per box must be a positive integer");
  }
  const boxes = Math.ceil(requestedPieces / unitsPerBox);
  return {
    requestedPieces,
    unitsPerBox,
    boxes,
    suppliedPieces: boxes * unitsPerBox,
  };
}

/** Integer NT dollars. Half-up via Math.round, then the result is a whole dollar. */
export function taxTwd(subtotal: number, taxRateBps: number): number {
  if (taxRateBps <= 0) return 0;
  return Math.round((subtotal * taxRateBps) / 10_000);
}

export function quoteTotals(input: {
  suppliedPieces: number;
  unitPriceTwd: number;
  taxRateBps: number;
}): { subtotal: number; tax: number; total: number } {
  const subtotal = input.suppliedPieces * input.unitPriceTwd;
  const tax = taxTwd(subtotal, input.taxRateBps);
  return { subtotal, tax, total: subtotal + tax };
}
