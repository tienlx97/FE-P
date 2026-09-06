'use client';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { usePlaceForm } from '../hooks/use-place-form.js';
import { PlaceFields } from './place-fields.jsx';

/**
 * Create a Place from the reference-data page using the same shared frame and field set as quick creation.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   countries: import('../types/index.js').Country[],
 *   onSuccess?: () => void,
 * }} props
 */
export function PlaceFormDialog({
  isOpen,
  onOpenChange,
  countries,
  onSuccess,
}) {
  const form = usePlaceForm({
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
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
      title="Thêm cảng / nơi đến"
      submitLabel="Thêm"
      width={480}
      draft={{ values: form.values }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={form.fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <PlaceFields
        values={form.values}
        setField={form.setField}
        fieldStatuses={form.fieldStatuses}
        countries={countries}
      />
    </FormDialog>
  );
}
