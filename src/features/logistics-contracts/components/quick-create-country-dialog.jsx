'use client';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { useCountryForm } from '../hooks/use-country-form.js';
import { CountryFields } from './country-fields.jsx';

/**
 * Quick-create Country from a picker. Enter submits this independent child form only.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   onCreated: (country: import('../types/index.js').Country) => void,
 * }} props
 */
export function QuickCreateCountryDialog({ isOpen, onOpenChange, onCreated }) {
  const form = useCountryForm({
    onSuccess: (country) => {
      onCreated(country);
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
