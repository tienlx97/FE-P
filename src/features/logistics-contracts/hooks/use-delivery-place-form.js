'use client';

import { useState } from 'react';

import { deliveryPlaceSchema } from '../config/delivery-place-schema.js';
import { useCreateDeliveryPlaceMutation } from './use-delivery-places-query.js';

/**
 * @param {string} [countryId]
 * @returns {import('../types/index.js').DeliveryPlaceFormValues}
 */
function emptyValues(countryId) {
  return { name: '', countryId: countryId ?? '' };
}

/** @param {string} [message] @returns {{ type: 'error', message: string } | undefined} */
function fieldStatus(message) {
  return message ? { type: 'error', message } : undefined;
}

/**
 * Form state for creating a `DeliveryPlace` (per-country lookup catalog) — mirrors
 * `useCustomerForm`. Used by `quick-create-delivery-place-dialog.jsx`. `DeliveryPlace` is only
 * a lookup/suggestion catalog — it does not constrain
 * `placeOfDelivery` on the Contract form.
 * @param {{ countryId?: string, isOpen?: boolean, onSuccess?: (place: import('../types/index.js').DeliveryPlace) => void }} [options]
 */
export function useDeliveryPlaceForm({ countryId, isOpen, onSuccess } = {}) {
  const [values, setValues] = useState(emptyValues(countryId));
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');

  const createMutation = useCreateDeliveryPlaceMutation();

  // `QuickCreateDeliveryPlaceDialog` stays mounted and is opened by its caller
  // setting `isOpen` directly (e.g. an IconButton's onClick), never by
  // calling this hook's `reset()` — so a `countryId` prop change (the
  // caller's currently selected export country) picked up between opens
  // would otherwise never reach `values.countryId`, which was seeded once
  // via `useState(emptyValues(countryId))` at mount. Re-seeding whenever
  // `isOpen` flips true keeps the form in sync with the latest `countryId`
  // every time it opens. No-op when `isOpen` isn't passed at all (e.g.
  // `delivery-place-form-dialog.jsx`, which has no such prop to go stale).
  //
  // Done as a render-phase state adjustment (comparing against a
  // `prevIsOpen` state mirror), not a `useEffect` — the lint rule
  // `react-hooks/set-state-in-effect` forbids synchronous `setState` in
  // effects (it causes an extra commit); this is React's documented
  // pattern for "reset state when a prop changes" instead.
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(isOpen);
    setValues(emptyValues(countryId));
    setFieldErrors({});
    setSubmitError('');
  } else if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
  }

  /**
   * @param {keyof import('../types/index.js').DeliveryPlaceFormValues} field
   * @param {string} value
   */
  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function reset() {
    setValues(emptyValues(countryId));
    setFieldErrors({});
    setSubmitError('');
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} [event] */
  async function handleSubmit(event) {
    event?.preventDefault();
    setSubmitError('');

    const result = deliveryPlaceSchema.safeParse(values);
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

    onSuccess?.(createResult.deliveryPlace);
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
