'use client';

import { Building2 } from 'lucide-react';

import {
  MetaFormSection,
  MetaPill,
} from '@/shared/components/custom/meta/index.js';

import { useCustomerForm } from '../hooks/use-customer-form.js';
import { CustomerFields } from './customer-fields.jsx';
import { PartyFormDrawer } from './party-form-drawer.jsx';

/**
 * Quick-create Customer from a contract picker, as a narrow Meta drawer
 * over the contract drawer (its submit never reaches the parent form).
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

  function close() {
    form.reset();
    onOpenChange(false);
  }

  return (
    <PartyFormDrawer
      isOpen={isOpen}
      onClose={close}
      title="Thêm nhanh khách hàng"
      icon={Building2}
      width={560}
      submitLabel="Thêm khách hàng"
      submitError={form.submitError}
      isSubmitting={form.isSubmitting}
      onSubmit={form.handleSubmit}
    >
      <MetaFormSection
        isBoxed
        title="Thông tin chung"
        meta={<MetaPill label="Bắt buộc" tone="accent" />}
      >
        <CustomerFields
          values={form.values}
          setField={form.setField}
          fieldStatuses={form.fieldStatuses}
          extraFieldRows={form.extraFieldRows}
        />
      </MetaFormSection>
    </PartyFormDrawer>
  );
}
