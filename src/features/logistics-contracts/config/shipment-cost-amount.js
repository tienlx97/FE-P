/**
 * `Amount` is the saved line total. Quantity defaults to one on older API
 * responses; the editor derives a unit price only for display and editing.
 * @param {{ amount: number, quantity?: number }} cost
 */
export function costUnitPrice(cost) {
  return Number((cost.amount / (cost.quantity || 1)).toFixed(2));
}

/** @param {number | undefined} quantity @param {number | undefined} unitPrice */
export function costLineTotal(quantity, unitPrice) {
  return typeof quantity === 'number' && typeof unitPrice === 'number'
    ? Number((quantity * unitPrice).toFixed(2))
    : undefined;
}
