/** @satisfies {ReadonlyArray<import('@astryxdesign/core/PowerSearch').FieldDefinition>} */
export const SEARCH_FIELD_DEFS = [
  { key: 'companyName', type: 'string', label: 'Tên công ty' },
  { key: 'representativeName', type: 'string', label: 'Người đại diện' },
  { key: 'representativeTitle', type: 'string', label: 'Chức vụ' },
  { key: 'address', type: 'string', label: 'Địa chỉ' },
  { key: 'taxCode', type: 'string', label: 'Mã số thuế/CCCD' },
  { key: 'phone', type: 'string', label: 'Điện thoại' },
];

export const COLUMN_OPTIONS = [
  { key: 'companyName', label: 'Tên công ty', isAlwaysVisible: true },
  { key: 'representativeName', label: 'Người đại diện' },
  { key: 'representativeTitle', label: 'Chức vụ' },
  { key: 'address', label: 'Địa chỉ' },
  { key: 'extraFields', label: 'Trường tùy ý' },
];

/** @satisfies {ReadonlyArray<import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterFieldDef>} */
export const FILTER_FIELD_DEFS = [
  { key: 'companyName', label: 'Tên công ty', type: 'string' },
  { key: 'representativeName', label: 'Người đại diện', type: 'string' },
  { key: 'representativeTitle', label: 'Chức vụ', type: 'string' },
  { key: 'address', label: 'Địa chỉ', type: 'string' },
  { key: 'taxCode', label: 'Mã số thuế/CCCD', type: 'string' },
  { key: 'phone', label: 'Điện thoại', type: 'string' },
];

export const SKELETON_ROW_COUNT = 6;

export const DEFAULT_PAGE_SIZE = 25;

export const PAGE_SIZE_OPTIONS = ['10', '25', '50', '100'];

export const skeletonRows = Array.from(
  { length: SKELETON_ROW_COUNT },
  (_, index) => ({
    id: `skeleton-${index}`,
    companyName: '',
    representativeName: '',
    representativeTitle: '',
    address: '',
    extraFields: [],
  }),
);
