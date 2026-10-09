'use client';

import { DateInput } from '@astryxdesign/core/DateInput';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

import { MetaFormCard } from '@/shared/components/custom/meta/index.js';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';

import {
  PAYMENT_KIND_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from '../config/child-schemas.js';
import { formatVnd, subInstallmentAmount } from '../config/money.js';

/** @typedef {import('../types/index.js').AccountingSubInstallmentFormValues} SubValues */

/**
 * One sub-instalment's fields; the amount of a percent payment is shown as
 * computed from the contract value after tax.
 * @param {{
 *   values: SubValues,
 *   onChange: <K extends keyof SubValues>(field: K, value: SubValues[K]) => void,
 *   fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 *   statusPrefix?: string,
 *   valueAfterTax: number,
 * }} props
 */
export function SubInstallmentFields({
  values,
  onChange,
  fieldStatuses,
  statusPrefix = '',
  valueAfterTax,
}) {
  const isPercent = values.kind === 'Percent';
  const status = (/** @type {string} */ field) =>
    fieldStatuses[`${statusPrefix}${field}`];

  return (
    <VStack gap={3} hAlign="stretch">
      <Grid columns={{ minWidth: 220, max: 2 }} gap={3}>
        <Selector
          label="Loại thanh toán"
          value={values.kind}
          onChange={(value) =>
            onChange(
              'kind',
              /** @type {import('../types/index.js').PaymentKind} */ (
                value ?? 'Percent'
              ),
            )
          }
          options={PAYMENT_KIND_OPTIONS}
          isRequired
        />
        {isPercent ? (
          <FormattedNumberTextInput
            label="Tỷ lệ"
            value={values.percent}
            onChange={(value) => onChange('percent', value)}
            units="%"
            isRequired
            status={status('percent')}
          />
        ) : (
          <FormattedNumberTextInput
            label="Giá trị thanh toán"
            value={values.amount}
            onChange={(value) => onChange('amount', value)}
            units="VND"
            isRequired
            status={status('amount')}
          />
        )}
        <Selector
          label="Trạng thái"
          value={values.status}
          onChange={(value) =>
            onChange(
              'status',
              /** @type {import('../types/index.js').PaymentStatus} */ (
                value ?? 'Planned'
              ),
            )
          }
          options={PAYMENT_STATUS_OPTIONS}
          isRequired
        />
        <DateInput
          label="Ngày thanh toán"
          value={
            /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
              values.paymentDate
            )
          }
          onChange={(value) => onChange('paymentDate', value ?? '')}
          format={formatDateInputValue}
          isOptional
        />
      </Grid>
      <Grid columns={{ minWidth: 220, max: 2 }} gap={3}>
        <TextInput
          label="Điều kiện thanh toán"
          value={values.condition}
          onChange={(value) => onChange('condition', value)}
          isOptional
          status={status('condition')}
          statusVariant="tooltip"
        />
        <TextInput
          label="Ghi chú"
          value={values.note}
          onChange={(value) => onChange('note', value)}
          isOptional
          status={status('note')}
          statusVariant="tooltip"
        />
      </Grid>
      <MetaFormCard>
        <HStack hAlign="between" gap={3} wrap="wrap">
          <Text color="secondary">
            {isPercent
              ? `Số tiền · ${values.percent ?? 0}% giá trị sau thuế`
              : 'Số tiền thanh toán'}
          </Text>
          <Text weight="bold" color="accent" hasTabularNumbers>
            {formatVnd(
              subInstallmentAmount(
                values.kind,
                values.percent,
                values.amount,
                valueAfterTax,
              ),
            )}{' '}
            VND
          </Text>
        </HStack>
      </MetaFormCard>
    </VStack>
  );
}
