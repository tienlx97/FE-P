'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { Selector } from '@astryxdesign/core/Selector';
import { pixel, proportional, Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import {
  colorVars,
  radiusVars,
  spacingVars,
} from '@astryxdesign/core/theme/tokens.stylex';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { IconTrash } from '@/shared/components/icon/icon-trash.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';

// `Table` always bleeds edge-to-edge against `--container-padding-block-start`
// when it's the first child of its parent (see Table's scroll-wrapper
// `containerBleed` style) — meant for a table sitting directly in a Card/
// LayoutContent. Here it's nested several `VStack`s deep under the tab
// strip, but is still DOM-first-child of this wrapper, so it inherits
// LayoutContent's block padding var from the dialog and yanks itself up
// by that amount, overlapping the tab strip above. Reset the var at this
// boundary (plain `style`, not `xstyle` — `@stylexjs/valid-styles` rejects
// raw `--*` keys) so the table keeps the gap this `VStack` already
// establishes instead of bleeding into it.
const tableWrapperStyle = /** @type {import('react').CSSProperties} */ ({
  '--container-padding-block-start': '0px',
});

const styles = stylex.create({
  staticCell: {
    backgroundColor: {
      default: 'transparent',
      ':hover': colorVars['--color-overlay-hover'],
    },
    borderRadius: radiusVars['--radius-inner'],
    cursor: 'pointer',
    display: 'block',
    marginInline: `calc(${spacingVars['--spacing-2']} * -1)`,
    paddingBlock: spacingVars['--spacing-1'],
    paddingInline: spacingVars['--spacing-2'],
  },
});

/**
 * "Tài khoản ngân hàng" grid — shared by `CreateUserForm`/`EditUserForm`.
 * Purely a controlled view over `useBankAccountRows`'s state; it never
 * calls the API itself (see that hook's doc comment for why). Rendered as
 * a real `Table` (bordered grid with a header row), per the reference
 * layout. Rows already saved (`bankAccountId` set) render as plain text
 * until clicked — matching the reference screenshot, where existing
 * accounts read as static rows and only a freshly-added row is an open
 * input grid. Rows with no `bankAccountId` yet (added this session, not
 * saved) always render as inputs since there's no saved value to display.
 * @param {{
 *   rows: import('../types/index.js').BankAccountRow[],
 *   vietnamBanks: import('../types/index.js').VietnamBank[],
 *   onAddRow: () => void,
 *   onRemoveRow: (rowKey: string) => void,
 *   onClearRows: () => void,
 *   onUpdateRowField: (rowKey: string, field: 'vietnamBankId' | 'accountNumber' | 'branch', value: string) => void,
 *   onSetPrimaryRow: (rowKey: string) => void,
 * }} props
 */
export function BankAccountsFields({
  rows,
  vietnamBanks,
  onAddRow,
  onRemoveRow,
  onClearRows,
  onSetPrimaryRow,
  onUpdateRowField,
}) {
  // Rows are saved-and-static by default; clicking one opts it into edit mode
  // for the rest of this session. Never needs to come back out — once you've
  // touched a saved value there's no read-only view left worth returning to
  // before the whole form saves.
  const [editingRowKeys, setEditingRowKeys] = useState(() => new Set());

  /** @param {string} rowKey */
  function startEditing(rowKey) {
    setEditingRowKeys((current) =>
      current.has(rowKey) ? current : new Set(current).add(rowKey),
    );
  }

  const bankOptions = vietnamBanks.map((bank) => ({
    value: bank.id,
    label: `${bank.shortName} — ${bank.name}`,
  }));
  const bankLabelById = new Map(
    bankOptions.map((option) => [option.value, option.label]),
  );

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').BankAccountRow & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'accountNumber',
      header: 'Số tài khoản',
      width: proportional(1),
      renderCell: (row) => {
        if (!row.bankAccountId || editingRowKeys.has(row.rowKey)) {
          return (
            <TextInput
              label="Số tài khoản"
              isLabelHidden
              value={row.accountNumber}
              onChange={(value) =>
                onUpdateRowField(row.rowKey, 'accountNumber', value)
              }
            />
          );
        }
        return (
          <Text
            as="div"
            xstyle={styles.staticCell}
            onClick={() => startEditing(row.rowKey)}
          >
            {row.accountNumber}
          </Text>
        );
      },
    },
    {
      key: 'vietnamBankId',
      header: 'Tên ngân hàng',
      width: proportional(1.4),
      renderCell: (row) => {
        if (!row.bankAccountId || editingRowKeys.has(row.rowKey)) {
          return (
            <Selector
              hasSearch
              label="Ngân hàng"
              isLabelHidden
              placeholder="Chọn ngân hàng"
              value={row.vietnamBankId}
              onChange={(value) =>
                onUpdateRowField(row.rowKey, 'vietnamBankId', value ?? '')
              }
              options={bankOptions}
            />
          );
        }
        return (
          <Text
            as="div"
            maxLines={1}
            xstyle={styles.staticCell}
            onClick={() => startEditing(row.rowKey)}
          >
            {bankLabelById.get(row.vietnamBankId) ?? ''}
          </Text>
        );
      },
    },
    {
      key: 'branch',
      header: 'Chi nhánh',
      width: proportional(1),
      renderCell: (row) => {
        if (!row.bankAccountId || editingRowKeys.has(row.rowKey)) {
          return (
            <TextInput
              label="Chi nhánh"
              isLabelHidden
              value={row.branch}
              onChange={(value) =>
                onUpdateRowField(row.rowKey, 'branch', value)
              }
            />
          );
        }
        return (
          <Text
            as="div"
            xstyle={styles.staticCell}
            onClick={() => startEditing(row.rowKey)}
          >
            {row.branch}
          </Text>
        );
      },
    },
    {
      key: 'isPrimary',
      header: 'Mặc định',
      width: pixel(100),
      align: 'center',
      // Each row is its own single-item RadioList rather than one RadioList
      // spanning the column — Table renders each cell independently, so
      // there's no single DOM parent to share a group under. Mutual
      // exclusivity (only one row primary at a time) is already enforced
      // by `onSetPrimaryRow`/`useBankAccountRows`, not by radio grouping.
      // The item's own label is left empty: the column header already reads
      // "Mặc định", so repeating that word next to every radio circle was
      // pure noise — the radio alone, centered, reads clearly against the
      // header. Width stays at 100 (not shrunk to fit just the radio):
      // TableHeaderCell always truncates header text with an ellipsis
      // regardless of the table's textOverflow setting, and anything
      // narrower clips "Mặc định" itself.
      renderCell: (row) => (
        <RadioList
          label="Đặt làm tài khoản mặc định"
          isLabelHidden
          size="sm"
          value={row.isPrimary ? row.rowKey : ''}
          onChange={() => onSetPrimaryRow(row.rowKey)}
        >
          <RadioListItem label="" value={row.rowKey} />
        </RadioList>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: pixel(48),
      align: 'end',
      renderCell: (row) => (
        <IconButton
          label="Xoá dòng này"
          tooltip="Xoá"
          icon={<Icon icon={IconTrash} size="sm" />}
          type="button"
          variant="ghost"
          onClick={() => onRemoveRow(row.rowKey)}
        />
      ),
    },
  ];

  return (
    <VStack gap={3} hAlign="stretch" style={tableWrapperStyle}>
      {rows.length > 0 ? (
        <Table data={rows} columns={columns} idKey="rowKey" dividers="grid" />
      ) : (
        <Text color="secondary">Chưa có tài khoản ngân hàng nào.</Text>
      )}

      <HStack gap={2}>
        <Button
          label="Thêm dòng"
          type="button"
          variant="secondary"
          size="sm"
          onClick={onAddRow}
        />
        {rows.length > 0 ? (
          <Button
            label="Xoá tất cả"
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearRows}
          />
        ) : null}
      </HStack>
    </VStack>
  );
}
