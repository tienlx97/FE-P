'use client';

import { Truck } from 'lucide-react';

import { useSupplierForm } from '../hooks/use-supplier-form.js';
import { PartyFormDrawer } from './party-form-drawer.jsx';
import { PartyFormFields } from './party-form-fields.jsx';

/**
 * Meta create / edit drawer for a supplier (replaced `SupplierFormDialog`):
 * `useSupplierForm` in `PartyFormDrawer`, with every group of
 * `PartyFormFields` as a boxed section card.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   supplier?: import('../types/index.js').Supplier | null,
 *   onSuccess?: (supplier: import('../types/index.js').Supplier) => void,
 * }} props
 */
export function SupplierFormDrawer({
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

  function close() {
    form.reset();
    onOpenChange(false);
  }

  return (
    <PartyFormDrawer
      isOpen={isOpen}
      onClose={close}
      title={supplier ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
      icon={Truck}
      code={supplier?.profile?.code || undefined}
      submitLabel={supplier ? 'Lưu thay đổi' : 'Thêm nhà cung cấp'}
      submitError={form.submitError}
      isSubmitting={form.isSubmitting}
      onSubmit={form.handleSubmit}
    >
      <PartyFormFields kind="supplier" form={form} layout="sections" />
    </PartyFormDrawer>
  );
}
