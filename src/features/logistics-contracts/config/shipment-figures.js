/**
 * Declaration figures (declared value, declaration exchange rate, quantity,
 * declared weight) are null until a shipment is declared — optional while
 * Booked / Packing (`requiresDeclarationFigures`). VNĐ amounts need the
 * rate, so totals cover rated shipments only and say how many were left
 * out, like the backend's `missingExchangeRateCount`.
 */

/** Placeholder for a figure that is not known yet. */
export const MISSING_FIGURE = '—';

/**
 * "Giá trị invoice (VNĐ)" of one shipment, or null without a rate.
 * @param {{ invoiceValue: number, declarationExchangeRate: number | null }} shipment
 */
export function invoiceValueVnd(shipment) {
  return shipment.declarationExchangeRate == null
    ? null
    : shipment.invoiceValue * shipment.declarationExchangeRate;
}

/**
 * VNĐ invoice total over the shipments that have a rate.
 * @param {{ invoiceValue: number, declarationExchangeRate: number | null }[]} shipments
 * @returns {{ total: number, missingRateCount: number }}
 */
export function invoiceValueVndTotal(shipments) {
  let total = 0;
  let missingRateCount = 0;
  for (const shipment of shipments) {
    const value = invoiceValueVnd(shipment);
    if (value === null) missingRateCount += 1;
    else total += value;
  }
  return { total, missingRateCount };
}

/**
 * Sum of a nullable figure, skipping shipments that do not have it yet.
 * @template T
 * @param {T[]} items @param {(item: T) => number | null | undefined} figure
 */
export function sumFigure(items, figure) {
  return items.reduce((total, item) => total + (figure(item) ?? 0), 0);
}

/**
 * "chưa gồm 2 lô chưa có tỷ giá" — note beside a VNĐ total, empty when
 * every shipment is counted.
 * @param {number} missingRateCount
 */
export function missingRateNote(missingRateCount) {
  return missingRateCount > 0
    ? `chưa gồm ${missingRateCount} lô chưa có tỷ giá`
    : '';
}

/**
 * A nullable figure through `format`, or "—" while it is unknown.
 * @param {number | null | undefined} value @param {(value: number) => string} format
 */
export function formatFigure(value, format) {
  return value == null ? MISSING_FIGURE : format(value);
}
