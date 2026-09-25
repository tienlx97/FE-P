'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import {
  CheckboxList,
  CheckboxListItem,
} from '@astryxdesign/core/CheckboxList';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { CirclePlus } from 'lucide-react';
import { useState } from 'react';

import { BankAccountDialog } from '@/shared/components/bank-accounts/bank-account-dialog.jsx';
import { ReadOnlyLock } from '@/shared/components/read-only-lock.jsx';


/**
 * Ngân hàng thụ hưởng: **at least 1** bank account of the contract's catalog
 * seller, referenced by id (BE-kt-xnk `unify-bank-accounts`).
 * @param {{
 *   banks: import('@/shared/api/bank-accounts.js').BankAccount[],
 *   selectedBankIds: string[],
 *   onChange: (bankIds: string[]) => void,
 *   status?: { type: 'error' | 'success', message: string },
 *   isReadOnly?: boolean,
 *   sellerName?: string,
 *   onAddBankAccount: (operation: { kind: 'add' | 'update', accountId?: string, account: any }) => Promise<{ success: boolean, message?: string }>,
 * }} props
 */
export function ContractBanksFields({
  banks,
  selectedBankIds,
  onChange,
  status,
  isReadOnly = false,
  sellerName,
  onAddBankAccount,
}) {
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  return (
    <VStack gap={3} hAlign="stretch">
      {status ? (
        <Banner status="error" title={status.message} container="card" />
      ) : null}

      {banks.length > 0 ? (
        <ReadOnlyLock isActive={isReadOnly}>
          <CheckboxList
            label="Ngân hàng thụ hưởng"
            isLabelHidden
            value={selectedBankIds}
            onChange={onChange}
            hasDividers
            width="100%"
          >
            {banks.map((account) => (
              <CheckboxListItem
                key={account.id}
                value={/** @type {string} */ (account.id)}
                label={account.bankName}
                description={[
                  account.holder,
                  account.accountNumber,
                  account.branch,
                  account.currency,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              />
            ))}
          </CheckboxList>
        </ReadOnlyLock>
      ) : (
        <Text color="secondary">
          {sellerName
            ? 'Bên bán chưa có tài khoản ngân hàng.'
            : 'Chọn bên bán trong danh mục để chọn tài khoản thụ hưởng.'}
        </Text>
      )}

      <Button
        isDisabled={isReadOnly || !sellerName}
        label="Thêm tài khoản cho bên bán"
        icon={<Icon icon={CirclePlus} size="md" />}
        type="button"
        variant="secondary"
        width="100%"
        size="md"
        onClick={() => setIsQuickCreateOpen(true)}
      />

      {isQuickCreateOpen ? (
        <BankAccountDialog
          account={null}
          holderDefault={sellerName ?? ''}
          submit={onAddBankAccount}
          onClose={() => setIsQuickCreateOpen(false)}
        />
      ) : null}
    </VStack>
  );
}
