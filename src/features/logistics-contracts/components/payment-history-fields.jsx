'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { DateInput } from '@astryxdesign/core/DateInput';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { pixel, proportional, Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { Toolbar } from '@astryxdesign/core/Toolbar';
import { VStack } from '@astryxdesign/core/VStack';

import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { IconPlus } from '@/shared/components/icon/icon-plus.jsx';
import { IconTrash } from '@/shared/components/icon/icon-trash.jsx';

import { formatMoney } from '../config/currencies.js';

/**
 * "Lịch sử thanh toán" grid for a Commission — actual payments made to the
 * third party (date/amount/note), separate from `PaymentTermsFields` (the
 * agreed schedule). Unlike payment terms there is no required total — a
 * Commission may have zero, partial, or fully-paid history at any time.
 * Purely a controlled view over `usePaymentHistoryRows`'s state.
 * @param {{
 *   rows: import('../types/index.js').CommissionPaymentRow[],
 *   status?: { type: 'error' | 'success', message: string },
 *   currency?: string,
 *   isReadOnly?: boolean,
 *   onAddRow: () => void,
 *   onRemoveRow: (rowKey: string) => void,
 *   onUpdateRowField: (rowKey: string, field: 'paymentDate' | 'amount' | 'note', value: number | string | undefined) => void,
 * }} props
 */
export function PaymentHistoryFields({
  rows,
  status,
  currency,
  isReadOnly = false,
  onAddRow,
  onRemoveRow,
  onUpdateRowField,
}) {
  const total = rows.reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const tableRows = rows.map((row, index) => ({
    ...row,
    sequence: index + 1,
  }));

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').CommissionPaymentRow & { sequence: number } & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'sequence',
      header: 'Lần',
      width: pixel(72),
      renderCell: (row) => (
        <Text color="secondary" hasTabularNumbers>
          {row.sequence}
        </Text>
      ),
    },
    {
      key: 'paymentDate',
      header: 'Ngày thanh toán',
      width: pixel(220),
      renderCell: (row) =>
        isReadOnly ? (
          <Text hasTabularNumbers>{row.paymentDate || '—'}</Text>
        ) : (
          <DateInput
            label="Ngày thanh toán"
            isLabelHidden
            value={
              /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
                row.paymentDate || null
              )
            }
            onChange={(value) =>
              onUpdateRowField(row.rowKey, 'paymentDate', value ?? '')
            }
            format="system_date"
            size="sm"
            width="100%"
          />
        ),
    },
    {
      key: 'amount',
      header: 'Giá trị',
      width: pixel(200),
      renderCell: (row) => (
        <FormattedNumberTextInput
          label="Giá trị"
          isLabelHidden
          value={row.amount}
          onChange={(value) => onUpdateRowField(row.rowKey, 'amount', value)}
          units={currency || undefined}
          size="sm"
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      key: 'note',
      header: 'Ghi chú',
      width: proportional(1, { minWidth: 280 }),
      renderCell: (row) => (
        <TextArea
          label="Ghi chú"
          isLabelHidden
          value={row.note}
          onChange={(value) => onUpdateRowField(row.rowKey, 'note', value)}
          placeholder="Ghi chú (không bắt buộc)"
          rows={1}
          size="sm"
          width="100%"
          isReadOnly={isReadOnly}
        />
      ),
    },
  ];

  if (!isReadOnly) {
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
          onClick={() => onRemoveRow(row.rowKey)}
        />
      ),
    });
  }

  return (
    <VStack gap={2} hAlign="stretch">
      {rows.length === 0 ? (
        <EmptyState
          title="Chưa có lần thanh toán"
          description={
            isReadOnly
              ? undefined
              : 'Ghi nhận lần thanh toán đầu tiên cho Commission này.'
          }
          isCompact
          actions={
            isReadOnly ? undefined : (
              <Button
                label="Thêm lần thanh toán"
                type="button"
                variant="secondary"
                icon={<Icon icon={IconPlus} size="sm" />}
                onClick={onAddRow}
              />
            )
          }
        />
      ) : (
        <>
          <Toolbar
            label="Thao tác lịch sử thanh toán"
            size="sm"
            variant="muted"
            dividers={['bottom']}
            startContent={
              isReadOnly ? undefined : (
                <Button
                  label="Thêm lần thanh toán"
                  type="button"
                  variant="secondary"
                  icon={<Icon icon={IconPlus} size="sm" />}
                  onClick={onAddRow}
                />
              )
            }
            endContent={
              <Text weight="semibold" hasTabularNumbers>
                Đã thanh toán: {formatMoney(total, currency ?? '')}
              </Text>
            }
          />
          <Table
            data={tableRows}
            columns={columns}
            idKey="rowKey"
            density="compact"
            dividers="grid"
          />
        </>
      )}

      {status ? (
        <Banner status="error" title={status.message} container="card" />
      ) : null}
    </VStack>
  );
}
