import { shipmentStatusOptions } from './shipment-status.js';
import { shipmentTypeOptions } from './shipment-types.js';

/**
 * A `Shipment` plus fields resolved client-side for display — same reason
 * as `CommissionListRow` in `commissions-list.jsx`: the
 * system-wide `GET /api/v1/shipments` response doesn't carry the parent
 * contract's number/project or the forwarder's name.
 * @typedef {import('../types/index.js').Shipment & {
 *   contractNumber: string,
 *   projectName: string,
 *   supplierName: string,
 * }} ShipmentListRow
 */

/** @satisfies {ReadonlyArray<import('@astryxdesign/core/PowerSearch').FieldDefinition>} */
export const SEARCH_FIELD_DEFS = [
  { key: 'shipmentCode', type: 'string', label: 'Mã' },
  { key: 'name', type: 'string', label: 'Tên lô hàng' },
  { key: 'contractNumber', type: 'string', label: 'Số hợp đồng' },
  { key: 'projectName', type: 'string', label: 'Dự án' },
  { key: 'bookingNumber', type: 'string', label: 'Booking' },
];

export const COLUMN_OPTIONS = [
  { key: 'shipmentCode', label: 'Mã', isAlwaysVisible: true },
  { key: 'contractNumber', label: 'Số hợp đồng' },
  { key: 'projectName', label: 'Dự án' },
  { key: 'name', label: 'Tên lô hàng' },
  { key: 'type', label: 'Loại hình' },
  { key: 'status', label: 'Tình trạng' },
  { key: 'quantity', label: 'Số lượng' },
  { key: 'bookingNumber', label: 'Booking' },
  { key: 'supplier', label: 'Forwarder' },
  { key: 'invoiceValue', label: 'Giá trị invoice' },
  { key: 'actions', label: 'Chức năng', isAlwaysVisible: true },
];

// Narrow default, same "start narrow, opt in via Tuỳ chọn hiển thị"
// convention as `contracts-list.jsx`'s `DEFAULT_COLUMN_KEYS`.
export const DEFAULT_COLUMN_KEYS = [
  'shipmentCode',
  'contractNumber',
  'name',
  'type',
  'status',
  'invoiceValue',
  'actions',
];

// `shipmentCode` (computed from the parent contract's number + shipment
// number) has no backend search field — excluded here, still searchable
// via the quick-search box above (`SEARCH_FIELD_DEFS`, client-side over
// the loaded page).
/** @satisfies {ReadonlyArray<import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterFieldDef>} */
export const FILTER_FIELD_DEFS = [
  { key: 'contractNumber', label: 'Số hợp đồng', type: 'string' },
  { key: 'projectName', label: 'Dự án', type: 'string' },
  { key: 'name', label: 'Tên lô hàng', type: 'string' },
  {
    key: 'type',
    label: 'Loại hình',
    type: 'enum',
    options: shipmentTypeOptions,
  },
  {
    key: 'status',
    label: 'Tình trạng',
    type: 'enum',
    options: shipmentStatusOptions,
  },
  { key: 'bookingNumber', label: 'Booking', type: 'string' },
  { key: 'supplierName', label: 'Forwarder', type: 'string' },
  { key: 'invoiceValue', label: 'Giá trị invoice', type: 'number' },
  { key: 'etd', label: 'ETD', type: 'date' },
  { key: 'eta', label: 'ETA', type: 'date' },
];

export const SKELETON_ROW_COUNT = 6;

export const DEFAULT_PAGE_SIZE = 25;

export const PAGE_SIZE_OPTIONS = ['10', '25', '50', '100'];

/** @type {ShipmentListRow[]} */
export const skeletonRows = Array.from(
  { length: SKELETON_ROW_COUNT },
  (_, index) => ({
    id: `skeleton-${index}`,
    contractId: '',
    shipmentNumber: 0,
    shipmentCode: '',
    supplierCustomerId: '',
    bookingNumber: '',
    billOfLadingNumber: null,
    shippingLine: null,
    vesselName: null,
    etd: null,
    eta: null,
    placeOfLoading: null,
    placeOfDischarge: null,
    type: 'LCL',
    name: '',
    paymentCondition: 'TT',
    invoiceValue: 0,
    invoiceCurrency: '',
    declarationValue: 0,
    declarationCurrency: '',
    declarationExchangeRate: 0,
    quantityAmount: 0,
    quantityUnit: 'Kien',
    declarationWeightKg: 0,
    coNumber: null,
    coDeclarationDate: null,
    coIssuedDate: null,
    costs: [],
    costTotalsByCategory: [],
    status: 'Booked',
    contractNumber: '',
    projectName: '',
    supplierName: '',
  }),
);
