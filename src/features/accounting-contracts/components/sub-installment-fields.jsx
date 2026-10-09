'use client';

import { DateInput } from '@astryxdesign/core/DateInput';
import { Grid } from '@astryxdesign/core/Grid';
import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';

import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';

import {
  PAYMENT_KIND_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from '../config/child-schemas.js';
import { formatVnd, subInstallmentAmount } from '../config/money.js';

/** @typedef {import('../types/index.js').AccountingSubInstallmentFormValues} SubValues */

/** @returns {SubValues} */
export function emptySubInstallment() {
  return {
    kind: 'Percent',
    percent: undefined,
    amount: undefined,
    condition: '',
    paymentDate: '',
    status: 'Planned',
    note: '',
  };
}

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
    <Grid columns={{ minWidth: 200, max: 3 }} gap={3}>
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
      <Text color="secondary">
        Giá trị thanh toán:{' '}
        <Text weight="semibold">
          {formatVnd(
            subInstallmentAmount(
              values.kind,
              values.percent,
              values.amount,
              valueAfterTax,
            ),
          )}
        </Text>
      </Text>
    </Grid>
  );
}
