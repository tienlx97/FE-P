'use client';

import { TextInput } from '@astryxdesign/core/TextInput';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { useShipmentCostCategoryForm } from '../hooks/use-shipment-cost-category-form.js';

/**
 * "+ Thêm nhóm chi phí" opened from the cost-lines row's category Selector
 * in `shipment-cost-lines-fields.jsx` — mirrors `QuickCreateCountryDialog`.
 * Uses the shared independent form frame for nested creation.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   onCreated: (costCategory: import('../types/index.js').ShipmentCostCategory) => void,
 * }} props
 */
export function QuickCreateShipmentCostCategoryDialog({
  isOpen,
  onOpenChange,
  onCreated,
}) {
  const form = useShipmentCostCategoryForm({
    onSuccess: (costCategory) => {
      onCreated(costCategory);
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
      title="Thêm nhóm chi phí"
      submitLabel="Thêm"
      width={480}
      draft={{ values: form.values }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={form.fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <TextInput
        label="Tên nhóm chi phí"
        placeholder="Ví dụ: Trucking, O/F, Customs"
        value={form.values.name}
        onChange={(value) => form.setField('name', value)}
        isRequired
        status={form.fieldStatuses.name}
        statusVariant="tooltip"
      />
    </FormDialog>
  );
}
