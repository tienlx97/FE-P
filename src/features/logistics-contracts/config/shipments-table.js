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
  { key: 'quantityAmount', type: 'number', label: 'Số lượng' },
  { key: 'logisticsCost', type: 'number', label: 'Chi phí Logistics' },
  { key: 'vgmCount', type: 'number', label: 'VGM' },
];

/**
 * One column per fixed LOG cost group (BE-kt-xnk
 * `add-shipment-cost-log-groups`), headers abbreviated as in Figma 109:6632.
 */
export const COST_GROUP_COLUMNS = [
  {
    key: 'cost-LOG-01',
    code: 'LOG-01',
    name: 'Packing & Export Preparation',
    header: 'Packing & Exp. Prep',
  },
  {
    key: 'cost-LOG-02',
    code: 'LOG-02',
    name: 'Origin Inland Transportation & Depot',
    header: 'Inland Trans. (Origin)',
  },
  {
    key: 'cost-LOG-03',
    code: 'LOG-03',
    name: 'Origin Port & Export Charges',
    header: 'Origin Port Charges',
  },
  {
    key: 'cost-LOG-04',
    code: 'LOG-04',
    name: 'International Freight & Insurance',
    header: "Int'l Freight & Ins.",
  },
  {
    key: 'cost-LOG-05',
    code: 'LOG-05',
    name: 'Destination Port Charges',
    header: 'Dest. Port Charges',
  },
  {
    key: 'cost-LOG-06',
    code: 'LOG-06',
    name: 'Destination Inland Transportation',
    header: 'Dest. Inland Trans.',
  },
  {
    key: 'cost-LOG-07',
    code: 'LOG-07',
    name: 'Import Customs & Clearance',
    header: 'Import Custom Clearance',
  },
  {
    key: 'cost-LOG-08',
    code: 'LOG-08',
    name: 'Import Duty & Tax',
    header: 'Import Duty & Tax',
  },
];

export const COLUMN_OPTIONS = [
  { key: 'customsDeclarationDate', label: 'Ngày khai HQ' },
  { key: 'shipmentCode', label: 'Mã', isAlwaysVisible: true },
  { key: 'contractNumber', label: 'Số hợp đồng' },
  { key: 'incoterm', label: 'Incoterm' },
  { key: 'projectName', label: 'Dự án' },
  { key: 'name', label: 'Tên lô hàng' },
  { key: 'type', label: 'Loại hình' },
  { key: 'quantity', label: 'Số lượng' },
  { key: 'status', label: 'Tình trạng' },
  { key: 'bookingNumber', label: 'Booking' },
  { key: 'billOfLadingNumber', label: 'B/L' },
  { key: 'placeOfDischarge', label: 'Cảng đến' },
  { key: 'customsDeclarationNumber', label: 'Số tờ khai' },
  { key: 'coNumber', label: 'Số C/O' },
  { key: 'supplier', label: 'Booking (Forwarder)' },
  { key: 'shippingLine', label: 'Hãng tàu' },
  { key: 'customsBrokers', label: 'Đại lý hải quan' },
  { key: 'truckers', label: 'Đơn vị trucking' },
  { key: 'invoiceValue', label: 'Giá trị invoice' },
  { key: 'declarationValue', label: 'Giá trị tờ khai' },
  { key: 'declarationValueVnd', label: 'Giá trị tờ khai (VNĐ)' },
  { key: 'logisticsCost', label: 'Logistics (tổng chi phí)' },
  ...COST_GROUP_COLUMNS.map((group) => ({
    key: group.key,
    label: `${group.code} · ${group.name}`,
  })),
  { key: 'vgm', label: 'VGM' },
  { key: 'actions', label: 'Thao tác', isAlwaysVisible: true },
];

// "Cơ bản" — Figma 108:5920 (Meta "Danh sách Shipment"): identity,
// type / quantity / status, then the shipping documents.
export const DEFAULT_COLUMN_KEYS = [
  'customsDeclarationDate',
  'shipmentCode',
  'contractNumber',
  'incoterm',
  'type',
  'quantity',
  'status',
  'bookingNumber',
  'billOfLadingNumber',
  'placeOfDischarge',
  'customsDeclarationNumber',
  'coNumber',
  'actions',
];

// "Giá trị & Chi phí" — Figma 109:6632: declaration values under "GIÁ TRỊ",
// then one column per LOG cost group under "CHI PHÍ LOGISTICS".
export const VALUE_COLUMN_KEYS = [
  'shipmentCode',
  'contractNumber',
  'declarationValue',
  'declarationValueVnd',
  // "Logistics" = sum of the LOG groups, first in the cost group.
  'logisticsCost',
  ...COST_GROUP_COLUMNS.map((group) => group.key),
  'actions',
];

// "Nhà cung cấp" — Figma 110:7496: forwarder, shipping line, customs
// brokers and trucking companies (several per task allowed).
export const SUPPLIER_COLUMN_KEYS = [
  'shipmentCode',
  'contractNumber',
  'supplier',
  'shippingLine',
  'customsBrokers',
  'truckers',
  'actions',
];

/** @satisfies {ReadonlyArray<import('@/shared/components/advance-table.jsx').AdvanceTableViewPreset>} */
export const VIEW_PRESETS = [
  { key: 'basic', label: 'Cơ bản', columnKeys: DEFAULT_COLUMN_KEYS },
  { key: 'value', label: 'Giá trị & Chi phí', columnKeys: VALUE_COLUMN_KEYS },
  {
    key: 'supplier',
    label: 'Nhà cung cấp',
    columnKeys: SUPPLIER_COLUMN_KEYS,
  },
];

// `shipmentCode` (computed from the parent contract's number + shipment
// number) has no backend search field — excluded here. Still searchable via
// the quick-search box above (`SEARCH_FIELD_DEFS`, client-side over the
// loaded page), which also mirrors its text into a server-side
// `contractNumber` `Contains` filter (`shipments-list.jsx`'s
// `handleContentSearchChange`) so a match outside the current page is still
// found — same idea as `contracts-list.jsx`'s own quick-search box.
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
  { key: 'declarationValue', label: 'Giá trị tờ khai', type: 'number' },
  { key: 'etd', label: 'ETD', type: 'date' },
  { key: 'eta', label: 'ETA', type: 'date' },
  // Resolves against any cost line's invoice number, not a field on the
  // Shipment itself (BE-kt-xnk's `ShipmentFilterFields`) — a lô hàng
  // matches if *any* of its cost lines carries this invoice number.
  { key: 'invoiceNumber', label: 'Số hoá đơn', type: 'string' },
  { key: 'coNumber', label: 'Số C/O', type: 'string' },
  { key: 'coIssuedDate', label: 'Ngày có C/O', type: 'date' },
  { key: 'customsDeclarationNumber', label: 'Số tờ khai', type: 'string' },
  {
    key: 'customsDeclarationDate',
    label: 'Ngày khai Hải quan',
    type: 'date',
  },
];

export const SKELETON_ROW_COUNT = 6;

// User request (2026-09-23): 100 rows by default.
export const DEFAULT_PAGE_SIZE = 100;

export const PAGE_SIZE_OPTIONS = ['10', '25', '50', '100'];

/** @type {ShipmentListRow[]} */
export const skeletonRows = Array.from(
  { length: SKELETON_ROW_COUNT },
  (_, index) => ({
    id: `skeleton-${index}`,
    version: 0,
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
    declarationValueVnd: 0,
    quantityAmount: 0,
    quantityUnit: 'Kien',
    declarationWeightKg: 0,
    coNumber: null,
    coDeclarationDate: null,
    coIssuedDate: null,
    customsDeclarationNumber: null,
    customsDeclarationDate: null,
    customsInspected: false,
    costs: [],
    costTotalsByCategory: [],
    status: 'Booked',
    vgmCount: 0,
    contractNumber: '',
    projectName: '',
    supplierName: '',
    logisticsCost: 0,
  }),
);
