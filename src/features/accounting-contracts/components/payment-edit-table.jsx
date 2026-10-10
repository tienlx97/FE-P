'use client';

import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { DateInput } from '@astryxdesign/core/DateInput';
import { Divider } from '@astryxdesign/core/Divider';
import { Grid, GridSpan } from '@astryxdesign/core/Grid';
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
  PAYMENT_KIND_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from '../config/child-schemas.js';
import { formatVnd, subInstallmentValues } from '../config/money.js';

/** @typedef {import('../types/index.js').AccountingSubInstallmentFormValues} Values */

/**
 * One payment (lần thanh toán) as a card: the code and the computed values
 * before / after tax on top, then the editable fields — kind / value / tax /
 * status / date on one row, actual paid amount, condition and note below.
 * @param {{ row: { id: string, code: string, values: Values }, index: number,
 * contractValueBeforeTax: number,
 * onChange: <K extends keyof Values>(index: number, field: K, value: Values[K]) => void,
 * status: (field: string) => { type: 'error', message: string } | undefined,
 * onRemove?: (index: number) => void }} props
 */
function PaymentCard({
  row,
  index,
  contractValueBeforeTax,
  onChange,
  status,
  onRemove,
}) {
  const { code, values } = row;
  const isPercent = values.kind === 'Percent';
  const computed = subInstallmentValues(
    values.kind,
    values.percent,
    values.valueBeforeTax,
    values.taxRatePercent,
    contractValueBeforeTax,
  );
  return (
    <Card padding={4}>
      <VStack gap={4} hAlign="stretch">
        <HStack hAlign="between" vAlign="center" gap={3}>
          <HStack vAlign="center" gap={3}>
            <Text weight="bold" color="accent" size="lg">
              Lần {code}
            </Text>
            <Text color="secondary" size="sm">
              {isPercent ? 'Theo tỷ lệ' : 'Theo giá trị'}
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
        <Grid columns={10} gap={3}>
          <GridSpan columns={2}>
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
          </GridSpan>
          <GridSpan columns={2}>
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
          </GridSpan>
          <GridSpan columns={2}>
            <FormattedNumberTextInput
              label="Thuế"
              isRequired
              value={values.taxRatePercent}
              units="%"
              onChange={(v) => onChange(index, 'taxRatePercent', v)}
              status={status('taxRatePercent')}
            />
          </GridSpan>
          <GridSpan columns={2}>
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
          </GridSpan>
          <GridSpan columns={2}>
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
          </GridSpan>
          <GridSpan columns={4}>
            <FormattedNumberTextInput
              label="Giá trị thực tế thanh toán"
              value={values.actualPaidAmount}
              units="VND"
              onChange={(v) => onChange(index, 'actualPaidAmount', v)}
              status={status('actualPaidAmount')}
            />
          </GridSpan>
          <GridSpan columns={3}>
            <TextArea
              label="Điều kiện thanh toán"
              placeholder="Điều kiện, hồ sơ cần hoàn tất…"
              rows={2}
              value={values.condition}
              onChange={(v) => onChange(index, 'condition', v)}
              maxLength={1000}
              isOptional
              status={status('condition')}
            />
          </GridSpan>
          <GridSpan columns={3}>
            <TextArea
              label="Ghi chú"
              placeholder="Nhập ghi chú…"
              rows={2}
              value={values.note}
              onChange={(v) => onChange(index, 'note', v)}
              maxLength={1000}
              isOptional
              status={status('note')}
            />
          </GridSpan>
        </Grid>
      </VStack>
    </Card>
  );
}

/**
 * Editable list of payments, one card each (name kept from the table it
 * replaced).
 * @param {{ rows: { id: string, code: string, values: Values }[], contractValueBeforeTax: number,
 * onChange: <K extends keyof Values>(index: number, field: K, value: Values[K]) => void,
 * fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 * onRemove?: (index: number) => void, statusPrefix?: string }} props
 */
export function PaymentEditTable({
  rows,
  contractValueBeforeTax,
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
          contractValueBeforeTax={contractValueBeforeTax}
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
