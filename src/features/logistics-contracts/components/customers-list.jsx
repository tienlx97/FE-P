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

import { searchCustomers } from '../api/customers.js';
import {
  COLUMN_OPTIONS,
  DEFAULT_PAGE_SIZE,
  FILTER_FIELD_DEFS,
  PAGE_SIZE_OPTIONS,
  SEARCH_FIELD_DEFS,
  skeletonRows,
} from '../config/customers-table.js';
import {
  useDeleteCustomerMutation,
  useSearchCustomersQuery,
} from '../hooks/use-customers-query.js';
import { usePartyLookupsQuery } from '../hooks/use-party-lookups-query.js';
import { CustomerFormDrawer } from './customer-form-drawer.jsx';
import { renderFilterValue } from './filter-value.jsx';

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

// Matches BE-kt-xnk's `CustomerSortFields` allow-list.
const SORTABLE_COLUMN_KEYS = [
  'code',
  'companyName',
  'representativeName',
  'taxCode',
  'phone',
];

/**
 * Group tab + "Loại đối tượng" / "Nội bộ" → BE search conditions
 * (BE-kt-xnk `customer-detail-api`). A customer has one group
 * (`profile.groupId`).
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
  // Auto-generated codes ("KH-1789371175139") read as one token.
  nowrap: {
    whiteSpace: 'nowrap',
  },
});

/**
 * Khách hàng list — same layout as the Khách hàng list
 * (`suppliers-list.jsx`): group tabs with counts, "Loại đối tượng" /
 * "Nội bộ" filters, code + name linking to `/logistics/customers/[id]`,
 * edit / delete row actions.
 */
export function CustomersList() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [hasOpenedCreate, setHasOpenedCreate] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(
    /** @type {import('../types/index.js').Customer | null} */ (null),
  );
  const [deletingCustomer, setDeletingCustomer] = useState(
    /** @type {import('../types/index.js').Customer | null} */ (null),
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
  const { groups } = usePartyLookupsQuery('customer');

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

  const [sort, setSort] = useState(
    /** @type {{ field: string, direction: 'Ascending' | 'Descending' } | null} */ (
      null
    ),
  );
  /** @param {string | null} field @param {'Ascending' | 'Descending'} direction */
  function handleSortChange(field, direction) {
    setSort(field ? { field, direction } : null);
    setPageIndex(1);
  }

  const toast = useAppToast();
  const deleteMutation = useDeleteCustomerMutation();

  // Hard-deletes the catalog entry (BE-kt-xnk `DeleteCustomerCommand`),
  // which refuses (409) while the customer is the buyer of any contract.
  async function handleConfirmDelete() {
    if (!deletingCustomer) return;
    const result = await deleteMutation.mutateAsync(deletingCustomer.id);
    setDeletingCustomer(null);
    if (result.success) {
      toast({ body: `Đã xoá khách hàng "${deletingCustomer.companyName}".` });
    } else {
      toast({ body: result.message, type: 'error' });
    }
  }

  const customersQuery = useSearchCustomersQuery({
    page: pageIndex,
    pageSize,
    conditions: searchConditions,
    sort,
  });
  // "Tất cả" tab count — every customer, whatever filter is active.
  const allCustomersQuery = useSearchCustomersQuery({
    page: 1,
    pageSize: 1,
    conditions: [],
  });
  const allCustomersCount = allCustomersQuery.data?.success
    ? allCustomersQuery.data.totalCount
    : undefined;
  const listResult = customersQuery.data;
  const customers = listResult?.success ? listResult.customers : [];
  const totalCustomers = listResult?.success ? listResult.totalCount : 0;
  const totalPages = Math.max(
    1,
    listResult?.success ? listResult.totalPages : 1,
  );

  /** @param {import('../types/index.js').Customer[]} rawCustomers */
  function enrichCustomers(rawCustomers) {
    return rawCustomers.map((customer) => ({
      ...customer,
      code: customer.profile?.code ?? '',
      taxCode: customer.profile?.taxCode ?? '',
      phone: customer.profile?.phone ?? '',
      representativeName: customer.representativeName ?? '',
      representativeTitle: customer.representativeTitle ?? '',
      address: customer.address ?? '',
    }));
  }

  const searchableCustomers = enrichCustomers(customers);

  // "Xuất toàn bộ dữ liệu" in AdvanceTable's export dropdown.
  async function fetchAllCustomers() {
    const result = await searchCustomers({
      sort,
      page: 1,
      pageSize: listResult?.success
        ? Math.max(1, listResult.totalCount)
        : pageSize,
      conditions: searchConditions,
    });
    return result.success ? enrichCustomers(result.customers) : [];
  }

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').Customer & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'code',
      header: 'Mã KH',
      width: pixel(176),
      filter: 'code',
      renderCell: (customer) =>
        customer.code ? (
          <Text weight="medium" hasTabularNumbers xstyle={styles.nowrap}>
            {String(customer.code)}
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
      renderCell: (customer) => (
        <Link
          href={`/logistics/customers/${customer.id}`}
          weight="bold"
          color="accent"
          xstyle={styles.companyName}
        >
          {customer.companyName}
        </Link>
      ),
    },
    {
      key: 'taxCode',
      header: 'Mã số thuế / CCCD',
      width: pixel(168),
      filter: 'taxCode',
      renderCell: (customer) => (
        <Text color="secondary" hasTabularNumbers>
          <MetaCellText value={String(customer.taxCode ?? '')} />
        </Text>
      ),
    },
    {
      key: 'representativeName',
      header: 'Người đại diện',
      width: proportional(1),
      filter: 'representativeName',
      renderCell: (customer) => (
        <MetaStackedCell
          primary={customer.representativeName}
          secondary={customer.representativeTitle}
        />
      ),
    },
    {
      key: 'phone',
      header: 'Điện thoại',
      width: pixel(128),
      filter: 'phone',
      renderCell: (customer) => (
        <Text hasTabularNumbers>
          <MetaCellText value={String(customer.phone ?? '')} />
        </Text>
      ),
    },
    {
      key: 'address',
      header: 'Địa chỉ',
      width: proportional(1.4),
      filter: 'address',
      renderCell: (customer) => <MetaCellText value={customer.address} />,
    },
    {
      key: 'extraFields',
      header: 'Tùy ý',
      width: pixel(80),
      align: 'center',
      renderCell: (customer) =>
        customer.extraFields.length === 0 ? (
          <MetaCellText value={null} />
        ) : (
          <Tooltip
            content={customer.extraFields
              .map((field) => `${field.key}: ${field.value}`)
              .join(' · ')}
          >
            <MetaCountBadge value={`+${customer.extraFields.length}`} />
          </Tooltip>
        ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: pixel(96),
      align: 'center',
      renderCell: (customer) =>
        customer.id.startsWith('skeleton-') ? null : (
          <MetaRowActions
            recordLabel={customer.companyName}
            onEdit={() => setEditingCustomer(customer)}
            onDelete={() => setDeletingCustomer(customer)}
          />
        ),
    },
  ];

  // Tab counts: "Tất cả" is every customer, a group's `customerCount` its
  // members. Neither follows the "Loại đối tượng" / "Nội bộ" filters.
  const groupTabs = [
    { value: ALL, label: 'Tất cả', count: allCustomersCount },
    ...groups.map((/** @type {import('../types/index.js').PartyLookup} */ group) => ({
      value: group.id,
      label: group.name,
      count: group.customerCount,
    })),
  ];

  const groupTabList = (
    <Carousel
      aria-label="Nhóm khách hàng"
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
            panelId="customers-table"
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
          message={listResult.message ?? 'Không thể tải danh sách khách hàng'}
        />
      ) : null}

      <StackItem size="fill">
        <AdvanceTable
          title={
            <MetaListTitle
              title="Danh sách khách hàng"
              count={listResult?.success ? totalCustomers : undefined}
              unit="khách hàng"
            />
          }
          headerContent={groupTabList}
          isFramed
          toolbarFilters={filterBand}
          dividers="rows"
          primaryAction={{
            label: 'Thêm khách hàng',
            icon: <Icon icon={Plus} size="sm" />,
            onClick: () => {
              setHasOpenedCreate(true);
              setIsCreateOpen(true);
            },
          }}
          toolbarLabel="Thao tác danh sách khách hàng"
          searchFieldDefs={SEARCH_FIELD_DEFS}
          entityLabel="Khách hàng"
          contentSearchFieldKey="companyName"
          searchPlaceholder="Tìm tên công ty..."
          filterFieldDefs={FILTER_FIELD_DEFS}
          advancedFilterConditions={filterConditions}
          onAdvancedFilterChange={setFilterConditions}
          columnOptions={COLUMN_OPTIONS}
          tableColumns={columns}
          data={searchableCustomers}
          idKey="id"
          isLoading={customersQuery.isLoading}
          skeletonRows={skeletonRows}
          fetchAllRows={fetchAllCustomers}
          onRefresh={() => customersQuery.refetch()}
          isRefreshing={customersQuery.isFetching}
          fixedEndColumnKeys={['actions']}
          sort={sort}
          onSortChange={handleSortChange}
          sortableColumnKeys={SORTABLE_COLUMN_KEYS}
          pagination={{
            pageIndex,
            pageSize,
            totalCount: totalCustomers,
            totalPages,
            onPageIndexChange: setPageIndex,
            onPageSizeChange: setPageSize,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
          }}
        />
      </StackItem>

      {hasOpenedCreate ? (
        <CustomerFormDrawer
          isOpen={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSuccess={() => setIsCreateOpen(false)}
        />
      ) : null}

      {editingCustomer ? (
        <CustomerFormDrawer
          key={editingCustomer.id}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setEditingCustomer(null);
          }}
          customer={editingCustomer}
          onSuccess={() => setEditingCustomer(null)}
        />
      ) : null}

      <AlertDialog
        isOpen={deletingCustomer != null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDeletingCustomer(null);
        }}
        title={`Xoá "${deletingCustomer?.companyName ?? ''}" khỏi danh mục khách hàng?`}
        description="Khách hàng đang là bên mua của hợp đồng sẽ không xoá được. Hành động này không thể hoàn tác."
        actionLabel="Xoá"
        isActionLoading={deleteMutation.isPending}
        onAction={handleConfirmDelete}
      />
    </VStack>
  );
}
