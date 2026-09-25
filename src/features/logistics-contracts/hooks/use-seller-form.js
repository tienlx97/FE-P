'use client';

import { useState } from 'react';

import { useExtraFieldRows } from '@/shared/hooks/use-extra-field-rows.js';

import { sellerSchema } from '../config/seller-schema.js';
import { useCreateSellerMutation } from './use-sellers-query.js';

/** @returns {import('../types/index.js').SellerFormValues} */
function emptyValues() {
  return {
    companyName: '',
    representativeName: '',
    representativeTitle: '',
    address: '',
  };
}

/** @param {string} [message] @returns {{ type: 'error', message: string } | undefined} */
function fieldStatus(message) {
  return message ? { type: 'error', message } : undefined;
}

/**
 * Form state for creating a `Seller` (bên bán catalog entry) — the
 * quick-create dialog embedded in the Contract form's Seller section.
 * Mirrors `useCustomerForm`.
 * @param {{ onSuccess?: (seller: import('../types/index.js').Seller) => void }} [options]
 */
export function useSellerForm({ onSuccess } = {}) {
  const [values, setValues] = useState(emptyValues());
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');

  const extraFieldRows = useExtraFieldRows();
  const createMutation = useCreateSellerMutation();

  /**
   * @param {keyof import('../types/index.js').SellerFormValues} field
   * @param {string} value
   */
  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function reset() {
    setValues(emptyValues());
    setFieldErrors({});
    setSubmitError('');
    extraFieldRows.clearRows();
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} [event] Present when used as a `<form onSubmit>`, absent when a quick-create dialog calls it directly from a button `onClick`. */
  async function handleSubmit(event) {
    event?.preventDefault();
    setSubmitError('');

    const result = sellerSchema.safeParse(values);
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
      extraFieldRows: extraFieldRows.rows,
    });

    if (!createResult.success) {
      setSubmitError(createResult.message);
      return;
    }

    onSuccess?.(createResult.seller);
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
    extraFieldRows,
    submitError,
    isSubmitting: createMutation.isPending,
    handleSubmit,
    reset,
  };
}
