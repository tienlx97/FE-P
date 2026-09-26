import { apiRequest } from '@/shared/api/api-client.js';

import { joinSiCutoff } from '../config/shipment-operational-details.js';
import { freeTimeRequestBody } from '../config/shipment-schedule.js';

const GENERIC_LOAD_ERROR = 'Không thể tải lịch tàu';
const GENERIC_UPDATE_ERROR = 'Không thể cập nhật lịch tàu';

/** @param {string} contractId @param {string} shipmentId */
function scheduleUrl(contractId, shipmentId) {
  return `/api/v1/contracts/${contractId}/shipments/${shipmentId}/schedule`;
}

/**
 * The shipment's schedule, ATD / ATA, free time and every revision (BE-kt-xnk
 * `add-shipment-schedule-free-time`). Requires `logistics:contracts:view`.
 * @param {string} contractId
 * @param {string} shipmentId
 * @returns {Promise<{ success: true, schedule: import('../types/index.js').ShipmentSchedule } | { success: false, message: string }>}
 */
export async function getShipmentSchedule(contractId, shipmentId) {
  const result = await apiRequest(scheduleUrl(contractId, shipmentId), {
    errorMessage: GENERIC_LOAD_ERROR,
  });

  return result.success
    ? { success: true, schedule: result.data }
    : { success: false, message: result.message };
}

/**
 * B/L progress; answers with the schedule. Requires
 * `logistics:contracts:manage`.
 * @param {string} contractId
 * @param {string} shipmentId
 * @param {import('../types/index.js').ShipmentDocuments} documents
 * @returns {Promise<{ success: true, schedule: import('../types/index.js').ShipmentSchedule } | { success: false, message: string }>}
 */
export async function updateShipmentDocuments(contractId, shipmentId, documents) {
  const result = await apiRequest(
    `/api/v1/contracts/${contractId}/shipments/${shipmentId}/documents`,
    {
      method: 'PUT',
      errorMessage: 'Không thể cập nhật B/L',
      body: {
        BillOfLadingType: documents.billOfLadingType,
        BlDraftReceivedOn: documents.blDraftReceivedOn,
        BlIssuedOn: documents.blIssuedOn,
        BlReleasedOn: documents.blReleasedOn,
        BlReleaseReference: documents.blReleaseReference,
      },
    },
  );

  return result.success
    ? { success: true, schedule: result.data }
    : { success: false, message: result.message };
}

/**
 * Replaces every transshipment leg ([] = direct); answers with the
 * schedule. Requires `logistics:contracts:manage`.
 * @param {string} contractId
 * @param {string} shipmentId
 * @param {import('../types/index.js').TransshipmentLegFormRow[]} rows
 * @returns {Promise<{ success: true, schedule: import('../types/index.js').ShipmentSchedule } | { success: false, message: string }>}
 */
export async function replaceShipmentTransshipment(contractId, shipmentId, rows) {
  const result = await apiRequest(
    `/api/v1/contracts/${contractId}/shipments/${shipmentId}/transshipment`,
    {
      method: 'PUT',
      errorMessage: 'Không thể lưu chuyển tải',
      body: {
        Legs: rows.map((row) => ({
          Port: row.port.trim(),
          VesselName: row.vesselName || null,
          VoyageNumber: row.voyageNumber || null,
          Eta: row.eta || null,
          Ata: row.ata || null,
          Etd: row.etd || null,
          Atd: row.atd || null,
        })),
      },
    },
  );

  return result.success
    ? { success: true, schedule: result.data }
    : { success: false, message: result.message };
}

/**
 * "Cập nhật lịch tàu": the whole new schedule with why it changed (409 when
 * `version` is stale). Requires `logistics:contracts:manage`.
 * @param {string} contractId
 * @param {string} shipmentId
 * @param {number} version
 * @param {import('../types/index.js').ShipmentScheduleFormValues} values
 * @returns {Promise<{ success: true, schedule: import('../types/index.js').ShipmentSchedule } | { success: false, message: string }>}
 */
export async function updateShipmentSchedule(contractId, shipmentId, version, values) {
  const result = await apiRequest(scheduleUrl(contractId, shipmentId), {
    method: 'PUT',
    errorMessage: GENERIC_UPDATE_ERROR,
    body: {
      Version: version,
      Etd: values.etd || null,
      Eta: values.eta || null,
      SiCutoff: joinSiCutoff(values.siCutoffDate, values.siCutoffTime),
      CyCutoff: joinSiCutoff(values.cyCutoffDate, values.cyCutoffTime),
      VesselName: values.vesselName || null,
      VoyageNumber: values.voyageNumber || null,
      Reason: values.reason,
      NoticeOn: values.noticeOn,
      Note: values.note || null,
      ActualDeparture: values.actualDeparture || null,
      ActualArrival: values.actualArrival || null,
      OriginFreeTime: freeTimeRequestBody(values.originFreeTime),
      DestinationFreeTime: freeTimeRequestBody(values.destinationFreeTime),
    },
  });

  return result.success
    ? { success: true, schedule: result.data }
    : { success: false, message: result.message };
}
