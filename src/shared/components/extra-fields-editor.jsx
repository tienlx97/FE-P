'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Plus } from 'lucide-react';

import { IconTrash } from '@/shared/components/icon/icon-trash.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';

/**
 * Generic "trường tùy ý" (Key/Value) repeatable-rows editor — the EAV
 * mechanism the backend exposes on Party A/Customer/Bank
 * (`docs/api/Customers.md` etc., BE-kt-xnk). Purely a controlled view over
 * `useExtraFieldRows`'s state, same shape as `bank-accounts-fields.jsx`.
 * @param {{
 *   rows: { rowKey: string, key: string, value: string }[],
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
  // Plain rows, not a grid-ruled `Table`: inputs already draw their own
  // boxes, and table rules around them (inside a form card) read as boxes
  // within boxes. Key / value are clear from the content and placeholders.
  return (
    <VStack gap={2} hAlign="stretch">
      <Text type="label" color="secondary">
        Trường tùy ý
      </Text>

      {rows.length > 0 ? (
        <VStack gap={2} hAlign="stretch">
          {rows.map((row) => (
            <HStack key={row.rowKey} gap={2} vAlign="center" wrap="nowrap">
              <StackItem size="fill" xstyle={styles.keyColumn}>
                <TextInput
                  label="Tên trường"
                  isLabelHidden
                  value={row.key}
                  onChange={(value) =>
                    onUpdateRowField(row.rowKey, 'key', value)
                  }
                  placeholder="Tên trường, ví dụ: Mã số thuế"
                  isReadOnly={isReadOnly}
                />
              </StackItem>
              <StackItem size="fill" xstyle={styles.valueColumn}>
                <TextInput
                  label="Giá trị"
                  isLabelHidden
                  value={row.value}
                  onChange={(value) =>
                    onUpdateRowField(row.rowKey, 'value', value)
                  }
                  placeholder="Giá trị"
                  isReadOnly={isReadOnly}
                />
              </StackItem>
              <IconButton
                isDisabled={isReadOnly}
                label="Xoá dòng này"
                tooltip="Xoá"
                icon={<Icon icon={IconTrash} size="sm" />}
                type="button"
                variant="ghost"
                onClick={() => onRemoveRow(row.rowKey)}
              />
            </HStack>
          ))}
        </VStack>
      ) : (
        <Text color="secondary">Chưa có trường tùy ý nào.</Text>
      )}

      <HStack gap={2}>
        <Button
          isDisabled={isReadOnly}
          label="Thêm trường"
          icon={<Icon icon={Plus} size="sm" />}
          type="button"
          variant="secondary"
          size="sm"
          onClick={onAddRow}
        />
      </HStack>
    </VStack>
  );
}

const styles = stylex.create({
  keyColumn: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 0,
  },
  valueColumn: {
    flexBasis: 0,
    flexGrow: 1.4,
    minWidth: 0,
  },
});
