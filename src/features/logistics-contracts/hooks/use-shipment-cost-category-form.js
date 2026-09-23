'use client';

import { useState } from 'react';

import { shipmentCostCategorySchema } from '../config/shipment-cost-category-schema.js';
import { useCreateShipmentCostCategoryMutation } from './use-shipment-cost-categories-query.js';

/** @returns {import('../types/index.js').ShipmentCostCategoryFormValues} */
function emptyValues() {
  return { name: '' };
}

/** @param {string} [message] @returns {{ type: 'error', message: string } | undefined} */
function fieldStatus(message) {
  return message ? { type: 'error', message } : undefined;
}

/**
 * Form state for creating a `ShipmentCostCategory` (logistics cost-group
 * catalog entry) — mirrors `useCountryForm`. Used by
 * `quick-create-shipment-cost-category-dialog.jsx`.
 * @param {{ onSuccess?: (costCategory: import('../types/index.js').ShipmentCostCategory) => void }} [options]
 */
export function useShipmentCostCategoryForm({ onSuccess } = {}) {
  const [values, setValues] = useState(emptyValues());
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');

  const createMutation = useCreateShipmentCostCategoryMutation();

  /**
   * @param {keyof import('../types/index.js').ShipmentCostCategoryFormValues} field
   * @param {string} value
   */
  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function reset() {
    setValues(emptyValues());
    setFieldErrors({});
    setSubmitError('');
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} [event] */
  async function handleSubmit(event) {
    event?.preventDefault();
    setSubmitError('');

    const result = shipmentCostCategorySchema.safeParse(values);
    if (!result.success) {
      /** @type {Record<string, string>} */
      const nextFieldErrors = {};
      for (const issue of result.error.issues) {
        nextFieldErrors[String(issue.path[0])] = issue.message;
      }
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    const createResult = await createMutation.mutateAsync({
      values: result.data,
    });

    if (!createResult.success) {
      setSubmitError(createResult.message);
      return;
    }

    onSuccess?.(createResult.costCategory);
    reset();
  }

  return {
    values,
    setField,
    fieldStatuses: Object.fromEntries(
      Object.entries(fieldErrors).map(([key, message]) => [
        key,
        fieldStatus(message),
      ]),
    ),
    submitError,
    isSubmitting: createMutation.isPending,
    handleSubmit,
    reset,
  };
}
