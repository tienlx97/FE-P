'use client';

import { Selector } from '@astryxdesign/core/Selector';
import { VStack } from '@astryxdesign/core/VStack';

import { TextInput } from '@/shared/components/text-input.jsx';

/**
 * `Place` catalog field-set — `Name` + a `CountryId` Selector reusing the
 * Country list. `Place` is a lookup/suggestion catalog only, unrelated to
 * `placeOfLoading`/`placeOfDischarge` validation on the Contract form.
 * @param {{
 *   values: import('../types/index.js').PlaceFormValues,
 *   setField: (field: keyof import('../types/index.js').PlaceFormValues, value: string) => void,
 *   fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 *   countries: import('../types/index.js').Country[],
 *   isCountryFixed?: boolean,
 * }} props
 */
export function PlaceFields({
  values,
  setField,
  fieldStatuses,
  countries,
  isCountryFixed = false,
}) {
  return (
    <VStack gap={3} hAlign="stretch">
      <TextInput
        label="Tên cảng / nơi"
        value={values.name}
        onChange={(value) => setField('name', value)}
        isRequired
        status={fieldStatuses.name}
        statusVariant="tooltip"
      />
      <Selector
        label="Nước"
        hasSearch
        placeholder="Chọn nước"
        value={values.countryId}
        onChange={(value) => setField('countryId', value ?? '')}
        options={countries.map((country) => ({
          value: country.id,
          label: country.name,
        }))}
        isDisabled={isCountryFixed}
        isRequired
        status={fieldStatuses.countryId}
        statusVariant="tooltip"
        width="100%"
      />
    </VStack>
  );
}
