/**
 * A `Commission` plus the fields resolved client-side for display —
 * see the comment above `contractsById` in `CommissionsList` for why
 * these aren't already on the API response.
 * @typedef {import('../types/index.js').Commission & {
 *   contractNumber: string,
 *   projectName: string,
 *   currency: string,
 *   partyCustomerName: string,
 * }} CommissionListRow
 */

/** @satisfies {ReadonlyArray<import('@astryxdesign/core/PowerSearch').FieldDefinition>} */
export const SEARCH_FIELD_DEFS = [
  { key: 'code', type: 'string', label: 'Mã' },
  { key: 'contractNumber', type: 'string', label: 'Số hợp đồng' },
  { key: 'projectName', type: 'string', label: 'Dự án' },
  { key: 'partyCustomerName', type: 'string', label: 'Bên nhận hoa hồng' },
];

export const COLUMN_OPTIONS = [
  { key: 'code', label: 'Mã', isAlwaysVisible: true },
  { key: 'contractNumber', label: 'Số hợp đồng' },
  { key: 'projectName', label: 'Dự án' },
  { key: 'partyCustomerName', label: 'Bên nhận hoa hồng' },
  { key: 'value', label: 'Giá trị' },
  { key: 'signedDate', label: 'Ngày ký' },
  { key: 'sellerSigned', label: 'Bên bán đã ký' },
  { key: 'partySigned', label: 'Bên nhận hoa hồng đã ký' },
  { key: 'actions', label: 'Chức năng', isAlwaysVisible: true },
];

// The picker opens on this set rather than every column at once — same
// "start narrow, let the user opt in via Tuỳ chọn hiển thị" convention as
// `contracts-list.jsx`'s `DEFAULT_COLUMN_KEYS`.
export const DEFAULT_COLUMN_KEYS = [
  'code',
  'contractNumber',
  'partyCustomerName',
  'value',
  'signedDate',
  'actions',
];

// `code` (computed from Year+Number) has no backend search field —
// excluded here, still searchable via the quick-search box above
// (`SEARCH_FIELD_DEFS`, client-side over the loaded page).
/** @satisfies {ReadonlyArray<import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterFieldDef>} */
export const FILTER_FIELD_DEFS = [
  { key: 'contractNumber', label: 'Số hợp đồng', type: 'string' },
  { key: 'projectName', label: 'Dự án', type: 'string' },
  { key: 'partyCustomerName', label: 'Bên nhận hoa hồng', type: 'string' },
  { key: 'value', label: 'Giá trị', type: 'number' },
  { key: 'signedDate', label: 'Ngày ký', type: 'date' },
  {
    key: 'sellerSigned',
    label: 'Bên bán đã ký',
    type: 'enum',
    options: [
      { value: 'true', label: 'Đã ký' },
      { value: 'false', label: 'Chưa ký' },
    ],
  },
  {
    key: 'partySigned',
    label: 'Bên nhận hoa hồng đã ký',
    type: 'enum',
    options: [
      { value: 'true', label: 'Đã ký' },
      { value: 'false', label: 'Chưa ký' },
    ],
  },
];

export const SKELETON_ROW_COUNT = 6;

export const DEFAULT_PAGE_SIZE = 25;

export const PAGE_SIZE_OPTIONS = ['10', '25', '50', '100'];

/** @type {CommissionListRow[]} */
export const skeletonRows = Array.from(
  { length: SKELETON_ROW_COUNT },
  (_, index) => ({
    id: `skeleton-${index}`,
    contractId: '',
    year: 0,
    number: 0,
    code: '',
    signedDate: '',
    partyCustomerId: '',
    value: 0,
    sellerSigned: false,
    partySigned: false,
    paymentTerms: [],
    paymentHistory: [],
    contractNumber: '',
    projectName: '',
    currency: '',
    partyCustomerName: '',
  }),
);
