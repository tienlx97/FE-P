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

/**
 * Badge color for the "Tình trạng" column — 3 buckets across the 8 linear
 * stages (mirrors `badgeVariantForContractStatus`'s own bucketing, not one
 * unique color per status): not yet started, actively moving, done.
 * @param {import('../types/index.js').ShipmentStatus | string} status
 */
export function badgeVariantForShipmentStatus(status) {
  if (status === 'Completed') return 'green';
  if (status === 'Booked') return 'neutral';
  return 'blue';
}

/**
 * Meta list pill tone per status (Figma 108:5920): packing / customs =
 * amber, at the yard / trucking = indigo, moving = cobalt, done = emerald,
 * booked = neutral.
 * @param {import('../types/index.js').ShipmentStatus | string} status
 * @returns {'accent' | 'success' | 'indigo' | 'warning' | 'neutral'}
 */
export function metaToneForShipmentStatus(status) {
  if (status === 'Completed') return 'success';
  if (status === 'Packing' || status === 'CustomsDeclaration') return 'warning';
  if (status === 'AtYardAwaitingExport' || status === 'TruckingToSite') {
    return 'indigo';
  }
  if (status === 'Shipping' || status === 'DeliveredToPort') return 'accent';
  return 'neutral';
}

/**
 * Statuses a shipment normally passes through under `incoterm`, in order
 * (the four flows documented on `SHIPMENT_STATUSES`). Status stays freely
 * settable: a `current` status outside the flow is slotted in by its place
 * in `SHIPMENT_STATUSES`, so the shipment page can always mark it.
 * @param {import('../types/index.js').Incoterm | string} incoterm
 * @param {import('../types/index.js').ShipmentStatus} [current]
 * @returns {import('../types/index.js').ShipmentStatus[]}
 */
export function shipmentStatusFlow(incoterm, current) {
  /** @type {import('../types/index.js').ShipmentStatus[]} */
  const flow =
    incoterm === 'EXW'
      ? ['Booked', 'Packing', 'Completed']
      : incoterm === 'FOB'
        ? ['Booked', 'Packing', 'DeliveredToPort', 'Completed']
        : incoterm === 'DDP'
          ? [
              'Booked',
              'Packing',
              'AtYardAwaitingExport',
              'Shipping',
              'DeliveredToPort',
              'CustomsDeclaration',
              'TruckingToSite',
              'Completed',
            ]
          : [
              'Booked',
              'Packing',
              'AtYardAwaitingExport',
              'Shipping',
              'DeliveredToPort',
              'Completed',
            ];
  if (!current || flow.includes(current)) return flow;
  const rank = SHIPMENT_STATUSES.indexOf(current);
  const at = flow.findIndex(
    (status) => SHIPMENT_STATUSES.indexOf(status) > rank,
  );
  return [...flow.slice(0, at), current, ...flow.slice(at)];
}

/**
 * The status after `current` in its Incoterm flow, or null when done.
 * @param {import('../types/index.js').Incoterm | string} incoterm
 * @param {import('../types/index.js').ShipmentStatus} current
 */
export function nextShipmentStatus(incoterm, current) {
  const flow = shipmentStatusFlow(incoterm, current);
  return flow[flow.indexOf(current) + 1] ?? null;
}

/**
 * Whether a shipment at `status` must carry its declaration figures
 * (declared value, declaration exchange rate, quantity, declared weight).
 * Mirrors BE `ShipmentStatusRules.RequiresDeclarationFigures`: optional
 * while Booked / Packing, required from AtYardAwaitingExport on.
 * @param {import('../types/index.js').ShipmentStatus | ''} status
 */
export function requiresDeclarationFigures(status) {
  return status !== '' && status !== 'Booked' && status !== 'Packing';
}
