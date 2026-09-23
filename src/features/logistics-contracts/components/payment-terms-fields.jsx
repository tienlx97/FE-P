'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { CirclePlus } from 'lucide-react';
import { useState } from 'react';

import {
  MetaPaymentTermRow,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';
import { NumberInput } from '@/shared/components/number-input.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';

import { formatMoney } from '../config/currencies.js';

// Room for "100.00" plus the "%" unit.
const RATIO_WIDTH = 160;

const styles = stylex.create({
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
 * Payment milestones as Meta step cards (`MetaPaymentTermRow`): a summary
 * line (derived title, ratio pill, amount) with the condition underneath;
 * the pencil opens the ratio (`NumberInput`, "%" unit) and a multi-line
 * condition in place — steps without a condition yet start open. The API
 * only persists ratio and condition, so the title is derived from the
 * condition text. Wrapped in `MetaThemeProvider` because it is also used by
 * the commission form outside the Meta contract pages.
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
  const [openRowKeys, setOpenRowKeys] = useState(
    () => /** @type {Set<string>} */ (new Set()),
  );
  const hasValue =
    typeof contractValue === 'number' && !Number.isNaN(contractValue);

  // A step without a condition opens its editor and keeps it open until the
  // user closes it — deriving "open" from an empty condition alone would
  // collapse the editor on the first typed character.
  const newEmptyKeys = isReadOnly
    ? []
    : rows
        .filter(
          (row) => !row.paymentCondition.trim() && !openRowKeys.has(row.rowKey),
        )
        .map((row) => row.rowKey);
  if (newEmptyKeys.length > 0) {
    setOpenRowKeys(new Set([...openRowKeys, ...newEmptyKeys]));
  }

  /** @param {string} rowKey */
  function toggleRow(rowKey) {
    setOpenRowKeys((current) => {
      const next = new Set(current);
      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);
      return next;
    });
  }

  return (
    <MetaThemeProvider>
      <VStack gap={2} hAlign="stretch">
        {rows.map((row, index) => {
          const sequence = index + 1;
          const ratio = row.paymentRatioPercent || 0;
          const condition = row.paymentCondition.trim();

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
                hasValue
                  ? formatMoney((contractValue * ratio) / 100, currency ?? '')
                  : undefined
              }
              description={condition || 'Chưa nhập điều kiện thanh toán'}
              isReadOnly={isReadOnly}
              isEditing={!isReadOnly && openRowKeys.has(row.rowKey)}
              onToggleEdit={() => toggleRow(row.rowKey)}
              onRemove={() => onRemoveRow(row.rowKey)}
              isRemoveDisabled={rows.length <= 1}
              editor={
                <>
                  <NumberInput
                    label="Tỷ lệ"
                    value={row.paymentRatioPercent}
                    onChange={(value) =>
                      onUpdateRowField(row.rowKey, 'paymentRatioPercent', value)
                    }
                    units="%"
                    min={0}
                    max={100}
                    width={RATIO_WIDTH}
                  />
                  <TextArea
                    label="Điều kiện kích hoạt thanh toán"
                    rows={3}
                    value={row.paymentCondition}
                    onChange={(value) =>
                      onUpdateRowField(row.rowKey, 'paymentCondition', value)
                    }
                    placeholder="Ví dụ: T/T trong 07 ngày sau khi nghiệm thu hàng tại nhà máy..."
                    width="100%"
                  />
                </>
              }
            />
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
