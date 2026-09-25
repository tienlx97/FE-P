'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { MultiSelector } from '@astryxdesign/core/MultiSelector';
import { StackItem } from '@astryxdesign/core/Stack';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { BankAccountDialog } from '@/shared/components/bank-accounts/bank-account-dialog.jsx';
import {
  MetaFormCard,
  MetaPaymentSplitBar,
} from '@/shared/components/custom/meta/index.js';
import { IconPlus } from '@/shared/components/icon/icon-plus.jsx';

import { formatMoney } from '../config/currencies.js';
import { PaymentTermsFields } from './payment-terms-fields.jsx';

const styles = stylex.create({
  minZero: { minWidth: 0 },
});

/** @param {import('@/shared/api/bank-accounts.js').BankAccount} account */
function bankLabel(account) {
  return [
    account.bankName,
    account.accountNumber,
    account.currency,
    account.isActive === false ? 'ngừng hoạt động' : '',
  ]
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
 *   banks: import('@/shared/api/bank-accounts.js').BankAccount[],
 *   selectedBankIds: string[],
 *   onBankIdsChange: (bankIds: string[]) => void,
 *   bankStatus?: { type: 'error' | 'success', message: string },
 *   sellerName?: string,
 *   onAddBankAccount: (operation: { kind: 'add' | 'update', accountId?: string, account: any }) => Promise<{ success: boolean, message?: string }>,
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
  sellerName,
  onAddBankAccount,
}) {
  const [isQuickCreateBankOpen, setIsQuickCreateBankOpen] = useState(false);
  const hasValue =
    typeof contractValue === 'number' && !Number.isNaN(contractValue);
  const isBalanced = Math.abs(totalPercent - 100) < 0.01;

  return (
    <MetaFormCard variant="default">
      <HStack gap={2} vAlign="end" wrap="nowrap">
        <StackItem size="fill" xstyle={styles.minZero}>
          <MultiSelector
            label="Tài khoản / Ngân hàng thụ hưởng chỉ định"
            description="Tài khoản ngân hàng của bên bán"
            placeholder={
              !sellerName
                ? 'Chọn bên bán trong danh mục trước'
                : banks.length > 0
                  ? 'Chọn tài khoản thụ hưởng'
                  : 'Bên bán chưa có tài khoản — bấm +'
            }
            isDisabled={!sellerName}
            options={banks.map((account) => ({
              value: /** @type {string} */ (account.id),
              label: bankLabel(account),
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
          label="Thêm tài khoản cho bên bán"
          tooltip="Thêm tài khoản cho bên bán"
          isDisabled={!sellerName}
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

      {isQuickCreateBankOpen ? (
        <BankAccountDialog
          account={null}
          holderDefault={sellerName ?? ''}
          submit={onAddBankAccount}
          onClose={() => setIsQuickCreateBankOpen(false)}
        />
      ) : null}
    </MetaFormCard>
  );
}
