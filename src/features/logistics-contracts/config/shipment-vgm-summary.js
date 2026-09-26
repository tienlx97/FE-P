import { SHIPMENT_CONTAINER_TYPES } from './shipment-container-types.js';

/**
 * @typedef {Object} ShipmentVgmSummary
 * @property {number} containerCount - VGM records (one per container)
 * @property {{ type: import('../types/index.js').ShipmentContainerType, count: number }[]} typeCounts - largest count first, then catalog order
 * @property {number} sealCount - records with a seal number
 * @property {number} maxGross
 * @property {number} tare
 * @property {number} grossWeight
 * @property {number} vgm
 * @property {number | null} plannedContainerCount - `Shipment.quantityAmount` when counted in containers (FCL), else null
 * @property {number | null} declaredRatio - containers with a VGM weight / planned containers (0–1, capped), null without a plan
 * @property {number} declaredCount - records with a VGM weight above zero
 */

/**
 * Totals for the shipment-detail "VGM" tab (Figma 120:9075): banner
 * figures and the table's totals row, computed from the VGM records.
 * @param {import('../types/index.js').ShipmentVgm[]} vgms
 * @param {Pick<import('../types/index.js').Shipment, 'quantityAmount' | 'quantityUnit'>} shipment
 * @returns {ShipmentVgmSummary}
 */
export function summarizeShipmentVgms(vgms, shipment) {
  /** @type {Map<import('../types/index.js').ShipmentContainerType, number>} */
  const counts = new Map();
  for (const vgm of vgms) {
    counts.set(vgm.containerType, (counts.get(vgm.containerType) ?? 0) + 1);
  }
  const typeCounts = [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        SHIPMENT_CONTAINER_TYPES.indexOf(a.type) -
          SHIPMENT_CONTAINER_TYPES.indexOf(b.type),
    );

  const declaredCount = vgms.filter((vgm) => (vgm.vgm ?? 0) > 0).length;
  const plannedContainerCount =
    shipment.quantityUnit === 'Cont' && shipment.quantityAmount > 0
      ? shipment.quantityAmount
      : null;

  return {
    containerCount: vgms.length,
    typeCounts,
    sealCount: vgms.filter((vgm) => (vgm.sealNumber ?? '').trim() !== '').length,
    maxGross: sum(vgms, 'maxGross'),
    tare: sum(vgms, 'tare'),
    grossWeight: sum(vgms, 'grossWeight'),
    vgm: sum(vgms, 'vgm'),
    plannedContainerCount,
    declaredRatio:
      plannedContainerCount === null
        ? null
        : Math.min(declaredCount / plannedContainerCount, 1),
    declaredCount,
  };
}

/**
 * @param {import('../types/index.js').ShipmentVgm[]} vgms
 * @param {'maxGross' | 'tare' | 'grossWeight' | 'vgm'} key
 */
function sum(vgms, key) {
  return vgms.reduce((total, vgm) => total + (vgm[key] ?? 0), 0);
}
