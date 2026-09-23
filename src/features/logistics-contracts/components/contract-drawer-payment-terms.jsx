'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { MultiSelector } from '@astryxdesign/core/MultiSelector';
import { StackItem } from '@astryxdesign/core/Stack';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import {
  MetaFormCard,
  MetaPaymentSplitBar,
} from '@/shared/components/custom/meta/index.js';
import { IconPlus } from '@/shared/components/icon/icon-plus.jsx';

import { formatMoney } from '../config/currencies.js';
import { PaymentTermsFields } from './payment-terms-fields.jsx';
import { QuickCreateBankDialog } from './quick-create-bank-dialog.jsx';

const styles = stylex.create({
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
 * beneficiary banks as one multi-select, the ratio split bar, then the
 * shared `PaymentTermsFields` step cards (the section header owns "Thêm
 * điều khoản"). Form state stays owned by `useContractForm`.
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
  const [isQuickCreateBankOpen, setIsQuickCreateBankOpen] = useState(false);
  const hasValue =
    typeof contractValue === 'number' && !Number.isNaN(contractValue);
  const isBalanced = Math.abs(totalPercent - 100) < 0.01;

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

      <PaymentTermsFields
        rows={rows}
        status={status}
        contractValue={contractValue}
        currency={currency}
        hasAddButton={false}
        onAddRow={() => {}}
        onRemoveRow={onRemoveRow}
        onUpdateRowField={onUpdateRowField}
      />

      <QuickCreateBankDialog
        isOpen={isQuickCreateBankOpen}
        onOpenChange={setIsQuickCreateBankOpen}
        onCreated={(bank) => onBankIdsChange([...selectedBankIds, bank.id])}
      />
    </MetaFormCard>
  );
}
