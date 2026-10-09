'use client';

import { Grid } from '@astryxdesign/core/Grid';
import { Building2 } from 'lucide-react';

import { MetaFormSection } from '@/shared/components/custom/meta/index.js';
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
function CustomerFormSession({ isOpen, onOpenChange, customer }) {
  const saveMutation = useSaveCustomerMutation();
  const form = useZodForm({
    initialValues: valuesOf(customer),
    schema: customerSchema,
    submit: (values) => saveMutation.mutateAsync({ values, id: customer?.id }),
    onSuccess: () => onOpenChange(false),
  });

  return (
    <FormDialog
      variant="drawer"
      drawerIcon={Building2}
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
      <MetaFormSection
        isBoxed
        title="Thông tin khách hàng"
        isTitleUppercase={false}
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
          {OPTIONAL_FIELDS.filter((field) => field.key === 'taxCode').map(
            (field) => (
              <TextInput
                key={field.key}
                label={field.label}
                value={form.values[field.key]}
                onChange={(value) => form.setField(field.key, value)}
                isOptional
                status={form.fieldStatuses[field.key]}
                statusVariant="tooltip"
              />
            ),
          )}
          <TextInput
            label="Địa chỉ"
            value={form.values.address}
            onChange={(value) => form.setField('address', value)}
            isOptional
            status={form.fieldStatuses.address}
            statusVariant="tooltip"
          />
        </Grid>
      </MetaFormSection>
      <MetaFormSection
        isBoxed
        title="Thông tin liên hệ"
        isTitleUppercase={false}
      >
        <Grid columns={{ minWidth: 220, max: 2 }} gap={3}>
          {OPTIONAL_FIELDS.filter((field) => field.key !== 'taxCode').map(
            (field) => (
              <TextInput
                key={field.key}
                label={field.label}
                value={form.values[field.key]}
                onChange={(value) => form.setField(field.key, value)}
                isOptional
                status={form.fieldStatuses[field.key]}
              />
            ),
          )}
        </Grid>
      </MetaFormSection>
      <MetaFormSection isBoxed title="Ghi chú" isTitleUppercase={false}>
        <TextArea
          label="Ghi chú"
          value={form.values.note}
          onChange={(value) => form.setField('note', value)}
          isOptional
          maxLength={1000}
          status={form.fieldStatuses.note}
          statusVariant="tooltip"
        />
      </MetaFormSection>
    </FormDialog>
  );
}

/** @param {Parameters<typeof CustomerFormSession>[0]} props */
export function CustomerFormDialog(props) {
  return props.isOpen ? (
    <CustomerFormSession key={props.customer?.id ?? 'new'} {...props} />
  ) : null;
}
