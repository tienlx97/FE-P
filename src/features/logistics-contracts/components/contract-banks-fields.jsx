'use client';

import { Banner } from '@astryxdesign/core/Banner';
import {
  CheckboxList,
  CheckboxListItem,
} from '@astryxdesign/core/CheckboxList';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

import { IconPlus } from '@/shared/components/icon/icon-plus.jsx';

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

      <HStack hAlign="between" vAlign="start">
        {banks.length > 0 ? (
          <CheckboxList
            isDisabled={isReadOnly}
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
        ) : (
          <Text color="secondary">Chưa có ngân hàng nào trong danh mục.</Text>
        )}

        <IconButton
          isDisabled={isReadOnly}
          label="Thêm ngân hàng"
          tooltip="Thêm ngân hàng"
          icon={<Icon icon={IconPlus} size="sm" />}
          type="button"
          variant="secondary"
          onClick={() => setIsQuickCreateOpen(true)}
        />
      </HStack>

      <QuickCreateBankDialog
        isOpen={isQuickCreateOpen}
        onOpenChange={setIsQuickCreateOpen}
        onCreated={(bank) => onChange([...selectedBankIds, bank.id])}
      />
    </VStack>
  );
}
