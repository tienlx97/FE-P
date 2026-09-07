'use client';

import { useState } from 'react';

/** @returns {import('../types/index.js').ShipmentCostLineRow} */
function emptyRow() {
  return {
    rowKey: crypto.randomUUID(),
    costCategoryId: '',
    name: '',
    amount: undefined,
    note: '',
    providerCustomerId: '',
    invoiceNumber: '',
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

  function addRow() {
    setRows((current) => [...current, emptyRow()]);
  }

  /** @param {string} rowKey */
  function removeRow(rowKey) {
    setRows((current) => current.filter((row) => row.rowKey !== rowKey));
  }

  /**
   * @param {string} rowKey
   * @param {'costCategoryId' | 'name' | 'amount' | 'note' | 'providerCustomerId' | 'invoiceNumber'} field
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
