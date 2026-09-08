/** @satisfies {ReadonlyArray<import('@astryxdesign/core/PowerSearch').FieldDefinition>} */
export const SEARCH_FIELD_DEFS = [
  { key: 'contractNumber', type: 'string', label: 'Số hợp đồng' },
  { key: 'projectName', type: 'string', label: 'Dự án' },
];

export const COLUMN_OPTIONS = [
  { key: 'contractNumber', label: 'Số hợp đồng', isAlwaysVisible: true },
  { key: 'projectName', label: 'Dự án' },
  { key: 'containerCount', label: 'Số cont' },
  { key: 'costPricePerContainer', label: 'Giá vốn' },
  { key: 'quotedPricePerContainer', label: 'Giá báo khách' },
  { key: 'logisticsTotal', label: 'Tổng' },
  { key: 'profit', label: 'Lợi nhuận' },
  { key: 'actions', label: 'Chức năng', isAlwaysVisible: true },
];

export const DEFAULT_COLUMN_KEYS = [
  'contractNumber',
  'projectName',
  'containerCount',
  'costPricePerContainer',
  'quotedPricePerContainer',
  'logisticsTotal',
  'profit',
  'actions',
];

// BOQ has no filterable fields of its own on the backend — a row is a
// permission-gated projection of Contract, so `conditions` filter the same
// Contract fields the main Contracts/Shipments search does (see
// `docs/api/Contracts.md`, BE-kt-xnk).
/** @satisfies {ReadonlyArray<import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterFieldDef>} */
export const FILTER_FIELD_DEFS = [
  { key: 'contractNumber', label: 'Số hợp đồng', type: 'string' },
  { key: 'projectName', label: 'Dự án', type: 'string' },
];

export const SKELETON_ROW_COUNT = 6;

export const DEFAULT_PAGE_SIZE = 25;

export const PAGE_SIZE_OPTIONS = ['10', '25', '50', '100'];

/** @type {import('../types/index.js').ContractPrivateInfoListItem[]} */
export const skeletonRows = Array.from(
  { length: SKELETON_ROW_COUNT },
  (_, index) => ({
    contractId: `skeleton-${index}`,
    contractNumber: '',
    projectName: '',
    containerCount: null,
    costPricePerContainer: null,
    quotedPricePerContainer: null,
    logisticsTotal: null,
    profit: null,
  }),
);
