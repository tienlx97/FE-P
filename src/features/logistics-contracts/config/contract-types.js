/**
 * Fixed contract classification — mirrors the backend's
 * `CompanyManagement.Domain.Contracts.ContractType` enum (BE-kt-xnk) exactly,
 * so the string sent in `CreateContractRequest.ContractType` /
 * `UpdateContractRequest.ContractType` round-trips without a mapping layer.
 * @type {import('../types/index.js').ContractType[]}
 */
export const CONTRACT_TYPES = ['Draft', 'Official'];

export const contractTypeOptions = [
  { value: 'Draft', label: 'Nháp' },
  { value: 'Official', label: 'Chính thức' },
];

/** @param {import('../types/index.js').ContractType | string} contractType */
export function labelForContractType(contractType) {
  return (
    contractTypeOptions.find((option) => option.value === contractType)
      ?.label ?? contractType
  );
}

/**
 * `Badge` color for the contract-type badge (per user request,
 * 2026-09-17: the header mockup shows it as a colored category tag, not
 * flat neutral) — `Badge`'s own guidance is to use color variants for
 * category tags. `Official` (Chính thức) reads as the "real" classification.
 * @param {import('../types/index.js').ContractType | string} contractType
 * @returns {'blue' | 'neutral'}
 */
export function badgeVariantForContractType(contractType) {
  return contractType === 'Official' ? 'blue' : 'neutral';
}
