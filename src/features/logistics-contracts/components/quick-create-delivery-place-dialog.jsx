'use client';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { useDeliveryPlaceForm } from '../hooks/use-delivery-place-form.js';
import { DeliveryPlaceFields } from './delivery-place-fields.jsx';

/**
 * Quick-create a delivery place from the contract "Nơi giao hàng" picker. Seeds the selected country on every opening and uses an independent child form.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   countries: import('../types/index.js').Country[],
 *   countryId?: string,
 *   onCreated: (place: import('../types/index.js').DeliveryPlace) => void,
 * }} props
 */
export function QuickCreateDeliveryPlaceDialog({
  isOpen,
  onOpenChange,
  countries,
  countryId,
  onCreated,
}) {
  const form = useDeliveryPlaceForm({
    countryId,
    // Re-seeds `values.countryId` from the latest `countryId` prop every
    // time this dialog opens — see the `isOpen` param's doc comment in
    // `useDeliveryPlaceForm`. This dialog stays mounted and is opened by its
    // caller flipping `isOpen` directly (an IconButton's onClick), which
    // never touches this hook, so without this the Country selector would
    // stay stuck on whatever `countryId` was true the first time this
    // component ever mounted.
    isOpen,
    onSuccess: (place) => {
      onCreated(place);
      onOpenChange(false);
    },
  });

  /** @param {boolean} open */
  function handleOpenChange(open) {
    if (!open) form.reset();
    onOpenChange(open);
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
        isCountryFixed={Boolean(countryId)}
      />
    </FormDialog>
  );
}
