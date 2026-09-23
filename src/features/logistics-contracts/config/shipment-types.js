/**
 * Fixed shipment (cargo load) type set — mirrors the backend's
 * `CompanyManagement.Domain.Contracts.ShipmentType` enum (BE-kt-xnk)
 * exactly, so the string sent in `CreateShipmentRequest.Type` /
 * `UpdateShipmentRequest.Type` round-trips without a mapping layer.
 * @type {import('../types/index.js').ShipmentType[]}
 */
export const SHIPMENT_TYPES = ['LCL', 'FCL'];

export const shipmentTypeOptions = [
  { value: 'LCL', label: 'LCL' },
  { value: 'FCL', label: 'FCL' },
];

/** @param {import('../types/index.js').ShipmentType | string} type */
export function labelForShipmentType(type) {
  return (
    shipmentTypeOptions.find((option) => option.value === type)?.label ?? type
  );
}
