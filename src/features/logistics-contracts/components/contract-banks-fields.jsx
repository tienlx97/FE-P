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

import { ReadOnlyLock } from '@/shared/components/read-only-lock.jsx';

import { QuickCreateBankDialog } from './quick-create-bank-dialog.jsx';

/**
 * Ngân hàng thụ hưởng: **at least 1** `ContractBank` catalog entry required,
 * referenced by id (not snapshotted — see `docs/api/ContractBanks.md`,
 * `docs/api/Contracts.md`, BE-kt-xnk).
 * @param {{
 *   banks: import('../types/index.js').ContractBank[],
 *   selectedBankIds: string[],
 *   onChange: (bankIds: string[]) => void,
 *   status?: { type: 'error' | 'success', message: string },
 *   isReadOnly?: boolean,
 * }} props
 */
export function ContractBanksFields({
  banks,
  selectedBankIds,
  onChange,
  status,
  isReadOnly = false,
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
            {banks.map((bank) => (
              <CheckboxListItem
                key={bank.id}
                value={bank.id}
                label={bank.bankName || 'Ngân hàng chưa đặt tên'}
                description={[
                  bank.beneficiary,
                  bank.bankAccountNumber,
                  bank.branchName,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              />
            ))}
          </CheckboxList>
        </ReadOnlyLock>
      ) : (
        <Text color="secondary">Chưa có ngân hàng nào trong danh mục.</Text>
      )}

      <Button
        isDisabled={isReadOnly}
        label="Thêm ngân hàng thụ hưởng"
        icon={<Icon icon={CirclePlus} size="md" />}
        type="button"
        variant="secondary"
        width="100%"
        size="md"
        onClick={() => setIsQuickCreateOpen(true)}
      />

      <QuickCreateBankDialog
        isOpen={isQuickCreateOpen}
        onOpenChange={setIsQuickCreateOpen}
        onCreated={(bank) => onChange([...selectedBankIds, bank.id])}
      />
    </VStack>
  );
}
