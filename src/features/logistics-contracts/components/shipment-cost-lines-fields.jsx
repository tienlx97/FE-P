'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { overlayPaddingReset } from '@astryxdesign/core/Layout';
import { List, ListItem } from '@astryxdesign/core/List';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { IconPlus } from '@/shared/components/icon/icon-plus.jsx';
import { ReadOnlyLock } from '@/shared/components/read-only-lock.jsx';

import { formatMoney } from '../config/currencies.js';
import { useShipmentCostCategoriesQuery } from '../hooks/use-shipment-cost-categories-query.js';
import { useShipmentCostItemTemplatesQuery } from '../hooks/use-shipment-cost-item-templates-query.js';
import { QuickCreateShipmentCostCategoryDialog } from './quick-create-shipment-cost-category-dialog.jsx';

// Sentinel `Selector` value for the trailing "+ Thêm nhóm chi phí" option —
// picking it opens `QuickCreateShipmentCostCategoryDialog` instead of
// assigning it as the row's `costCategoryId`, per user request (2026-09-05)
// to fold that action into the dropdown itself instead of a separate
// `IconButton` beside it.
const ADD_COST_CATEGORY_OPTION_VALUE = '__add_cost_category__';

const styles = stylex.create({
  // Tints a category section's header bar — same token the shared table's
  // totals-row footer uses — so groups read as clear divisions instead of
  // just bold text among plain rows (carried over from the two earlier
  // table-based passes at this tab; still the right call with `List` swapped
  // in for `Table`).
  sectionHeader: {
    backgroundColor: colorVars['--color-background-muted'],
    borderRadius: 6,
    paddingBlock: 8,
    paddingInline: 12,
  },
  // Marks the one row currently open for editing — a plain tinted block
  // with an accent left rule, not a `Card` (Astryx reserves `Card` for
  // dashboard widgets/galleries/settings groups, never list items).
  editPanel: {
    backgroundColor: colorVars['--color-background-muted'],
    borderInlineStartColor: colorVars['--color-border-emphasized'],
    borderInlineStartStyle: 'solid',
    borderInlineStartWidth: 3,
    borderRadius: 6,
  },
});

/**
 * `DropdownMenu` sections for one row's "Chọn tên có sẵn" suggestion picker
 * — templates of the row's own cost category only, once one is chosen
 * (matching "given I picked Trucking, suggest trucking names"); otherwise
 * every template, grouped by category so the list stays scannable instead
 * of one long flat list. Further narrowed to templates whose name contains
 * whatever the row's `name` field currently holds (case/diacritic-insensitive)
 * — so opening the menu after typing part of a name recommends against that
 * text instead of ignoring it.
 * @param {import('../types/index.js').ShipmentCostLineRow} row
 * @param {import('../types/index.js').ShipmentCostItemTemplate[]} costItemTemplates
 * @param {Map<string, import('../types/index.js').ShipmentCostCategory>} costCategoriesById
 * @param {(template: import('../types/index.js').ShipmentCostItemTemplate) => void} onSelect
 */
function suggestionMenuSections(
  row,
  costItemTemplates,
  costCategoriesById,
  onSelect,
) {
  const byCategory = row.costCategoryId
    ? costItemTemplates.filter(
        (template) => template.costCategoryId === row.costCategoryId,
      )
    : costItemTemplates;

  const normalizedQuery = row.name.trim().toLocaleLowerCase('vi');
  const templates = normalizedQuery
    ? byCategory.filter((template) =>
        template.name.toLocaleLowerCase('vi').includes(normalizedQuery),
      )
    : byCategory;

  const groupedByCategory = templates.reduce((groups, template) => {
    const existing = groups.get(template.costCategoryId) ?? [];
    existing.push(template);
    groups.set(template.costCategoryId, existing);
    return groups;
  }, /** @type {Map<string, import('../types/index.js').ShipmentCostItemTemplate[]>} */ (new Map()));

  return Array.from(groupedByCategory.entries())
    .sort(([categoryIdA], [categoryIdB]) =>
      (costCategoriesById.get(categoryIdA)?.name ?? '').localeCompare(
        costCategoriesById.get(categoryIdB)?.name ?? '',
        'vi',
      ),
    )
    .map(([categoryId, templatesInCategory]) => ({
      type: /** @type {const} */ ('section'),
      title: costCategoriesById.get(categoryId)?.name ?? '',
      items: templatesInCategory
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
        .map((template) => ({
          id: template.id,
          label: template.name,
          onClick: () => onSelect(template),
        })),
    }));
}

/**
 * A short, comma-joined summary of a row's supplier/invoice/note for its
 * collapsed `ListItem` description — empty when none are set, so a plain
 * row stays a single line instead of an always-present "Chưa có nhà cung
 * cấp" filler (the previous table design's own complaint, still avoided
 * here).
 * @param {import('../types/index.js').ShipmentCostLineRow} row
 * @param {import('../types/index.js').Customer[]} customers
 */
function detailsSummary(row, customers) {
  const parts = [];
  const supplier = customers.find(
    (customer) => customer.id === row.providerCustomerId,
  );
  if (supplier) parts.push(supplier.companyName);
  if (row.invoiceNumber) parts.push(`HĐ ${row.invoiceNumber}`);
  if (row.note) parts.push(row.note);
  return parts.join(' · ');
}

/**
 * One cost line's open editor — replaces its collapsed `ListItem` in place
 * (see `splitByExpanded` below for why it's never nested *inside* a
 * `ListItem`: Astryx's own `ListItem` docs warn against nesting interactive
 * controls inside an already-interactive item, and its slot API — `label`/
 * `description`/`start`/`endContent` — has no slot for a full form anyway).
 * Every field gets its own visible label here (unlike the previous
 * table-cell version's `isLabelHidden`) since there's no column header
 * doing that job anymore — third redesign of this tab in one day, this
 * time swapping the dense editable-grid approach for `List`/`ListItem`
 * entirely per user request ("dùng cách tiếp cận khác đi").
 * `Name` stays a plain, always free-text `TextInput` — Astryx has no
 * combobox that keeps arbitrary typed text as its own value while also
 * live-filtering suggestions without moving focus off the field (tried and
 * rejected: `Selector`, `Typeahead`/`BaseTypeahead`, a hand-built
 * `usePopover` combobox — see git history for the full investigation).
 * `ShipmentCostItemTemplate` suggestions are surfaced via a `DropdownMenu`
 * beside the field instead; picking one only ever fills the value.
 * @param {{
 *   row: import('../types/index.js').ShipmentCostLineRow,
 *   isReadOnly: boolean,
 *   costCategories: import('../types/index.js').ShipmentCostCategory[],
 *   costItemTemplates: import('../types/index.js').ShipmentCostItemTemplate[],
 *   costCategoriesById: Map<string, import('../types/index.js').ShipmentCostCategory>,
 *   customers: import('../types/index.js').Customer[],
 *   onUpdateRowField: (rowKey: string, field: 'costCategoryId' | 'name' | 'amount' | 'note' | 'providerCustomerId' | 'invoiceNumber', value: number | string | undefined) => void,
 *   onRequestQuickCreateCategory: (rowKey: string) => void,
 *   onRemoveRow: (rowKey: string) => void,
 *   onCollapse: () => void,
 * }} props
 */
function ShipmentCostLineEditor({
  row,
  isReadOnly,
  costCategories,
  costItemTemplates,
  costCategoriesById,
  customers,
  onUpdateRowField,
  onRequestQuickCreateCategory,
  onRemoveRow,
  onCollapse,
}) {
  /** @param {import('../types/index.js').ShipmentCostItemTemplate} template */
  function selectTemplate(template) {
    onUpdateRowField(row.rowKey, 'name', template.name);
    if (!row.costCategoryId) {
      onUpdateRowField(row.rowKey, 'costCategoryId', template.costCategoryId);
    }
  }

  const sections = suggestionMenuSections(
    row,
    costItemTemplates,
    costCategoriesById,
    selectTemplate,
  );
  const hasSuggestions = sections.some((section) => section.items.length > 0);

  return (
    <VStack gap={3} padding={4} xstyle={styles.editPanel}>
      <HStack hAlign="between" vAlign="center">
        <Text weight="semibold">
          {isReadOnly
            ? row.name || 'Khoản chi phí'
            : `${row.name || 'Khoản chi phí mới'} — đang sửa`}
        </Text>
        <Button
          label={isReadOnly ? 'Thu gọn' : 'Xong'}
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCollapse}
        />
      </HStack>

      <HStack gap={2} vAlign="end" wrap="wrap">
        <StackItem size="fill">
          <TextInput
            label="Tên khoản chi phí"
            value={row.name}
            onChange={(value) => onUpdateRowField(row.rowKey, 'name', value)}
            placeholder={isReadOnly ? '—' : 'Ví dụ: Phí THC, Phí D/O'}
            isReadOnly={isReadOnly}
          />
        </StackItem>
        {isReadOnly ? null : (
          <DropdownMenu
            button={{
              label: 'Gợi ý',
              tooltip: 'Chọn tên có sẵn',
              variant: 'secondary',
              size: 'md',
              icon: <Icon icon={Sparkles} size="sm" />,
              isDisabled: !hasSuggestions,
            }}
            items={sections}
          />
        )}
      </HStack>

      <HStack gap={4} wrap="wrap" vAlign="start">
        <StackItem size="fill">
          <ReadOnlyLock isActive={isReadOnly}>
            <Selector
              label="Nhóm chi phí"
              hasSearch
              placeholder={isReadOnly ? '—' : 'Chọn nhóm chi phí'}
              value={row.costCategoryId}
              onChange={(value) => {
                if (value === ADD_COST_CATEGORY_OPTION_VALUE) {
                  onRequestQuickCreateCategory(row.rowKey);
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
        </StackItem>
        <StackItem size="fill">
          <FormattedNumberTextInput
            label="Số tiền"
            value={row.amount}
            onChange={(value) => onUpdateRowField(row.rowKey, 'amount', value)}
            units="đ"
            isReadOnly={isReadOnly}
          />
        </StackItem>
      </HStack>

      <HStack gap={4} wrap="wrap" vAlign="start">
        <StackItem size="fill">
          <ReadOnlyLock isActive={isReadOnly}>
            <Selector
              label="Nhà cung cấp"
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
        </StackItem>
        <StackItem size="fill">
          <TextInput
            label="Số hoá đơn"
            value={row.invoiceNumber}
            onChange={(value) =>
              onUpdateRowField(row.rowKey, 'invoiceNumber', value)
            }
            placeholder={isReadOnly ? '—' : 'Không bắt buộc'}
            isReadOnly={isReadOnly}
          />
        </StackItem>
      </HStack>

      <TextArea
        label="Ghi chú"
        value={row.note}
        onChange={(value) => onUpdateRowField(row.rowKey, 'note', value)}
        placeholder={isReadOnly ? '—' : 'Ghi chú (không bắt buộc)'}
        rows={2}
        width="100%"
        isReadOnly={isReadOnly}
      />

      {isReadOnly ? null : (
        <HStack hAlign="end">
          <Button
            label="Xoá dòng này"
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemoveRow(row.rowKey)}
          />
        </HStack>
      )}
    </VStack>
  );
}

/**
 * Splits one category's rows into alternating runs of collapsed
 * (`{type: 'list', rows}`) and open-for-edit (`{type: 'editor', row}`)
 * entries, so the caller can render each collapsed run as its own `<List>`
 * of plain `ListItem`s and each open row as a `ShipmentCostLineEditor` in
 * between — never mixing the two inside one `<List>`, which would put
 * non-`ListItem` content directly under Astryx's `<ul>` (`List`'s own docs:
 * children should be `ListItem`s).
 * @param {import('../types/index.js').ShipmentCostLineRow[]} groupRows
 * @param {ReadonlySet<string>} expandedIds
 */
function splitByExpanded(groupRows, expandedIds) {
  const runs = [];
  let currentRun = [];
  for (const row of groupRows) {
    if (expandedIds.has(row.rowKey)) {
      if (currentRun.length > 0) {
        runs.push({ type: /** @type {const} */ ('list'), rows: currentRun });
        currentRun = [];
      }
      runs.push({ type: /** @type {const} */ ('editor'), row });
    } else {
      currentRun.push(row);
    }
  }
  if (currentRun.length > 0) {
    runs.push({ type: /** @type {const} */ ('list'), rows: currentRun });
  }
  return runs;
}

/**
 * "Thông tin chi phí logistics" for a Shipment — a `List`/`ListItem` ledger
 * (per user request 2026-09-15, third redesign of this tab in one session:
 * a dense editable `Table` grid, however polished, never stopped reading as
 * "a wall of boxes"; Astryx's own workflow doc already names `List`/`Item`
 * as the sanctioned pattern for dense data, this just hadn't been tried
 * yet). Grouped by cost category into one `<List>` per group (subtotal +
 * "add" in the section header) — replaces the previous single `Table` with
 * synthetic group-header rows, which existed purely to fake this same
 * grouping inside a flat row list. Each cost line is a plain, read-only
 * `ListItem` (name, amount, a short supplier/invoice/note summary) until
 * clicked; clicking swaps it for `ShipmentCostLineEditor`, a full form with
 * every field visibly labeled — so at most a few rows show input controls
 * at once instead of all of them simultaneously, which is what actually
 * produced "wall of boxes" in the two earlier table-based passes today.
 * `Amount` is always VNĐ, no currency selector — see `docs/api/Shipments.md`,
 * BE-kt-xnk.
 * @param {{
 *   rows: import('../types/index.js').ShipmentCostLineRow[],
 *   customers: import('../types/index.js').Customer[],
 *   status?: { type: 'error' | 'success', message: string },
 *   isReadOnly?: boolean,
 *   onAddRow: (costCategoryId?: string) => void,
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

  const [expandedIds, setExpandedIds] = useState(
    /** @type {Set<string>} */ (new Set()),
  );
  function toggleRow(/** @type {string} */ rowKey) {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);
      return next;
    });
  }

  // A freshly-added row (via the top "+" or a group header's own "+") opens
  // straight into its editor instead of appearing as a blank, unclickable-
  // looking collapsed row the user then has to find and click — diffed by
  // `rowKey` (assigned by `generateRowKey()` in the owning hook) rather than
  // by length, so this only fires for a genuine addition, never for an
  // in-place field edit or a removal.
  const knownRowKeysRef = useRef(new Set(rows.map((row) => row.rowKey)));
  useEffect(() => {
    const previousKeys = knownRowKeysRef.current;
    const addedRow = rows.find((row) => !previousKeys.has(row.rowKey));
    if (addedRow) {
      setExpandedIds((previous) => new Set(previous).add(addedRow.rowKey));
    }
    knownRowKeysRef.current = new Set(rows.map((row) => row.rowKey));
  }, [rows]);

  const costCategoriesQuery = useShipmentCostCategoriesQuery();
  const costCategories = costCategoriesQuery.data?.success
    ? costCategoriesQuery.data.costCategories
    : [];
  const costCategoriesById = new Map(
    costCategories.map((costCategory) => [costCategory.id, costCategory]),
  );

  // Fetched once (unfiltered), then filtered per row below — same "one
  // query, not one per row" reasoning `costCategories` above already
  // follows. `ShipmentCost.Name` never gets constrained to one of these
  // (see `ShipmentCostLineEditor`'s own doc comment), so a missing/empty
  // list just means an empty suggestion menu, never a validation problem.
  const costItemTemplatesQuery = useShipmentCostItemTemplatesQuery();
  const costItemTemplates = costItemTemplatesQuery.data?.success
    ? costItemTemplatesQuery.data.costItemTemplates
    : [];

  const total = rows.reduce((sum, row) => sum + (row.amount ?? 0), 0);

  // Rows grouped by cost category (per user request 2026-09-14: was one
  // flat table with a category picker per row, easy to lose track of "how
  // much did Trucking/O·F/Customs cost"). A row with no category yet falls
  // into "Chưa phân loại", sorted last. Groups ordered by category name —
  // stable regardless of add order. Kept as a live computation over `rows`
  // (the in-progress edit, not `shipment.costTotalsByCategory`, a
  // server-computed snapshot) so it stays correct while editing.
  const UNCATEGORIZED_KEY = '__uncategorized__';
  const rowsByCategory = rows.reduce((groups, row) => {
    const key = row.costCategoryId || UNCATEGORIZED_KEY;
    const existing = groups.get(key) ?? [];
    existing.push(row);
    groups.set(key, existing);
    return groups;
  }, /** @type {Map<string, import('../types/index.js').ShipmentCostLineRow[]>} */ (new Map()));

  const sortedGroups = Array.from(rowsByCategory.entries()).sort(
    ([keyA], [keyB]) => {
      if (keyA === UNCATEGORIZED_KEY) return 1;
      if (keyB === UNCATEGORIZED_KEY) return -1;
      const nameA = costCategoriesById.get(keyA)?.name ?? '';
      const nameB = costCategoriesById.get(keyB)?.name ?? '';
      return nameA.localeCompare(nameB, 'vi');
    },
  );

  // STT (số thứ tự) numbers every cost line continuously across groups, in
  // the same display order they render below.
  const sttByRowKey = new Map(
    sortedGroups
      .flatMap(([, groupRows]) => groupRows)
      .map((row, index) => [row.rowKey, index + 1]),
  );

  return (
    <VStack
      gap={4}
      hAlign="stretch"
      {...stylex.props(overlayPaddingReset.reset)}
    >
      <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3} padding={3}>
        <VStack gap={1}>
          <Text color="secondary">
            Tổng chi phí logistics · {rows.length} khoản
          </Text>
          <Text weight="bold" size="xl" hasTabularNumbers>
            {formatMoney(total)} đ
          </Text>
          <Text color="secondary">
            Bấm vào một dòng để xem hoặc sửa nhà cung cấp, hoá đơn và ghi chú.
          </Text>
        </VStack>
        <Button
          isDisabled={isReadOnly}
          label="Thêm chi phí"
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onAddRow()}
        />
      </HStack>

      {rows.length === 0 ? (
        <VStack gap={2} padding={6} hAlign="center">
          <Text weight="semibold">Chưa có khoản chi phí nào</Text>
          <Text color="secondary">
            {isReadOnly
              ? 'Chọn Sửa để bổ sung chi phí cho shipment này.'
              : 'Chọn Thêm chi phí, nhập tên khoản phí và số tiền để bắt đầu.'}
          </Text>
        </VStack>
      ) : (
        <VStack gap={4} hAlign="stretch" padding={3}>
          {sortedGroups.map(([key, groupRows]) => {
            const categoryLabel =
              key === UNCATEGORIZED_KEY
                ? 'Chưa phân loại'
                : (costCategoriesById.get(key)?.name ?? '—');
            const groupCostCategoryId = key === UNCATEGORIZED_KEY ? '' : key;
            const subtotal = groupRows.reduce(
              (sum, row) => sum + (row.amount ?? 0),
              0,
            );
            const runs = splitByExpanded(groupRows, expandedIds);

            return (
              <VStack key={key} gap={2} hAlign="stretch">
                <HStack
                  hAlign="between"
                  vAlign="center"
                  xstyle={styles.sectionHeader}
                >
                  <HStack gap={1} vAlign="center">
                    <Text weight="semibold">{categoryLabel}</Text>
                    <IconButton
                      isDisabled={isReadOnly}
                      label={`Thêm chi phí vào ${categoryLabel}`}
                      tooltip="Thêm dòng vào nhóm này"
                      icon={<Icon icon={IconPlus} size="sm" />}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onAddRow(groupCostCategoryId)}
                    />
                  </HStack>
                  <Text weight="semibold" hasTabularNumbers>
                    {formatMoney(subtotal)} đ
                  </Text>
                </HStack>

                {runs.map((run, runIndex) =>
                  run.type === 'editor' ? (
                    <ShipmentCostLineEditor
                      key={run.row.rowKey}
                      row={run.row}
                      isReadOnly={isReadOnly}
                      costCategories={costCategories}
                      costItemTemplates={costItemTemplates}
                      costCategoriesById={costCategoriesById}
                      customers={customers}
                      onUpdateRowField={onUpdateRowField}
                      onRequestQuickCreateCategory={setQuickCreateForRowKey}
                      onRemoveRow={onRemoveRow}
                      onCollapse={() => toggleRow(run.row.rowKey)}
                    />
                  ) : (
                    // `header` only feeds `aria-labelledby` here — the
                    // category name is already visible above as this
                    // group's own section header (rendered once per group,
                    // not once per run), so a second visible copy for every
                    // run an open editor happens to split a group into
                    // would be redundant on screen.
                    <List
                      key={`run-${runIndex}`}
                      header={<VisuallyHidden>{categoryLabel}</VisuallyHidden>}
                      hasDividers
                      density="compact"
                    >
                      {run.rows.map((row) => (
                        <ListItem
                          key={row.rowKey}
                          label={row.name || 'Khoản chi phí mới'}
                          description={
                            detailsSummary(row, customers) || undefined
                          }
                          startContent={
                            <Text
                              color="secondary"
                              hasTabularNumbers
                              size="sm"
                            >
                              {sttByRowKey.get(row.rowKey)}
                            </Text>
                          }
                          endContent={
                            <HStack gap={2} vAlign="center">
                              <Text weight="semibold" hasTabularNumbers>
                                {formatMoney(row.amount ?? 0)} đ
                              </Text>
                              <Icon
                                icon="chevronRight"
                                size="sm"
                                color="secondary"
                              />
                            </HStack>
                          }
                          onClick={() => toggleRow(row.rowKey)}
                        />
                      ))}
                    </List>
                  ),
                )}
              </VStack>
            );
          })}
        </VStack>
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
