'use client';

import { useState } from 'react';

import { countrySchema } from '../config/country-schema.js';
import { useCreateCountryMutation } from './use-countries-query.js';

/** @returns {import('../types/index.js').CountryFormValues} */
function emptyValues() {
  return { name: '' };
}

/** @param {string} [message] @returns {{ type: 'error', message: string } | undefined} */
function fieldStatus(message) {
  return message ? { type: 'error', message } : undefined;
}

/**
 * Form state for creating a `Country` (contract country catalog entry) —
 * mirrors `useCustomerForm`. Used by `quick-create-country-dialog.jsx`,
 * embedded in the Contract form (no standalone Country page — see the
 * Seller precedent).
 * @param {{ onSuccess?: (country: import('../types/index.js').Country) => void }} [options]
 */
export function useCountryForm({ onSuccess } = {}) {
  const [values, setValues] = useState(emptyValues());
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');

  const createMutation = useCreateCountryMutation();

  /**
   * @param {keyof import('../types/index.js').CountryFormValues} field
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

    const result = countrySchema.safeParse(values);
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

    onSuccess?.(createResult.country);
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
