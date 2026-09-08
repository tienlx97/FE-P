'use client';

import { useState } from 'react';

import { generateRowKey } from '@/shared/config/generate-row-key.js';

/** @returns {import('../types/index.js').CommissionPaymentRow} */
function emptyRow() {
  return {
    rowKey: generateRowKey(),
    paymentDate: '',
    amount: undefined,
    note: '',
  };
}

/**
 * Local editable-grid state for a Commission's "Lịch sử thanh toán" —
 * same `rowKey`-based shape as `use-payment-term-rows.js`, but unlike that
 * one starts empty (a Commission may have no payments recorded yet) rather
 * than with one blank row.
 * @param {import('../types/index.js').CommissionPaymentRow[]} [initialRows]
 */
export function usePaymentHistoryRows(initialRows = []) {
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
   * @param {'paymentDate' | 'amount' | 'note'} field
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
