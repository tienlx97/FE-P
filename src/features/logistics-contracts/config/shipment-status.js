/**
 * Shipment workflow status ("Tình trạng") — mirrors the backend's
 * `CompanyManagement.Domain.Contracts.ShipmentStatus` enum (BE-kt-xnk)
 * exactly, so the string round-trips without a mapping layer. Freely
 * settable — not enforced as a strict per-Incoterm state machine — but
 * the values cover every stage across the business's four common
 * Incoterm flows (BE-kt-xnk's
 * `openspec/changes/add-contract-and-shipment-status/`):
 * - CIF: Booked → Packing → AtYardAwaitingExport → Shipping →
 *   DeliveredToPort → Completed
 * - DDP: same as CIF, then → CustomsDeclaration → TruckingToSite →
 *   Completed
 * - FOB: Booked → Packing → DeliveredToPort → Completed
 * - EXW: Booked → Packing → Completed
 * @type {import('../types/index.js').ShipmentStatus[]}
 */
export const SHIPMENT_STATUSES = [
  'Booked',
  'Packing',
  'AtYardAwaitingExport',
  'Shipping',
  'DeliveredToPort',
  'CustomsDeclaration',
  'TruckingToSite',
  'Completed',
];

export const shipmentStatusOptions = [
  { value: 'Booked', label: 'Đã book' },
  { value: 'Packing', label: 'Đang đóng hàng' },
  { value: 'AtYardAwaitingExport', label: 'Hạ bãi chờ xuất' },
  { value: 'Shipping', label: 'Shipping' },
  { value: 'DeliveredToPort', label: 'Đã giao đến cảng' },
  { value: 'CustomsDeclaration', label: 'Khai HQ' },
  { value: 'TruckingToSite', label: 'Trucking đến site' },
  { value: 'Completed', label: 'Đã hoàn thành' },
];

/** @param {import('../types/index.js').ShipmentStatus | string} status */
export function labelForShipmentStatus(status) {
  return (
    shipmentStatusOptions.find((option) => option.value === status)?.label ??
    status
  );
}
