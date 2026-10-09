'use client';

import { Grid } from '@astryxdesign/core/Grid';
import { useEffect } from 'react';

import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';

import { customerSchema } from '../config/catalog-schemas.js';
import { useSaveCustomerMutation } from '../hooks/use-catalogs.js';
import { useZodForm } from '../hooks/use-zod-form.js';

/**
 * @param {import('../types/index.js').AccountingCustomer | null} customer
 * @returns {import('../types/index.js').AccountingCustomerFormValues}
 */
function valuesOf(customer) {
  return {
    name: customer?.name ?? '',
    taxCode: customer?.taxCode ?? '',
    address: customer?.address ?? '',
    phone: customer?.phone ?? '',
    email: customer?.email ?? '',
    contactPerson: customer?.contactPerson ?? '',
    note: customer?.note ?? '',
  };
}

/** @type {Array<{ key: 'taxCode' | 'phone' | 'email' | 'contactPerson', label: string }>} */
const OPTIONAL_FIELDS = [
  { key: 'taxCode', label: 'Mã số thuế' },
  { key: 'phone', label: 'Điện thoại' },
  { key: 'email', label: 'Email' },
  { key: 'contactPerson', label: 'Người liên hệ' },
];

/**
 * Create (no `customer`) or edit an accounting customer.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   customer: import('../types/index.js').AccountingCustomer | null,
 * }} props
 */
export function CustomerFormDialog({ isOpen, onOpenChange, customer }) {
  const saveMutation = useSaveCustomerMutation();
  const form = useZodForm({
    initialValues: valuesOf(customer),
    schema: customerSchema,
    submit: (values) => saveMutation.mutateAsync({ values, id: customer?.id }),
    onSuccess: () => onOpenChange(false),
  });
  const { reset } = form;

  useEffect(() => {
    if (isOpen) reset(valuesOf(customer));
    // Reload the values each time the dialog opens on a (possibly other) customer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, customer]);

  return (
    <FormDialog
      variant="drawer"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={customer ? 'Sửa khách hàng' : 'Thêm khách hàng'}
      submitLabel={customer ? 'Lưu' : 'Thêm'}
      width={640}
      draft={{ values: form.values }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={form.fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <Grid columns={{ minWidth: 220, max: 2 }} gap={3}>
        <TextInput
          label="Tên khách hàng"
          value={form.values.name}
          onChange={(value) => form.setField('name', value)}
          isRequired
          status={form.fieldStatuses.name}
          statusVariant="tooltip"
        />
        {OPTIONAL_FIELDS.map((field) => (
          <TextInput
            key={field.key}
            label={field.label}
            value={form.values[field.key]}
            onChange={(value) => form.setField(field.key, value)}
            isOptional
            status={form.fieldStatuses[field.key]}
            statusVariant="tooltip"
          />
        ))}
        <TextInput
          label="Địa chỉ"
          value={form.values.address}
          onChange={(value) => form.setField('address', value)}
          isOptional
          status={form.fieldStatuses.address}
          statusVariant="tooltip"
        />
      </Grid>
      <TextArea
        label="Ghi chú"
        value={form.values.note}
        onChange={(value) => form.setField('note', value)}
        isOptional
        maxLength={1000}
        status={form.fieldStatuses.note}
        statusVariant="tooltip"
      />
    </FormDialog>
  );
}
