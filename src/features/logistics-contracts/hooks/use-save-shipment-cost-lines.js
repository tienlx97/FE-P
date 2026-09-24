'use client';

import { shipmentSchema } from '../config/shipment-schema.js';
import { valuesFromShipment } from './use-shipment-form.js';
import { useUpdateShipmentMutation } from './use-shipments-query.js';

/**
 * A saved cost line as form values (the shape the shipment PUT takes).
 * @param {import('../types/index.js').ShipmentCostLine} cost
 * @returns {import('../types/index.js').ShipmentCostLineFormValues}
 */
export function costLineFormValues(cost) {
  return {
    costCategoryId: cost.costCategoryId,
    name: cost.name,
    amount: cost.amount,
    note: cost.note ?? '',
    providerCustomerId: cost.providerCustomerId ?? '',
    invoiceNumber: cost.invoiceNumber ?? '',
    costNature: cost.costNature ?? 'Standard',
  };
}

/**
 * Saves a shipment's cost lines. They have no endpoint of their own — the
 * shipment PUT replaces the whole list — so this resends the shipment as
 * it is (same values / parsing as `useShipmentForm`) with `costLines` as
 * the new list. Used by the cost drawer (add / edit one line) and the
 * cost grid's delete.
 * @param {string} contractId
 */
export function useSaveShipmentCostLines(contractId) {
  const updateMutation = useUpdateShipmentMutation(contractId);

  /**
   * @param {import('../types/index.js').Shipment} shipment
   * @param {import('../types/index.js').ShipmentCostLineFormValues[]} costLines
   * @returns {Promise<{ success: true, shipment: import('../types/index.js').Shipment } | { success: false, message: string }>}
   */
  async function saveCostLines(shipment, costLines) {
    const parsed = shipmentSchema.safeParse({
      ...valuesFromShipment(shipment),
      costLines,
    });
    if (!parsed.success) {
      return {
        success: false,
        message:
          'Thông tin lô hàng chưa hợp lệ — mở "Chỉnh sửa" lô hàng để sửa rồi lưu lại.',
      };
    }

    const { costLines: parsedCostLines, ...values } = parsed.data;
    const result = await updateMutation.mutateAsync({
      shipmentId: shipment.id,
      version: shipment.version,
      values,
      costLines: parsedCostLines,
    });
    return result.success
      ? { success: true, shipment: result.shipment }
      : { success: false, message: result.message };
  }

  return { saveCostLines, isPending: updateMutation.isPending };
}
