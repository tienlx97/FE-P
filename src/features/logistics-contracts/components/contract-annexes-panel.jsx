'use client';

import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { pixel, proportional, Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { IconPlus } from '@/shared/components/icon/icon-plus.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { labelForContractAnnexType } from '../config/contract-annex-types.js';
import { formatMoney } from '../config/currencies.js';
import {
  useContractAnnexesQuery,
  useDeleteContractAnnexMutation,
} from '../hooks/use-contract-annexes-query.js';

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/**
 * Signed amount label for one contract-annex row — `ValueChange` describes a
 * non-monetary information change (see its `note`), never an amount, so it
 * has no amount to show here.
 * @param {import('../types/index.js').ContractAnnex} annex
 * @param {string} currency
 */
function annexAmountLabel(annex, currency) {
  if (annex.type === 'ValueChange') return '—';
  const formatted = formatMoney(annex.amount, currency);
  if (annex.type === 'AmountIncrease') return `+ ${formatted}`;
  return `− ${formatted}`;
}

/**
 * "Phụ lục" tab body — extracted from `ContractGeneralFields` (task 3.1,
 * `openspec/changes/logistics-workspace-redesign/design.md` section 3) so
 * annexes get their own tab instead of trailing the "Hồ sơ" form. Uses the
 * contract's own last-saved `contractValue`/`currency`, not a live draft
 * from the "Hồ sơ" tab's form (a separate, possibly-unsaved instance this
 * panel has no access to) — the grand total here should never reflect
 * numbers the user hasn't saved yet.
 *
 * Each annex is still added/edited through `ContractAnnexFormDialog`
 * (owned by `ContractsList`, ADR-0004) — this panel only renders the list,
 * total, and delete confirmation.
 * @param {{
 *   contract: import('../types/index.js').Contract,
 *   onAddAnnex?: () => void,
 *   onEditAnnex?: (annex: import('../types/index.js').ContractAnnex) => void,
 * }} props
 */
export function ContractAnnexesPanel({ contract, onAddAnnex, onEditAnnex }) {
  const [deletingAnnex, setDeletingAnnex] = useState(
    /** @type {import('../types/index.js').ContractAnnex | null} */ (null),
  );

  const annexesQuery = useContractAnnexesQuery(contract.id);
  const annexes = annexesQuery.data?.success ? annexesQuery.data.annexes : [];
  const deleteAnnexMutation = useDeleteContractAnnexMutation(contract.id);

  async function handleConfirmDeleteAnnex() {
    if (!deletingAnnex) return;
    await deleteAnnexMutation.mutateAsync(deletingAnnex.id);
    setDeletingAnnex(null);
  }

  const annexesTotal = annexes.reduce((total, annex) => {
    if (annex.type === 'AmountIncrease') return total + annex.amount;
    if (annex.type === 'AmountDecrease') return total - annex.amount;
    return total;
  }, 0);
  const contractGrandTotal = (contract.contractValue ?? 0) + annexesTotal;

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').ContractAnnex & Record<string, unknown>>[]} */
  const annexColumns = [
    {
      key: 'annexCode',
      header: 'Mã phụ lục',
      width: proportional(1.2),
      renderCell: (annex) =>
        `${annex.annexCode} · ${labelForContractAnnexType(annex.type)}`,
    },
    {
      key: 'signedDate',
      header: 'Ngày ký',
      width: pixel(120),
      renderCell: (annex) => formatDisplayDate(annex.signedDate),
    },
    {
      key: 'buyerSigned',
      header: 'Mua ký',
      width: pixel(90),
      renderCell: (annex) => (annex.buyerSigned ? 'Đã ký' : 'Chưa ký'),
    },
    {
      key: 'sellerSigned',
      header: 'Bán ký',
      width: pixel(90),
      renderCell: (annex) => (annex.sellerSigned ? 'Đã ký' : 'Chưa ký'),
    },
    {
      key: 'note',
      header: 'Ghi chú',
      width: proportional(1),
      renderCell: (annex) => orDash(annex.note),
    },
    {
      key: 'amount',
      header: 'Số tiền',
      width: pixel(140),
      align: 'end',
      renderCell: (annex) => annexAmountLabel(annex, contract.currency),
    },
  ];
  if (onEditAnnex) {
    annexColumns.push({
      key: 'actions',
      header: '',
      width: pixel(90),
      renderCell: (annex) => (
        <HStack gap={1} vAlign="center" hAlign="end">
          <IconButton
            label={`Sửa ${annex.annexCode}`}
            tooltip="Sửa phụ lục"
            icon={<Icon icon={Pencil} size="sm" />}
            variant="ghost"
            size="sm"
            onClick={() => onEditAnnex(annex)}
          />
          <IconButton
            label={`Xoá ${annex.annexCode}`}
            tooltip="Xoá phụ lục"
            icon={<Icon icon={Trash2} size="sm" />}
            variant="ghost"
            size="sm"
            onClick={() => setDeletingAnnex(annex)}
          />
        </HStack>
      ),
    });
  }

  return (
    <VStack gap={4} hAlign="stretch">
      <HStack hAlign="between" vAlign="center">
        <Text weight="semibold">Phụ lục hợp đồng</Text>
        {onAddAnnex ? (
          <IconButton
            label="Thêm phụ lục"
            tooltip="Thêm phụ lục"
            icon={<Icon icon={IconPlus} size="sm" />}
            variant="secondary"
            size="sm"
            onClick={onAddAnnex}
          />
        ) : null}
      </HStack>

      {annexes.length === 0 ? (
        <Text color="secondary">Chưa có phụ lục</Text>
      ) : (
        <Table
          columns={annexColumns}
          data={annexes}
          idKey="id"
          dividers="rows"
          density="compact"
        />
      )}

      <HStack hAlign="between" vAlign="center">
        <Text weight="semibold">Tổng cộng:</Text>
        <Text weight="semibold">
          {formatMoney(contractGrandTotal, contract.currency)}
        </Text>
      </HStack>

      <AlertDialog
        isOpen={deletingAnnex !== null}
        onOpenChange={(nextIsOpen) => {
          if (!nextIsOpen) setDeletingAnnex(null);
        }}
        title={`Xoá phụ lục ${deletingAnnex?.annexCode ?? ''}?`}
        description="Hành động này không thể hoàn tác."
        actionLabel="Xoá"
        onAction={handleConfirmDeleteAnnex}
      />
    </VStack>
  );
}
