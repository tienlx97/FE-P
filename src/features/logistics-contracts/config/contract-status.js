/**
 * Contract workflow status ("Trạng thái hợp đồng") — mirrors the
 * backend's `CompanyManagement.Domain.Contracts.ContractStatus` enum
 * (BE-kt-xnk) exactly, so the string round-trips without a mapping
 * layer. Independent of `ContractType` (Draft/Official is a paperwork
 * stage; this is whether the underlying deal is still ongoing) — see
 * BE-kt-xnk's `openspec/changes/add-contract-and-shipment-status/`.
 * @type {import('../types/index.js').ContractStatus[]}
 */
export const CONTRACT_STATUSES = ['InProgress', 'Completed', 'Cancelled'];

export const contractStatusOptions = [
  { value: 'InProgress', label: 'Đang thực hiện' },
  { value: 'Completed', label: 'Đã hoàn thành' },
  { value: 'Cancelled', label: 'Đã huỷ' },
];

/** @param {import('../types/index.js').ContractStatus | string} status */
export function labelForContractStatus(status) {
  return (
    contractStatusOptions.find((option) => option.value === status)?.label ??
    status
  );
}

/**
 * `Badge` color for the contracts list's "Trạng thái" column (per user
 * request, 2026-09-08): blue = hoàn thành, green = đang thực hiện,
 * red = đã huỷ.
 * @param {import('../types/index.js').ContractStatus | string} status
 * @returns {'blue' | 'green' | 'red' | 'neutral'}
 */
export function badgeVariantForContractStatus(status) {
  if (status === 'Completed') return 'blue';
  if (status === 'InProgress') return 'green';
  if (status === 'Cancelled') return 'red';
  return 'neutral';
}
