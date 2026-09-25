'use client';

import { useState } from 'react';

import { generateRowKey } from '@/shared/config/generate-row-key.js';
import { useExtraFieldRows } from '@/shared/hooks/use-extra-field-rows.js';

import { customerSchema } from '../config/customer-schema.js';
import {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
} from './use-customers-query.js';
import { usePartyLookupsQuery } from './use-party-lookups-query.js';
import {
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
} from './use-suppliers-query.js';

/** @param {'customer' | 'supplier'} kind @returns {import('../types/index.js').PartyFormValues} */
function emptyValues(kind) {
  return {
    companyName: '',
    code: `${kind === 'customer' ? 'KH' : 'NCC'}-${Date.now()}`,
    isOrganization: true,
    taxCode: '',
    budgetUnitCode: '',
    phone: '',
    website: '',
    groupId: '',
    groupIds: [],
    employeeId: '',
    isInternal: false,
    representativeName: '',
    representativeTitle: '',
    address: '',
    contactSalutation: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    invoiceRecipientName: '',
    invoiceRecipientEmails: '',
    invoiceRecipientPhone: '',
    paymentTermId: '',
    dueDays: undefined,
    creditLimit: undefined,
    debtAccount: kind === 'customer' ? '131' : '331',
    country: 'Việt Nam',
    province: '',
    district: '',
    ward: '',
    deliveryAddressSameAsMain: false,
    notes: '',
  };
}
/** @param {any} party @param {'customer' | 'supplier'} kind */
function valuesFromParty(party, kind) {
  const p = party.profile ?? {};
  return {
    ...emptyValues(kind),
    companyName: party.companyName,
    representativeName: party.representativeName ?? '',
    representativeTitle: party.representativeTitle ?? '',
    address: party.address ?? '',
    code: p.code ?? '',
    isOrganization: p.isOrganization ?? true,
    taxCode: p.taxCode ?? '',
    budgetUnitCode: p.budgetUnitCode ?? '',
    phone: p.phone ?? '',
    website: p.website ?? '',
    groupId: p.groupId ?? '',
    groupIds: party.groupIds ?? [],
    employeeId: p.employeeId ?? '',
    isInternal: p.isInternal ?? false,
    contactSalutation: p.contactSalutation ?? '',
    contactName: p.contactName ?? '',
    contactEmail: p.contactEmail ?? '',
    contactPhone: p.contactPhone ?? '',
    invoiceRecipientName: p.invoiceRecipientName ?? '',
    invoiceRecipientEmails: p.invoiceRecipientEmails ?? '',
    invoiceRecipientPhone: p.invoiceRecipientPhone ?? '',
    paymentTermId: p.paymentTermId ?? '',
    dueDays: p.dueDays ?? undefined,
    creditLimit: p.creditLimit ?? undefined,
    debtAccount: p.debtAccount ?? (kind === 'customer' ? '131' : '331'),
    country: p.country ?? 'Việt Nam',
    province: p.province ?? '',
    district: p.district ?? '',
    ward: p.ward ?? '',
    deliveryAddressSameAsMain: p.deliveryAddressSameAsMain ?? false,
    notes: p.notes ?? '',
  };
}
/** @param {any[]} rows */
const withKeys = (rows) =>
  rows.map((row) => ({ rowKey: generateRowKey(), ...row }));
/** @param {string} message @returns {{type: 'error', message: string} | undefined} */
const fieldStatus = (message) =>
  message ? { type: 'error', message } : undefined;

/** @param {{kind: 'customer' | 'supplier', party?: any, onSuccess?: (party: any) => void}} options */
export function usePartyForm({ kind, party = null, onSuccess }) {
  const [values, setValues] = useState(
    party ? valuesFromParty(party, kind) : emptyValues(kind),
  );
  const [bankAccounts, setBankAccounts] = useState(
    withKeys(party?.bankAccounts ?? []),
  );
  const [deliveryAddresses, setDeliveryAddresses] = useState(
    withKeys(party?.deliveryAddresses ?? []),
  );
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const extraFieldRows = useExtraFieldRows(withKeys(party?.extraFields ?? []));
  const lookups = usePartyLookupsQuery(kind);
  const customerCreate = useCreateCustomerMutation();
  const customerUpdate = useUpdateCustomerMutation();
  const supplierCreate = useCreateSupplierMutation();
  const supplierUpdate = useUpdateSupplierMutation();
  /** @type {any} */
  const mutations =
    kind === 'customer'
      ? { create: customerCreate, update: customerUpdate }
      : { create: supplierCreate, update: supplierUpdate };
  /** @param {keyof import('../types/index.js').PartyFormValues} field @param {any} value */
  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }
  /** @param {import('react').Dispatch<import('react').SetStateAction<any[]>>} setRows @param {string} rowKey @param {string} field @param {any} value */
  function updateRow(setRows, rowKey, field, value) {
    setRows((rows) =>
      rows.map((row) =>
        row.rowKey === rowKey ? { ...row, [field]: value } : row,
      ),
    );
  }
  /** @param {import('react').Dispatch<import('react').SetStateAction<any[]>>} setRows @param {string} rowKey */
  function removeRow(setRows, rowKey) {
    setRows((rows) => rows.filter((row) => row.rowKey !== rowKey));
  }
  function reset() {
    setValues(party ? valuesFromParty(party, kind) : emptyValues(kind));
    setBankAccounts(withKeys(party?.bankAccounts ?? []));
    setDeliveryAddresses(withKeys(party?.deliveryAddresses ?? []));
    extraFieldRows.setRows(withKeys(party?.extraFields ?? []));
    setFieldErrors({});
    setSubmitError('');
  }
  /** @param {import('react').FormEvent<HTMLFormElement>} [event] */
  async function handleSubmit(event) {
    event?.preventDefault();
    setSubmitError('');
    const parsed = customerSchema.safeParse(values);
    if (!parsed.success) {
      const errors = /** @type {Record<string, string>} */ ({});
      parsed.error.issues.forEach((issue) => {
        errors[String(issue.path[0])] ??= issue.message;
      });
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    const payload = {
      values: parsed.data,
      extraFieldRows: extraFieldRows.rows,
      bankAccounts,
      deliveryAddresses,
    };
    const result = party
      ? await mutations.update.mutateAsync({
          ...payload,
          [kind === 'customer' ? 'customerId' : 'supplierId']: party.id,
        })
      : await mutations.create.mutateAsync(payload);
    if (!result.success) {
      setSubmitError(result.message);
      return;
    }
    onSuccess?.(result[kind]);
    if (!party) reset();
  }
  const fieldStatuses = /** @type {Record<string, any>} */ (
    Object.fromEntries(
      Object.entries(fieldErrors).map(([key, value]) => [
        key,
        fieldStatus(String(value)),
      ]),
    )
  );
  return {
    values,
    setField,
    fieldStatuses,
    bankAccounts,
    deliveryAddresses,
    extraFieldRows,
    lookups,
    submitError,
    addBankAccount: () =>
      setBankAccounts((rows) => [
        ...rows,
        {
          rowKey: generateRowKey(),
          accountNumber: '',
          bankName: '',
          branch: '',
          province: '',
        },
      ]),
    addDeliveryAddress: () =>
      setDeliveryAddresses((rows) => [
        ...rows,
        { rowKey: generateRowKey(), address: '' },
      ]),
    updateBankAccount: (
      /** @type {string} */ key,
      /** @type {string} */ field,
      /** @type {any} */ value,
    ) => updateRow(setBankAccounts, key, field, value),
    updateDeliveryAddress: (
      /** @type {string} */ key,
      /** @type {any} */ value,
    ) => updateRow(setDeliveryAddresses, key, 'address', value),
    removeBankAccount: (/** @type {string} */ key) =>
      removeRow(setBankAccounts, key),
    removeDeliveryAddress: (/** @type {string} */ key) =>
      removeRow(setDeliveryAddresses, key),
    isSubmitting: mutations.create.isPending || mutations.update.isPending,
    handleSubmit,
    reset,
  };
}
