'use client';

import { Grid } from '@astryxdesign/core/Grid';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { Selector } from '@astryxdesign/core/Selector';
import { VStack } from '@astryxdesign/core/VStack';

import { TextInput } from '@/shared/components/text-input.jsx';

/** Example names per kind, as input placeholders. */
const PLACEHOLDERS = {
  Port: { name: 'VD: Cát Lái', fullName: 'VD: Cảng Cát Lái, TP. Hồ Chí Minh' },
  Facility: {
    name: 'VD: Nhà máy Tân Uyên',
    fullName: 'VD: Nhà máy ABC, KCN Tân Uyên, Bình Dương',
  },
  Depot: {
    name: 'VD: ICD Phước Long',
    fullName: 'VD: ICD Phước Long, Thủ Đức, TP. Hồ Chí Minh',
  },
};

/**
 * `Port` field-set: kind (cảng / nhà máy-kho / depot), country, UN/LOCODE (ports
 * only), short and long name.
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
      <SegmentedControl
        label="Loại"
        value={values.kind}
        onChange={(value) => setField('kind', value)}
      >
        <SegmentedControlItem value="Port" label="Cảng" />
        <SegmentedControlItem value="Facility" label="Nhà máy / Kho" />
        <SegmentedControlItem value="Depot" label="Depot cont rỗng" />
      </SegmentedControl>
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
        {values.kind === 'Port' && (
          <TextInput
            label="Mã cảng (UN/LOCODE)"
            placeholder="VD: VNCLI"
            value={values.code}
            onChange={(value) => setField('code', value.slice(0, 5))}
            isRequired
            status={fieldStatuses.code}
            statusVariant="tooltip"
          />
        )}
        <TextInput
          label="Tên ngắn"
          placeholder={
            PLACEHOLDERS[values.kind].name
          }
          value={values.name}
          onChange={(value) => setField('name', value)}
          isRequired
          status={fieldStatuses.name}
          statusVariant="tooltip"
        />
      </Grid>
      <TextInput
        label="Tên đầy đủ"
        placeholder={
          PLACEHOLDERS[values.kind].fullName
        }
        value={values.fullName}
        onChange={(value) => setField('fullName', value)}
        isOptional
        status={fieldStatuses.fullName}
        statusVariant="tooltip"
      />
    </VStack>
  );
}
