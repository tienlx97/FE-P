'use client';

import { useState } from 'react';

import { generateRowKey } from '@/shared/config/generate-row-key.js';

/** @param {string} [costCategoryId] @returns {import('../types/index.js').ShipmentCostLineRow} */
function emptyRow(costCategoryId = '') {
  return {
    rowKey: generateRowKey(),
    costCategoryId,
    name: '',
    amount: undefined,
    note: '',
    providerCustomerId: '',
    invoiceNumber: '',
    costNature: 'Standard',
  };
}

/**
 * Local editable-grid state for a Shipment's "Thông tin chi phí logistics"
 * (`Costs`) — same `rowKey`-based shape as `use-payment-history-rows.js`,
 * starting empty (a shipment may have no cost lines recorded yet).
 * @param {import('../types/index.js').ShipmentCostLineRow[]} [initialRows]
 */
export function useShipmentCostLineRows(initialRows = []) {
  const [rows, setRows] = useState(initialRows);

  /**
   * @param {string} [costCategoryId] Pre-fills the new row's category —
   * used by a group header's own "+" (added in place, never needs to
   * re-sort into a different group) as opposed to the generic "+ Thêm chi
   * phí" button (an uncategorized row, sorted last until the user picks
   * one via the row's own Selector).
   */
  function addRow(costCategoryId) {
    setRows((current) => [...current, emptyRow(costCategoryId)]);
  }

  /** @param {string} rowKey */
  function removeRow(rowKey) {
    setRows((current) => current.filter((row) => row.rowKey !== rowKey));
  }

  /**
   * @param {string} rowKey
   * @param {'costCategoryId' | 'name' | 'amount' | 'note' | 'providerCustomerId' | 'invoiceNumber' | 'costNature'} field
   * @param {number | string | undefined} value
   */
  function updateRowField(rowKey, field, value) {
    setRows((current) =>
      current.map((row) =>
        row.rowKey === rowKey ? { ...row, [field]: value } : row,
      ),
    );
  }

  return { rows, setRows, addRow, removeRow, updateRowField };
}
