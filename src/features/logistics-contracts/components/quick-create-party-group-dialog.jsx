'use client';

import { TextInput } from '@astryxdesign/core/TextInput';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { usePartyGroupForm } from '../hooks/use-party-group-form.js';

/**
 * "+" opened from the "Nhóm khách hàng"/"Nhóm nhà cung cấp" Selector in
 * `party-form-fields.jsx` — mirrors `QuickCreateShipmentCostCategoryDialog`.
 * @param {{
 *   kind: 'customer' | 'supplier',
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   onCreated: (group: import('../types/index.js').PartyLookup) => void,
 * }} props
 */
export function QuickCreatePartyGroupDialog({
  kind,
  isOpen,
  onOpenChange,
  onCreated,
}) {
  const noun = kind === 'customer' ? 'khách hàng' : 'nhà cung cấp';
  const form = usePartyGroupForm({
    kind,
    onSuccess: (group) => {
      onCreated(group);
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
      title={`Thêm nhóm ${noun}`}
      submitLabel="Thêm"
      width={480}
      draft={{ values: form.values }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={form.fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <TextInput
        label={`Tên nhóm ${noun}`}
        value={form.values.name}
        onChange={(value) => form.setField('name', value)}
        isRequired
        status={form.fieldStatuses.name}
        statusVariant="tooltip"
      />
    </FormDialog>
  );
}
