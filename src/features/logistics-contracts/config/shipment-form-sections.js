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
      'declarationValue',
      'declarationCurrency',
      'declarationExchangeRate',
      'quantityAmount',
      'declarationWeightKg',
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
      'declarationValue',
      'declarationExchangeRate',
      'quantityAmount',
      'declarationWeightKg',
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

// Fields that always start with a value (currency, status, …): they say
// nothing about whether the user has filled a group in.
const PRESET_FIELDS = new Set([
  'status',
  'type',
  'invoiceCurrency',
  'declarationCurrency',
]);

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
 * @typedef {Object} ShipmentCreateStep
 * @property {string} label
 * @property {string} stageLabel - when its data usually becomes known
 * @property {ShipmentFormSectionId[]} sections
 */

/**
 * Steps of "Thêm Shipment" (`shipment-create-stepper`): the groups in stage
 * order; the last one also reviews every other group.
 * @type {ShipmentCreateStep[]}
 */
export const SHIPMENT_CREATE_STEPS = [
  {
    label: 'Cơ bản & đơn vị',
    stageLabel: 'Đã book',
    sections: ['basic', 'parties'],
  },
  {
    label: 'Booking & lịch trình',
    stageLabel: 'Đã book',
    sections: ['booking', 'schedule'],
  },
  { label: 'Hàng hóa', stageLabel: 'Đang đóng hàng', sections: ['goods'] },
  {
    label: 'Hải quan & C/O',
    stageLabel: 'Hạ bãi chờ xuất',
    sections: ['customs'],
  },
  { label: 'Ghi chú & xem lại', stageLabel: 'Tuỳ chọn', sections: ['note'] },
];

/** @param {ShipmentCreateStep} step */
function stepSections(step) {
  return SHIPMENT_FORM_SECTIONS.filter((section) =>
    step.sections.includes(section.id),
  );
}

/**
 * Every value a step edits (validating "Tiếp" checks only these).
 * @param {ShipmentCreateStep} step
 * @returns {(keyof ShipmentFormValues)[]}
 */
export function stepFields(step) {
  return stepSections(step).flatMap((section) => section.fields);
}

/**
 * Stepper mark of a step: an error in any of its groups, complete when every
 * group with key fields is complete, null when it has only optional groups.
 * @param {ShipmentCreateStep} step
 * @param {ShipmentFormValues} values
 * @param {Record<string, unknown>} errors
 * @returns {'error' | 'complete' | 'missing' | null}
 */
export function stepState(step, values, errors) {
  const states = stepSections(step).map(
    (section) => sectionCompleteness(section, values, errors).state,
  );
  if (states.includes('error')) return 'error';
  const required = states.filter((state) => state !== 'optional');
  if (required.length === 0) return null;
  return required.every((state) => state === 'complete')
    ? 'complete'
    : 'missing';
}

/**
 * Index of the first step holding one of `errors`, or -1.
 * @param {Record<string, unknown>} errors
 */
export function firstStepWithError(errors) {
  return SHIPMENT_CREATE_STEPS.findIndex((step) =>
    stepSections(step).some((section) => sectionHasError(section, errors)),
  );
}

/**
 * Step index that holds `sectionId`.
 * @param {ShipmentFormSectionId} sectionId
 */
export function stepOfSection(sectionId) {
  return SHIPMENT_CREATE_STEPS.findIndex((step) =>
    step.sections.includes(sectionId),
  );
}

/**
 * Whether a group starts open: always-relevant groups, groups whose stage
 * the status has reached, and groups that already hold data.
 * @param {ShipmentFormSection} section
 * @param {ShipmentFormValues} values
 */
export function isSectionOpenByDefault(section, values) {
  if (section.stage === 'Booked') return true;
  if (
    section.fields.some(
      (field) => !PRESET_FIELDS.has(field) && isFilled(values[field]),
    )
  ) {
    return true;
  }
  if (!section.stage || !values.status) return false;
  return (
    SHIPMENT_STATUSES.indexOf(values.status) >=
    SHIPMENT_STATUSES.indexOf(section.stage)
  );
}
