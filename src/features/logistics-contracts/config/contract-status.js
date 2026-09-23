/**
 * Contract workflow status ("Trạng thái hợp đồng") — mirrors the
 * backend's `CompanyManagement.Domain.Contracts.ContractStatus` enum
 * (BE-kt-xnk) exactly, so the string round-trips without a mapping
 * layer. Independent of `ContractType` (Draft/Official is a paperwork
 * stage; this is whether the underlying deal is still ongoing) — see
 * BE-kt-xnk's `openspec/changes/add-contract-and-shipment-status/`.
 * List order here is display order only — it doesn't need to match the
 * backend enum's ordinal (`NotStarted` is last there, to avoid
 * reinterpreting already-stored values; see that enum's doc comment).
 * @type {import('../types/index.js').ContractStatus[]}
 */
export const CONTRACT_STATUSES = [
  'NotStarted',
  'InProgress',
  'Completed',
  'Cancelled',
];

export const contractStatusOptions = [
  { value: 'NotStarted', label: 'Chưa thực hiện' },
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
 * red = đã huỷ, neutral = chưa thực hiện (and any unrecognised value).
 * @param {import('../types/index.js').ContractStatus | string} status
 * @returns {'blue' | 'green' | 'red' | 'neutral'}
 */
export function badgeVariantForContractStatus(status) {
  if (status === 'Completed') return 'blue';
  if (status === 'InProgress') return 'green';
  if (status === 'Cancelled') return 'red';
  return 'neutral';
}

/**
 * `StatusDot` variant for the same status — a narrower palette than
 * `Badge`'s (`astryx component StatusDot`: only success/warning/error/
 * accent/neutral), so "Completed" maps to `accent` rather than repeating
 * `badgeVariantForContractStatus`'s own `'blue'`.
 * @param {import('../types/index.js').ContractStatus | string} status
 * @returns {'success' | 'accent' | 'error' | 'neutral'}
 */
export function statusDotVariantForContractStatus(status) {
  if (status === 'Completed') return 'accent';
  if (status === 'InProgress') return 'success';
  if (status === 'Cancelled') return 'error';
  return 'neutral';
}

/**
 * `MetaPill` tone for the same status (Meta contract-detail header and
 * edit drawer): emerald = đang thực hiện, cobalt = hoàn thành, neutral
 * otherwise.
 * @param {import('../types/index.js').ContractStatus | string} status
 * @returns {'accent' | 'success' | 'neutral'}
 */
export function metaToneForContractStatus(status) {
  if (status === 'Completed') return 'accent';
  if (status === 'InProgress') return 'success';
  return 'neutral';
}
