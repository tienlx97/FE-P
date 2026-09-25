'use client';

import { Grid } from '@astryxdesign/core/Grid';
import { Selector } from '@astryxdesign/core/Selector';
import { VStack } from '@astryxdesign/core/VStack';

import { TextInput } from '@/shared/components/text-input.jsx';

/**
 * `Port` ("Cảng đến") field-set: country, UN/LOCODE, short and long name.
 * @param {{
 *   values: import('../types/index.js').PortFormValues,
 *   setField: (field: keyof import('../types/index.js').PortFormValues, value: string) => void,
 *   fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 *   countries: import('../types/index.js').Country[],
 *   isCountryFixed?: boolean,
 * }} props
 */
export function PortFields({
  values,
  setField,
  fieldStatuses,
  countries,
  isCountryFixed = false,
}) {
  return (
    <VStack gap={3} hAlign="stretch">
      <Selector
        label="Nước"
        hasSearch
        placeholder="Chọn nước"
        value={values.countryId}
        onChange={(value) => setField('countryId', value ?? '')}
        options={countries.map((country) => ({
          value: country.id,
          label: country.code
            ? `${country.name} (${country.code})`
            : country.name,
        }))}
        isDisabled={isCountryFixed}
        isRequired
        status={fieldStatuses.countryId}
        statusVariant="tooltip"
        width="100%"
      />
      <Grid columns={{ minWidth: 160, max: 2 }} gap={3}>
        <TextInput
          label="Mã cảng (UN/LOCODE)"
          placeholder="VD: VNCLI"
          value={values.code}
          onChange={(value) => setField('code', value.slice(0, 5))}
          isRequired
          status={fieldStatuses.code}
          statusVariant="tooltip"
        />
        <TextInput
          label="Tên ngắn"
          placeholder="VD: Cát Lái"
          value={values.name}
          onChange={(value) => setField('name', value)}
          isRequired
          status={fieldStatuses.name}
          statusVariant="tooltip"
        />
      </Grid>
      <TextInput
        label="Tên đầy đủ"
        placeholder="VD: Cảng Cát Lái, TP. Hồ Chí Minh"
        value={values.fullName}
        onChange={(value) => setField('fullName', value)}
        isOptional
        status={fieldStatuses.fullName}
        statusVariant="tooltip"
      />
    </VStack>
  );
}
