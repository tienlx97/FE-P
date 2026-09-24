'use client';

import { shipmentSchema } from '../config/shipment-schema.js';
import { valuesFromShipment } from './use-shipment-form.js';
import { useUpdateShipmentMutation } from './use-shipments-query.js';

/**
 * Removes one cost line from a shipment. Cost lines have no endpoint of
 * their own — the shipment PUT replaces the whole list — so this resends
 * the shipment as it is (same values / parsing as `useShipmentForm`) with
 * that line left out.
 * @param {string} contractId
 */
export function useRemoveShipmentCostLine(contractId) {
  const updateMutation = useUpdateShipmentMutation(contractId);

  /**
   * @param {import('../types/index.js').Shipment} shipment
   * @param {string} costLineId
   * @returns {Promise<{ success: true } | { success: false, message: string }>}
   */
  async function removeCostLine(shipment, costLineId) {
    const parsed = shipmentSchema.safeParse({
      ...valuesFromShipment(shipment),
      costLines: shipment.costs
        .filter((cost) => cost.id !== costLineId)
        .map((cost) => ({
          costCategoryId: cost.costCategoryId,
          name: cost.name,
          amount: cost.amount,
          note: cost.note ?? '',
          providerCustomerId: cost.providerCustomerId ?? '',
          invoiceNumber: cost.invoiceNumber ?? '',
          costNature: cost.costNature ?? 'Standard',
        })),
    });
    if (!parsed.success) {
      return {
        success: false,
        message:
          'Thông tin lô hàng chưa hợp lệ — mở "Chỉnh sửa" để sửa rồi xoá lại.',
      };
    }

    const { costLines, ...values } = parsed.data;
    const result = await updateMutation.mutateAsync({
      shipmentId: shipment.id,
      version: shipment.version,
      values,
      costLines,
    });
    return result.success
      ? { success: true }
      : { success: false, message: result.message };
  }

  return { removeCostLine, isPending: updateMutation.isPending };
}
