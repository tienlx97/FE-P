/**
 * Fixed container-type set — mirrors the backend's
 * `CompanyManagement.Domain.Contracts.ShipmentContainerType` enum
 * (BE-kt-xnk) exactly, so the string sent in
 * `CreateShipmentVgmRequest.ContainerType` /
 * `UpdateShipmentVgmRequest.ContainerType` round-trips without a mapping
 * layer. A leading digit isn't a valid C# (or JS) identifier, so each
 * member is prefixed `Size`.
 * @type {import('../types/index.js').ShipmentContainerType[]}
 */
export const SHIPMENT_CONTAINER_TYPES = [
  'Size20',
  'Size40',
  'Size40HC',
  'Size45',
];

export const shipmentContainerTypeOptions = [
  { value: 'Size20', label: "20'" },
  { value: 'Size40', label: "40'" },
  { value: 'Size40HC', label: "40'HC" },
  { value: 'Size45', label: "45'" },
];

/** @param {import('../types/index.js').ShipmentContainerType | string} type */
export function labelForShipmentContainerType(type) {
  return (
    shipmentContainerTypeOptions.find((option) => option.value === type)
      ?.label ?? type
  );
}
