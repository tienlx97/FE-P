import { apiRequest } from '@/shared/api/api-client.js';

const GENERIC_LOAD_ERROR = 'Không thể tải hành trình lô hàng';
const GENERIC_CONFIRM_ERROR = 'Không thể xác nhận mốc hành trình';
const GENERIC_REOPEN_ERROR = 'Không thể bỏ xác nhận mốc hành trình';

// FE-side milestone names (standard English logistics terms) in place of
// the backend's Vietnamese `label`. Most milestones have one name; the two
// whose backend label depends on the Incoterm (EXW / CIF / DDP) are
// translated per label so that distinction survives.
/** @type {Partial<Record<import('../types/index.js').ShipmentMilestone, string>>} */
const MILESTONE_LABELS = {
  EmptyPickup: 'Empty Pickup',
  CargoReady: 'Packing',
  OriginPort: 'POL',
  OnBoard: 'Shipped on Board',
  Ocean: 'Ocean Freight',
  DestinationPort: 'POD',
  DestinationInland: 'On-carriage',
  Site: 'Site Delivery',
  EmptyReturn: 'Empty Return',
};

/** @type {Record<string, string>} */
const INCOTERM_LABELS = {
  'Buyer nhận hàng': 'Buyer Pickup',
  'Thông quan nhập khẩu': 'Import Clearance',
  'Buyer nhận hàng & nhập khẩu': 'Buyer Pickup & Import',
  'Thông quan & thuế NK': 'Import Clearance & Duties',
};

/**
 * @param {import('../types/index.js').ShipmentJourney} journey
 * @returns {import('../types/index.js').ShipmentJourney}
 */
function withMilestoneLabels(journey) {
  return {
    ...journey,
    steps: journey.steps.map((step) => ({
      ...step,
      label:
        MILESTONE_LABELS[step.milestone] ??
        INCOTERM_LABELS[step.label] ??
        step.label,
    })),
  };
}

/** @param {string} contractId @param {string} shipmentId */
function journeyUrl(contractId, shipmentId) {
  return `/api/v1/contracts/${contractId}/shipments/${shipmentId}/journey`;
}

/**
 * The shipment's tracking journey under its contract's Incoterm
 * (BE-kt-xnk `add-shipment-journey-tracking`). Requires
 * `logistics:contracts:view`.
 * @param {string} contractId
 * @param {string} shipmentId
 * @returns {Promise<{ success: true, journey: import('../types/index.js').ShipmentJourney } | { success: false, message: string }>}
 */
export async function getShipmentJourney(contractId, shipmentId) {
  const result = await apiRequest(journeyUrl(contractId, shipmentId), {
    errorMessage: GENERIC_LOAD_ERROR,
  });

  return result.success
    ? { success: true, journey: withMilestoneLabels(result.data) }
    : { success: false, message: result.message };
}

/**
 * Confirms (or re-dates) a milestone by hand. Requires
 * `logistics:contracts:manage`.
 * @param {string} contractId
 * @param {string} shipmentId
 * @param {import('../types/index.js').ShipmentMilestone} milestone
 * @param {{ completedOn: string, note: string }} values
 * @returns {Promise<{ success: true, journey: import('../types/index.js').ShipmentJourney } | { success: false, message: string }>}
 */
export async function confirmShipmentMilestone(
  contractId,
  shipmentId,
  milestone,
  values,
) {
  const result = await apiRequest(
    `${journeyUrl(contractId, shipmentId)}/milestones/${milestone}`,
    {
      method: 'PUT',
      errorMessage: GENERIC_CONFIRM_ERROR,
      body: { CompletedOn: values.completedOn, Note: values.note || null },
    },
  );

  return result.success
    ? { success: true, journey: withMilestoneLabels(result.data) }
    : { success: false, message: result.message };
}

/**
 * Removes a milestone's hand confirmation.
 * @param {string} contractId
 * @param {string} shipmentId
 * @param {import('../types/index.js').ShipmentMilestone} milestone
 * @returns {Promise<{ success: true, journey: import('../types/index.js').ShipmentJourney } | { success: false, message: string }>}
 */
export async function reopenShipmentMilestone(
  contractId,
  shipmentId,
  milestone,
) {
  const result = await apiRequest(
    `${journeyUrl(contractId, shipmentId)}/milestones/${milestone}`,
    { method: 'DELETE', errorMessage: GENERIC_REOPEN_ERROR },
  );

  return result.success
    ? { success: true, journey: withMilestoneLabels(result.data) }
    : { success: false, message: result.message };
}
