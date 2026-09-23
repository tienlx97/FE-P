'use client';

import { useState } from 'react';

import { partyGroupSchema } from '../config/party-group-schema.js';
import { useCreatePartyGroupMutation } from './use-party-lookups-query.js';

/** @returns {import('../types/index.js').PartyGroupFormValues} */
function emptyValues() {
  return { name: '' };
}

/** @param {string} [message] @returns {{ type: 'error', message: string } | undefined} */
function fieldStatus(message) {
  return message ? { type: 'error', message } : undefined;
}

/**
 * Form state for creating a Customer/Supplier group (name-only lookup
 * catalog entry) — mirrors `useShipmentCostCategoryForm`. Used by
 * `quick-create-party-group-dialog.jsx`.
 * @param {{ kind: 'customer' | 'supplier', onSuccess?: (group: import('../types/index.js').PartyLookup) => void }} options
 */
export function usePartyGroupForm({ kind, onSuccess }) {
  const [values, setValues] = useState(emptyValues());
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');

  const createMutation = useCreatePartyGroupMutation(kind);

  /** @param {keyof import('../types/index.js').PartyGroupFormValues} field @param {string} value */
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

    const result = partyGroupSchema.safeParse(values);
    if (!result.success) {
      const nextFieldErrors = /** @type {Record<string, string>} */ ({});
      for (const issue of result.error.issues) {
        nextFieldErrors[String(issue.path[0])] = issue.message;
      }
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    const createResult = await createMutation.mutateAsync(result.data.name);

    if (!createResult.success) {
      setSubmitError(createResult.message);
      return;
    }

    onSuccess?.(createResult.group);
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
