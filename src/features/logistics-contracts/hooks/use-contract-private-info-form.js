'use client';

import { useState } from 'react';

import { generateRowKey } from '@/shared/config/generate-row-key.js';

import { contractPrivateInfoSchema } from '../config/contract-private-info-schema.js';
import { useUpsertContractPrivateInfoMutation } from './use-contract-private-info-query.js';
import { useExtraFieldRows } from './use-extra-field-rows.js';

/** @returns {import('../types/index.js').ContractPrivateInfoFormValues} */
function emptyValues() {
  return {
    boqSentDate: '',
    containerCount: undefined,
    costPricePerContainer: undefined,
    quotedPricePerContainer: undefined,
    unitCostLabor: undefined,
    unitCostSandblasting: undefined,
    unitCostPainting: undefined,
    unitCostFactory: undefined,
    volumeSale: undefined,
    volumeMaterial: undefined,
    profit: undefined,
    totalAmountUsd: undefined,
    exchangeRateVnd: undefined,
  };
}

/** @param {import('../types/index.js').ContractPrivateInfo} privateInfo
 * @returns {import('../types/index.js').ContractPrivateInfoFormValues} */
function valuesFromPrivateInfo(privateInfo) {
  return {
    boqSentDate: privateInfo.boqSentDate ?? '',
    containerCount: privateInfo.containerCount ?? undefined,
    costPricePerContainer: privateInfo.costPricePerContainer ?? undefined,
    quotedPricePerContainer: privateInfo.quotedPricePerContainer ?? undefined,
    unitCostLabor: privateInfo.unitCostLabor ?? undefined,
    unitCostSandblasting: privateInfo.unitCostSandblasting ?? undefined,
    unitCostPainting: privateInfo.unitCostPainting ?? undefined,
    unitCostFactory: privateInfo.unitCostFactory ?? undefined,
    volumeSale: privateInfo.volumeSale ?? undefined,
    volumeMaterial: privateInfo.volumeMaterial ?? undefined,
    profit: privateInfo.profit ?? undefined,
    totalAmountUsd: privateInfo.totalAmountUsd ?? undefined,
    exchangeRateVnd: privateInfo.exchangeRateVnd ?? undefined,
  };
}

/** @param {string} [message] @returns {{ type: 'error', message: string } | undefined} */
function fieldStatus(message) {
  return message ? { type: 'error', message } : undefined;
}

/**
 * Backs the "Thông tin private" tab's inline edit mode in
 * `ContractExpandedDetails` (same `isReadOnly`-toggle convention as the
 * "Thông tin" tab's `useContractForm`, not a separate dialog) — unlike
 * `useCommissionForm`, there is no create/edit split: the backend endpoint
 * is a single idempotent `PUT` (upsert), so this hook only ever calls one
 * mutation regardless of whether `privateInfo` already has values.
 * @param {{
 *   contractId: string,
 *   privateInfo?: import('../types/index.js').ContractPrivateInfo | null,
 *   onSuccess?: (privateInfo: import('../types/index.js').ContractPrivateInfo) => void,
 * }} options
 */
export function useContractPrivateInfoForm({
  contractId,
  privateInfo = null,
  onSuccess,
}) {
  const [version, setVersion] = useState(privateInfo?.version);
  const [values, setValues] = useState(
    privateInfo ? valuesFromPrivateInfo(privateInfo) : emptyValues(),
  );
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');

  const extraFieldRows = useExtraFieldRows(
    (privateInfo?.extraFields ?? []).map((field) => ({
      rowKey: generateRowKey(),
      key: field.key,
      value: field.value,
    })),
  );

  // Same fingerprint idiom as `useContractForm`/`useCommissionForm` — lets
  // a caller (the Contract dialog's footer) know whether this tab has an
  // unsaved draft worth guarding navigation on, without hoisting state.
  const draftFingerprint = JSON.stringify({
    values,
    extraFields: extraFieldRows.rows,
  });
  const [initialFingerprint, setInitialFingerprint] = useState(draftFingerprint);

  function reset() {
    setVersion(privateInfo?.version);
    setValues(privateInfo ? valuesFromPrivateInfo(privateInfo) : emptyValues());
    setFieldErrors({});
    setSubmitError('');
    extraFieldRows.setRows(
      (privateInfo?.extraFields ?? []).map((field) => ({
        rowKey: generateRowKey(),
        key: field.key,
        value: field.value,
      })),
    );
  }

  const upsertMutation = useUpsertContractPrivateInfoMutation(contractId);

  /**
   * @template {keyof import('../types/index.js').ContractPrivateInfoFormValues} K
   * @param {K} field
   * @param {import('../types/index.js').ContractPrivateInfoFormValues[K]} value
   */
  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');

    const result = contractPrivateInfoSchema.safeParse(values);
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

    const mutationResult = await upsertMutation.mutateAsync({
      values: result.data,
      extraFieldRows: extraFieldRows.rows,
      version,
    });

    if (!mutationResult.success) {
      setSubmitError(mutationResult.message);
      return;
    }

    setVersion(mutationResult.privateInfo.version);
    // Moves the dirty baseline up to what was just submitted, so re-opening
    // edit mode right after a clean save doesn't misreport `isDirty`.
    setInitialFingerprint(draftFingerprint);
    onSuccess?.(mutationResult.privateInfo);
  }

  return {
    reset,
    isDirty: draftFingerprint !== initialFingerprint,
    title: 'Thông tin private (BOQ)',
    submitLabel: 'Lưu thay đổi',
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
    isSubmitting: upsertMutation.isPending,
    handleSubmit,
  };
}
