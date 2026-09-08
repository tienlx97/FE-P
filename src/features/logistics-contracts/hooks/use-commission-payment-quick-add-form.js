'use client';

import { useState } from 'react';

import { commissionPaymentSchema } from '../config/commission-schema.js';
import { useUpdateCommissionMutation } from './use-commission-query.js';

const TODAY_ISO = new Date().toISOString().slice(0, 10);

/** @returns {import('../types/index.js').CommissionPaymentFormValues} */
function emptyValues() {
  return { paymentDate: TODAY_ISO, amount: undefined, note: '' };
}

/** @param {string} [message] @returns {{ type: 'error', message: string } | undefined} */
function fieldStatus(message) {
  return message ? { type: 'error', message } : undefined;
}

/**
 * Form state for the "Thêm nhanh" quick-add dialog — appends one payment
 * to an existing `Commission`'s `paymentHistory` without opening the full
 * edit form. The backend has no dedicated single-payment endpoint
 * (`PaymentHistory` is replaced wholesale by `PUT .../commission`, same as
 * `PaymentTerms`), so this resends every other field unchanged alongside
 * the existing history plus the one new entry.
 * @param {{
 *   contractId: string,
 *   commission: import('../types/index.js').Commission,
 *   onSuccess?: (commission: import('../types/index.js').Commission) => void,
 * }} options
 */
export function useCommissionPaymentQuickAddForm({
  contractId,
  commission,
  onSuccess,
}) {
  const [values, setValues] = useState(emptyValues());
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');

  const updateMutation = useUpdateCommissionMutation(contractId);

  /**
   * @template {keyof import('../types/index.js').CommissionPaymentFormValues} K
   * @param {K} field
   * @param {import('../types/index.js').CommissionPaymentFormValues[K]} value
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

    const result = commissionPaymentSchema.safeParse(values);
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

    const mutationResult = await updateMutation.mutateAsync({
      values: {
        code: commission.code,
        signedDate: commission.signedDate,
        partyCustomerId: commission.partyCustomerId,
        value: commission.value,
        sellerSigned: commission.sellerSigned,
        partySigned: commission.partySigned,
      },
      paymentTerms: commission.paymentTerms.map((term) => ({
        paymentRatioPercent: term.paymentRatioPercent,
        paymentCondition: term.paymentCondition,
      })),
      paymentHistory: [
        ...commission.paymentHistory.map((payment) => ({
          paymentDate: payment.paymentDate,
          amount: payment.amount,
          note: payment.note ?? '',
        })),
        result.data,
      ],
    });

    if (!mutationResult.success) {
      setSubmitError(mutationResult.message);
      return;
    }

    onSuccess?.(mutationResult.commission);
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
    isSubmitting: updateMutation.isPending,
    handleSubmit,
    reset,
  };
}
