'use client';

import { Building2 } from 'lucide-react';

import { useCustomerForm } from '../hooks/use-customer-form.js';
import { PartyFormDrawer } from './party-form-drawer.jsx';
import { PartyFormFields } from './party-form-fields.jsx';

/**
 * Meta create / edit drawer for a customer (replaced `CustomerFormDialog`):
 * `useCustomerForm` in `PartyFormDrawer`, with every group of
 * `PartyFormFields` as a boxed section card.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   customer?: import('../types/index.js').Customer | null,
 *   onSuccess?: (customer: import('../types/index.js').Customer) => void,
 * }} props
 */
export function CustomerFormDrawer({
  isOpen,
  onOpenChange,
  customer = null,
  onSuccess,
}) {
  const form = useCustomerForm({
    customer,
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
      title={customer ? 'Sửa khách hàng' : 'Thêm khách hàng'}
      icon={Building2}
      code={customer?.profile?.code || undefined}
      submitLabel={customer ? 'Lưu thay đổi' : 'Thêm khách hàng'}
      submitError={form.submitError}
      isSubmitting={form.isSubmitting}
      onSubmit={form.handleSubmit}
    >
      <PartyFormFields kind="customer" form={form} layout="sections" />
    </PartyFormDrawer>
  );
}
