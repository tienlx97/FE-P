'use client';

import { DateInput } from '@astryxdesign/core/DateInput';
import { TextArea } from '@astryxdesign/core/TextArea';
import { VStack } from '@astryxdesign/core/VStack';

import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';

/**
 * Single-`CommissionPayment` field-set, used by the "Thêm nhanh" quick-add
 * dialog (`CommissionPaymentQuickAddDialog`) — one date/amount/note entry
 * at a time, as opposed to `PaymentHistoryFields`' full editable grid
 * inside the Commission form.
 * @param {{
 *   values: import('../types/index.js').CommissionPaymentFormValues,
 *   setField: <K extends keyof import('../types/index.js').CommissionPaymentFormValues>(field: K, value: import('../types/index.js').CommissionPaymentFormValues[K]) => void,
 *   fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 *   currency?: string,
 * }} props
 */
export function CommissionPaymentFields({
  values,
  setField,
  fieldStatuses,
  currency,
}) {
  return (
    <VStack gap={4} hAlign="stretch">
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
        width="100%"
      />

      <FormattedNumberTextInput
        label="Giá trị"
        value={values.amount}
        onChange={(value) => setField('amount', value)}
        units={currency || undefined}
        isRequired
        status={fieldStatuses.amount}
        statusVariant="tooltip"
      />

      <TextArea
        label="Ghi chú"
        value={values.note}
        onChange={(value) => setField('note', value)}
        isOptional
        maxLength={500}
        status={fieldStatuses.note}
        statusVariant="tooltip"
      />
    </VStack>
  );
}
