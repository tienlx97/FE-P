'use client';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { useCustomerForm } from '../hooks/use-customer-form.js';
import { CustomerFields } from './customer-fields.jsx';

/**
 * Create/edit dialog for the Customers page (`customers-list.jsx`) — same
 * field-set as `quick-create-customer-dialog.jsx`, but with its own
 * `<form>` since it is not nested inside another dialog's form. Pass
 * `customer` to edit an existing one; omit it to create a new one.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   customer?: import('../types/index.js').Customer | null,
 *   onSuccess?: (customer: import('../types/index.js').Customer) => void,
 * }} props
 */
export function CustomerFormDialog({
  isOpen,
  onOpenChange,
  customer = null,
  onSuccess,
}) {
  const form = useCustomerForm({
    customer,
    onSuccess: (savedCustomer) => {
      onOpenChange(false);
      onSuccess?.(savedCustomer);
    },
  });

  /** @param {boolean} nextIsOpen */
  function handleOpenChange(nextIsOpen) {
    if (!nextIsOpen) form.reset();
    onOpenChange(nextIsOpen);
  }

  return (
    <FormDialog
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title={customer ? 'Sửa khách hàng' : 'Thêm khách hàng'}
      submitLabel={customer ? 'Lưu thay đổi' : 'Thêm'}
      width={600}
      draft={{ values: form.values, extraFieldRows: form.extraFieldRows.rows }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={form.fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <CustomerFields
        values={form.values}
        setField={form.setField}
        fieldStatuses={form.fieldStatuses}
        extraFieldRows={form.extraFieldRows}
      />
    </FormDialog>
  );
}
