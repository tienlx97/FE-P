'use client';

import { useState } from 'react';

import { generateRowKey } from '@/shared/config/generate-row-key.js';

/** @returns {import('../types/index.js').ContractLineRow} */
function emptyRow() {
  return {
    rowKey: generateRowKey(),
    id: '',
    description: '',
    hsCode: '',
    quantity: undefined,
    unit: '',
    unitPrice: undefined,
  };
}

/**
 * @param {import('../types/index.js').ContractLine[] | undefined} lines
 * @returns {import('../types/index.js').ContractLineRow[]}
 */
export function contractLineRowsFrom(lines) {
  return (lines ?? []).map((line) => ({
    rowKey: line.id,
    id: line.id,
    description: line.description,
    hsCode: line.hsCode ?? '',
    quantity: line.quantity,
    unit: line.unit,
    unitPrice: line.unitPrice,
  }));
}

/**
 * Local editable state for "Danh mục hàng hóa" — same `rowKey` idiom as
 * `usePaymentTermRows`. A row keeps the line's `id` so the backend updates
 * it in place (shipments refer to it); new rows have `id: ''`. Exposes the
 * running total (Σ quantity × unit price).
 * @param {import('../types/index.js').ContractLineRow[]} [initialRows]
 */
export function useContractLineRows(initialRows = []) {
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
   * @param {'description' | 'hsCode' | 'quantity' | 'unit' | 'unitPrice'} field
   * @param {number | string | undefined} value
   */
  function updateRowField(rowKey, field, value) {
    setRows((current) =>
      current.map((row) =>
        row.rowKey === rowKey ? { ...row, [field]: value } : row,
      ),
    );
  }

  const total = rows.reduce(
    (sum, row) => sum + (row.quantity ?? 0) * (row.unitPrice ?? 0),
    0,
  );

  return { rows, setRows, addRow, removeRow, updateRowField, total };
}
