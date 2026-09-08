'use client';

import { useState } from 'react';

import { generateRowKey } from '@/shared/config/generate-row-key.js';

/** @returns {import('../types/index.js').PaymentTermRow} */
function emptyRow() {
  return {
    rowKey: generateRowKey(),
    paymentRatioPercent: undefined,
    paymentCondition: '',
  };
}

/**
 * Local editable-grid state for "Đợt thanh toán" — same `rowKey`-based
 * shape as `use-extra-field-rows.js`/`use-bank-account-rows.js`. Exposes a
 * derived `totalPercent` so the form can show a running total and flag it
 * red before the zod schema even runs.
 * @param {import('../types/index.js').PaymentTermRow[]} [initialRows]
 */
export function usePaymentTermRows(initialRows = []) {
  const [rows, setRows] = useState(
    initialRows.length > 0 ? initialRows : [emptyRow()],
  );

  function addRow() {
    setRows((current) => [...current, emptyRow()]);
  }

  /** @param {string} rowKey */
  function removeRow(rowKey) {
    setRows((current) => current.filter((row) => row.rowKey !== rowKey));
  }

  /**
   * @param {string} rowKey
   * @param {'paymentRatioPercent' | 'paymentCondition'} field
   * @param {number | string | undefined} value
   */
  function updateRowField(rowKey, field, value) {
    setRows((current) =>
      current.map((row) =>
        row.rowKey === rowKey ? { ...row, [field]: value } : row,
      ),
    );
  }

  const totalPercent = rows.reduce(
    (sum, row) => sum + (row.paymentRatioPercent ?? 0),
    0,
  );

  return { rows, setRows, addRow, removeRow, updateRowField, totalPercent };
}
