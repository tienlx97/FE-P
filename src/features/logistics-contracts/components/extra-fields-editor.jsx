'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { pixel, proportional, Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';

import { IconTrash } from '@/shared/components/icon/icon-trash.jsx';

/**
 * Generic "trường tùy ý" (Key/Value) repeatable-rows editor — the EAV
 * mechanism the backend exposes on Party A/Customer/Bank
 * (`docs/api/Customers.md` etc., BE-kt-xnk). Purely a controlled view over
 * `useExtraFieldRows`'s state, same shape as `bank-accounts-fields.jsx`.
 * @param {{
 *   rows: import('../types/index.js').ExtraFieldRow[],
 *   isReadOnly?: boolean,
 *   onAddRow: () => void,
 *   onRemoveRow: (rowKey: string) => void,
 *   onUpdateRowField: (rowKey: string, field: 'key' | 'value', value: string) => void,
 * }} props
 */
export function ExtraFieldsEditor({
  rows,
  isReadOnly = false,
  onAddRow,
  onRemoveRow,
  onUpdateRowField,
}) {
  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').ExtraFieldRow & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'key',
      header: 'Tên trường',
      width: proportional(1),
      renderCell: (row) => (
        <TextInput
          label="Tên trường"
          isLabelHidden
          value={row.key}
          onChange={(value) => onUpdateRowField(row.rowKey, 'key', value)}
          placeholder="Ví dụ: Mã số thuế"
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      key: 'value',
      header: 'Giá trị',
      width: proportional(1.4),
      renderCell: (row) => (
        <TextInput
          label="Giá trị"
          isLabelHidden
          value={row.value}
          onChange={(value) => onUpdateRowField(row.rowKey, 'value', value)}
          isReadOnly={isReadOnly}
        />
      ),
    },
  ];

  columns.push({
    key: 'actions',
    header: '',
    width: pixel(48),
    align: 'end',
    renderCell: (row) => (
      <IconButton
        isDisabled={isReadOnly}
        label="Xoá dòng này"
        tooltip="Xoá"
        icon={<Icon icon={IconTrash} size="sm" />}
        type="button"
        variant="ghost"
        onClick={() => onRemoveRow(row.rowKey)}
      />
    ),
  });

  return (
    <VStack gap={2} hAlign="stretch">
      <Text type="label" color="secondary">
        Trường tùy ý
      </Text>

      {rows.length > 0 ? (
        <Table data={rows} columns={columns} idKey="rowKey" dividers="grid" />
      ) : (
        <Text color="secondary">Chưa có trường tùy ý nào.</Text>
      )}

      <HStack gap={2}>
        <Button
          isDisabled={isReadOnly}
          label="Thêm trường"
          type="button"
          variant="secondary"
          size="sm"
          onClick={onAddRow}
        />
      </HStack>
    </VStack>
  );
}
