'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { overlayPaddingReset } from '@astryxdesign/core/Layout';
import { Selector } from '@astryxdesign/core/Selector';
import { pixel, proportional, Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { IconPlus } from '@/shared/components/icon/icon-plus.jsx';
import { IconTrash } from '@/shared/components/icon/icon-trash.jsx';
import { ReadOnlyLock } from '@/shared/components/read-only-lock.jsx';

import { formatMoney } from '../config/currencies.js';
import { useShipmentCostCategoriesQuery } from '../hooks/use-shipment-cost-categories-query.js';
import { QuickCreateShipmentCostCategoryDialog } from './quick-create-shipment-cost-category-dialog.jsx';

// Sentinel `Selector` value for the trailing "+ Thêm nhóm chi phí" option —
// picking it opens `QuickCreateShipmentCostCategoryDialog` instead of
// assigning it as the row's `costCategoryId`, per user request (2026-09-05)
// to fold that action into the dropdown itself instead of a separate
// `IconButton` beside it.
const ADD_COST_CATEGORY_OPTION_VALUE = '__add_cost_category__';

/**
 * "Thông tin chi phí logistics" grid for a Shipment — mirrors
 * `PaymentHistoryFields` (purely a controlled view over
 * `useShipmentCostLineRows`'s state). `Amount` is always VNĐ, no currency
 * selector (unlike other money fields on this form) — see
 * `docs/api/Shipments.md`, BE-kt-xnk. `Name` is free text — Astryx has no
 * autocomplete/combobox component that accepts free text plus suggestions,
 * so a plain `TextInput` is used instead of building a custom one (per
 * spec's documented fallback); `ShipmentCostItemTemplate` suggestions are
 * therefore not surfaced in this UI yet.
 * @param {{
 *   rows: import('../types/index.js').ShipmentCostLineRow[],
 *   customers: import('../types/index.js').Customer[],
 *   status?: { type: 'error' | 'success', message: string },
 *   isReadOnly?: boolean,
 *   onAddRow: () => void,
 *   onRemoveRow: (rowKey: string) => void,
 *   onUpdateRowField: (rowKey: string, field: 'costCategoryId' | 'name' | 'amount' | 'note' | 'providerCustomerId' | 'invoiceNumber', value: number | string | undefined) => void,
 * }} props
 */
export function ShipmentCostLinesFields({
  rows,
  customers,
  status,
  isReadOnly = false,
  onAddRow,
  onRemoveRow,
  onUpdateRowField,
}) {
  const [quickCreateForRowKey, setQuickCreateForRowKey] = useState(
    /** @type {string | null} */ (null),
  );

  const costCategoriesQuery = useShipmentCostCategoriesQuery();
  const costCategories = costCategoriesQuery.data?.success
    ? costCategoriesQuery.data.costCategories
    : [];
  const costCategoriesById = new Map(
    costCategories.map((costCategory) => [costCategory.id, costCategory]),
  );

  const total = rows.reduce((sum, row) => sum + (row.amount ?? 0), 0);

  // Rows visually grouped by cost category (per user request 2026-09-14:
  // was one flat table with a category picker per row, easy to lose track
  // of "how much did Trucking/O·F/Customs cost" without cross-referencing
  // the separate breakdown below it). A row with no category yet (a
  // freshly-added blank row) falls into "Chưa phân loại", sorted last so
  // it doesn't visually dominate the top of an otherwise-categorized list.
  // Groups are ordered by category name — stable regardless of the order
  // rows were added in, unlike grouping by first-appearance.
  // Kept as a live computation over `rows` (the in-progress edit, not
  // `shipment.costTotalsByCategory`, a server-computed snapshot) so it
  // stays correct while editing, same reasoning the previous "Tổng theo
  // nhóm chi phí" breakdown (now folded into these group headers instead
  // of a separate section) already had.
  const UNCATEGORIZED_KEY = '__uncategorized__';
  const rowsByCategory = rows.reduce((groups, row) => {
    const key = row.costCategoryId || UNCATEGORIZED_KEY;
    const existing = groups.get(key) ?? [];
    existing.push(row);
    groups.set(key, existing);
    return groups;
  }, /** @type {Map<string, import('../types/index.js').ShipmentCostLineRow[]>} */ (new Map()));

  const groupedTableRows = Array.from(rowsByCategory.entries())
    .sort(([keyA], [keyB]) => {
      if (keyA === UNCATEGORIZED_KEY) return 1;
      if (keyB === UNCATEGORIZED_KEY) return -1;
      const nameA = costCategoriesById.get(keyA)?.name ?? '';
      const nameB = costCategoriesById.get(keyB)?.name ?? '';
      return nameA.localeCompare(nameB, 'vi');
    })
    .flatMap(([key, groupRows]) => [
      {
        rowKey: `group-${key}`,
        __isGroupHeader: true,
        categoryLabel:
          key === UNCATEGORIZED_KEY
            ? 'Chưa phân loại'
            : (costCategoriesById.get(key)?.name ?? '—'),
        subtotal: groupRows.reduce((sum, row) => sum + (row.amount ?? 0), 0),
      },
      ...groupRows,
    ]);

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').ShipmentCostLineRow & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'costCategoryId',
      header: 'Nhóm chi phí',
      width: pixel(280),
      renderCell: (row) => (
        <ReadOnlyLock isActive={isReadOnly}>
          <Selector
            label="Nhóm chi phí"
            isLabelHidden
            hasSearch
            placeholder={isReadOnly ? '—' : 'Chọn nhóm chi phí'}
            value={row.costCategoryId}
            onChange={(value) => {
              if (value === ADD_COST_CATEGORY_OPTION_VALUE) {
                setQuickCreateForRowKey(row.rowKey);
                return;
              }
              onUpdateRowField(row.rowKey, 'costCategoryId', value ?? '');
            }}
            options={[
              ...costCategories.map((costCategory) => ({
                value: costCategory.id,
                label: costCategory.name,
              })),
              { type: 'divider' },
              {
                value: ADD_COST_CATEGORY_OPTION_VALUE,
                label: 'Thêm nhóm chi phí',
                icon: <Icon icon={IconPlus} size="sm" />,
              },
            ]}
            width="100%"
          />
        </ReadOnlyLock>
      ),
    },
    {
      key: 'name',
      header: 'Tên khoản chi phí',
      width: proportional(1, { minWidth: 180 }),
      renderCell: (row) => (
        <TextInput
          label="Tên khoản chi phí"
          isLabelHidden
          value={row.name}
          onChange={(value) => onUpdateRowField(row.rowKey, 'name', value)}
          placeholder={isReadOnly ? '—' : 'Ví dụ: Phí THC, Phí D/O'}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      key: 'amount',
      header: 'Số tiền',
      width: pixel(160),
      renderCell: (row) => (
        <FormattedNumberTextInput
          label="Số tiền"
          isLabelHidden
          value={row.amount}
          onChange={(value) => onUpdateRowField(row.rowKey, 'amount', value)}
          units="đ"
          size="sm"
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      key: 'note',
      header: 'Ghi chú',
      width: pixel(300),
      renderCell: (row) => (
        <TextArea
          label="Ghi chú"
          isLabelHidden
          value={row.note}
          onChange={(value) => onUpdateRowField(row.rowKey, 'note', value)}
          placeholder={isReadOnly ? '—' : 'Ghi chú (không bắt buộc)'}
          rows={1}
          size="sm"
          width="100%"
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      key: 'providerCustomerId',
      header: 'Nhà cung cấp',
      width: pixel(300),
      renderCell: (row) => (
        <ReadOnlyLock isActive={isReadOnly}>
          <Selector
            label="Nhà cung cấp"
            isLabelHidden
            hasSearch
            hasClear
            placeholder={isReadOnly ? '—' : 'Chưa xác định'}
            value={row.providerCustomerId || null}
            onChange={(value) =>
              onUpdateRowField(row.rowKey, 'providerCustomerId', value ?? '')
            }
            options={customers.map((customer) => ({
              value: customer.id,
              label: customer.companyName,
            }))}
            width="100%"
          />
        </ReadOnlyLock>
      ),
    },
    {
      key: 'invoiceNumber',
      header: 'Số hoá đơn',
      width: pixel(180),
      renderCell: (row) => (
        <TextInput
          label="Số hoá đơn"
          isLabelHidden
          value={row.invoiceNumber}
          onChange={(value) => onUpdateRowField(row.rowKey, 'invoiceNumber', value)}
          placeholder={isReadOnly ? '—' : 'Không bắt buộc'}
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

  // Group-header rows carry no real cost-line fields (`categoryLabel`/
  // `subtotal` only) — every column's `renderCell` is swapped for one of
  // these two on that row instead of running the real editable-field
  // logic above against fields that don't exist on it.
  const groupedColumns = columns.map((column) => ({
    ...column,
    renderCell: (/** @type {any} */ row) => {
      if (!row.__isGroupHeader) return column.renderCell?.(row);
      if (column.key === 'costCategoryId') {
        return (
          <Text weight="semibold" color="secondary">
            {row.categoryLabel}
          </Text>
        );
      }
      if (column.key === 'amount') {
        return (
          <Text weight="semibold" hasTabularNumbers>
            {formatMoney(row.subtotal)} đ
          </Text>
        );
      }
      return null;
    },
  }));

  return (
    <VStack
      gap={2}
      hAlign="stretch"
      {...stylex.props(overlayPaddingReset.reset)}
    >
      <HStack hAlign="between" vAlign="center">
        <Button
          isDisabled={isReadOnly}
          label="Thêm chi phí"
          type="button"
          variant="secondary"
          size="sm"
          onClick={onAddRow}
        />
        {rows.length > 0 ? (
          <Text weight="semibold">Tổng chi phí: {formatMoney(total)} đ</Text>
        ) : null}
      </HStack>

      {rows.length === 0 ? (
        <Text color="secondary">Chưa có khoản chi phí nào</Text>
      ) : (
        <Table
          data={groupedTableRows}
          columns={groupedColumns}
          idKey="rowKey"
          density="compact"
          dividers="grid"
        />
      )}

      {status ? (
        <Banner status="error" title={status.message} container="card" />
      ) : null}

      <QuickCreateShipmentCostCategoryDialog
        isOpen={quickCreateForRowKey !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setQuickCreateForRowKey(null);
        }}
        onCreated={(costCategory) => {
          if (quickCreateForRowKey) {
            onUpdateRowField(
              quickCreateForRowKey,
              'costCategoryId',
              costCategory.id,
            );
          }
          setQuickCreateForRowKey(null);
        }}
      />
    </VStack>
  );
}
