'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Trash2 } from 'lucide-react';

import { MetaFormCard } from '@/shared/components/custom/meta/index.js';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';

import { formatMoney } from '../config/currencies.js';

const LINE_COLUMNS = { minWidth: 140, max: 4 };

const styles = stylex.create({
  row: {
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-element)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    padding: 'var(--spacing-4)',
  },
});

/**
 * "Danh mục hàng hóa" of the contract form: one card per goods line —
 * description, HS code, quantity, unit, unit price and the computed amount.
 * The footer compares the lines' total with the contract value (they may
 * differ; the backend does not force them equal). State lives in
 * `useContractLineRows`.
 * @param {{
 *   rows: import('../types/index.js').ContractLineRow[],
 *   total: number,
 *   contractValue?: number,
 *   currency?: string,
 *   status?: { type: 'error' | 'success', message: string },
 *   onRemoveRow: (rowKey: string) => void,
 *   onUpdateRowField: (rowKey: string, field: 'description' | 'hsCode' | 'quantity' | 'unit' | 'unitPrice', value: number | string | undefined) => void,
 * }} props
 */
export function ContractLinesFields({
  rows,
  total,
  contractValue,
  currency,
  status,
  onRemoveRow,
  onUpdateRowField,
}) {
  const hasValue =
    typeof contractValue === 'number' && !Number.isNaN(contractValue);
  const gap = hasValue ? total - contractValue : 0;

  return (
    <MetaFormCard variant="default">
      {rows.length === 0 ? (
        <Text color="secondary">
          Chưa có dòng hàng — bấm &quot;Thêm dòng hàng&quot;.
        </Text>
      ) : null}
      {rows.map((row, index) => (
        <VStack key={row.rowKey} gap={3} hAlign="stretch" xstyle={styles.row}>
          <HStack hAlign="between" vAlign="center" gap={3} wrap="nowrap">
            <Text weight="bold">Dòng {index + 1}</Text>
            <HStack gap={2} vAlign="center" wrap="nowrap">
              <Text weight="bold" hasTabularNumbers>
                {formatMoney(
                  (row.quantity ?? 0) * (row.unitPrice ?? 0),
                  currency ?? '',
                )}
              </Text>
              <IconButton
                label={`Xoá dòng hàng ${index + 1}`}
                tooltip="Xoá"
                icon={<Icon icon={Trash2} size="sm" />}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveRow(row.rowKey)}
              />
            </HStack>
          </HStack>
          <TextInput
            label="Mô tả hàng hóa"
            value={row.description}
            onChange={(value) =>
              onUpdateRowField(row.rowKey, 'description', value)
            }
            isRequired
          />
          <Grid columns={LINE_COLUMNS} gap={3}>
            <TextInput
              label="HS code"
              value={row.hsCode}
              onChange={(value) =>
                onUpdateRowField(row.rowKey, 'hsCode', value)
              }
              placeholder="7308.90.99"
            />
            <FormattedNumberTextInput
              label="Số lượng"
              value={row.quantity}
              onChange={(value) =>
                onUpdateRowField(row.rowKey, 'quantity', value)
              }
              isRequired
            />
            <TextInput
              label="Đơn vị"
              value={row.unit}
              onChange={(value) => onUpdateRowField(row.rowKey, 'unit', value)}
              placeholder="tấn, bộ, kiện…"
              isRequired
            />
            <FormattedNumberTextInput
              label="Đơn giá"
              value={row.unitPrice}
              onChange={(value) =>
                onUpdateRowField(row.rowKey, 'unitPrice', value)
              }
              units={currency || undefined}
              isRequired
            />
          </Grid>
        </VStack>
      ))}
      {rows.length > 0 ? (
        <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap">
          <Text weight="bold">
            Tổng thành tiền: {formatMoney(total, currency ?? '')}
          </Text>
          {hasValue && Math.abs(gap) >= 0.01 ? (
            <Text color="secondary">
              {gap > 0 ? 'Cao hơn' : 'Thấp hơn'} giá trị hợp đồng{' '}
              {formatMoney(Math.abs(gap), currency ?? '')}
            </Text>
          ) : null}
        </HStack>
      ) : null}
      {status ? (
        <Banner status="error" title={status.message} container="card" />
      ) : null}
    </MetaFormCard>
  );
}
