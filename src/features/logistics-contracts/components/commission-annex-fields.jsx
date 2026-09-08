'use client';

import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { DateInput } from '@astryxdesign/core/DateInput';
import { HStack } from '@astryxdesign/core/HStack';
import { Selector } from '@astryxdesign/core/Selector';
import { VStack } from '@astryxdesign/core/VStack';

import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';

import { commissionAnnexTypeOptions } from '../config/commission-annex-types.js';

/**
 * `CommissionAnnex` field-set. `annexNumber`/`annexCode` are
 * backend-assigned and never editable, so they have no fields here — shown
 * read-only in the dialog header when editing (see
 * `CommissionAnnexFormDialog`).
 * @param {{
 *   values: import('../types/index.js').CommissionAnnexFormValues,
 *   setField: <K extends keyof import('../types/index.js').CommissionAnnexFormValues>(field: K, value: import('../types/index.js').CommissionAnnexFormValues[K]) => void,
 *   fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 * }} props
 */
export function CommissionAnnexFields({ values, setField, fieldStatuses }) {
  return (
    <VStack gap={4} hAlign="stretch">
      <Selector
        label="Loại phụ lục"
        placeholder="Chọn loại phụ lục"
        value={values.type}
        onChange={(value) =>
          setField(
            'type',
            /** @type {import('../types/index.js').CommissionAnnexType | ''} */ (
              value ?? ''
            ),
          )
        }
        options={commissionAnnexTypeOptions}
        isRequired
        status={fieldStatuses.type}
        statusVariant="tooltip"
      />

      <HStack gap={3}>
        <FormattedNumberTextInput
          label="Số tiền"
          value={values.amount}
          onChange={(value) => setField('amount', value)}
          isRequired
          status={fieldStatuses.amount}
          statusVariant="tooltip"
        />
        <DateInput
          label="Ngày ký"
          value={
            /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
              values.signedDate
            )
          }
          onChange={(value) => setField('signedDate', value ?? '')}
          format={formatDateInputValue}
          isRequired
          status={fieldStatuses.signedDate}
          statusVariant="tooltip"
        />
      </HStack>

      <HStack gap={4}>
        <CheckboxInput
          label="Bên công ty đã ký"
          value={values.sellerSigned}
          onChange={(checked) => setField('sellerSigned', checked)}
        />
        <CheckboxInput
          label="Bên nhận hoa hồng đã ký"
          value={values.partySigned}
          onChange={(checked) => setField('partySigned', checked)}
        />
      </HStack>
    </VStack>
  );
}
