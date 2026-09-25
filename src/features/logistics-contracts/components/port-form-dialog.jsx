'use client';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { usePortForm } from '../hooks/use-port-form.js';
import { PortFields } from './port-fields.jsx';

/**
 * Create a port ("Cảng đến") from the reference-data page using the same shared frame and field set as quick creation.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   countries: import('../types/index.js').Country[],
 *   onSuccess?: () => void,
 * }} props
 */
export function PortFormDialog({ isOpen, onOpenChange, countries, onSuccess }) {
  const form = usePortForm({
    countries,
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
      title="Thêm cảng đến"
      submitLabel="Thêm"
      width={560}
      draft={{ values: form.values }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={form.fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <PortFields
        values={form.values}
        setField={form.setField}
        fieldStatuses={form.fieldStatuses}
        countries={countries}
      />
    </FormDialog>
  );
}
