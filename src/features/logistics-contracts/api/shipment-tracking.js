import { apiRequest } from '@/shared/api/api-client.js';

/** @param {string} contractId @param {string} shipmentId */
function trackingUrl(contractId, shipmentId) {
  return `/api/v1/contracts/${contractId}/shipments/${shipmentId}/tracking`;
}

/**
 * @param {Awaited<ReturnType<typeof apiRequest>>} result
 * @returns {{ success: true, tracking: import('../types/index.js').ShipmentTracking } | { success: false, message: string }}
 */
function toTrackingResult(result) {
  return result.success
    ? {
        success: true,
        tracking: /** @type {import('../types/index.js').ShipmentTracking} */ (result.data),
      }
    : { success: false, message: result.message };
}

/**
 * The shipment's carrier tracking: carrier, adapter version, last sync,
 * pending "Hãng tàu báo khác" and stored events (BE-kt-xnk
 * `add-carrier-tracking`). Requires `logistics:contracts:view`.
 * @param {string} contractId
 * @param {string} shipmentId
 */
export async function getShipmentTracking(contractId, shipmentId) {
  return toTrackingResult(
    await apiRequest(trackingUrl(contractId, shipmentId), {
      errorMessage: 'Không thể tải tracking hãng tàu',
    }),
  );
}

/**
 * "Đồng bộ ngay". Requires `logistics:contracts:manage`; 400 when the
 * shipment's "Hãng tàu" names no known carrier.
 * @param {string} contractId
 * @param {string} shipmentId
 */
export async function syncShipmentTracking(contractId, shipmentId) {
  return toTrackingResult(
    await apiRequest(`${trackingUrl(contractId, shipmentId)}/sync`, {
      method: 'POST',
      errorMessage: 'Không thể đồng bộ với hãng tàu',
    }),
  );
}

/**
 * Accept (take the carrier's value) or dismiss a "Hãng tàu báo khác".
 * @param {string} contractId
 * @param {string} shipmentId
 * @param {string} discrepancyId
 * @param {'accept' | 'dismiss'} action
 */
export async function resolveTrackingDiscrepancy(contractId, shipmentId, discrepancyId, action) {
  return toTrackingResult(
    await apiRequest(`${trackingUrl(contractId, shipmentId)}/discrepancies/${discrepancyId}/${action}`, {
      method: 'POST',
      errorMessage: action === 'accept' ? 'Không thể lấy giá trị hãng tàu' : 'Không thể bỏ qua mục này',
    }),
  );
}
