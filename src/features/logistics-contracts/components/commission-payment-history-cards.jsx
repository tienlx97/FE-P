'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { DateInput } from '@astryxdesign/core/DateInput';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { CirclePlus, Trash2 } from 'lucide-react';

import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { ReadOnlyLock } from '@/shared/components/read-only-lock.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';

import { formatMoney } from '../config/currencies.js';

const TWO_COLUMNS = { minWidth: 220, max: 2 };

const styles = stylex.create({
  // Same card as the payment-term steps above it (`MetaPaymentTermRow`).
  row: {
    backgroundColor: 'var(--color-background-surface)',
    borderColor: 'var(--color-border-emphasized)',
    borderRadius: 'var(--radius-element)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    padding: 'var(--spacing-4)',
  },
  tile: {
    backgroundColor: 'var(--meta-emerald-wash)',
    borderRadius: 'var(--radius-element)',
    color: 'var(--meta-emerald-text)',
    flexShrink: 0,
    height: 'var(--spacing-7)',
    width: 'var(--spacing-7)',
  },
  amount: {
    color: 'var(--meta-emerald-text)',
    flexShrink: 0,
  },
  // Same dashed add button as "Thêm mốc điều kiện thanh toán".
  addButton: {
    borderColor: 'var(--color-accent)',
    borderRadius: 'var(--radius-element)',
    borderStyle: 'dashed',
    borderWidth: 'var(--border-width)',
    color: 'var(--color-accent)',
  },
});

/**
 * "Lịch sử thanh toán & chứng từ" in the Meta commission drawer — one card
 * per payment actually made (Lần 01…: date, amount, note), styled like the
 * payment-term steps above it, with the same dashed add button. The
 * section header already shows the paid total, so there is no footer sum.
 * The older commission dialog keeps `PaymentHistoryFields`' grid.
 * `isReadOnly` (the drawer's view mode) locks the fields and drops the
 * delete / add actions.
 * @param {{
 *   rows: import('../types/index.js').CommissionPaymentRow[],
 *   status?: { type: 'error' | 'success', message: string },
 *   currency?: string,
 *   isReadOnly?: boolean,
 *   onAddRow: () => void,
 *   onRemoveRow: (rowKey: string) => void,
 *   onUpdateRowField: (rowKey: string, field: 'paymentDate' | 'amount' | 'note', value: number | string | undefined) => void,
 * }} props
 */
export function CommissionPaymentHistoryCards({
  rows,
  status,
  currency,
  isReadOnly = false,
  onAddRow,
  onRemoveRow,
  onUpdateRowField,
}) {
  return (
    <VStack gap={2} hAlign="stretch">
      {rows.length === 0 ? (
        <Text size="sm" color="secondary">
          Chưa có lần thanh toán nào cho Commission này.
        </Text>
      ) : null}

      {rows.map((row, index) => {
        const sequence = index + 1;
        return (
          <VStack key={row.rowKey} gap={3} hAlign="stretch" xstyle={styles.row}>
            <HStack hAlign="between" vAlign="center" gap={3} wrap="nowrap">
              <HStack gap={3} vAlign="center" wrap="nowrap">
                <HStack
                  as="span"
                  hAlign="center"
                  vAlign="center"
                  xstyle={styles.tile}
                >
                  <Text
                    as="span"
                    size="sm"
                    weight="bold"
                    color="inherit"
                    hasTabularNumbers
                  >
                    {String(sequence).padStart(2, '0')}
                  </Text>
                </HStack>
                <Text weight="bold">Lần thanh toán {sequence}</Text>
              </HStack>
              <HStack gap={2} vAlign="center" wrap="nowrap">
                {row.amount ? (
                  <Text
                    weight="bold"
                    color="inherit"
                    hasTabularNumbers
                    xstyle={styles.amount}
                  >
                    {formatMoney(row.amount, currency ?? '')}
                  </Text>
                ) : null}
                {isReadOnly ? null : (
                  <IconButton
                    label={`Xoá lần thanh toán ${sequence}`}
                    tooltip="Xoá"
                    icon={<Icon icon={Trash2} size="sm" />}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveRow(row.rowKey)}
                  />
                )}
              </HStack>
            </HStack>

            <Grid columns={TWO_COLUMNS} gap={3}>
              <ReadOnlyLock isActive={isReadOnly}>
                <DateInput
                  label="Ngày thanh toán"
                  placeholder="Chọn ngày"
                  value={
                    /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
                      row.paymentDate || null
                    )
                  }
                  onChange={(value) =>
                    onUpdateRowField(row.rowKey, 'paymentDate', value ?? '')
                  }
                  format={formatDateInputValue}
                  width="100%"
                />
              </ReadOnlyLock>
              <FormattedNumberTextInput
                label="Giá trị"
                value={row.amount}
                onChange={(value) =>
                  onUpdateRowField(row.rowKey, 'amount', value)
                }
                units={currency || undefined}
                isReadOnly={isReadOnly}
              />
            </Grid>
            <TextArea
              label="Ghi chú / Chứng từ"
              isOptional={!isReadOnly}
              rows={2}
              value={row.note}
              onChange={(value) => onUpdateRowField(row.rowKey, 'note', value)}
              placeholder={
                isReadOnly ? '—' : 'Ví dụ: UNC số 123, chuyển khoản ngày…'
              }
              width="100%"
              isReadOnly={isReadOnly}
            />
          </VStack>
        );
      })}

      {isReadOnly ? null : (
        <Button
          label="Thêm lần thanh toán"
          type="button"
          variant="ghost"
          icon={<Icon icon={CirclePlus} size="sm" />}
          onClick={onAddRow}
          width="100%"
          xstyle={styles.addButton}
        />
      )}

      {status ? (
        <Banner status="error" title={status.message} container="card" />
      ) : null}
    </VStack>
  );
}
