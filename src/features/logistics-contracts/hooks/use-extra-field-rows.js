'use client';

import { useState } from 'react';

import { generateRowKey } from '@/shared/config/generate-row-key.js';

/** @returns {import('../types/index.js').ExtraFieldRow} */
function emptyRow() {
  return { rowKey: generateRowKey(), key: '', value: '' };
}

/**
 * Local editable-grid state for a "trường tùy ý" (Key/Value) section —
 * shared by Party A/Customer/Bank field-sets. Same shape as
 * `use-bank-account-rows.js` (admin-users feature): the grid never talks to
 * the API itself, callers read `rows` on submit.
 * @param {import('../types/index.js').ExtraFieldRow[]} [initialRows]
 */
export function useExtraFieldRows(initialRows = []) {
  const [rows, setRows] = useState(initialRows);

  function addRow() {
    setRows((current) => [...current, emptyRow()]);
  }

  /** @param {string} rowKey */
  function removeRow(rowKey) {
    setRows((current) => current.filter((row) => row.rowKey !== rowKey));
  }

  function clearRows() {
    setRows([]);
  }

  /**
   * @param {string} rowKey
   * @param {'key' | 'value'} field
   * @param {string} value
   */
  function updateRowField(rowKey, field, value) {
    setRows((current) =>
      current.map((row) => (row.rowKey === rowKey ? { ...row, [field]: value } : row)),
    );
  }

  return { rows, setRows, addRow, removeRow, clearRows, updateRowField };
}
