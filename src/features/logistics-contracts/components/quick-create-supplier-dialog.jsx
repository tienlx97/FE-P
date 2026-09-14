'use client';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { useSupplierForm } from '../hooks/use-supplier-form.js';
import { PartyFormFields } from './party-form-fields.jsx';

/** @param {{isOpen: boolean, onOpenChange: (open: boolean) => void, onCreated: (supplier: any) => void}} props */
export function QuickCreateSupplierDialog({ isOpen, onOpenChange, onCreated }) {
  const form = useSupplierForm({ onSuccess: (supplier) => { onCreated(supplier); onOpenChange(false); } });
  return (
    <FormDialog isOpen={isOpen} onOpenChange={onOpenChange} title="Thêm nhà cung cấp" submitLabel="Thêm" width={600} draft={{ values: form.values }} isSubmitting={form.isSubmitting} submitError={form.submitError} fieldStatuses={form.fieldStatuses} onSubmit={form.handleSubmit}>
      <PartyFormFields kind="supplier" form={form} compact />
    </FormDialog>
  );
}
