'use client';

import { Truck } from 'lucide-react';

import {
  MetaFormSection,
  MetaPill,
} from '@/shared/components/custom/meta/index.js';

import { useSupplierForm } from '../hooks/use-supplier-form.js';
import { PartyFormDrawer } from './party-form-drawer.jsx';
import { PartyFormFields } from './party-form-fields.jsx';

/**
 * Quick-create Supplier from a shipment picker, as a narrow Meta drawer
 * over the shipment drawer (its submit never reaches the parent form).
 * @param {{isOpen: boolean, onOpenChange: (open: boolean) => void, onCreated: (supplier: any) => void}} props
 */
export function QuickCreateSupplierDialog({ isOpen, onOpenChange, onCreated }) {
  const form = useSupplierForm({
    onSuccess: (supplier) => {
      onCreated(supplier);
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
      title="Thêm nhanh nhà cung cấp"
      icon={Truck}
      width={560}
      submitLabel="Thêm nhà cung cấp"
      submitError={form.submitError}
      isSubmitting={form.isSubmitting}
      onSubmit={form.handleSubmit}
    >
      <MetaFormSection
        isBoxed
        title="Thông tin chung"
        meta={<MetaPill label="Bắt buộc" tone="accent" />}
      >
        <PartyFormFields kind="supplier" form={form} compact />
      </MetaFormSection>
    </PartyFormDrawer>
  );
}
