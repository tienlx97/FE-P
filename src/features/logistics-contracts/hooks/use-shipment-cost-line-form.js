'use client';

import { useState } from 'react';

import { shipmentCostLineSchema } from '../config/shipment-schema.js';
import {
  costLineFormValues,
  useSaveShipmentCostLines,
} from './use-save-shipment-cost-lines.js';

/** @typedef {keyof import('../types/index.js').ShipmentCostLineFormValues} CostLineField */

/**
 * @param {string} [costCategoryId]
 * @returns {import('../types/index.js').ShipmentCostLineFormValues}
 */
function emptyValues(costCategoryId = '') {
  return {
    costCategoryId,
    name: '',
    amount: /** @type {number} */ (/** @type {unknown} */ (undefined)),
    note: '',
    providerCustomerId: '',
    invoiceNumber: '',
    invoiceDate: '',
    costNature: 'Standard',
  };
}

/**
 * Form state for adding one cost line to a shipment, or editing one
 * (`costLine`). Validation is the cost line part of `shipmentSchema`
 * (`shipmentCostLineSchema`), so the messages match the shipment editor's
 * cost grid. Saving resends the shipment with the line appended /
 * replaced in place.
 * @param {{
 *   contractId: string,
 *   shipment: import('../types/index.js').Shipment,
 *   costLine?: import('../types/index.js').ShipmentCostLine | null,
 *   initialCostCategoryId?: string,
 *   onSuccess?: (shipment: import('../types/index.js').Shipment) => void,
 * }} options
 */
export function useShipmentCostLineForm({
  contractId,
  shipment,
  costLine = null,
  initialCostCategoryId,
  onSuccess,
}) {
  const [initialValues] = useState(() =>
    costLine
      ? costLineFormValues(costLine)
      : emptyValues(initialCostCategoryId),
  );
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Partial<Record<CostLineField, string>>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');
  const { saveCostLines, isPending } = useSaveShipmentCostLines(contractId);

  const isDirty = /** @type {CostLineField[]} */ (
    Object.keys(initialValues)
  ).some((key) => !Object.is(values[key], initialValues[key]));

  /**
   * @template {CostLineField} K
   * @param {K} field
   * @param {import('../types/index.js').ShipmentCostLineFormValues[K]} value
   */
  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current,
    );
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} [event] */
  async function handleSubmit(event) {
    event?.preventDefault();
    setSubmitError('');

    const result = shipmentCostLineSchema.safeParse(values);
    if (!result.success) {
      /** @type {Partial<Record<CostLineField, string>>} */
      const nextErrors = {};
      for (const issue of result.error.issues) {
        const key = /** @type {CostLineField} */ (issue.path[0]);
        nextErrors[key] ??= issue.message;
      }
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});

    const existing = shipment.costs.map(costLineFormValues);
    const costLines = costLine
      ? shipment.costs.map((cost, index) =>
          cost.id === costLine.id ? result.data : existing[index],
        )
      : [...existing, result.data];

    const saved = await saveCostLines(shipment, costLines);
    if (!saved.success) {
      setSubmitError(saved.message);
      return;
    }
    onSuccess?.(saved.shipment);
  }

  /** @type {Partial<Record<CostLineField, { type: 'error', message: string }>>} */
  const fieldStatuses = {};
  for (const [key, message] of Object.entries(fieldErrors)) {
    if (message) {
      fieldStatuses[/** @type {CostLineField} */ (key)] = {
        type: 'error',
        message,
      };
    }
  }

  return {
    values,
    setField,
    fieldStatuses,
    submitError,
    isDirty,
    isSubmitting: isPending,
    handleSubmit,
  };
}
