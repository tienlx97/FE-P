'use client';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { useDeliveryPlaceForm } from '../hooks/use-delivery-place-form.js';
import { DeliveryPlaceFields } from './delivery-place-fields.jsx';

/**
 * Create a delivery place from the reference-data page using the same shared frame and field set as quick creation.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   countries: import('../types/index.js').Country[],
 *   onSuccess?: () => void,
 * }} props
 */
export function DeliveryPlaceFormDialog({
  isOpen,
  onOpenChange,
  countries,
  onSuccess,
}) {
  const form = useDeliveryPlaceForm({
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
      title="Thêm nơi giao hàng"
      submitLabel="Thêm"
      width={480}
      draft={{ values: form.values }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={form.fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <DeliveryPlaceFields
        values={form.values}
        setField={form.setField}
        fieldStatuses={form.fieldStatuses}
        countries={countries}
      />
    </FormDialog>
  );
}
