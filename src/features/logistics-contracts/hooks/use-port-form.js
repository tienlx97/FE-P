'use client';

import { useState } from 'react';

import { portSchema } from '../config/port-schema.js';
import { useCreatePortMutation } from './use-ports-query.js';

/**
 * @param {string} [countryId]
 * @param {string} [countryCode] ISO code, pre-filled as the UN/LOCODE prefix
 * @returns {import('../types/index.js').PortFormValues}
 */
function emptyValues(countryId, countryCode) {
  return {
    countryId: countryId ?? '',
    code: countryCode ?? '',
    name: '',
    fullName: '',
  };
}

/** @param {string} [message] @returns {{ type: 'error', message: string } | undefined} */
function fieldStatus(message) {
  return message ? { type: 'error', message } : undefined;
}

/**
 * Form state for creating a `Port` ("Cảng đến", UN/LOCODE). Same shape as
 * `useDeliveryPlaceForm`, including the render-phase re-seed whenever
 * `isOpen` flips true, so a quick-create dialog that stays mounted picks up
 * the caller's current country (and its ISO code as the code prefix).
 * @param {{
 *   countryId?: string,
 *   countries?: import('../types/index.js').Country[],
 *   isOpen?: boolean,
 *   onSuccess?: (port: import('../types/index.js').Port) => void,
 * }} [options]
 */
export function usePortForm({
  countryId,
  countries = [],
  isOpen,
  onSuccess,
} = {}) {
  /** @param {string} [id] */
  const codeOf = (id) =>
    countries.find((country) => country.id === id)?.code ?? '';
  const [values, setValues] = useState(
    emptyValues(countryId, codeOf(countryId)),
  );
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');

  const createMutation = useCreatePortMutation();

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(isOpen);
    setValues(emptyValues(countryId, codeOf(countryId)));
    setFieldErrors({});
    setSubmitError('');
  } else if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
  }

  /**
   * Picking a country re-seeds the code prefix when the code is still just
   * a (previous) prefix, so typing the 3-character location part is enough.
   * @param {keyof import('../types/index.js').PortFormValues} field
   * @param {string} value
   */
  function setField(field, value) {
    setValues((current) => {
      if (field === 'countryId' && current.code.length <= 2) {
        return { ...current, countryId: value, code: codeOf(value) };
      }
      return {
        ...current,
        [field]: field === 'code' ? value.toUpperCase() : value,
      };
    });
  }

  function reset() {
    setValues(emptyValues(countryId, codeOf(countryId)));
    setFieldErrors({});
    setSubmitError('');
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} [event] */
  async function handleSubmit(event) {
    event?.preventDefault();
    setSubmitError('');

    const result = portSchema.safeParse(values);
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

    onSuccess?.(createResult.port);
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
