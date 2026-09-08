'use client';

import { useState } from 'react';

import { commissionSchema } from '../config/commission-schema.js';
import { useCommissionCodeExistsQuery } from './use-commission-code-exists-query.js';
import {
  useCreateCommissionMutation,
  useUpdateCommissionMutation,
} from './use-commission-query.js';
import { useCustomersQuery } from './use-customers-query.js';
import { usePaymentHistoryRows } from './use-payment-history-rows.js';
import { usePaymentTermRows } from './use-payment-term-rows.js';

const TODAY_ISO = new Date().toISOString().slice(0, 10);

/** @returns {import('../types/index.js').CommissionFormValues} */
function emptyValues() {
  return {
    code: '',
    signedDate: TODAY_ISO,
    partyCustomerId: '',
    value: undefined,
    sellerSigned: false,
    partySigned: false,
  };
}

/** @param {import('../types/index.js').Commission} commission */
function valuesFromCommission(commission) {
  return {
    code: commission.code,
    signedDate: commission.signedDate,
    partyCustomerId: commission.partyCustomerId,
    value: commission.value,
    sellerSigned: commission.sellerSigned,
    partySigned: commission.partySigned,
  };
}

/** @param {string} [message] @returns {{ type: 'error', message: string } | undefined} */
function fieldStatus(message) {
  return message ? { type: 'error', message } : undefined;
}

/**
 * Single hook backing both the create and edit Commission dialog —
 * mirrors `useContractForm`'s create/edit merge. Pass `commission` to
 * edit the existing one — a contract has at most one, so there is no list
 * to pick from, only "create" (none yet) or "edit" (one exists).
 * @param {{
 *   contractId: string,
 *   commission?: import('../types/index.js').Commission | null,
 *   onSuccess?: (commission: import('../types/index.js').Commission) => void,
 * }} options
 */
export function useCommissionForm({
  contractId,
  commission = null,
  onSuccess,
}) {
  const isEdit = Boolean(commission);

  const [values, setValues] = useState(
    commission ? valuesFromCommission(commission) : emptyValues(),
  );
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');

  const customersQuery = useCustomersQuery();

  const paymentTermRows = usePaymentTermRows(
    commission
      ? commission.paymentTerms.map((term) => ({
          rowKey: term.id,
          paymentRatioPercent: term.paymentRatioPercent,
          paymentCondition: term.paymentCondition,
        }))
      : undefined,
  );

  const paymentHistoryRows = usePaymentHistoryRows(
    commission
      ? commission.paymentHistory.map((payment) => ({
          rowKey: payment.id,
          paymentDate: payment.paymentDate,
          amount: payment.amount,
          note: payment.note ?? '',
        }))
      : undefined,
  );

  function reset() {
    setValues(commission ? valuesFromCommission(commission) : emptyValues());
    setFieldErrors({});
    setSubmitError('');
    paymentTermRows.setRows(
      commission?.paymentTerms.map((term) => ({
        rowKey: term.id,
        paymentRatioPercent: term.paymentRatioPercent,
        paymentCondition: term.paymentCondition,
      })) ?? [],
    );
    paymentHistoryRows.setRows(
      commission?.paymentHistory.map((payment) => ({
        rowKey: payment.id,
        paymentDate: payment.paymentDate,
        amount: payment.amount,
        note: payment.note ?? '',
      })) ?? [],
    );
  }

  const createMutation = useCreateCommissionMutation(contractId);
  const updateMutation = useUpdateCommissionMutation(contractId);

  const commissionCodeExistsQuery = useCommissionCodeExistsQuery({
    code: values.code,
    excludeCommissionId: commission?.id,
  });

  /**
   * @template {keyof import('../types/index.js').CommissionFormValues} K
   * @param {K} field
   * @param {import('../types/index.js').CommissionFormValues[K]} value
   */
  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');

    const candidate = {
      ...values,
      paymentTerms: paymentTermRows.rows.map((row) => ({
        paymentRatioPercent: row.paymentRatioPercent,
        paymentCondition: row.paymentCondition,
      })),
      paymentHistory: paymentHistoryRows.rows.map((row) => ({
        paymentDate: row.paymentDate,
        amount: row.amount,
        note: row.note,
      })),
    };

    const result = commissionSchema.safeParse(candidate);
    if (!result.success) {
      /** @type {Record<string, string>} */
      const nextFieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.');
        if (!nextFieldErrors[key]) {
          nextFieldErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});

    const { paymentTerms, paymentHistory, ...submittedValues } = result.data;
    const mutationResult = commission
      ? await updateMutation.mutateAsync({
          values: submittedValues,
          paymentTerms,
          paymentHistory,
        })
      : await createMutation.mutateAsync({
          values: submittedValues,
          paymentTerms,
          paymentHistory,
        });

    if (!mutationResult.success) {
      setSubmitError(mutationResult.message);
      return;
    }

    onSuccess?.(mutationResult.commission);
  }

  // Same idiom as `useContractForm`'s `contractNumberDuplicateStatus`: only
  // shown once the debounced check has actually completed, so the user
  // isn't left guessing whether anything happened.
  /** @type {{ type: 'error' | 'success', message: string } | undefined} */
  const codeDuplicateStatus =
    !commissionCodeExistsQuery.isChecking &&
    commissionCodeExistsQuery.result?.success
      ? commissionCodeExistsQuery.result.exists
        ? { type: 'error', message: 'Mã Commission này đã được sử dụng' }
        : { type: 'success', message: 'Mã Commission chưa được sử dụng' }
      : undefined;

  const baseFieldStatuses = Object.fromEntries(
    Object.entries(fieldErrors).map(([key, message]) => [
      key,
      fieldStatus(message),
    ]),
  );

  return {
    reset,
    mode: isEdit ? 'edit' : 'create',
    title: isEdit ? 'CẬP NHẬT COMMISSION' : 'TẠO COMMISSION',
    submitLabel: isEdit ? 'Lưu thay đổi' : 'Tạo Commission',
    values,
    setField,
    fieldStatuses: {
      ...baseFieldStatuses,
      code: baseFieldStatuses.code ?? codeDuplicateStatus,
    },
    isCheckingCode: commissionCodeExistsQuery.isChecking,
    customers: customersQuery.data?.success
      ? customersQuery.data.customers
      : [],
    paymentTermRows,
    paymentHistoryRows,
    submitError,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    handleSubmit,
  };
}
