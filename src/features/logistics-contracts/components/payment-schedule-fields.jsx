'use client';

import { DateInput } from '@astryxdesign/core/DateInput';
import { Selector } from '@astryxdesign/core/Selector';
import { TextArea } from '@astryxdesign/core/TextArea';
import { VStack } from '@astryxdesign/core/VStack';

import { FormGrid } from '@/shared/components/form-grid.jsx';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';

import { paymentTypeOptions } from '../config/payment-schedule-types.js';

/**
 * `PaymentSchedule` field-set. `paymentNumber`/`paymentCode` are
 * backend-assigned and never editable, so they have no fields here — shown
 * read-only in the dialog header when editing (see
 * `PaymentScheduleFormDialog`).
 * @param {{
 *   values: import('../types/index.js').PaymentScheduleFormValues,
 *   setField: <K extends keyof import('../types/index.js').PaymentScheduleFormValues>(field: K, value: import('../types/index.js').PaymentScheduleFormValues[K]) => void,
 *   fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 * }} props
 */
export function PaymentScheduleFields({ values, setField, fieldStatuses }) {
  return (
    <VStack gap={4} hAlign="stretch">
      <FormGrid>
        <DateInput
          label="Ngày thanh toán"
          value={
            /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
              values.paymentDate
            )
          }
          onChange={(value) => setField('paymentDate', value ?? '')}
          format={formatDateInputValue}
          isRequired
          status={fieldStatuses.paymentDate}
          statusVariant="tooltip"
        />
        <FormattedNumberTextInput
          label="Giá trị"
          value={values.amount}
          onChange={(value) => setField('amount', value)}
          isRequired
          status={fieldStatuses.amount}
          statusVariant="tooltip"
        />
      </FormGrid>

      <Selector
        label="Loại thanh toán"
        placeholder="Chọn loại thanh toán"
        value={values.type}
        onChange={(value) =>
          setField(
            'type',
            /** @type {import('../types/index.js').PaymentType | ''} */ (
              value ?? ''
            ),
          )
        }
        options={paymentTypeOptions}
        isRequired
        status={fieldStatuses.type}
        statusVariant="tooltip"
      />

      <TextArea
        label="Ghi chú"
        value={values.note}
        onChange={(value) => setField('note', value)}
        isOptional
        maxLength={2000}
        status={fieldStatuses.note}
        statusVariant="tooltip"
      />
    </VStack>
  );
}
