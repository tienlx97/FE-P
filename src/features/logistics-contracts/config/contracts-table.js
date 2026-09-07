import { contractStatusOptions } from './contract-status.js';
import { contractTypeOptions } from './contract-types.js';
import { currencyOptions } from './currencies.js';
import { incotermOptions } from './incoterms.js';

/** @typedef {'info' | 'paymentSchedule' | 'shipment' | 'commission'} ExpandedTab */

/** @satisfies {ReadonlyArray<import('@astryxdesign/core/PowerSearch').FieldDefinition>} */
export const SEARCH_FIELD_DEFS = [
  { key: 'contractNumber', type: 'string', label: 'Số hợp đồng' },
  {
    key: 'contractType',
    type: 'enum',
    label: 'Loại hợp đồng',
    enumValues: contractTypeOptions,
  },
  { key: 'projectName', type: 'string', label: 'Dự án' },
  { key: 'buyerCompanyName', type: 'string', label: 'Khách hàng' },
  { key: 'contractValue', type: 'number', label: 'Giá trị' },
  {
    key: 'currency',
    type: 'enum',
    label: 'Đơn vị tiền tệ',
    enumValues: currencyOptions,
  },
  {
    key: 'incoterm',
    type: 'enum',
    label: 'Incoterm',
    enumValues: incotermOptions,
  },
  {
    key: 'status',
    type: 'enum',
    label: 'Trạng thái',
    enumValues: contractStatusOptions,
  },
];

// The static, single-value-per-field advanced search this list used to have
// (one text input per field, ANDed together) is replaced by the
// `AdvancedFilterBuilder` condition builder below (`FILTER_FIELD_DEFS`) —
// same funnel-icon entry point in `AdvanceTable`'s toolbar, now server-side
// and per-field-typed (operators, Và/Hoặc chaining) instead of a fixed form.
// `countryName`/`bankNames` (client-joined display fields with no matching
// backend filter field yet) aren't carried over — see
// `openspec/changes/add-advanced-filtering/proposal.md`'s "Out of scope".

/** @satisfies {ReadonlyArray<import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterFieldDef>} */
export const FILTER_FIELD_DEFS = [
  { key: 'contractNumber', label: 'Số hợp đồng', type: 'string' },
  {
    key: 'contractType',
    label: 'Loại hợp đồng',
    type: 'enum',
    options: contractTypeOptions,
  },
  { key: 'projectName', label: 'Dự án', type: 'string' },
  { key: 'buyerCompanyName', label: 'Khách hàng', type: 'string' },
  { key: 'sellerCompanyName', label: 'Người bán', type: 'string' },
  { key: 'contractValue', label: 'Giá trị', type: 'number' },
  {
    key: 'currency',
    label: 'Đơn vị tiền tệ',
    type: 'enum',
    options: currencyOptions,
  },
  {
    key: 'incoterm',
    label: 'Incoterm',
    type: 'enum',
    options: incotermOptions,
  },
  { key: 'incotermYear', label: 'Năm Incoterm', type: 'number' },
  { key: 'createdDate', label: 'Ngày tạo', type: 'date' },
  { key: 'quotationDate', label: 'Ngày báo giá', type: 'date' },
  { key: 'category', label: 'Hạng mục', type: 'string' },
  { key: 'placeOfLoading', label: 'Nơi xếp hàng', type: 'string' },
  { key: 'placeOfDischarge', label: 'Nơi dỡ hàng', type: 'string' },
  { key: 'note', label: 'Ghi chú', type: 'string' },
  {
    key: 'status',
    label: 'Trạng thái',
    type: 'enum',
    options: contractStatusOptions,
  },
];

export const COLUMN_OPTIONS = [
  { key: 'contractNumber', label: 'Số hợp đồng', isAlwaysVisible: true },
  { key: 'contractType', label: 'Loại hợp đồng' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'projectName', label: 'Dự án' },
  { key: 'buyer', label: 'Khách hàng' },
  { key: 'contractValue', label: 'Giá trị' },
  { key: 'incoterm', label: 'Incoterm' },
  { key: 'createdDate', label: 'Ngày tạo' },
  { key: 'quotationDate', label: 'Ngày báo giá' },
  { key: 'category', label: 'Hạng mục' },
  { key: 'countryName', label: 'Nước xuất khẩu' },
  { key: 'placeOfLoading', label: 'Nơi xếp hàng' },
  { key: 'placeOfDischarge', label: 'Nơi dỡ hàng' },
  { key: 'note', label: 'Ghi chú' },
  { key: 'paymentTerms', label: 'Đợt thanh toán' },
  { key: 'bankIds', label: 'Ngân hàng thụ hưởng' },
  { key: 'actions', label: 'Chức năng', isAlwaysVisible: true },
];

// The picker opens on this set rather than every column at once — the API
// carries more fields than a first glance needs, and starting from the
// pre-existing default keeps today's screen unchanged for anyone who
// already has it open.
export const DEFAULT_COLUMN_KEYS = [
  'contractNumber',
  'contractType',
  'status',
  'projectName',
  'buyer',
  'contractValue',
  'incoterm',
  'createdDate',
  'actions',
];

export const SKELETON_ROW_COUNT = 6;

export const DEFAULT_PAGE_SIZE = 25;

export const PAGE_SIZE_OPTIONS = ['10', '25', '50', '100'];

/** @type {import('../types/index.js').Contract[]} */
export const skeletonRows = Array.from(
  { length: SKELETON_ROW_COUNT },
  (_, index) => ({
    id: `skeleton-${index}`,
    contractNumber: '',
    contractType: 'Draft',
    createdDate: '',
    quotationDate: '',
    projectName: '',
    category: '',
    countryId: '',
    placeOfLoading: '',
    placeOfDischarge: '',
    contractValue: 0,
    currency: '',
    incoterm: 'EXW',
    incotermYear: 0,
    companyId: '',
    seller: {
      companyName: '',
      representativeName: null,
      representativeTitle: null,
      address: null,
      sourceSellerId: null,
      extraFields: [],
    },
    buyer: {
      companyName: '',
      representativeName: null,
      representativeTitle: null,
      address: null,
      sourceCustomerId: null,
      extraFields: [],
    },
    notifyParty: null,
    consignee: null,
    note: null,
    paymentTerms: [],
    bankIds: [],
    sellerSigned: false,
    buyerSigned: false,
    status: 'InProgress',
  }),
);
