'use client';
import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { MetadataList } from '@astryxdesign/core/MetadataList';
import { proportional } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Building2, Pencil, Printer, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  AdvanceTable,
  AdvanceTableErrorBanner,
} from '@/shared/components/advance-table.jsx';
import {
  expandableRowStyles,
  UnderlinedMetadataListItem as MetadataListItem,
} from '@/shared/components/expandable-row-styles.jsx';

import {
  COLUMN_OPTIONS,
  DEFAULT_PAGE_SIZE,
  FILTER_FIELD_DEFS,
  PAGE_SIZE_OPTIONS,
  SEARCH_FIELD_DEFS,
  skeletonRows,
} from '../config/customers-table.js';
import { useSearchCustomersQuery } from '../hooks/use-customers-query.js';
import { CustomerFormDialog } from './customer-form-dialog.jsx';

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

const styles = stylex.create({
  companyNameHeading: {
    textTransform: 'uppercase',
  },
});

/**
 * @param {object} props
 * @param {import('../types/index.js').Customer} props.customer
 * @param {() => void} props.onEdit
 */
function CustomerExpandedDetails({ customer, onEdit }) {
  return (
    <VStack gap={4} hAlign="stretch" xstyle={expandableRowStyles.expandedPanel}>
      <HStack gap={3} vAlign="center">
        <HStack
          vAlign="center"
          hAlign="center"
          xstyle={expandableRowStyles.expandedIcon}
        >
          <Icon icon={Building2} size="md" />
        </HStack>
        <VStack gap={1}>
          <Heading level={3} xstyle={styles.companyNameHeading}>
            {customer.companyName}
          </Heading>
          {customer.representativeName ? (
            <Text color="secondary">
              {customer.representativeName}
              {customer.representativeTitle
                ? ` · ${customer.representativeTitle}`
                : ''}
            </Text>
          ) : null}
        </VStack>
      </HStack>

      <MetadataList columns={4} label={{ position: 'top' }}>
        <MetadataListItem label="Tên công ty">
          {customer.companyName}
        </MetadataListItem>
        <MetadataListItem label="Người đại diện">
          {orDash(customer.representativeName)}
        </MetadataListItem>
        <MetadataListItem label="Chức vụ">
          {orDash(customer.representativeTitle)}
        </MetadataListItem>
        <MetadataListItem label="Địa chỉ">
          {orDash(customer.address)}
        </MetadataListItem>
        {customer.extraFields.map((field) => (
          <MetadataListItem key={field.key} label={field.key}>
            {orDash(field.value)}
          </MetadataListItem>
        ))}
      </MetadataList>

      <Divider />

      <HStack hAlign="between" vAlign="center">
        <Button
          label="Xoá"
          variant="ghost"
          size="sm"
          icon={<Icon icon={Trash2} />}
          isDisabled
          tooltip="Chưa hỗ trợ"
        />
        <HStack gap={2}>
          <Button
            label="In"
            variant="secondary"
            size="sm"
            icon={<Icon icon={Printer} />}
            isDisabled
            tooltip="Chưa hỗ trợ"
          />
          <Button
            label="Sửa khách hàng"
            variant="primary"
            size="sm"
            icon={<Icon icon={Pencil} />}
            onClick={onEdit}
          />
        </HStack>
      </HStack>
    </VStack>
  );
}

export function CustomersList() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [hasOpenedCreate, setHasOpenedCreate] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(
    /** @type {import('../types/index.js').Customer | null} */ (null),
  );
  const [expandedCustomerId, setExpandedCustomerId] = useState(
    /** @type {string | null} */ (null),
  );
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(1);
  const [filterConditions, setFilterConditions] = useState(
    /** @type {import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]} */ ([]),
  );

  const customersQuery = useSearchCustomersQuery({
    page: pageIndex,
    pageSize,
    conditions: filterConditions,
  });
  const listResult = customersQuery.data;
  const customers = listResult?.success ? listResult.customers : [];
  const totalCustomers = listResult?.success ? listResult.totalCount : 0;
  const totalPages = Math.max(
    1,
    listResult?.success ? listResult.totalPages : 1,
  );

  const searchableCustomers = customers.map((customer) => ({
    ...customer,
    representativeName: customer.representativeName ?? '',
    representativeTitle: customer.representativeTitle ?? '',
    address: customer.address ?? '',
  }));

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').Customer & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'companyName',
      header: 'Tên công ty',
      width: proportional(1.4),
      filter: 'companyName',
      renderCell: (customer) => customer.companyName,
    },
    {
      key: 'representativeName',
      header: 'Người đại diện',
      width: proportional(1),
      filter: 'representativeName',
      renderCell: (customer) => customer.representativeName || '—',
    },
    {
      key: 'representativeTitle',
      header: 'Chức vụ',
      width: proportional(0.8),
      filter: 'representativeTitle',
      renderCell: (customer) => customer.representativeTitle || '—',
    },
    {
      key: 'address',
      header: 'Địa chỉ',
      width: proportional(1.4),
      filter: 'address',
      renderCell: (customer) => customer.address || '—',
    },
    {
      key: 'extraFields',
      header: 'Trường tùy ý',
      width: proportional(1),
      renderCell: (customer) =>
        customer.extraFields.length > 0
          ? customer.extraFields
              .map((field) => `${field.key}: ${field.value}`)
              .join(', ')
          : '—',
    },
  ];

  const expandedIds = useMemo(
    () => new Set(expandedCustomerId ? [expandedCustomerId] : []),
    [expandedCustomerId],
  );
  const rowExpansion = {
    expandedIds,
    onToggle: (/** @type {string} */ customerId) =>
      setExpandedCustomerId((current) =>
        current === customerId ? null : customerId,
      ),
    getRowKey: (/** @type {import('../types/index.js').Customer} */ customer) =>
      customer.id,
    isExpandable: (/** @type {import('../types/index.js').Customer} */ customer) =>
      !customer.id.startsWith('skeleton-'),
    renderExpanded: (/** @type {import('../types/index.js').Customer} */ customer) => (
      <CustomerExpandedDetails
        customer={customer}
        onEdit={() => setEditingCustomer(customer)}
      />
    ),
  };

  return (
    <VStack gap={4} hAlign="stretch">
      <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
        <Heading level={1}>Khách hàng</Heading>
        <Button
          label="Thêm khách hàng"
          variant="primary"
          onClick={() => {
            setHasOpenedCreate(true);
            setIsCreateOpen(true);
          }}
        />
      </HStack>

      {listResult && !listResult.success ? (
        <AdvanceTableErrorBanner message={listResult.message} />
      ) : null}

      <AdvanceTable
        toolbarLabel="Thao tác danh sách khách hàng"
        searchFieldDefs={SEARCH_FIELD_DEFS}
        entityLabel="Khách hàng"
        contentSearchFieldKey="companyName"
        searchPlaceholder="Tìm công ty, địa chỉ..."
        filterFieldDefs={FILTER_FIELD_DEFS}
        advancedFilterConditions={filterConditions}
        onAdvancedFilterChange={setFilterConditions}
        columnOptions={COLUMN_OPTIONS}
        tableColumns={columns}
        data={searchableCustomers}
        idKey="id"
        isLoading={customersQuery.isLoading}
        skeletonRows={skeletonRows}
        rowExpansion={rowExpansion}
        onRefresh={() => customersQuery.refetch()}
        isRefreshing={customersQuery.isFetching}
        defaultStickyEnd="none"
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

      {hasOpenedCreate ? (
        <CustomerFormDialog
          isOpen={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSuccess={() => setIsCreateOpen(false)}
        />
      ) : null}

      {editingCustomer ? (
        <CustomerFormDialog
          key={editingCustomer.id}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setEditingCustomer(null);
          }}
          customer={editingCustomer}
          onSuccess={() => setEditingCustomer(null)}
        />
      ) : null}
    </VStack>
  );
}
