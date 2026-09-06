'use client';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { useSellerForm } from '../hooks/use-seller-form.js';
import { SellerFields } from './seller-fields.jsx';

/**
 * Quick-create Seller from a contract picker. FormDialog portals an independent form and isolates submission from the parent.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   onCreated: (seller: import('../types/index.js').Seller) => void,
 * }} props
 */
export function QuickCreateSellerDialog({ isOpen, onOpenChange, onCreated }) {
  const form = useSellerForm({
    onSuccess: (seller) => {
      onCreated(seller);
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
      title="Thêm bên bán"
      submitLabel="Thêm"
      width={600}
      draft={{ values: form.values, extraFieldRows: form.extraFieldRows.rows }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={form.fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <SellerFields
        values={form.values}
        setField={form.setField}
        fieldStatuses={form.fieldStatuses}
        extraFieldRows={form.extraFieldRows}
      />
    </FormDialog>
  );
}
