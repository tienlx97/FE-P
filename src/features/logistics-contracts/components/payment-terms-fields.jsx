'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { CirclePlus, Trash2 } from 'lucide-react';

import {
  metaPaymentStepTone,
  MetaPaymentTermRow,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { NumberInput } from '@/shared/components/number-input.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';

import { formatMoney } from '../config/currencies.js';

const TWO_COLUMNS = { minWidth: 200, max: 2 };

const rowTones = stylex.create({
  accent: { borderColor: 'var(--color-border-emphasized)' },
  indigo: { borderColor: 'var(--meta-indigo-border)' },
  success: { borderColor: 'var(--meta-emerald-border)' },
});

const tileTones = stylex.create({
  accent: {
    backgroundColor: 'var(--meta-primary-fixed)',
    color: 'var(--meta-primary-strong)',
  },
  indigo: {
    backgroundColor: 'var(--meta-indigo-soft)',
    color: 'var(--meta-indigo-deep)',
  },
  success: {
    backgroundColor: 'var(--meta-emerald-wash)',
    color: 'var(--meta-emerald-text)',
  },
});

const amountTones = stylex.create({
  accent: { color: 'var(--color-accent)' },
  indigo: { color: 'var(--meta-indigo-deep)' },
  success: { color: 'var(--meta-emerald-text)' },
});

const styles = stylex.create({
  // Same card as the commission payment-history cards
  // (`commission-payment-history-cards.jsx`); border / tile / amount take
  // the step's tone so they match the split bar's "Đợt n" legend.
  row: {
    backgroundColor: 'var(--color-background-surface)',
    borderRadius: 'var(--radius-element)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    padding: 'var(--spacing-4)',
  },
  tile: {
    borderRadius: 'var(--radius-element)',
    flexShrink: 0,
    height: 'var(--spacing-7)',
    width: 'var(--spacing-7)',
  },
  amount: {
    flexShrink: 0,
  },
  // Figma 104:5399: dashed cobalt "Thêm mốc điều kiện thanh toán".
  addButton: {
    borderColor: 'var(--color-accent)',
    borderRadius: 'var(--radius-element)',
    borderStyle: 'dashed',
    borderWidth: 'var(--border-width)',
    color: 'var(--color-accent)',
  },
});

/** @param {string} condition @param {number} sequence */
function paymentTermTitle(condition, sequence) {
  if (/tạm ứng/i.test(condition)) return 'Tạm ứng hợp đồng';
  if (/vận đơn|b\/l|tờ khai/i.test(condition)) {
    return 'Giao chứng từ B/L & Tờ khai';
  }
  if (/l\/c|letter of credit/i.test(condition)) return 'Bộ chứng từ gốc L/C';
  return `Mốc thanh toán ${sequence}`;
}

/** @param {string} condition */
function paymentMethod(condition) {
  if (/l\/c|letter of credit/i.test(condition)) return 'L/C (Letter of Credit)';
  if (/t\/t|telegraphic transfer|chuyển khoản/i.test(condition)) {
    return 'T/T (Telegraphic Transfer)';
  }
  return 'Theo thỏa thuận';
}

/**
 * Payment milestones as Meta step cards. Editable: every step is an open
 * card (like the commission payment-history cards) — header "01 Đợt thanh
 * toán 1" with the step's amount and delete, then Tỷ lệ (%) | Số tiền tương
 * ứng (ratio × contract value, read-only), then the trigger condition.
 * Read-only: the compact `MetaPaymentTermRow` summary (derived title,
 * ratio pill, amount, condition). The API only persists ratio and
 * condition. Wrapped in `MetaThemeProvider` because it is also used by the
 * commission form outside the Meta contract pages.
 * @param {{
 *   rows: import('../types/index.js').PaymentTermRow[],
 *   totalPercent?: number,
 *   status?: { type: 'error' | 'success', message: string },
 *   contractValue?: number,
 *   currency?: string,
 *   isReadOnly?: boolean,
 *   hasAddButton?: boolean,
 *   onAddRow: () => void,
 *   onRemoveRow: (rowKey: string) => void,
 *   onUpdateRowField: (rowKey: string, field: 'paymentRatioPercent' | 'paymentCondition', value: number | string | undefined) => void,
 * }} props
 */
export function PaymentTermsFields({
  rows,
  status,
  contractValue,
  currency,
  isReadOnly = false,
  hasAddButton = true,
  onAddRow,
  onRemoveRow,
  onUpdateRowField,
}) {
  const hasValue =
    typeof contractValue === 'number' && !Number.isNaN(contractValue);

  return (
    <MetaThemeProvider>
      <VStack gap={2} hAlign="stretch">
        {rows.map((row, index) => {
          const sequence = index + 1;
          const ratio = row.paymentRatioPercent || 0;
          const amount = hasValue ? (contractValue * ratio) / 100 : undefined;
          const condition = row.paymentCondition.trim();

          if (isReadOnly) {
            return (
              <MetaPaymentTermRow
                key={row.rowKey}
                sequence={sequence}
                title={paymentTermTitle(condition, sequence)}
                subtitle={
                  condition
                    ? `Phương thức: ${paymentMethod(condition)}`
                    : undefined
                }
                ratioLabel={`${ratio}%`}
                amount={
                  amount === undefined
                    ? undefined
                    : formatMoney(amount, currency ?? '')
                }
                description={condition || 'Chưa nhập điều kiện thanh toán'}
                isReadOnly
                isEditing={false}
                onToggleEdit={() => {}}
                onRemove={() => {}}
                editor={null}
              />
            );
          }

          const tone = metaPaymentStepTone(index);
          return (
            <VStack
              key={row.rowKey}
              gap={3}
              hAlign="stretch"
              xstyle={[styles.row, rowTones[tone]]}
            >
              <HStack hAlign="between" vAlign="center" gap={3} wrap="nowrap">
                <HStack gap={3} vAlign="center" wrap="nowrap">
                  <HStack
                    as="span"
                    hAlign="center"
                    vAlign="center"
                    xstyle={[styles.tile, tileTones[tone]]}
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
                  <Text weight="bold">Đợt thanh toán {sequence}</Text>
                </HStack>
                <HStack gap={2} vAlign="center" wrap="nowrap">
                  {amount ? (
                    <Text
                      weight="bold"
                      color="inherit"
                      hasTabularNumbers
                      xstyle={[styles.amount, amountTones[tone]]}
                    >
                      {formatMoney(amount, currency ?? '')}
                    </Text>
                  ) : null}
                  <IconButton
                    label={`Xoá đợt thanh toán ${sequence}`}
                    tooltip="Xoá"
                    icon={<Icon icon={Trash2} size="sm" />}
                    type="button"
                    variant="ghost"
                    size="sm"
                    isDisabled={rows.length <= 1}
                    onClick={() => onRemoveRow(row.rowKey)}
                  />
                </HStack>
              </HStack>

              <Grid columns={TWO_COLUMNS} gap={3}>
                <NumberInput
                  label="Tỷ lệ"
                  value={row.paymentRatioPercent}
                  onChange={(value) =>
                    onUpdateRowField(row.rowKey, 'paymentRatioPercent', value)
                  }
                  units="%"
                  min={0}
                  max={100}
                  width="100%"
                />
                <FormattedNumberTextInput
                  label="Số tiền tương ứng"
                  value={amount}
                  onChange={() => {}}
                  units={currency || undefined}
                  isReadOnly
                />
              </Grid>
              <TextArea
                label="Điều kiện kích hoạt thanh toán"
                rows={2}
                value={row.paymentCondition}
                onChange={(value) =>
                  onUpdateRowField(row.rowKey, 'paymentCondition', value)
                }
                placeholder="Ví dụ: T/T trong 07 ngày sau khi nghiệm thu hàng tại nhà máy..."
                width="100%"
              />
            </VStack>
          );
        })}

        {hasAddButton && !isReadOnly ? (
          <Button
            label="Thêm mốc điều kiện thanh toán"
            type="button"
            variant="ghost"
            icon={<Icon icon={CirclePlus} size="sm" />}
            onClick={onAddRow}
            width="100%"
            xstyle={styles.addButton}
          />
        ) : null}

        {status ? (
          <Banner status="error" title={status.message} container="card" />
        ) : null}
      </VStack>
    </MetaThemeProvider>
  );
}
