'use client';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { useCustomerForm } from '../hooks/use-customer-form.js';
import { CustomerFields } from './customer-fields.jsx';

/**
 * Quick-create Customer from a contract picker. FormDialog portals an independent form and isolates submission from the parent.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   onCreated: (customer: import('../types/index.js').Customer) => void,
 * }} props
 */
export function QuickCreateCustomerDialog({ isOpen, onOpenChange, onCreated }) {
  const form = useCustomerForm({
    onSuccess: (customer) => {
      onCreated(customer);
      onOpenChange(false);
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
      title="Thêm khách hàng"
      submitLabel="Thêm"
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
