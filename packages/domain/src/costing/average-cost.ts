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

/**
 * Distribute bill-level discount proportionally across line taxable amounts.
 * Last line absorbs residual paise so the sum matches exactly.
 */
export function distributeBillDiscount(
  lineTaxables: number[],
  billDiscount: number,
): number[] {
  if (billDiscount <= 0 || lineTaxables.length === 0) {
    return lineTaxables.map(() => 0);
  }
  const total = roundMoney(lineTaxables.reduce((s, v) => s + v, 0));
  if (total <= 0) {
    return lineTaxables.map(() => 0);
  }
  const allocations: number[] = [];
  let allocated = 0;
  for (let i = 0; i < lineTaxables.length; i++) {
    if (i === lineTaxables.length - 1) {
      allocations.push(roundMoney(billDiscount - allocated));
    } else {
      const share = roundMoney((lineTaxables[i]! / total) * billDiscount);
      allocations.push(share);
      allocated = roundMoney(allocated + share);
    }
  }
  return allocations;
}

/** Indian FY label e.g. Apr 2026 → "2026-27". */
export function financialYearLabel(date: Date, fyStartMonth = 4): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const startYear = month >= fyStartMonth ? year : year - 1;
  const endYearShort = String(startYear + 1).slice(-2);
  return `${startYear}-${endYearShort}`;
}

/** Round-off to nearest rupee within ±1 for header. */
export function computeRoundOff(amount: number): number {
  const rounded = Math.round(amount);
  const diff = roundMoney(rounded - amount);
  if (Math.abs(diff) > 1) return 0;
  return diff;
}
