import { SHIPMENT_STATUSES } from './shipment-status.js';

/** @typedef {import('../types/index.js').ShipmentFormValues} ShipmentFormValues */
/** @typedef {import('../types/index.js').ShipmentStatus} ShipmentStatus */
/** @typedef {'basic' | 'parties' | 'booking' | 'schedule' | 'goods' | 'customs' | 'note'} ShipmentFormSectionId */
/**
 * @typedef {Object} ShipmentFormSection
 * @property {ShipmentFormSectionId} id
 * @property {string} title
 * @property {string} group - outline heading the section sits under
 * @property {ShipmentStatus | null} stage - first status the section matters
 *   at; `Booked` = always, null = optional (note)
 * @property {(keyof ShipmentFormValues)[]} fields - every value it edits
 *   (also the prefixes of its validation error keys)
 * @property {(keyof ShipmentFormValues)[]} keyFields - what "complete" means
 */

/**
 * Groups of the shipment drawer in display order, grouped by the stage the
 * information usually becomes known at (Stitch "Chỉnh sửa Shipment",
 * regrouped by `shipment-staged-form`).
 * @type {ShipmentFormSection[]}
 */
export const SHIPMENT_FORM_SECTIONS = [
  {
    id: 'basic',
    title: 'Thông tin cơ bản',
    group: 'Thông tin chung',
    stage: 'Booked',
    fields: [
      'name',
      'type',
      'paymentCondition',
      'letterOfCreditNumber',
      'status',
      'invoiceNumber',
      'invoiceValue',
      'invoiceCurrency',
      'declarationValue',
      'declarationCurrency',
      'declarationExchangeRate',
      'quantityAmount',
      'declarationWeightKg',
      'placeOfLoading',
      'placeOfDischarge',
      'placeOfDelivery',
    ],
    keyFields: [
      'name',
      'type',
      'paymentCondition',
      'status',
      'invoiceValue',
      'declarationValue',
      'declarationExchangeRate',
      'quantityAmount',
      'declarationWeightKg',
      'placeOfLoading',
      'placeOfDischarge',
    ],
  },
  {
    id: 'parties',
    title: 'Đơn vị tham gia',
    group: 'Đã book',
    stage: 'Booked',
    fields: ['supplierCustomerId', 'customsBrokerIds', 'truckingIds'],
    keyFields: ['supplierCustomerId'],
  },
  {
    id: 'booking',
    title: 'Booking & tàu',
    group: 'Đã book',
    stage: 'Booked',
    fields: [
      'bookingNumber',
      'billOfLadingNumber',
      'shippingLine',
      'vesselName',
      'voyageNumber',
      'serviceTerm',
      'isTransshipment',
      'transshipmentLegs',
    ],
    keyFields: ['bookingNumber', 'shippingLine', 'vesselName', 'voyageNumber'],
  },
  {
    id: 'schedule',
    title: 'Lịch trình & cut-off',
    group: 'Đã book',
    stage: 'Booked',
    fields: [
      'siCutoffDate',
      'siCutoffTime',
      'cyCutoffDate',
      'cyCutoffTime',
      'etd',
      'eta',
      'originFreeTime',
      'destinationFreeTime',
      'emptyReturnDeadline',
    ],
    keyFields: ['siCutoffDate', 'cyCutoffDate', 'etd', 'eta'],
  },
  {
    id: 'goods',
    title: 'Hàng hóa & bên nhận trên B/L',
    group: 'Đóng hàng',
    stage: 'Packing',
    fields: ['goodsLines', 'consigneeOverride', 'notifyPartyOverride'],
    keyFields: ['goodsLines'],
  },
  {
    id: 'customs',
    title: 'Hải quan & C/O',
    group: 'Hải quan',
    stage: 'AtYardAwaitingExport',
    fields: [
      'customsDeclarationNumber',
      'customsDeclarationDate',
      'customsChannel',
      'customsInspected',
      'coNumber',
      'coForm',
      'coDeclarationDate',
      'coIssuedDate',
    ],
    keyFields: [
      'customsDeclarationNumber',
      'customsDeclarationDate',
      'customsChannel',
    ],
  },
  {
    id: 'note',
    title: 'Ghi chú',
    group: 'Khác',
    stage: null,
    fields: ['note'],
    keyFields: [],
  },
];

/**
 * Groups to fill when moving a shipment to `status` ("Chuyển sang …").
 * @type {Record<ShipmentStatus, ShipmentFormSectionId[]>}
 */
const STAGE_SECTIONS = {
  Booked: ['parties', 'booking', 'schedule'],
  Packing: ['goods'],
  AtYardAwaitingExport: ['schedule', 'customs'],
  Shipping: ['booking', 'schedule'],
  DeliveredToPort: ['schedule'],
  CustomsDeclaration: ['customs'],
  TruckingToSite: ['parties'],
  Completed: [],
};

/** @param {ShipmentStatus} status @returns {ShipmentFormSectionId[]} */
export function sectionsForStage(status) {
  return [...(STAGE_SECTIONS[status] ?? []), 'note'];
}

/** @param {unknown} value */
function isFilled(value) {
  if (value === undefined || value === null || value === false) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    // Goods lines: a quantity map; free time: { mode, … }.
    return Object.values(value).some(
      (item) =>
        item !== undefined && item !== null && item !== '' && item !== 0,
    );
  }
  return true;
}

/**
 * Validation error keys look like `name`, `transshipmentLegs.0.port`,
 * `originFreeTime.demDays`, `goodsLines.<id>`.
 * @param {ShipmentFormSection} section @param {Record<string, unknown>} errors
 */
export function sectionHasError(section, errors) {
  return Object.keys(errors).some(
    (key) =>
      errors[key] &&
      section.fields.includes(
        /** @type {keyof ShipmentFormValues} */ (key.split('.')[0]),
      ),
  );
}

/**
 * Outline state of a group.
 * @param {ShipmentFormSection} section
 * @param {ShipmentFormValues} values
 * @param {Record<string, unknown>} errors
 * @returns {{ state: 'error' | 'complete' | 'missing' | 'optional', missing: number }}
 */
export function sectionCompleteness(section, values, errors) {
  if (sectionHasError(section, errors)) return { state: 'error', missing: 0 };
  if (section.keyFields.length === 0) return { state: 'optional', missing: 0 };
  const missing = section.keyFields.filter(
    (field) => !isFilled(values[field]),
  ).length;
  return { state: missing ? 'missing' : 'complete', missing };
}

/**
 * Whether a group starts open: always-relevant groups, groups whose stage
 * the status has reached, and groups that already hold data.
 * @param {ShipmentFormSection} section
 * @param {ShipmentFormValues} values
 */
export function isSectionOpenByDefault(section, values) {
  if (section.stage === 'Booked') return true;
  if (section.fields.some((field) => isFilled(values[field]))) return true;
  if (!section.stage || !values.status) return false;
  return (
    SHIPMENT_STATUSES.indexOf(values.status) >=
    SHIPMENT_STATUSES.indexOf(section.stage)
  );
}
