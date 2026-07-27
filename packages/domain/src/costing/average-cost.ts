/**
 * Weighted average unit cost on inbound stock.
 * All values are plain numbers; callers should round for persistence.
 */
export function computeWeightedAverageCost(input: {
  oldQty: number;
  oldAvg: number;
  inQty: number;
  inRate: number;
}): number {
  const { oldQty, oldAvg, inQty, inRate } = input;
  if (inQty <= 0) {
    return oldAvg;
  }
  const newQty = oldQty + inQty;
  if (newQty === 0) {
    return 0;
  }
  if (oldQty <= 0) {
    return inRate;
  }
  return (oldQty * oldAvg + inQty * inRate) / newQty;
}

/** V1 same-state: split total GST rate into CGST + SGST halves from tax rate row. */
export function splitCgstSgst(totalRate: number): { cgstRate: number; sgstRate: number } {
  const half = totalRate / 2;
  return { cgstRate: half, sgstRate: half };
}

export function computeLineTax(input: {
  taxableAmount: number;
  cgstRate: number;
  sgstRate: number;
}): { cgstAmount: number; sgstAmount: number; igstAmount: number; taxAmount: number } {
  const cgstAmount = roundMoney((input.taxableAmount * input.cgstRate) / 100);
  const sgstAmount = roundMoney((input.taxableAmount * input.sgstRate) / 100);
  const igstAmount = 0;
  return {
    cgstAmount,
    sgstAmount,
    igstAmount,
    taxAmount: roundMoney(cgstAmount + sgstAmount),
  };
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function roundUnitCost(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}
