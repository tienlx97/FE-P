'use client';

import { useState } from 'react';

import { contractBankSchema } from '../config/contract-bank-schema.js';
import { useCreateContractBankMutation } from './use-contract-banks-query.js';
import { useExtraFieldRows } from './use-extra-field-rows.js';

/** @returns {import('../types/index.js').ContractBankFormValues} */
function emptyValues() {
  return {
    bankName: '',
    beneficiary: '',
    bankAccountNumber: '',
    branchName: '',
    bankAddress: '',
    swiftCode: '',
  };
}

/** @param {string} [message] @returns {{ type: 'error', message: string } | undefined} */
function fieldStatus(message) {
  return message ? { type: 'error', message } : undefined;
}

/**
 * Form state for creating a `ContractBank` — used by
 * `quick-create-bank-dialog.jsx`, embedded in the Contract form.
 * @param {{ onSuccess?: (bank: import('../types/index.js').ContractBank) => void }} [options]
 */
export function useBankForm({ onSuccess } = {}) {
  const [values, setValues] = useState(emptyValues());
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');

  const extraFieldRows = useExtraFieldRows();
  const createMutation = useCreateContractBankMutation();

  /**
   * @param {keyof import('../types/index.js').ContractBankFormValues} field
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

    const result = contractBankSchema.safeParse(values);
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

    onSuccess?.(createResult.bank);
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
