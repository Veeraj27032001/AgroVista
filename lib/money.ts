/**
 * Money helpers for the v3 foundation tables, which store amounts as integer
 * paise (spec §1) to avoid rounding errors and match Razorpay's own unit.
 * Existing tables (issue_orders, subscriptions, article_payments, …) still
 * store rupees and are untouched — only new *_paise columns use these.
 */

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function formatPaiseAsRupees(paise: number): string {
  return `₹${paiseToRupees(paise).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
