'use client';

import { TextInput } from '@/shared/components/text-input.jsx';

/**
 * `Country` catalog field-set (contract country) — just a `Name`, mirrors
 * the shape of `CustomerFields`/`SellerFields` minus the extra fields.
 * @param {{
 *   values: import('../types/index.js').CountryFormValues,
 *   setField: (field: keyof import('../types/index.js').CountryFormValues, value: string) => void,
 *   fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 * }} props
 */
export function CountryFields({ values, setField, fieldStatuses }) {
  return (
    <TextInput
      label="Tên nước"
      value={values.name}
      onChange={(value) => setField('name', value)}
      isRequired
      status={fieldStatuses.name}
      statusVariant="tooltip"
    />
  );
}
