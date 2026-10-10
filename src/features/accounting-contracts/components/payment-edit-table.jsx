'use client';

import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { DateInput } from '@astryxdesign/core/DateInput';
import { Divider } from '@astryxdesign/core/Divider';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Trash2 } from 'lucide-react';

import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';

import {
  labelOf,
  PAYMENT_KIND_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  PERCENT_BASIS_OPTIONS,
} from '../config/child-schemas.js';
import { formatVnd, subInstallmentValues } from '../config/money.js';
import { TypedValueInput } from './typed-value-input.jsx';

/** @typedef {import('../types/index.js').AccountingSubInstallmentFormValues} Values */

/**
 * One payment (lần thanh toán) as a card: the code and the computed values
 * before / after tax on top, then the editable fields — kind / value / basis
 * (percent only) / tax, then status / date / actual paid amount, condition
 * and note below.
 * @param {{ row: { id: string, code: string, values: Values }, index: number,
 * contract: { valueBeforeTax: number, valueAfterTax: number },
 * onChange: <K extends keyof Values>(index: number, field: K, value: Values[K]) => void,
 * status: (field: string) => { type: 'error', message: string } | undefined,
 * onRemove?: (index: number) => void }} props
 */
function PaymentCard({ row, index, contract, onChange, status, onRemove }) {
  const { code, values } = row;
  const isPercent = values.kind === 'Percent';
  const computed = subInstallmentValues(values, contract);
  return (
    <Card padding={5}>
      <VStack gap={5} hAlign="stretch">
        <HStack hAlign="between" vAlign="center" gap={3}>
          <HStack vAlign="center" gap={3}>
            <Text weight="bold" color="accent" size="lg">
              Lần {code}
            </Text>
            <Text color="secondary" size="sm">
              {isPercent
                ? `Theo tỷ lệ ${labelOf(PERCENT_BASIS_OPTIONS, values.percentBasis).toLowerCase()}`
                : 'Theo giá trị'}
            </Text>
          </HStack>
          <HStack vAlign="center" gap={3}>
            <VStack gap={0} hAlign="end">
              <Text color="secondary" size="sm">
                Trước thuế (VND)
              </Text>
              <Text hasTabularNumbers>{formatVnd(computed.beforeTax)}</Text>
            </VStack>
            <VStack gap={0} hAlign="end">
              <Text color="secondary" size="sm">
                Sau thuế (VND)
              </Text>
              <Text weight="bold" size="lg" hasTabularNumbers>
                {formatVnd(computed.afterTax)}
              </Text>
            </VStack>
            {onRemove ? (
              <Button
                label={`Xoá lần ${code}`}
                isIconOnly
                icon={<Icon icon={Trash2} size="sm" />}
                variant="ghost"
                onClick={() => onRemove(index)}
              />
            ) : null}
          </HStack>
        </HStack>
        <Divider />
        <VStack gap={2} hAlign="stretch">
          <Text color="secondary" size="sm" weight="semibold">
            Giá trị
          </Text>
          <Grid columns={isPercent ? 4 : 3} gap={4}>
            <Selector
              label="Hình thức"
              value={values.kind}
              options={PAYMENT_KIND_OPTIONS}
              onChange={(v) =>
                onChange(
                  index,
                  'kind',
                  /** @type {Values['kind']} */ (v ?? 'Percent'),
                )
              }
            />
            <FormattedNumberTextInput
              label={isPercent ? 'Tỷ lệ' : 'Giá trị trước thuế'}
              isRequired
              value={isPercent ? values.percent : values.valueBeforeTax}
              units={isPercent ? '%' : 'VND'}
              onChange={(v) =>
                onChange(index, isPercent ? 'percent' : 'valueBeforeTax', v)
              }
              status={status(isPercent ? 'percent' : 'valueBeforeTax')}
            />
            {isPercent ? (
              <Selector
                label="Tính trên"
                value={values.percentBasis}
                options={PERCENT_BASIS_OPTIONS}
                onChange={(v) =>
                  onChange(
                    index,
                    'percentBasis',
                    /** @type {Values['percentBasis']} */ (v ?? 'BeforeTax'),
                  )
                }
              />
            ) : null}
            <FormattedNumberTextInput
              label="Thuế"
              isRequired
              value={values.taxRatePercent}
              units="%"
              onChange={(v) => onChange(index, 'taxRatePercent', v)}
              status={status('taxRatePercent')}
            />
          </Grid>
        </VStack>
        <Grid columns={2} gap={4}>
          {isPercent ? (
            <TypedValueInput
              label="Giá trị trước thuế"
              computed={computed.auto.beforeTax}
              typed={values.valueBeforeTax}
              onChange={(v) => onChange(index, 'valueBeforeTax', v)}
              status={status('valueBeforeTax')}
            />
          ) : null}
          <TypedValueInput
            label="Giá trị sau thuế"
            computed={computed.auto.afterTax}
            typed={values.valueAfterTax}
            onChange={(v) => onChange(index, 'valueAfterTax', v)}
            status={status('valueAfterTax')}
          />
        </Grid>
        <VStack gap={2} hAlign="stretch">
          <Text color="secondary" size="sm" weight="semibold">
            Thanh toán
          </Text>
          <Grid columns={3} gap={4}>
            <Selector
              label="Trạng thái"
              value={values.status}
              options={PAYMENT_STATUS_OPTIONS}
              onChange={(v) =>
                onChange(
                  index,
                  'status',
                  /** @type {Values['status']} */ (v ?? 'Planned'),
                )
              }
            />
            <DateInput
              label="Ngày thanh toán"
              value={
                /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
                  values.paymentDate
                )
              }
              format={formatDateInputValue}
              onChange={(v) => onChange(index, 'paymentDate', v ?? '')}
              isOptional
            />
            <FormattedNumberTextInput
              label="Giá trị thực tế thanh toán"
              value={values.actualPaidAmount}
              units="VND"
              onChange={(v) => onChange(index, 'actualPaidAmount', v)}
              status={status('actualPaidAmount')}
            />
          </Grid>
        </VStack>
        <VStack gap={2} hAlign="stretch">
          <Text color="secondary" size="sm" weight="semibold">
            Điều kiện và ghi chú
          </Text>
          <Grid columns={2} gap={4}>
            <TextArea
              label="Điều kiện thanh toán"
              placeholder="Điều kiện, hồ sơ cần hoàn tất…"
              rows={3}
              value={values.condition}
              onChange={(v) => onChange(index, 'condition', v)}
              maxLength={1000}
              isOptional
              status={status('condition')}
            />
            <TextArea
              label="Ghi chú"
              placeholder="Nhập ghi chú…"
              rows={3}
              value={values.note}
              onChange={(v) => onChange(index, 'note', v)}
              maxLength={1000}
              isOptional
              status={status('note')}
            />
          </Grid>
        </VStack>
      </VStack>
    </Card>
  );
}

/**
 * Editable list of payments, one card each (name kept from the table it
 * replaced).
 * @param {{ rows: { id: string, code: string, values: Values }[],
 * contract: { valueBeforeTax: number, valueAfterTax: number },
 * onChange: <K extends keyof Values>(index: number, field: K, value: Values[K]) => void,
 * fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 * onRemove?: (index: number) => void, statusPrefix?: string }} props
 */
export function PaymentEditTable({
  rows,
  contract,
  onChange,
  fieldStatuses,
  onRemove,
  statusPrefix = 'subInstallments.',
}) {
  if (rows.length === 0) {
    return <Text color="secondary">Chưa có lần thanh toán</Text>;
  }
  return (
    <VStack gap={3} hAlign="stretch">
      {rows.map((row, index) => (
        <PaymentCard
          key={row.id}
          row={row}
          index={index}
          contract={contract}
          onChange={onChange}
          onRemove={rows.length > 1 ? onRemove : undefined}
          status={(field) =>
            fieldStatuses[
              `${statusPrefix}${statusPrefix ? `${index}.` : ''}${field}`
            ]
          }
        />
      ))}
    </VStack>
  );
}
