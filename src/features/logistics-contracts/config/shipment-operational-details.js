/**
 * Option lists for `Shipment.operationalDetails` (BE-kt-xnk
 * `add-shipment-operational-details`). `serviceTerm` / `coForm` are free
 * text on the backend (≤ 20 chars); these are the usual values.
 */

export const SHIPMENT_SERVICE_TERMS = ['CY/CY', 'CY/CFS', 'CFS/CY', 'CFS/CFS'];

export const shipmentServiceTermOptions = SHIPMENT_SERVICE_TERMS.map(
  (term) => ({ value: term, label: term }),
);

export const shipmentRoutingOptions = [
  { value: 'direct', label: 'Đi thẳng (Direct)' },
  { value: 'transshipment', label: 'Chuyển tải (Transshipment)' },
];

/** @type {import('../types/index.js').ShipmentCustomsChannel[]} */
export const SHIPMENT_CUSTOMS_CHANNELS = ['Green', 'Yellow', 'Red'];

export const shipmentCustomsChannelOptions = [
  { value: 'Green', label: 'Luồng Xanh' },
  { value: 'Yellow', label: 'Luồng Vàng' },
  { value: 'Red', label: 'Luồng Đỏ' },
];

/** @param {import('../types/index.js').ShipmentCustomsChannel} channel */
export function labelForCustomsChannel(channel) {
  return (
    shipmentCustomsChannelOptions.find((option) => option.value === channel)
      ?.label ?? channel
  );
}

/**
 * Meta pill tone per channel: green = released, yellow = documents
 * checked, red = physical inspection.
 * @param {import('../types/index.js').ShipmentCustomsChannel} channel
 * @returns {'success' | 'warning' | 'danger'}
 */
export function metaToneForCustomsChannel(channel) {
  if (channel === 'Green') return 'success';
  if (channel === 'Yellow') return 'warning';
  return 'danger';
}

/**
 * `siCutoff` ("YYYY-MM-DDTHH:mm[:ss]") split into the form's date and time
 * inputs, and joined back (time defaults to 00:00).
 * @param {string | null | undefined} siCutoff
 */
export function splitSiCutoff(siCutoff) {
  if (!siCutoff) return { date: '', time: '' };
  const [date, time = ''] = siCutoff.split('T');
  return { date, time: time.slice(0, 5) };
}

/** @param {string} date @param {string} time */
export function joinSiCutoff(date, time) {
  if (!date) return null;
  return `${date}T${(time || '00:00').slice(0, 5)}:00`;
}
