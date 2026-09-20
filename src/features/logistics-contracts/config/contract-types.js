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
