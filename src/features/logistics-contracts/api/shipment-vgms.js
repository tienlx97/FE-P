import { apiRequest } from '@/shared/api/api-client.js';

const GENERIC_LIST_ERROR = 'Không thể tải danh sách VGM';
const GENERIC_CREATE_ERROR = 'Không thể thêm VGM';
const GENERIC_UPDATE_ERROR = 'Không thể cập nhật VGM';
const GENERIC_DELETE_ERROR = 'Không thể xoá VGM';

/**
 * `TimeInput` emits `HH:MM` (no `hasSeconds`), but the backend's `TimeOnly?`
 * binds via System.Text.Json's built-in converter, which requires seconds
 * (`HH:MM:SS`) — `HH:MM` alone fails deserialization with a 400. Append
 * `:00` when the value is bare `HH:MM`.
 * @param {string} value
 */
function withSeconds(value) {
  return /^\d{2}:\d{2}$/.test(value) ? `${value}:00` : value;
}

/** @param {import('../types/index.js').ShipmentVgmFormValues} values */
function toRequestBody(values) {
  return {
    ContainerNumber: values.containerNumber,
    SealNumber: values.sealNumber,
    ContainerType: values.containerType,
    Tare: values.tare,
    Payload: values.payload,
    MaxGross: values.maxGross,
    NetWeight: values.netWeight,
    PackagingWeight: values.packagingWeight,
    PackingDate: values.packingDate,
    PlannedPackingTime: values.plannedPackingTime
      ? withSeconds(values.plannedPackingTime)
      : null,
    ActualPackingTime: values.actualPackingTime
      ? withSeconds(values.actualPackingTime)
      : null,
    TruckArrivalTime: values.truckArrivalTime
      ? withSeconds(values.truckArrivalTime)
      : null,
    CarrierCustomerId: values.carrierCustomerId,
    Note: values.note || null,
  };
}

/**
 * Requires `logistics:contracts:view`, scoped to the contract's company.
 * @param {string} contractId
 * @param {string} shipmentId
 * @returns {Promise<{ success: true, vgms: import('../types/index.js').ShipmentVgm[] } | { success: false, message: string }>}
 */
export async function listShipmentVgms(contractId, shipmentId) {
  const result = await apiRequest(
    `/api/v1/contracts/${contractId}/shipments/${shipmentId}/vgm`,
    { errorMessage: GENERIC_LIST_ERROR },
  );

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, vgms: result.data ?? [] };
}

/**
 * Requires `logistics:contracts:manage`, scoped to the contract's company.
 * `sequenceNumber`/`grossWeight`/`vgm` are assigned/computed by the
 * backend, never sent here.
 * @param {string} contractId
 * @param {string} shipmentId
 * @param {import('../types/index.js').ShipmentVgmFormValues} values
 * @returns {Promise<{ success: true, vgm: import('../types/index.js').ShipmentVgm } | { success: false, message: string }>}
 */
export async function createShipmentVgm(contractId, shipmentId, values) {
  const result = await apiRequest(
    `/api/v1/contracts/${contractId}/shipments/${shipmentId}/vgm`,
    {
      method: 'POST',
      errorMessage: GENERIC_CREATE_ERROR,
      body: toRequestBody(values),
    },
  );

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, vgm: result.data };
}

/**
 * Requires `logistics:contracts:manage`, scoped to the contract's company.
 * `sequenceNumber` is immutable — not part of the request body.
 * @param {string} contractId
 * @param {string} shipmentId
 * @param {string} vgmId
 * @param {import('../types/index.js').ShipmentVgmFormValues} values
 * @returns {Promise<{ success: true, vgm: import('../types/index.js').ShipmentVgm } | { success: false, message: string }>}
 */
export async function updateShipmentVgm(contractId, shipmentId, vgmId, values) {
  const result = await apiRequest(
    `/api/v1/contracts/${contractId}/shipments/${shipmentId}/vgm/${vgmId}`,
    {
      method: 'PUT',
      errorMessage: GENERIC_UPDATE_ERROR,
      body: toRequestBody(values),
    },
  );

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, vgm: result.data };
}

/**
 * Requires `logistics:contracts:manage`, scoped to the contract's company.
 * Unlike every other child list in this feature, VGM records can be
 * deleted outright (BE-kt-xnk) — a mis-entered container is removed, not
 * corrected in place.
 * @param {string} contractId
 * @param {string} shipmentId
 * @param {string} vgmId
 * @returns {Promise<{ success: true } | { success: false, message: string }>}
 */
export async function deleteShipmentVgm(contractId, shipmentId, vgmId) {
  const result = await apiRequest(
    `/api/v1/contracts/${contractId}/shipments/${shipmentId}/vgm/${vgmId}`,
    { method: 'DELETE', errorMessage: GENERIC_DELETE_ERROR },
  );

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true };
}

/**
 * Records (or clears, with an empty date) one container's empty return —
 * the CIF journey's "Trả cont rỗng" step reads these. Requires
 * `logistics:contracts:manage`.
 * @param {string} contractId
 * @param {string} shipmentId
 * @param {string} vgmId
 * @param {{ returnedOn: string, depot: string }} values
 * @returns {Promise<{ success: true, vgm: import('../types/index.js').ShipmentVgm } | { success: false, message: string }>}
 */
export async function recordShipmentVgmEmptyReturn(
  contractId,
  shipmentId,
  vgmId,
  values,
) {
  const result = await apiRequest(
    `/api/v1/contracts/${contractId}/shipments/${shipmentId}/vgm/${vgmId}/empty-return`,
    {
      method: 'PUT',
      errorMessage: 'Không thể ghi nhận trả cont rỗng',
      body: {
        ReturnedOn: values.returnedOn || null,
        Depot: values.depot || null,
      },
    },
  );

  return result.success
    ? { success: true, vgm: result.data }
    : { success: false, message: result.message };
}
