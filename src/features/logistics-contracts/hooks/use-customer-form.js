'use client';

import { useState } from 'react';

import { generateRowKey } from '@/shared/config/generate-row-key.js';

import { customerSchema } from '../config/customer-schema.js';
import {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
} from './use-customers-query.js';
import { useExtraFieldRows } from './use-extra-field-rows.js';

/** @returns {import('../types/index.js').CustomerFormValues} */
function emptyValues() {
  return {
    companyName: '',
    representativeName: '',
    representativeTitle: '',
    address: '',
  };
}

/** @param {import('../types/index.js').Customer} customer @returns {import('../types/index.js').CustomerFormValues} */
function valuesFromCustomer(customer) {
  return {
    companyName: customer.companyName,
    representativeName: customer.representativeName ?? '',
    representativeTitle: customer.representativeTitle ?? '',
    address: customer.address ?? '',
  };
}

/** @param {import('../types/index.js').Customer} customer @returns {import('../types/index.js').ExtraFieldRow[]} */
function extraFieldRowsFromCustomer(customer) {
  return customer.extraFields.map((field) => ({
    rowKey: generateRowKey(),
    key: field.key,
    value: field.value,
  }));
}

/** @param {string} [message] @returns {{ type: 'error', message: string } | undefined} */
function fieldStatus(message) {
  return message ? { type: 'error', message } : undefined;
}

/**
 * Form state for creating/updating a `Customer` (Party A catalog entry) —
 * shared by `quick-create-customer-dialog.jsx` (embedded in the Contract
 * form, create-only) and `customer-form-dialog.jsx` (the standalone
 * Customers page, create + edit). Pass `customer` to edit an existing one.
 * @param {{ customer?: import('../types/index.js').Customer | null, onSuccess?: (customer: import('../types/index.js').Customer) => void }} [options]
 */
export function useCustomerForm({ customer = null, onSuccess } = {}) {
  const [values, setValues] = useState(
    customer ? valuesFromCustomer(customer) : emptyValues(),
  );
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');

  const extraFieldRows = useExtraFieldRows(
    customer ? extraFieldRowsFromCustomer(customer) : [],
  );
  const createMutation = useCreateCustomerMutation();
  const updateMutation = useUpdateCustomerMutation();

  /**
   * @param {keyof import('../types/index.js').CustomerFormValues} field
   * @param {string} value
   */
  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function reset() {
    setValues(customer ? valuesFromCustomer(customer) : emptyValues());
    setFieldErrors({});
    setSubmitError('');
    extraFieldRows.setRows(
      customer ? extraFieldRowsFromCustomer(customer) : [],
    );
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} [event] Present when used as a `<form onSubmit>`, absent when a quick-create dialog calls it directly from a button `onClick`. */
  async function handleSubmit(event) {
    event?.preventDefault();
    setSubmitError('');

    const result = customerSchema.safeParse(values);
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
    const mutationResult = customer
      ? await updateMutation.mutateAsync({
          customerId: customer.id,
          values: result.data,
          extraFieldRows: extraFieldRows.rows,
        })
      : await createMutation.mutateAsync({
          values: result.data,
          extraFieldRows: extraFieldRows.rows,
        });

    if (!mutationResult.success) {
      setSubmitError(mutationResult.message);
      return;
    }

    onSuccess?.(mutationResult.customer);
    if (!customer) reset();
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
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    handleSubmit,
    reset,
  };
}
