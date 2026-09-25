'use client';

import { useState } from 'react';

import { bankAccountSchema } from '@/shared/config/bank-account-schema.js';
import { generateRowKey } from '@/shared/config/generate-row-key.js';

import { useExtraFieldRows } from './use-extra-field-rows.js';

/**
 * @param {import('@/shared/api/bank-accounts.js').BankAccount | null} account
 * @param {string} holder default holder for a new account (the owner's name)
 */
function initialValues(account, holder) {
  return {
    bankName: account?.bankName ?? '',
    branch: account?.branch ?? '',
    province: account?.province ?? '',
    accountNumber: account?.accountNumber ?? '',
    holder: account?.holder ?? holder,
    currency: account?.currency ?? 'VND',
    swiftCode: account?.swiftCode ?? '',
    isActive: account?.isActive ?? true,
    isDefault: account?.isDefault ?? false,
  };
}

/**
 * Add/edit form for one bank account (`BankAccountDialog`); `submit` sends
 * the add / update call and resolves with its result.
 * @param {{
 *   account: import('@/shared/api/bank-accounts.js').BankAccount | null,
 *   holderDefault: string,
 *   submit: (operation: { kind: 'add' | 'update', accountId?: string, account: any }) => Promise<{ success: boolean, message?: string }>,
 *   onSuccess: () => void,
 * }} options
 */
export function useBankAccountForm({ account, holderDefault, submit, onSuccess }) {
  const [values, setValues] = useState(() =>
    initialValues(account, holderDefault),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');
  const extraFieldRows = useExtraFieldRows(
    (account?.extraFields ?? []).map((field) => ({
      rowKey: generateRowKey(),
      key: field.key,
      value: field.value,
    })),
  );

  /** "Thêm trường" suggestion: adds `key` unless a row already has it. @param {string} key */
  function addSuggestedField(key) {
    if (extraFieldRows.rows.some((row) => row.key.trim() === key)) return;
    extraFieldRows.setRows((rows) => [
      ...rows.filter((row) => row.key.trim() || row.value.trim()),
      { rowKey: generateRowKey(), key, value: '' },
    ]);
  }

  /** @param {keyof ReturnType<typeof initialValues>} field @param {any} value */
  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} [event] */
  async function handleSubmit(event) {
    event?.preventDefault();
    setSubmitError('');
    const parsed = bankAccountSchema.safeParse({
      ...values,
      // Fully blank rows are dropped; a value without a name is an error.
      extraFields: extraFieldRows.rows
        .filter((row) => row.key.trim() || row.value.trim())
        .map((row) => ({ key: row.key, value: row.value })),
    });
    if (!parsed.success) {
      const errors = /** @type {Record<string, string>} */ ({});
      for (const issue of parsed.error.issues) {
        errors[String(issue.path[0])] ??= issue.message;
      }
      setFieldErrors(errors);
      if (errors.extraFields) {
        setSubmitError(`Thông tin bổ sung: ${errors.extraFields}`);
      }
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);
    const result = await submit(
      account?.id
        ? { kind: 'update', accountId: account.id, account: parsed.data }
        : { kind: 'add', account: parsed.data },
    );
    setIsSubmitting(false);
    if (!result.success) {
      setSubmitError(result.message ?? 'Không thể lưu tài khoản ngân hàng');
      return;
    }
    onSuccess();
  }

  const fieldStatuses = /** @type {Record<string, { type: 'error', message: string }>} */ (
    Object.fromEntries(
      Object.entries(fieldErrors).map(([key, message]) => [
        key,
        { type: 'error', message },
      ]),
    )
  );

  return {
    values,
    setField,
    fieldStatuses,
    submitError,
    extraFieldRows,
    addSuggestedField,
    isSubmitting,
    handleSubmit,
  };
}
