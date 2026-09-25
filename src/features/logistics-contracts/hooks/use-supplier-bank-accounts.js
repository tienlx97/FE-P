'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { listVietnamBanks } from '@/shared/api/vietnam-banks.js';

import { changeSupplierBankAccount } from '../api/suppliers.js';
import { partyBankAccountSchema } from '../config/party-bank-account-schema.js';

/** Vietnamese bank catalog — short code tile + full name on bank rows. */
export function useVietnamBanksQuery() {
  return useQuery({
    queryKey: ['shared', 'vietnam-banks'],
    queryFn: listVietnamBanks,
    staleTime: Infinity,
  });
}

/**
 * Add / update / delete / set-default for one supplier's bank accounts.
 * Every endpoint returns the whole supplier, written straight into the
 * detail query, then the supplier lists are refetched.
 * @param {string} supplierId
 */
export function useSupplierBankAccountMutation(supplierId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      /** @type {Parameters<typeof changeSupplierBankAccount>[1]} */ options,
    ) => changeSupplierBankAccount(supplierId, options),
    onSuccess: (result) => {
      if (!result.success) return;
      queryClient.setQueryData(
        ['logistics-contracts', 'suppliers', supplierId],
        result,
      );
      queryClient.invalidateQueries({
        queryKey: ['logistics-contracts', 'suppliers-search'],
      });
    },
  });
}

/**
 * @param {import('../types/index.js').PartyBankAccount | null} account
 * @param {string} holder default holder for a new account (the supplier's name)
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
 * Add/edit form for one supplier bank account (`SupplierBankAccountDialog`).
 * @param {{
 *   supplier: import('../types/index.js').Supplier,
 *   account: import('../types/index.js').PartyBankAccount | null,
 *   onSuccess: () => void,
 * }} options
 */
export function useSupplierBankAccountForm({ supplier, account, onSuccess }) {
  const [values, setValues] = useState(() =>
    initialValues(account, supplier.companyName),
  );
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');
  const mutation = useSupplierBankAccountMutation(supplier.id);

  /** @param {keyof ReturnType<typeof initialValues>} field @param {any} value */
  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} [event] */
  async function handleSubmit(event) {
    event?.preventDefault();
    setSubmitError('');
    const parsed = partyBankAccountSchema.safeParse(values);
    if (!parsed.success) {
      const errors = /** @type {Record<string, string>} */ ({});
      for (const issue of parsed.error.issues) {
        errors[String(issue.path[0])] ??= issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    const result = await mutation.mutateAsync(
      account?.id
        ? {
            method: 'PUT',
            accountId: account.id,
            account: parsed.data,
            errorMessage: 'Không thể sửa tài khoản ngân hàng',
          }
        : {
            method: 'POST',
            account: parsed.data,
            errorMessage: 'Không thể thêm tài khoản ngân hàng',
          },
    );
    if (!result.success) {
      setSubmitError(result.message);
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
    isSubmitting: mutation.isPending,
    handleSubmit,
  };
}
