'use client';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Button } from '@astryxdesign/core/Button';
import { Carousel } from '@astryxdesign/core/Carousel';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Link } from '@astryxdesign/core/Link';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Text } from '@astryxdesign/core/Text';
import { Tooltip } from '@astryxdesign/core/Tooltip';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';

import {
  AdvanceTable,
  AdvanceTableErrorBanner,
} from '@/shared/components/advance-table.jsx';
import { MetaCountBadge } from '@/shared/components/custom/meta/count-badge.jsx';
import {
  MetaCellText,
  MetaListTitle,
  MetaRowActions,
  MetaStackedCell,
} from '@/shared/components/custom/meta/list-parts.jsx';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { searchSuppliers } from '../api/suppliers.js';
import {
  COLUMN_OPTIONS,
  DEFAULT_PAGE_SIZE,
  FILTER_FIELD_DEFS,
  PAGE_SIZE_OPTIONS,
  SEARCH_FIELD_DEFS,
  skeletonRows,
} from '../config/suppliers-table.js';
import { usePartyLookupsQuery } from '../hooks/use-party-lookups-query.js';
import {
  useDeleteSupplierMutation,
  useSearchSuppliersQuery,
} from '../hooks/use-suppliers-query.js';
import { renderFilterValue } from './filter-value.jsx';
import { SupplierFormDialog } from './supplier-form-dialog.jsx';

const ALL = 'all';

const ORGANIZATION_OPTIONS = [
  { value: ALL, label: 'Tất cả' },
  { value: 'true', label: 'Tổ chức' },
  { value: 'false', label: 'Cá nhân' },
];

const INTERNAL_OPTIONS = [
  { value: ALL, label: 'Tất cả' },
  { value: 'true', label: 'Nội bộ' },
  { value: 'false', label: 'Bên ngoài' },
];

/**
 * Group tab + "Loại đối tượng" / "Nội bộ" → BE search conditions
 * (BE-kt-xnk `supplier-multi-group-filters`). `groupId` matches suppliers
 * in that group, even if they are in others too.
 * @param {{ groupId: string, isOrganization: string, isInternal: string }} filters
 * @returns {import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]}
 */
function quickFilterConditions({ groupId, isOrganization, isInternal }) {
  return [
    ['groupId', groupId],
    ['isOrganization', isOrganization],
    ['isInternal', isInternal],
  ]
    .filter(([, value]) => value !== ALL)
    .map(([field, value]) => ({
      id: `quick-${field}`,
      field,
      operator: 'Equals',
      value,
      valueTo: '',
      connector: 'And',
    }));
}

const styles = stylex.create({
  groupCarousel: {
    flexGrow: 1,
    maxWidth: 'calc(var(--spacing-10) * 18)',
    minWidth: 0,
  },
  companyName: {
    textTransform: 'uppercase',
  },
  // Auto-generated codes ("NCC-1789371175139") read as one token.
  nowrap: {
    whiteSpace: 'nowrap',
  },
});

export function SuppliersList() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [hasOpenedCreate, setHasOpenedCreate] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(
    /** @type {import('../types/index.js').Supplier | null} */ (null),
  );
  const [deletingSupplier, setDeletingSupplier] = useState(
    /** @type {import('../types/index.js').Supplier | null} */ (null),
  );
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(1);
  const [filterConditions, setFilterConditions] = useState(
    /** @type {import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]} */ ([]),
  );
  const [quickFilters, setQuickFilters] = useState({
    groupId: ALL,
    isOrganization: ALL,
    isInternal: ALL,
  });
  const { groups } = usePartyLookupsQuery('supplier');

  /** @param {Partial<typeof quickFilters>} change */
  function changeQuickFilters(change) {
    setQuickFilters((current) => ({ ...current, ...change }));
    setPageIndex(1);
  }

  // Appended after the advanced-filter conditions: BE folds connectors
  // left to right, so a trailing `And` narrows the whole advanced filter.
  const searchConditions = [
    ...filterConditions,
    ...quickFilterConditions(quickFilters),
  ];

  const toast = useAppToast();
  const deleteMutation = useDeleteSupplierMutation();

  // Hard-deletes the catalog entry (BE-kt-xnk `DeleteSupplierCommand`) — the
  // backend itself rejects (foreign-key constraint, surfaced as a generic
  // error here) if the supplier is still referenced by any Shipment/
  // ShipmentCost/ShipmentVgm/Commission, so this never silently orphans
  // that data.
  async function handleConfirmDelete() {
    if (!deletingSupplier) return;
    const result = await deleteMutation.mutateAsync(deletingSupplier.id);
    setDeletingSupplier(null);
    if (result.success) {
      toast({ body: `Đã xoá nhà cung cấp "${deletingSupplier.companyName}".` });
    } else {
      toast({ body: result.message, type: 'error' });
    }
  }

  const suppliersQuery = useSearchSuppliersQuery({
    page: pageIndex,
    pageSize,
    conditions: searchConditions,
  });
  // "Tất cả" tab count — every supplier, whatever filter is active.
  const allSuppliersQuery = useSearchSuppliersQuery({
    page: 1,
    pageSize: 1,
    conditions: [],
  });
  const allSuppliersCount = allSuppliersQuery.data?.success
    ? allSuppliersQuery.data.totalCount
    : undefined;
  const listResult = suppliersQuery.data;
  const suppliers = listResult?.success ? listResult.suppliers : [];
  const totalSuppliers = listResult?.success ? listResult.totalCount : 0;
  const totalPages = Math.max(
    1,
    listResult?.success ? listResult.totalPages : 1,
  );

  /** @param {import('../types/index.js').Supplier[]} rawSuppliers */
  function enrichSuppliers(rawSuppliers) {
    return rawSuppliers.map((supplier) => ({
      ...supplier,
      code: supplier.profile?.code ?? '',
      taxCode: supplier.profile?.taxCode ?? '',
      phone: supplier.profile?.phone ?? '',
      representativeName: supplier.representativeName ?? '',
      representativeTitle: supplier.representativeTitle ?? '',
      address: supplier.address ?? '',
    }));
  }

  const searchableSuppliers = enrichSuppliers(suppliers);

  // "Xuất toàn bộ dữ liệu" in AdvanceTable's export dropdown.
  async function fetchAllSuppliers() {
    const result = await searchSuppliers({
      page: 1,
      pageSize: listResult?.success
        ? Math.max(1, listResult.totalCount)
        : pageSize,
      conditions: searchConditions,
    });
    return result.success ? enrichSuppliers(result.suppliers) : [];
  }

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').Supplier & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'code',
      header: 'Mã NCC',
      width: pixel(176),
      filter: 'code',
      renderCell: (supplier) =>
        supplier.code ? (
          <Text weight="medium" hasTabularNumbers xstyle={styles.nowrap}>
            {String(supplier.code)}
          </Text>
        ) : (
          <MetaCellText value={null} />
        ),
    },
    {
      key: 'companyName',
      header: 'Tên công ty',
      width: proportional(1.6),
      filter: 'companyName',
      renderCell: (supplier) => (
        <Link
          href={`/logistics/suppliers/${supplier.id}`}
          weight="bold"
          color="accent"
          xstyle={styles.companyName}
        >
          {supplier.companyName}
        </Link>
      ),
    },
    {
      key: 'taxCode',
      header: 'Mã số thuế / CCCD',
      width: pixel(168),
      filter: 'taxCode',
      renderCell: (supplier) => (
        <Text color="secondary" hasTabularNumbers>
          <MetaCellText value={String(supplier.taxCode ?? '')} />
        </Text>
      ),
    },
    {
      key: 'representativeName',
      header: 'Người đại diện',
      width: proportional(1),
      filter: 'representativeName',
      renderCell: (supplier) => (
        <MetaStackedCell
          primary={supplier.representativeName}
          secondary={supplier.representativeTitle}
        />
      ),
    },
    {
      key: 'phone',
      header: 'Điện thoại',
      width: pixel(128),
      filter: 'phone',
      renderCell: (supplier) => (
        <Text hasTabularNumbers>
          <MetaCellText value={String(supplier.phone ?? '')} />
        </Text>
      ),
    },
    {
      key: 'address',
      header: 'Địa chỉ',
      width: proportional(1.4),
      filter: 'address',
      renderCell: (supplier) => <MetaCellText value={supplier.address} />,
    },
    {
      key: 'extraFields',
      header: 'Tùy ý',
      width: pixel(80),
      align: 'center',
      renderCell: (supplier) =>
        supplier.extraFields.length === 0 ? (
          <MetaCellText value={null} />
        ) : (
          <Tooltip
            content={supplier.extraFields
              .map((field) => `${field.key}: ${field.value}`)
              .join(' · ')}
          >
            <MetaCountBadge value={`+${supplier.extraFields.length}`} />
          </Tooltip>
        ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: pixel(96),
      align: 'center',
      renderCell: (supplier) =>
        supplier.id.startsWith('skeleton-') ? null : (
          <MetaRowActions
            recordLabel={supplier.companyName}
            onEdit={() => setEditingSupplier(supplier)}
            onDelete={() => setDeletingSupplier(supplier)}
          />
        ),
    },
  ];

  // Tab counts: "Tất cả" is every supplier; a group's `supplierCount` counts
  // each supplier in every group it belongs to. Neither follows the
  // "Loại đối tượng" / "Nội bộ" filters.
  const groupTabs = [
    { value: ALL, label: 'Tất cả', count: allSuppliersCount },
    ...groups.map((/** @type {import('../types/index.js').PartyLookup} */ group) => ({
      value: group.id,
      label: group.name,
      count: group.supplierCount,
    })),
  ];

  const groupTabList = (
    <Carousel
      aria-label="Nhóm nhà cung cấp"
      gap={0}
      xstyle={styles.groupCarousel}
    >
      <TabList
        role="tablist"
        size="md"
        overflow="visible"
        value={quickFilters.groupId}
        onChange={(value) => changeQuickFilters({ groupId: value })}
      >
        {groupTabs.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            panelId="suppliers-table"
            endContent={
              tab.count == null ? undefined : (
                <MetaCountBadge
                  value={tab.count}
                  tone={
                    tab.value === quickFilters.groupId ? 'on-accent' : 'neutral'
                  }
                />
              )
            }
          />
        ))}
      </TabList>
    </Carousel>
  );

  const filterBand = (
    <HStack gap={2} vAlign="center" wrap="nowrap">
      <Selector
        label="Loại đối tượng"
        isLabelHidden
        size="lg"
        value={quickFilters.isOrganization}
        options={ORGANIZATION_OPTIONS}
        renderValue={renderFilterValue('Loại đối tượng:')}
        onChange={(value) => changeQuickFilters({ isOrganization: value })}
      />
      <Selector
        label="Nội bộ"
        isLabelHidden
        size="lg"
        value={quickFilters.isInternal}
        options={INTERNAL_OPTIONS}
        renderValue={renderFilterValue('Nội bộ:')}
        onChange={(value) => changeQuickFilters({ isInternal: value })}
      />
      <Button
        label="Đặt lại"
        icon={<Icon icon={RotateCcw} size="sm" />}
        variant="ghost"
        size="lg"
        onClick={() =>
          changeQuickFilters({
            groupId: ALL,
            isOrganization: ALL,
            isInternal: ALL,
          })
        }
      />
    </HStack>
  );

  return (
    <VStack gap={4} hAlign="stretch" height="100%">
      {listResult && !listResult.success ? (
        <AdvanceTableErrorBanner
          message={listResult.message ?? 'Không thể tải danh sách nhà cung cấp'}
        />
      ) : null}

      <StackItem size="fill">
        <AdvanceTable
          title={
            <MetaListTitle
              title="Danh sách nhà cung cấp"
              count={listResult?.success ? totalSuppliers : undefined}
              unit="nhà cung cấp"
            />
          }
          headerContent={groupTabList}
          isFramed
          toolbarFilters={filterBand}
          dividers="rows"
          primaryAction={{
            label: 'Thêm nhà cung cấp',
            icon: <Icon icon={Plus} size="sm" />,
            onClick: () => {
              setHasOpenedCreate(true);
              setIsCreateOpen(true);
            },
          }}
          toolbarLabel="Thao tác danh sách nhà cung cấp"
          searchFieldDefs={SEARCH_FIELD_DEFS}
          entityLabel="Nhà cung cấp"
          contentSearchFieldKey="companyName"
          searchPlaceholder="Tìm tên công ty..."
          filterFieldDefs={FILTER_FIELD_DEFS}
          advancedFilterConditions={filterConditions}
          onAdvancedFilterChange={setFilterConditions}
          columnOptions={COLUMN_OPTIONS}
          tableColumns={columns}
          data={searchableSuppliers}
          idKey="id"
          isLoading={suppliersQuery.isLoading}
          skeletonRows={skeletonRows}
          fetchAllRows={fetchAllSuppliers}
          onRefresh={() => suppliersQuery.refetch()}
          isRefreshing={suppliersQuery.isFetching}
          fixedEndColumnKeys={['actions']}
          pagination={{
            pageIndex,
            pageSize,
            totalCount: totalSuppliers,
            totalPages,
            onPageIndexChange: setPageIndex,
            onPageSizeChange: setPageSize,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
          }}
        />
      </StackItem>

      {hasOpenedCreate ? (
        <SupplierFormDialog
          isOpen={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSuccess={() => setIsCreateOpen(false)}
        />
      ) : null}

      {editingSupplier ? (
        <SupplierFormDialog
          key={editingSupplier.id}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setEditingSupplier(null);
          }}
          supplier={editingSupplier}
          onSuccess={() => setEditingSupplier(null)}
        />
      ) : null}

      <AlertDialog
        isOpen={deletingSupplier != null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDeletingSupplier(null);
        }}
        title={`Xoá "${deletingSupplier?.companyName ?? ''}" khỏi danh mục nhà cung cấp?`}
        description="Nhà cung cấp đang được dùng làm forwarder, đơn vị chi phí, hãng vận chuyển VGM hoặc bên nhận hoa hồng sẽ không xoá được. Hành động này không thể hoàn tác."
        actionLabel="Xoá"
        isActionLoading={deleteMutation.isPending}
        onAction={handleConfirmDelete}
      />
    </VStack>
  );
}
