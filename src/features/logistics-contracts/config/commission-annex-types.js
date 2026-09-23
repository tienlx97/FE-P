/**
 * Fixed annex type set — mirrors the backend's
 * `CompanyManagement.Domain.Contracts.CommissionAnnexType` enum
 * (BE-kt-xnk) exactly, so the string sent in
 * `CreateCommissionAnnexRequest.Type` /
 * `UpdateCommissionAnnexRequest.Type` round-trips without a mapping
 * layer. Distinct from `ContractAnnexType` — `InfoChange`, not
 * `ValueChange`.
 * @type {import('../types/index.js').CommissionAnnexType[]}
 */
export const COMMISSION_ANNEX_TYPES = [
  'AmountIncrease',
  'AmountDecrease',
  'InfoChange',
];

export const commissionAnnexTypeOptions = [
  { value: 'AmountIncrease', label: 'Phát sinh tăng' },
  { value: 'AmountDecrease', label: 'Phát sinh giảm' },
  { value: 'InfoChange', label: 'Thay đổi thông tin' },
];

/** @param {import('../types/index.js').CommissionAnnexType | string} type */
export function labelForCommissionAnnexType(type) {
  return (
    commissionAnnexTypeOptions.find((option) => option.value === type)?.label ??
    type
  );
}
