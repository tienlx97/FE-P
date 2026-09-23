'use client';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { useSupplierForm } from '../hooks/use-supplier-form.js';
import { PartyFormFields } from './party-form-fields.jsx';

/** @param {{isOpen: boolean, onOpenChange: (open: boolean) => void, supplier?: any, onSuccess?: (supplier: any) => void}} props */
export function SupplierFormDialog({
  isOpen,
  onOpenChange,
  supplier = null,
  onSuccess,
}) {
  const form = useSupplierForm({
    supplier,
    onSuccess: (saved) => {
      onOpenChange(false);
      onSuccess?.(saved);
    },
  });
  /** @param {boolean} next */
  function handleOpenChange(next) {
    if (!next) form.reset();
    onOpenChange(next);
  }
  return (
    <FormDialog
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title={supplier ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
      submitLabel={supplier ? 'Lưu thay đổi' : 'Thêm'}
      width={1040}
      draft={{
        values: form.values,
        extraFieldRows: form.extraFieldRows.rows,
        bankAccounts: form.bankAccounts,
        deliveryAddresses: form.deliveryAddresses,
      }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={form.fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <PartyFormFields kind="supplier" form={form} />
    </FormDialog>
  );
}
