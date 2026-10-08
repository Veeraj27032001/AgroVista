/**
 * GST split for an invoice line. `amountPaise` is treated as tax-inclusive
 * (spec §5.1 — "Prices shown to buyers include GST"). If no rate is
 * configured yet (ratePercent = 0, e.g. GSTIN not set up), the line is a
 * plain receipt: taxable value = amount, tax = 0 — nothing is fabricated.
 */
export function splitGst(params: {
  amountPaise: number;
  ratePercent: number;
  buyerStateName: string | null;
  businessStateName: string | null;
}): { taxableValuePaise: number; cgstPaise: number; sgstPaise: number; igstPaise: number; totalPaise: number } {
  const { amountPaise, ratePercent, buyerStateName, businessStateName } = params;

  if (!ratePercent) {
    return { taxableValuePaise: amountPaise, cgstPaise: 0, sgstPaise: 0, igstPaise: 0, totalPaise: amountPaise };
  }

  const taxableValuePaise = Math.round(amountPaise / (1 + ratePercent / 100));
  const totalTax = amountPaise - taxableValuePaise;

  const sameState = Boolean(businessStateName) && buyerStateName?.toLowerCase() === businessStateName?.toLowerCase();
  if (sameState) {
    const half = Math.round(totalTax / 2);
    return { taxableValuePaise, cgstPaise: half, sgstPaise: totalTax - half, igstPaise: 0, totalPaise: amountPaise };
  }
  return { taxableValuePaise, cgstPaise: 0, sgstPaise: 0, igstPaise: totalTax, totalPaise: amountPaise };
}
