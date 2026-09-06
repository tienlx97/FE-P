'use client';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { useBankForm } from '../hooks/use-bank-form.js';
import { BankFields } from './bank-fields.jsx';

/**
 * "+ Thêm ngân hàng" embedded in the Contract form's Ngân hàng section.
 * Uses the shared independent form frame for nested creation.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   onCreated: (bank: import('../types/index.js').ContractBank) => void,
 * }} props
 */
export function QuickCreateBankDialog({ isOpen, onOpenChange, onCreated }) {
  const form = useBankForm({
    onSuccess: (bank) => {
      onCreated(bank);
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
      title="Thêm ngân hàng"
      submitLabel="Thêm"
      width={600}
      draft={{ values: form.values, extraFieldRows: form.extraFieldRows.rows }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={form.fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <BankFields
        values={form.values}
        setField={form.setField}
        fieldStatuses={form.fieldStatuses}
        extraFieldRows={form.extraFieldRows}
      />
    </FormDialog>
  );
}
