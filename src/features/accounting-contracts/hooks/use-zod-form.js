'use client';

import { useState } from 'react';

/**
 * Form state for the Kế toán dialogs: values, per-field errors from a zod
 * schema, a submit error, and a submit that validates first.
 * @template {Record<string, unknown>} V
 * @template P
 * @param {{
 *   initialValues: V,
 *   schema: import('zod').ZodType<P, any>,
 *   submit: (parsed: P, values: V) => Promise<{ success: true } | { success: false, message: string, fieldErrors?: Record<string, string> }>,
 *   onSuccess?: () => void,
 * }} options
 */
export function useZodForm({ initialValues, schema, submit, onSuccess }) {
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * @template {keyof V} K
   * @param {K} field
   * @param {V[K]} value
   */
  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  /** @param {V} next */
  function reset(next) {
    setValues(next);
    setFieldErrors({});
    setSubmitError('');
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} [event] */
  async function handleSubmit(event) {
    event?.preventDefault();
    setSubmitError('');

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      /** @type {Record<string, string>} */
      const next = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.');
        if (!next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const result = await submit(parsed.data, values);
      if (!result.success) {
        setSubmitError(result.message);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        return;
      }
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    values,
    setField,
    fieldStatuses:
      /** @type {Record<string, { type: 'error', message: string } | undefined>} */ (
        Object.fromEntries(
          Object.entries(fieldErrors).map(([key, message]) => [
            key,
            { type: 'error', message },
          ]),
        )
      ),
    submitError,
    isSubmitting,
    handleSubmit,
    reset,
  };
}
