'use client';

import { useState } from 'react';

import { generateRowKey } from '@/shared/config/generate-row-key.js';

/**
 * @param {boolean} isPrimary
 * @returns {import('../types/index.js').BankAccountRow}
 */
function emptyRow(isPrimary) {
  return {
    rowKey: generateRowKey(),
    bankAccountId: null,
    vietnamBankId: '',
    accountNumber: '',
    branch: '',
    isPrimary,
  };
}

/**
 * Local editable-grid state for the "Tài khoản ngân hàng" section, shared
 * by `CreateUserForm` and `EditUserForm`. The grid itself never talks to
 * the API directly — callers read `rows` on submit and persist the diff
 * (see `useCreateUserForm`/`useEditUserForm`).
 * @param {import('../types/index.js').BankAccountRow[]} [initialRows]
 */
export function useBankAccountRows(initialRows = []) {
  const [rows, setRows] = useState(initialRows);

  function addRow() {
    setRows((current) => [...current, emptyRow(current.length === 0)]);
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
   * @param {'vietnamBankId' | 'accountNumber' | 'branch'} field
   * @param {string} value
   */
  function updateRowField(rowKey, field, value) {
    setRows((current) =>
      current.map((row) => (row.rowKey === rowKey ? { ...row, [field]: value } : row)),
    );
  }

  /** @param {string} rowKey */
  function setPrimaryRow(rowKey) {
    setRows((current) =>
      current.map((row) => ({ ...row, isPrimary: row.rowKey === rowKey })),
    );
  }

  return { rows, setRows, addRow, removeRow, clearRows, updateRowField, setPrimaryRow };
}
