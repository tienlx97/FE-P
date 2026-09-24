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
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';

import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { IconPlus } from '@/shared/components/icon/icon-plus.jsx';
import { IconTrash } from '@/shared/components/icon/icon-trash.jsx';
import { ReadOnlyLock } from '@/shared/components/read-only-lock.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';

import { formatVndAmount } from '../config/currencies.js';
import { useShipmentCostCategoriesQuery } from '../hooks/use-shipment-cost-categories-query.js';

// Business decision 2026-09-24 (BE-kt-xnk `add-shipment-cost-log-groups`).
const COST_NATURE_OPTIONS = [
  {
    value: 'Standard',
    label: 'Standard',
    description: 'Chi phí thông thường (O/F, THC, D/O…)',
  },
  {
    value: 'Abnormal',
    label: 'Abnormal',
    description: 'Phát sinh bất thường (demurrage, detention, lưu kho…)',
  },
];

/** @param {import('../types/index.js').ShipmentCostCategory | undefined} costCategory */
function costCategoryLabel(costCategory) {
  return costCategory ? `${costCategory.code} · ${costCategory.name}` : '—';
}

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
 *   onAddRow: (costCategoryId?: string) => void,
 *   onRemoveRow: (rowKey: string) => void,
 *   onUpdateRowField: (rowKey: string, field: 'costCategoryId' | 'name' | 'amount' | 'note' | 'providerCustomerId' | 'invoiceNumber' | 'costNature', value: number | string | undefined) => void,
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
  const costCategoriesQuery = useShipmentCostCategoriesQuery();
  const costCategories = costCategoriesQuery.data?.success
    ? costCategoriesQuery.data.costCategories
    : [];
  const costCategoriesById = new Map(
    costCategories.map((costCategory) => [costCategory.id, costCategory]),
  );

  const total = rows.reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const abnormalTotal = rows.reduce(
    (sum, row) =>
      row.costNature === 'Abnormal' ? sum + (row.amount ?? 0) : sum,
    0,
  );

  // Rows visually grouped by cost category (per user request 2026-09-14:
  // was one flat table with a category picker per row, easy to lose track
  // of "how much did Trucking/O·F/Customs cost" without cross-referencing
  // the separate breakdown below it). A row with no category yet (a
  // freshly-added blank row) falls into "Chưa phân loại", sorted last so
  // it doesn't visually dominate the top of an otherwise-categorized list.
  // Groups are ordered by LOG code — stable regardless of the order rows
  // were added in, unlike grouping by first-appearance.
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
      const codeA = costCategoriesById.get(keyA)?.code ?? '';
      const codeB = costCategoriesById.get(keyB)?.code ?? '';
      return codeA.localeCompare(codeB);
    })
    .flatMap(([key, groupRows]) => [
      {
        rowKey: `group-${key}`,
        __isGroupHeader: true,
        // '' (not the sentinel) for "Chưa phân loại" — passed straight to
        // `onAddRow` so its own "+" adds another uncategorized row, same
        // as the generic "+ Thêm chi phí" button above the table.
        groupCostCategoryId: key === UNCATEGORIZED_KEY ? '' : key,
        categoryLabel:
          key === UNCATEGORIZED_KEY
            ? 'Chưa phân loại'
            : costCategoryLabel(costCategoriesById.get(key)),
        subtotal: groupRows.reduce((sum, row) => sum + (row.amount ?? 0), 0),
      },
      ...groupRows,
    ]);

  // STT (số thứ tự) numbers actual cost lines only, in table display order
  // — group header rows aren't counted, so it stays "1, 2, 3, ..." across
  // the whole grid rather than resetting per category group.
  const sttByRowKey = new Map(
    groupedTableRows
      .filter((row) => !(/** @type {any} */ (row).__isGroupHeader))
      .map((row, index) => [row.rowKey, index + 1]),
  );

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').ShipmentCostLineRow & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'stt',
      header: 'STT',
      width: pixel(48),
      align: 'center',
      renderCell: (row) => (
        <Text color="secondary" hasTabularNumbers>
          {sttByRowKey.get(row.rowKey)}
        </Text>
      ),
    },
    {
      key: 'costCategoryId',
      header: 'Nhóm chi phí',
      width: pixel(320),
      renderCell: (row) => (
        <ReadOnlyLock isActive={isReadOnly}>
          <Selector
            label="Nhóm chi phí"
            isLabelHidden
            hasSearch
            placeholder={isReadOnly ? '—' : 'Chọn nhóm LOG'}
            value={row.costCategoryId}
            onChange={(value) =>
              onUpdateRowField(row.rowKey, 'costCategoryId', value ?? '')
            }
            options={costCategories.map((costCategory) => ({
              value: costCategory.id,
              label: costCategoryLabel(costCategory),
              description: costCategory.note ?? undefined,
            }))}
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
          placeholder={isReadOnly ? '—' : 'Ví dụ: O/F, THC xuất, D/O'}
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
      key: 'costNature',
      header: 'Cost Nature',
      width: pixel(150),
      renderCell: (row) => (
        <ReadOnlyLock isActive={isReadOnly}>
          <Selector
            label="Cost Nature"
            isLabelHidden
            value={row.costNature}
            onChange={(value) =>
              onUpdateRowField(row.rowKey, 'costNature', value ?? 'Standard')
            }
            options={COST_NATURE_OPTIONS}
            width="100%"
          />
        </ReadOnlyLock>
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
          onChange={(value) =>
            onUpdateRowField(row.rowKey, 'invoiceNumber', value)
          }
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
          <HStack gap={1} vAlign="center">
            <Text weight="semibold" color="secondary">
              {row.categoryLabel}
            </Text>
            <IconButton
              isDisabled={isReadOnly}
              label={`Thêm chi phí vào ${row.categoryLabel}`}
              tooltip="Thêm dòng vào nhóm này"
              icon={<Icon icon={IconPlus} size="sm" />}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onAddRow(row.groupCostCategoryId)}
            />
          </HStack>
        );
      }
      if (column.key === 'amount') {
        return (
          <Text weight="semibold" hasTabularNumbers>
            {formatVndAmount(row.subtotal)}
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
          onClick={() => onAddRow()}
        />
        {rows.length > 0 ? (
          <HStack gap={3} vAlign="center">
            {abnormalTotal > 0 ? (
              <Text color="secondary">
                Trong đó Abnormal: {formatVndAmount(abnormalTotal)}
              </Text>
            ) : null}
            <Text weight="semibold">
              Tổng chi phí: {formatVndAmount(total)}
            </Text>
          </HStack>
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
    </VStack>
  );
}
