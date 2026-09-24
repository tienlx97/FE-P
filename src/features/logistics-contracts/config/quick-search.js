/**
 * "Tra cứu nhanh" (Ctrl/⌘ + K) — turns what the user typed into what to
 * look up. Only contract numbers and shipment codes for now:
 *
 * - `26KCT14` / `26kct14` → contracts whose number contains it, plus
 *   their shipments.
 * - `26KCT14/LOT-1`, `26kct14/lot1`, `26KCT14/LOT-01` → shipment
 *   `26KCT14/LOT-01` (the backend's `{contractNumber}/LOT-{nn}` for FCL,
 *   `/LCL-{nn}` for LCL). The part after `/` may be partial: `26KCT14/LOT`
 *   lists every FCL lot, `26KCT14/2` both `LOT-02` and `LCL-02`.
 *
 * Case never matters — the backend compares with MySQL's case-insensitive
 * collation, and the lot suffix is matched here.
 */

/** @typedef {'LOT' | 'LCL'} ShipmentCodePrefix */

/**
 * @typedef {{
 *   contractTerm: string,
 *   lot: { prefix: ShipmentCodePrefix | null, number: number | null } | null,
 * }} QuickSearchQuery
 */

export const QUICK_SEARCH_CONTRACT_LIMIT = 5;
export const QUICK_SEARCH_SHIPMENT_LIMIT = 8;

/** @type {Record<string, ShipmentCodePrefix>} */
const PREFIX_ALIASES = { LOT: 'LOT', FCL: 'LOT', LCL: 'LCL' };

const LOT_SUFFIX_PATTERN = /^(LOT|FCL|LCL)?[\s-]*0*(\d+)?$/;

/**
 * `null` when there's nothing to look up (blank, or only a `/`) or the
 * part after `/` can't be a shipment suffix.
 * @param {string} query
 * @returns {QuickSearchQuery | null}
 */
export function parseQuickSearchQuery(query) {
  const trimmed = query.trim().toUpperCase();
  const slashIndex = trimmed.indexOf('/');
  const contractTerm = (
    slashIndex === -1 ? trimmed : trimmed.slice(0, slashIndex)
  ).trim();

  if (!contractTerm) {
    return null;
  }

  if (slashIndex === -1) {
    return { contractTerm, lot: null };
  }

  const match = LOT_SUFFIX_PATTERN.exec(trimmed.slice(slashIndex + 1).trim());
  if (!match) {
    return null;
  }

  return {
    contractTerm,
    lot: {
      prefix: match[1] ? PREFIX_ALIASES[match[1]] : null,
      number: match[2] ? Number(match[2]) : null,
    },
  };
}

/**
 * Whether `shipmentCode` (`{contractNumber}/LOT-01`) satisfies the parsed
 * lot suffix; always true when the query had no `/`.
 * @param {string} shipmentCode
 * @param {QuickSearchQuery['lot']} lot
 */
export function matchesLotSuffix(shipmentCode, lot) {
  if (!lot) {
    return true;
  }

  const suffix = shipmentCode.slice(shipmentCode.lastIndexOf('/') + 1);
  const match = /^(LOT|LCL)-(\d+)$/i.exec(suffix);
  if (!match) {
    return false;
  }

  return (
    (lot.prefix === null || match[1].toUpperCase() === lot.prefix) &&
    (lot.number === null || Number(match[2]) === lot.number)
  );
}

/**
 * Exact matches first (`26KCT1` ranks `26KCT1` above `26KCT14`), then the
 * backend's order.
 * @template T
 * @param {T[]} items
 * @param {(item: T) => string} codeOf
 * @param {string} term uppercased
 * @returns {T[]}
 */
export function rankExactFirst(items, codeOf, term) {
  return items
    .map((item, index) => ({
      item,
      rank: codeOf(item).toUpperCase() === term ? 0 : 1,
      index,
    }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ item }) => item);
}

/** @param {string} contractId */
export function contractDetailHref(contractId) {
  return `/logistics/contract/${contractId}`;
}

/**
 * @param {string} contractId
 * @param {string} shipmentId
 */
export function shipmentDetailHref(contractId, shipmentId) {
  return `/logistics/contract/${contractId}/shipment/${shipmentId}`;
}
