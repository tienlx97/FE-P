'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Icon } from '@astryxdesign/core/Icon';
import { VStack } from '@astryxdesign/core/VStack';

import {
  MaritimeButton,
  MaritimePaymentTermCard,
} from '@/shared/components/custom/maritime/index.js';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { IconPlus } from '@/shared/components/icon/icon-plus.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';

import { formatMoney } from '../config/currencies.js';

/** @param {string} condition @param {number} sequence */
export function paymentTermTitle(condition, sequence) {
  if (/tạm ứng/i.test(condition)) return 'Tạm ứng hợp đồng';
  if (/vận đơn|b\/l|tờ khai/i.test(condition)) {
    return 'Giao chứng từ B/L & Tờ khai';
  }
  if (/l\/c|letter of credit/i.test(condition)) return 'Bộ chứng từ gốc L/C';
  return `Mốc thanh toán ${sequence}`;
}

/** @param {string} condition */
function paymentMethod(condition) {
  if (/l\/c|letter of credit/i.test(condition)) {
    return 'L/C (Letter of Credit)';
  }
  if (/t\/t|telegraphic transfer/i.test(condition)) {
    return 'T/T (Telegraphic Transfer)';
  }
  return 'Theo thỏa thuận';
}

/**
 * Card-based payment milestones matching the selected Figma section. The API
 * only persists ratio and condition, so the visible title/method are honest
 * summaries derived from the condition rather than unsaved form fields.
 * @param {{
 *   rows: import('../types/index.js').PaymentTermRow[],
 *   totalPercent: number,
 *   status?: { type: 'error' | 'success', message: string },
 *   contractValue?: number,
 *   currency?: string,
 *   isReadOnly?: boolean,
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
  onAddRow,
  onRemoveRow,
  onUpdateRowField,
}) {
  return (
    <VStack gap={3} hAlign="stretch">
      {rows.map((row, index) => {
        const amount =
          typeof contractValue === 'number' && !Number.isNaN(contractValue)
            ? (contractValue * (row.paymentRatioPercent || 0)) / 100
            : undefined;
        const sequence = index + 1;
        const method = paymentMethod(row.paymentCondition);

        return (
          <MaritimePaymentTermCard
            key={row.rowKey}
            sequence={sequence}
            title={paymentTermTitle(row.paymentCondition, sequence)}
            amount={
              amount === undefined ? '' : formatMoney(amount, currency ?? '')
            }
            method={method}
            isHighlighted={method.startsWith('L/C')}
            isRemoveDisabled={isReadOnly || rows.length <= 1}
            onRemove={() => onRemoveRow(row.rowKey)}
            ratioControl={
              <FormattedNumberTextInput
                label="Tỷ lệ (%)"
                isLabelHidden
                value={row.paymentRatioPercent}
                onChange={(value) =>
                  onUpdateRowField(row.rowKey, 'paymentRatioPercent', value)
                }
                units="%"
                size="sm"
                isReadOnly={isReadOnly}
              />
            }
            conditionControl={
              <TextInput
                label="Điều kiện kích hoạt thanh toán"
                isLabelHidden
                value={row.paymentCondition}
                onChange={(value) =>
                  onUpdateRowField(row.rowKey, 'paymentCondition', value)
                }
                placeholder="Ví dụ: L/C at sight, T/T..."
                size="md"
                width="100%"
                isReadOnly={isReadOnly}
              />
            }
          />
        );
      })}

      <MaritimeButton
        label="Thêm mốc điều kiện thanh toán"
        type="button"
        variant="secondary"
        treatment="add"
        icon={<Icon icon={IconPlus} size="sm" />}
        isDisabled={isReadOnly}
        onClick={onAddRow}
        width="100%"
      />

      {status ? (
        <Banner status="error" title={status.message} container="card" />
      ) : null}
    </VStack>
  );
}
