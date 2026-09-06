'use client';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { useCountryForm } from '../hooks/use-country-form.js';
import { CountryFields } from './country-fields.jsx';

/**
 * Standalone create dialog for the Countries page (`countries-list.jsx`) —
 * same field-set as `quick-create-country-dialog.jsx`, but with its own
 * `<form>` since it is not nested inside another dialog's form. Mirrors
 * `CustomerFormDialog`.
 * @param {{ isOpen: boolean, onOpenChange: (isOpen: boolean) => void, onSuccess?: () => void }} props
 */
export function CountryFormDialog({ isOpen, onOpenChange, onSuccess }) {
  const form = useCountryForm({
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
      title="Thêm nước"
      submitLabel="Thêm"
      width={480}
      draft={{ values: form.values }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={form.fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <CountryFields
        values={form.values}
        setField={form.setField}
        fieldStatuses={form.fieldStatuses}
      />
    </FormDialog>
  );
}
