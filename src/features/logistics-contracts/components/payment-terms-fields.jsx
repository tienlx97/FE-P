'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { pixel, proportional, Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Toolbar } from '@astryxdesign/core/Toolbar';
import { VStack } from '@astryxdesign/core/VStack';

import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { IconPlus } from '@/shared/components/icon/icon-plus.jsx';
import { IconTrash } from '@/shared/components/icon/icon-trash.jsx';

import { formatMoney } from '../config/currencies.js';

/**
 * "Đợt thanh toán" grid — tỷ lệ % + điều kiện thanh toán per row, with a
 * running total that turns red once it drifts from 100 (the backend
 * rejects anything else, see `CreateContractCommandValidator`, BE-kt-xnk).
 * "Thành tiền" per row is a derived, read-only display (contractValue ×
 * paymentRatioPercent / 100) — not part of the submitted payload.
 * Purely a controlled view over `usePaymentTermRows`'s state.
 * @param {{
 *   rows: import('../types/index.js').PaymentTermRow[],
 *   totalPercent: number,
 *   status?: { type: 'error' | 'success', message: string },
 *   contractValue?: number,
 *   currency?: string,
 *   isReadOnly?: boolean,
 *   onAddRow: () => void,
 *   onRemoveRow: (rowKey: string) => void,
 *   onUpdateRowField: (rowKey: string, field: 'paymentRatioPercent' | 'paymentCondition', value: number | string | undefined) => void,
 * }} props
 */
export function PaymentTermsFields({
  rows,
  totalPercent,
  status,
  contractValue,
  currency,
  isReadOnly = false,
  onAddRow,
  onRemoveRow,
  onUpdateRowField,
}) {
  const isTotalValid = Math.abs(totalPercent - 100) < 0.01;
  const tableRows = rows.map((row, index) => ({
    ...row,
    sequence: index + 1,
  }));

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').PaymentTermRow & { sequence: number } & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'sequence',
      header: 'Đợt',
      width: pixel(72),
      renderCell: (row) => (
        <Text color="secondary" hasTabularNumbers>
          {row.sequence}
        </Text>
      ),
    },
    {
      key: 'paymentRatioPercent',
      header: 'Tỷ lệ (%)',
      width: pixel(128),
      renderCell: (row) => (
        <FormattedNumberTextInput
          label="Tỷ lệ (%)"
          isLabelHidden
          value={row.paymentRatioPercent}
          onChange={(value) =>
            onUpdateRowField(row.rowKey, 'paymentRatioPercent', value)
          }
          units="%"
          size="sm"
          isDisabled={isReadOnly}
        />
      ),
    },
    {
      key: 'paymentCondition',
      header: 'Điều kiện thanh toán',
      width: proportional(1),
      renderCell: (row) => (
        <TextInput
          label="Điều kiện thanh toán"
          isLabelHidden
          value={row.paymentCondition}
          onChange={(value) =>
            onUpdateRowField(row.rowKey, 'paymentCondition', value)
          }
          placeholder="Ví dụ: L/C at sight, T/T..."
          size="sm"
          width="100%"
          isDisabled={isReadOnly}
        />
      ),
    },
    {
      key: 'amount',
      header: 'Thành tiền',
      width: pixel(180),
      align: 'end',
      renderCell: (row) => {
        const amount =
          typeof contractValue === 'number' && !Number.isNaN(contractValue)
            ? (contractValue * (row.paymentRatioPercent || 0)) / 100
            : undefined;
        return (
          <Text
            type="body"
            color={amount === undefined ? 'secondary' : undefined}
            hasTabularNumbers
          >
            {amount === undefined ? '—' : formatMoney(amount, currency ?? '')}
          </Text>
        );
      },
    },
  ];

  columns.push({
    key: 'actions',
    header: 'Thao tác',
    width: pixel(96),
    align: 'end',
    renderCell: (row) => (
      <IconButton
        label="Xoá dòng này"
        tooltip="Xoá"
        icon={<Icon icon={IconTrash} size="sm" />}
        type="button"
        variant="ghost"
        isDisabled={isReadOnly || rows.length <= 1}
        onClick={() => onRemoveRow(row.rowKey)}
      />
    ),
  });

  return (
    <VStack gap={2} hAlign="stretch">
      <Toolbar
        label="Thao tác đợt thanh toán"
        size="sm"
        variant="muted"
        dividers={['bottom']}
        startContent={
          <Button
            isDisabled={isReadOnly}
            label="Thêm đợt"
            type="button"
            variant="secondary"
            icon={<Icon icon={IconPlus} size="sm" />}
            onClick={onAddRow}
          />
        }
        endContent={
          <HStack gap={2} vAlign="center">
            <StatusDot
              variant={isTotalValid ? 'success' : 'error'}
              label={
                isTotalValid ? 'Tổng tỷ lệ hợp lệ' : 'Tổng tỷ lệ chưa hợp lệ'
              }
            />
            <Text weight="semibold" hasTabularNumbers>
              Tổng tỷ lệ: {totalPercent}% / 100%
            </Text>
          </HStack>
        }
      />

      <Table
        data={tableRows}
        columns={columns}
        idKey="rowKey"
        density="compact"
        dividers="grid"
      />

      {status ? (
        <Banner status="error" title={status.message} container="card" />
      ) : null}
    </VStack>
  );
}
