'use client';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { usePlaceForm } from '../hooks/use-place-form.js';
import { PlaceFields } from './place-fields.jsx';

/**
 * Quick-create Place from contract pickers. Seeds the selected country on every opening and uses an independent child form.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   countries: import('../types/index.js').Country[],
 *   countryId?: string,
 *   onCreated: (place: import('../types/index.js').Place) => void,
 * }} props
 */
export function QuickCreatePlaceDialog({
  isOpen,
  onOpenChange,
  countries,
  countryId,
  onCreated,
}) {
  const form = usePlaceForm({
    countryId,
    // Re-seeds `values.countryId` from the latest `countryId` prop every
    // time this dialog opens — see the `isOpen` param's doc comment in
    // `usePlaceForm`. This dialog stays mounted and is opened by its
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
        isCountryFixed={Boolean(countryId)}
      />
    </FormDialog>
  );
}
