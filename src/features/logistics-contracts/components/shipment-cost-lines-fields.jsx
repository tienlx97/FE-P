'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { overlayPaddingReset } from '@astryxdesign/core/Layout';
import { MetadataList } from '@astryxdesign/core/MetadataList';
import { Selector } from '@astryxdesign/core/Selector';
import { pixel, proportional, Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { UnderlinedMetadataListItem as MetadataListItem } from '@/shared/components/expandable-row-styles.jsx';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { IconPlus } from '@/shared/components/icon/icon-plus.jsx';
import { IconTrash } from '@/shared/components/icon/icon-trash.jsx';

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

  // Live "Tổng theo nhóm chi phí" breakdown — computed from the rows
  // currently being edited (not `shipment.costTotalsByCategory`, a
  // server-computed snapshot), so it stays correct while editing and shown
  // in both modes (per user request 2026-09-06, mirrors Commission's
  // Phụ lục/Tổng cộng).
  const totalsByCategory = Array.from(
    rows.reduce((totals, row) => {
      if (!row.costCategoryId) return totals;
      totals.set(
        row.costCategoryId,
        (totals.get(row.costCategoryId) ?? 0) + (row.amount ?? 0),
      );
      return totals;
    }, new Map()),
  ).map(([costCategoryId, totalAmount]) => ({
    costCategoryId,
    costCategoryName: costCategoriesById.get(costCategoryId)?.name ?? '—',
    totalAmount,
  }));

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').ShipmentCostLineRow & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'costCategoryId',
      header: 'Nhóm chi phí',
      width: pixel(280),
      renderCell: (row) => (
        <Selector
          isDisabled={isReadOnly}
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
          isDisabled={isReadOnly}
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
          isDisabled={isReadOnly}
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
          isDisabled={isReadOnly}
        />
      ),
    },
    {
      key: 'providerCustomerId',
      header: 'Nhà cung cấp',
      width: pixel(300),
      renderCell: (row) => (
        <Selector
          isDisabled={isReadOnly}
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
          isDisabled={isReadOnly}
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
        <>
          <Table
            data={rows}
            columns={columns}
            idKey="rowKey"
            density="compact"
            dividers="grid"
          />

          {totalsByCategory.length > 0 ? (
            <MetadataList
              title={<Text weight="semibold">Tổng theo nhóm chi phí</Text>}
              columns={2}
              label={{ position: 'top' }}
            >
              {totalsByCategory.map((categoryTotal) => (
                <MetadataListItem
                  key={categoryTotal.costCategoryId}
                  label={categoryTotal.costCategoryName}
                >
                  {formatMoney(categoryTotal.totalAmount)} đ
                </MetadataListItem>
              ))}
            </MetadataList>
          ) : null}
        </>
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
