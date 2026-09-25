'use client';

import { Grid } from '@astryxdesign/core/Grid';

import { TextInput } from '@/shared/components/text-input.jsx';

/**
 * `Country` catalog field-set (contract country) — `Name` plus the optional
 * ISO 3166-1 alpha-2 `Code` (prefix of its ports' UN/LOCODEs).
 * @param {{
 *   values: import('../types/index.js').CountryFormValues,
 *   setField: (field: keyof import('../types/index.js').CountryFormValues, value: string) => void,
 *   fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 * }} props
 */
export function CountryFields({ values, setField, fieldStatuses }) {
  return (
    <Grid columns={{ minWidth: 120, max: 2 }} gap={3}>
      <TextInput
        label="Tên nước"
        value={values.name}
        onChange={(value) => setField('name', value)}
        isRequired
        status={fieldStatuses.name}
        statusVariant="tooltip"
      />
      <TextInput
        label="Mã nước (ISO)"
        placeholder="VD: VN"
        value={values.code}
        onChange={(value) => setField('code', value.toUpperCase().slice(0, 2))}
        isOptional
        status={fieldStatuses.code}
        statusVariant="tooltip"
      />
    </Grid>
  );
}
