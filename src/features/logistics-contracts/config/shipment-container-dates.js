import {
  tracksDestinationFreeTime,
  tracksOriginFreeTime,
} from './shipment-schedule.js';

/**
 * @typedef {Object} ContainerDateField
 * @property {'emptyPickedUpOn' | 'gatedInOn' | 'destinationGatedOutOn' | 'emptyReturnedOn'} key
 * @property {string} label
 * @property {string} shortLabel - header pill
 */

/**
 * The container dates the seller records under this Incoterm: origin
 * (pickup, gate-in) except EXW; destination (empty return) under CIF /
 * DDP, plus the destination gate-out when destination DEM / DET are
 * counted separately (it ends DEM and starts DET).
 * @param {import('../types/index.js').Incoterm | string} incoterm
 * @param {import('../types/index.js').ContainerFreeTime | null | undefined} destinationFreeTime
 * @returns {ContainerDateField[]}
 */
export function containerDateFields(incoterm, destinationFreeTime) {
  /** @type {ContainerDateField[]} */
  const fields = [];
  if (tracksOriginFreeTime(incoterm)) {
    fields.push(
      { key: 'emptyPickedUpOn', label: 'Lấy rỗng', shortLabel: 'Lấy rỗng' },
      { key: 'gatedInOn', label: 'Hạ bãi (gate-in)', shortLabel: 'Hạ bãi' },
    );
  }
  if (tracksDestinationFreeTime(incoterm)) {
    if (destinationFreeTime?.mode === 'Separate') {
      fields.push({
        key: 'destinationGatedOutOn',
        label: 'Lấy hàng ra cảng đích',
        shortLabel: 'Ra cảng đích',
      });
    }
    fields.push({
      key: 'emptyReturnedOn',
      label: 'Trả rỗng',
      shortLabel: 'Trả rỗng',
    });
  }
  return fields;
}

/**
 * Dialog rows from the VGM records (every date kept, shown or not, so a
 * save never clears a hidden one).
 * @param {import('../types/index.js').ShipmentVgm[]} containers
 * @returns {import('../types/index.js').ContainerDatesFormRow[]}
 */
export function containerDatesRows(containers) {
  return containers.map((container) => ({
    vgmId: container.id,
    containerNumber: container.containerNumber,
    emptyPickedUpOn: container.emptyPickedUpOn ?? '',
    gatedInOn: container.gatedInOn ?? '',
    destinationGatedOutOn: container.destinationGatedOutOn ?? '',
    emptyReturnedOn: container.emptyReturnedOn ?? '',
    emptyReturnDepot: container.emptyReturnDepot ?? '',
  }));
}

/**
 * First – last date of one container event: "01/10/2026" or
 * "01/10/2026 – 03/10/2026"; null when no container has it.
 * @param {Array<string | null | undefined>} dates
 * @returns {{ from: string, to: string } | null}
 */
export function dateRange(dates) {
  const sorted = /** @type {string[]} */ (dates.filter(Boolean)).sort();
  return sorted.length > 0
    ? { from: sorted[0], to: sorted.at(-1) ?? sorted[0] }
    : null;
}
