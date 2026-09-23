'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { MultiSelector } from '@astryxdesign/core/MultiSelector';
import { StackItem } from '@astryxdesign/core/Stack';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import {
  MetaFormCard,
  MetaPaymentSplitBar,
  MetaPaymentTermRow,
} from '@/shared/components/custom/meta/index.js';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { IconPlus } from '@/shared/components/icon/icon-plus.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';

import { formatMoney } from '../config/currencies.js';
import { paymentTermTitle } from './payment-terms-fields.jsx';
import { QuickCreateBankDialog } from './quick-create-bank-dialog.jsx';

const styles = stylex.create({
  ratio: { flexBasis: 'calc(var(--spacing-12) * 3)' },
  condition: { minWidth: 'calc(var(--spacing-12) * 5)' },
  minZero: { minWidth: 0 },
});

/** @param {import('../types/index.js').ContractBank} bank */
function bankLabel(bank) {
  return [bank.bankName || 'Ngân hàng chưa đặt tên', bank.bankAccountNumber]
    .filter(Boolean)
    .join(' · ');
}

/**
 * "4. Điều khoản thanh toán" body of the edit drawer (Figma 103:4983):
 * beneficiary banks as one multi-select, the ratio split bar, then one
 * `MetaPaymentTermRow` per step. Rows are summaries; the pencil opens the
 * step's ratio + condition inputs in place (steps without a condition yet
 * start open). Form state stays owned by `useContractForm`.
 * @param {{
 *   rows: import('../types/index.js').PaymentTermRow[],
 *   totalPercent: number,
 *   status?: { type: 'error' | 'success', message: string },
 *   contractValue?: number,
 *   currency?: string,
 *   onRemoveRow: (rowKey: string) => void,
 *   onUpdateRowField: (rowKey: string, field: 'paymentRatioPercent' | 'paymentCondition', value: number | string | undefined) => void,
 *   banks: import('../types/index.js').ContractBank[],
 *   selectedBankIds: string[],
 *   onBankIdsChange: (bankIds: string[]) => void,
 *   bankStatus?: { type: 'error' | 'success', message: string },
 * }} props
 */
export function ContractDrawerPaymentTerms({
  rows,
  totalPercent,
  status,
  contractValue,
  currency,
  onRemoveRow,
  onUpdateRowField,
  banks,
  selectedBankIds,
  onBankIdsChange,
  bankStatus,
}) {
  const [openRowKeys, setOpenRowKeys] = useState(
    () => /** @type {Set<string>} */ (new Set()),
  );
  const [isQuickCreateBankOpen, setIsQuickCreateBankOpen] = useState(false);
  const hasValue =
    typeof contractValue === 'number' && !Number.isNaN(contractValue);
  const isBalanced = Math.abs(totalPercent - 100) < 0.01;

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
    <MetaFormCard>
      <HStack gap={2} vAlign="end" wrap="nowrap">
        <StackItem size="fill" xstyle={styles.minZero}>
          <MultiSelector
            label="Tài khoản / Ngân hàng thụ hưởng chỉ định"
            placeholder={
              banks.length > 0
                ? 'Chọn ngân hàng thụ hưởng'
                : 'Chưa có ngân hàng nào trong danh mục'
            }
            options={banks.map((bank) => ({
              value: bank.id,
              label: bankLabel(bank),
            }))}
            value={selectedBankIds}
            onChange={onBankIdsChange}
            triggerDisplay="labels"
            hasSearch
            isRequired
            status={bankStatus}
            statusVariant="tooltip"
            width="100%"
          />
        </StackItem>
        <IconButton
          label="Thêm ngân hàng"
          tooltip="Thêm ngân hàng"
          icon={<Icon icon={IconPlus} size="sm" />}
          type="button"
          size="lg"
          variant="secondary"
          onClick={() => setIsQuickCreateBankOpen(true)}
        />
      </HStack>

      <MetaPaymentSplitBar
        label="Các đợt thanh toán cam kết"
        totalLabel={
          hasValue
            ? `${totalPercent}% / ${formatMoney(
                (contractValue * totalPercent) / 100,
                currency ?? '',
              )}`
            : `${totalPercent}%`
        }
        isBalanced={isBalanced}
        ratios={rows.map((row) => row.paymentRatioPercent || 0)}
      />

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
              ratioLabel={`${ratio}%`}
              amount={
                hasValue
                  ? formatMoney((contractValue * ratio) / 100, currency ?? '')
                  : undefined
              }
              description={condition || 'Chưa nhập điều kiện thanh toán'}
              isEditing={openRowKeys.has(row.rowKey) || !condition}
              onToggleEdit={() => toggleRow(row.rowKey)}
              onRemove={() => onRemoveRow(row.rowKey)}
              isRemoveDisabled={rows.length <= 1}
              editor={
                <HStack gap={3} vAlign="start" wrap="wrap">
                  <StackItem xstyle={styles.ratio}>
                    <FormattedNumberTextInput
                      label="Tỷ lệ (%)"
                      value={row.paymentRatioPercent}
                      onChange={(value) =>
                        onUpdateRowField(
                          row.rowKey,
                          'paymentRatioPercent',
                          value,
                        )
                      }
                      units="%"
                    />
                  </StackItem>
                  <StackItem size="fill" xstyle={styles.condition}>
                    <TextInput
                      label="Điều kiện kích hoạt thanh toán"
                      value={row.paymentCondition}
                      onChange={(value) =>
                        onUpdateRowField(row.rowKey, 'paymentCondition', value)
                      }
                      placeholder="Ví dụ: L/C at sight, T/T..."
                      width="100%"
                    />
                  </StackItem>
                </HStack>
              }
            />
          );
        })}
      </VStack>

      {status ? (
        <Banner status="error" title={status.message} container="card" />
      ) : null}

      <QuickCreateBankDialog
        isOpen={isQuickCreateBankOpen}
        onOpenChange={setIsQuickCreateBankOpen}
        onCreated={(bank) => onBankIdsChange([...selectedBankIds, bank.id])}
      />
    </MetaFormCard>
  );
}
