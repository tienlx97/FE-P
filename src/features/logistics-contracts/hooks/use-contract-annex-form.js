'use client';

import { useState } from 'react';

import { contractAnnexSchema } from '../config/contract-annex-schema.js';
import {
  useCreateContractAnnexMutation,
  useUpdateContractAnnexMutation,
} from './use-contract-annexes-query.js';

/** @returns {import('../types/index.js').ContractAnnexFormValues} */
function emptyValues() {
  return {
    type: '',
    amount: undefined,
    signedDate: '',
    buyerSigned: false,
    sellerSigned: false,
    note: '',
  };
}

/** @param {import('../types/index.js').ContractAnnex} annex */
function valuesFromAnnex(annex) {
  return {
    type: annex.type,
    amount: annex.amount,
    signedDate: annex.signedDate,
    buyerSigned: annex.buyerSigned,
    sellerSigned: annex.sellerSigned,
    note: annex.note ?? '',
  };
}

/** @param {string} [message] @returns {{ type: 'error', message: string } | undefined} */
function fieldStatus(message) {
  return message ? { type: 'error', message } : undefined;
}

/**
 * Form state for creating/updating a `ContractAnnex`. Pass `annex` to edit
 * an existing one — `annexNumber`/`annexCode` are never editable (backend-
 * assigned), so they never appear in `values`.
 * @param {{
 *   contractId: string,
 *   annex?: import('../types/index.js').ContractAnnex | null,
 *   onSuccess?: (annex: import('../types/index.js').ContractAnnex) => void,
 * }} options
 */
export function useContractAnnexForm({ contractId, annex = null, onSuccess }) {
  const [values, setValues] = useState(
    annex ? valuesFromAnnex(annex) : emptyValues(),
  );
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');

  const createMutation = useCreateContractAnnexMutation(contractId);
  const updateMutation = useUpdateContractAnnexMutation(contractId);

  /**
   * @template {keyof import('../types/index.js').ContractAnnexFormValues} K
   * @param {K} field
   * @param {import('../types/index.js').ContractAnnexFormValues[K]} value
   */
  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function reset() {
    setValues(annex ? valuesFromAnnex(annex) : emptyValues());
    setFieldErrors({});
    setSubmitError('');
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} [event] */
  async function handleSubmit(event) {
    event?.preventDefault();
    setSubmitError('');

    const result = contractAnnexSchema.safeParse(values);
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

    const mutationResult = annex
      ? await updateMutation.mutateAsync({
          annexId: annex.id,
          values: result.data,
        })
      : await createMutation.mutateAsync(result.data);

    if (!mutationResult.success) {
      setSubmitError(mutationResult.message);
      return;
    }

    onSuccess?.(mutationResult.annex);
    if (!annex) reset();
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
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    handleSubmit,
    reset,
  };
}
