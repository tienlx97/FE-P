/**
 * Milestones confirmed by hand with their actual date (BE
 * `IncotermJourneys.IsConfirmable`). Every other milestone comes from
 * data the shipment already holds — status, packing dates (VGM), customs
 * declaration date, ETD / ETA, empty returns — so it has no "Xác nhận
 * mốc" action. Spec: `docs/shipment-journey-incoterms.md`.
 * @type {ReadonlySet<import('../types/index.js').ShipmentMilestone>}
 */
const CONFIRMABLE_MILESTONES = new Set(['ImportClearance', 'Site']);

/** @param {import('../types/index.js').ShipmentMilestone} milestone */
export function isConfirmableMilestone(milestone) {
  return CONFIRMABLE_MILESTONES.has(milestone);
}

/**
 * First and last packing date across the containers (packing can take
 * several days), as ISO dates; null when no container has one.
 * @param {Pick<import('../types/index.js').ShipmentVgm, 'packingDate'>[]} vgms
 * @returns {{ from: string, to: string } | null}
 */
export function packingDateRange(vgms) {
  const dates = vgms
    .map((vgm) => vgm.packingDate)
    .filter(Boolean)
    .sort();
  return dates.length > 0 ? { from: dates[0], to: dates.at(-1) ?? dates[0] } : null;
}
