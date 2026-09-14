'use client';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { MetadataList } from '@astryxdesign/core/MetadataList';
import { StackItem } from '@astryxdesign/core/Stack';
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
import {
  useDeleteSupplierMutation,
  useSearchSuppliersQuery,
} from '../hooks/use-suppliers-query.js';
import { SupplierFormDialog } from './supplier-form-dialog.jsx';

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

const styles = stylex.create({
  companyNameHeading: {
    textTransform: 'uppercase',
  },
});

/** @param {unknown} value */
function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>]/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char] ?? char,
  );
}

/**
 * Opens a print-ready window for one supplier's profile — same
 * new-window + `window.print()` approach as `AdvanceTable`'s table-level
 * print export (`buildExportTable`'s doc comment), just for a single
 * record's fields instead of a table of rows.
 * @param {import('../types/index.js').Supplier} supplier
 */
function printSupplier(supplier) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  const fields = [
    ['Tên công ty', supplier.companyName],
    ['Người đại diện', orDash(supplier.representativeName)],
    ['Chức vụ', orDash(supplier.representativeTitle)],
    ['Địa chỉ', orDash(supplier.address)],
    ...supplier.extraFields.map(
      (field) =>
        /** @type {[string, string]} */ ([field.key, orDash(field.value)]),
    ),
  ];
  printWindow.document.write(`<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><title>${escapeHtml(supplier.companyName)}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; }
  h1 { font-size: 18px; margin-bottom: 24px; }
  dl { display: grid; grid-template-columns: 200px 1fr; row-gap: 10px; }
  dt { font-weight: bold; color: dimgray; }
  dd { margin: 0; }
</style></head><body>
<h1>${escapeHtml(supplier.companyName)}</h1>
<dl>${fields
    .map(
      ([label, value]) =>
        `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`,
    )
    .join('')}</dl>
</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => printWindow.print();
}

/**
 * @param {object} props
 * @param {import('../types/index.js').Supplier} props.supplier
 * @param {() => void} props.onEdit
 * @param {() => void} props.onDeleteRequest
 */
function SupplierExpandedDetails({ supplier, onEdit, onDeleteRequest }) {
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
            {supplier.companyName}
          </Heading>
          {supplier.representativeName ? (
            <Text color="secondary">
              {supplier.representativeName}
              {supplier.representativeTitle
                ? ` · ${supplier.representativeTitle}`
                : ''}
            </Text>
          ) : null}
        </VStack>
      </HStack>

      <MetadataList columns={4} label={{ position: 'top' }}>
        <MetadataListItem label="Tên công ty">
          {supplier.companyName}
        </MetadataListItem>
        <MetadataListItem label="Người đại diện">
          {orDash(supplier.representativeName)}
        </MetadataListItem>
        <MetadataListItem label="Chức vụ">
          {orDash(supplier.representativeTitle)}
        </MetadataListItem>
        <MetadataListItem label="Địa chỉ">
          {orDash(supplier.address)}
        </MetadataListItem>
        {supplier.extraFields.map((field) => (
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
          onClick={onDeleteRequest}
        />
        <HStack gap={2}>
          <Button
            label="In"
            variant="secondary"
            size="sm"
            icon={<Icon icon={Printer} />}
            onClick={() => printSupplier(supplier)}
          />
          <Button
            label="Sửa nhà cung cấp"
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

export function SuppliersList() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [hasOpenedCreate, setHasOpenedCreate] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(
    /** @type {import('../types/index.js').Supplier | null} */ (null),
  );
  const [expandedSupplierId, setExpandedSupplierId] = useState(
    /** @type {string | null} */ (null),
  );
  const [deletingSupplier, setDeletingSupplier] = useState(
    /** @type {import('../types/index.js').Supplier | null} */ (null),
  );
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(1);
  const [filterConditions, setFilterConditions] = useState(
    /** @type {import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]} */ ([]),
  );

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
      setExpandedSupplierId((current) =>
        current === deletingSupplier.id ? null : current,
      );
      toast({ body: `Đã xoá nhà cung cấp "${deletingSupplier.companyName}".` });
    } else {
      toast({ body: result.message, type: 'error' });
    }
  }

  const suppliersQuery = useSearchSuppliersQuery({
    page: pageIndex,
    pageSize,
    conditions: filterConditions,
  });
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
      conditions: filterConditions,
    });
    return result.success ? enrichSuppliers(result.suppliers) : [];
  }

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').Supplier & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'companyName',
      header: 'Tên công ty',
      width: proportional(1.4),
      filter: 'companyName',
      renderCell: (supplier) => supplier.companyName,
    },
    {
      key: 'representativeName',
      header: 'Người đại diện',
      width: proportional(1),
      filter: 'representativeName',
      renderCell: (supplier) => supplier.representativeName || '—',
    },
    {
      key: 'representativeTitle',
      header: 'Chức vụ',
      width: proportional(0.8),
      filter: 'representativeTitle',
      renderCell: (supplier) => supplier.representativeTitle || '—',
    },
    {
      key: 'address',
      header: 'Địa chỉ',
      width: proportional(1.4),
      filter: 'address',
      renderCell: (supplier) => supplier.address || '—',
    },
    {
      key: 'extraFields',
      header: 'Trường tùy ý',
      width: proportional(1),
      renderCell: (supplier) =>
        supplier.extraFields.length > 0
          ? supplier.extraFields
              .map((field) => `${field.key}: ${field.value}`)
              .join(', ')
          : '—',
    },
  ];

  const expandedIds = useMemo(
    () => new Set(expandedSupplierId ? [expandedSupplierId] : []),
    [expandedSupplierId],
  );
  const rowExpansion = {
    expandedIds,
    onToggle: (/** @type {string} */ supplierId) =>
      setExpandedSupplierId((current) =>
        current === supplierId ? null : supplierId,
      ),
    getRowKey: (/** @type {import('../types/index.js').Supplier} */ supplier) =>
      supplier.id,
    isExpandable: (
      /** @type {import('../types/index.js').Supplier} */ supplier,
    ) => !supplier.id.startsWith('skeleton-'),
    renderExpanded: (
      /** @type {import('../types/index.js').Supplier} */ supplier,
    ) => (
      <SupplierExpandedDetails
        supplier={supplier}
        onEdit={() => setEditingSupplier(supplier)}
        onDeleteRequest={() => setDeletingSupplier(supplier)}
      />
    ),
  };

  return (
    <VStack gap={4} hAlign="stretch" height="100%">
      <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
        <Heading level={1}>Nhà cung cấp</Heading>
        <Button
          label="Thêm nhà cung cấp"
          variant="primary"
          onClick={() => {
            setHasOpenedCreate(true);
            setIsCreateOpen(true);
          }}
        />
      </HStack>

      {listResult && !listResult.success ? (
        <AdvanceTableErrorBanner message={listResult.message ?? 'Không thể tải danh sách nhà cung cấp'} />
      ) : null}

      <StackItem size="fill">
        <AdvanceTable
          toolbarLabel="Thao tác danh sách nhà cung cấp"
          searchFieldDefs={SEARCH_FIELD_DEFS}
          entityLabel="Nhà cung cấp"
          contentSearchFieldKey="companyName"
          searchPlaceholder="Tìm công ty, địa chỉ..."
          filterFieldDefs={FILTER_FIELD_DEFS}
          advancedFilterConditions={filterConditions}
          onAdvancedFilterChange={setFilterConditions}
          columnOptions={COLUMN_OPTIONS}
          tableColumns={columns}
          data={searchableSuppliers}
          idKey="id"
          isLoading={suppliersQuery.isLoading}
          skeletonRows={skeletonRows}
          rowExpansion={rowExpansion}
          fetchAllRows={fetchAllSuppliers}
          onRefresh={() => suppliersQuery.refetch()}
          isRefreshing={suppliersQuery.isFetching}
          defaultStickyEnd="none"
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

