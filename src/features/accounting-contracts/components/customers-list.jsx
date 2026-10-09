'use client';

import { Icon } from '@astryxdesign/core/Icon';
import { StackItem } from '@astryxdesign/core/Stack';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { VStack } from '@astryxdesign/core/VStack';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import {
  AdvanceTable,
  AdvanceTableErrorBanner,
} from '@/shared/components/advance-table.jsx';
import {
  MetaCellText,
  MetaListTitle,
  MetaPrimaryCell,
  MetaRowActions,
} from '@/shared/components/custom/meta/list-parts.jsx';

import {
  useCustomersQuery,
  useDeleteCustomerMutation,
} from '../hooks/use-catalogs.js';
import { ConfirmDeleteDialog } from './confirm-delete-dialog.jsx';
import { CustomerFormDialog } from './customer-form-dialog.jsx';

/** @satisfies {ReadonlyArray<import('@astryxdesign/core/PowerSearch').FieldDefinition>} */
const SEARCH_FIELD_DEFS = [
  { key: 'name', type: 'string', label: 'Tên khách hàng' },
  { key: 'taxCode', type: 'string', label: 'Mã số thuế' },
  { key: 'contactPerson', type: 'string', label: 'Người liên hệ' },
  { key: 'phone', type: 'string', label: 'Điện thoại' },
];

const COLUMN_OPTIONS = [
  { key: 'name', label: 'Tên khách hàng', isAlwaysVisible: true },
  { key: 'taxCode', label: 'Mã số thuế' },
  { key: 'contactPerson', label: 'Người liên hệ' },
  { key: 'phone', label: 'Điện thoại' },
  { key: 'email', label: 'Email' },
  { key: 'address', label: 'Địa chỉ' },
  { key: 'actions', label: 'Thao tác', isAlwaysVisible: true },
];

/** @typedef {import('../types/index.js').AccountingCustomer} AccountingCustomer */

/** @param {'taxCode' | 'contactPerson' | 'phone' | 'email' | 'address'} key @param {string} header @param {number} width */
function textColumn(key, header, width) {
  return {
    key,
    header,
    width: proportional(width),
    filter: key,
    renderCell: (/** @type {AccountingCustomer} */ customer) => (
      <MetaCellText value={customer[key]} />
    ),
  };
}

/** Accounting customers: list, create, edit, delete. */
export function AccountingCustomersList() {
  const [editing, setEditing] = useState(
    /** @type {AccountingCustomer | null} */ (null),
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(
    /** @type {AccountingCustomer | null} */ (null),
  );

  const customersQuery = useCustomersQuery();
  const deleteMutation = useDeleteCustomerMutation();
  const result = customersQuery.data;
  const customers = result?.success ? result.data : [];

  /** @param {AccountingCustomer | null} customer */
  function openForm(customer) {
    setEditing(customer);
    setIsFormOpen(true);
  }

  /** @type {import('@astryxdesign/core/Table').TableColumn<AccountingCustomer & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'name',
      header: 'Tên khách hàng',
      width: proportional(2),
      filter: 'name',
      renderCell: (customer) => (
        <MetaPrimaryCell>{customer.name}</MetaPrimaryCell>
      ),
    },
    textColumn('taxCode', 'Mã số thuế', 1),
    textColumn('contactPerson', 'Người liên hệ', 1),
    textColumn('phone', 'Điện thoại', 1),
    textColumn('email', 'Email', 1.2),
    textColumn('address', 'Địa chỉ', 2),
    {
      key: 'actions',
      header: 'Thao tác',
      width: pixel(96),
      align: 'end',
      renderCell: (customer) => (
        <MetaRowActions
          recordLabel={customer.name}
          onEdit={() => openForm(customer)}
          onDelete={() => setDeleting(customer)}
        />
      ),
    },
  ];

  return (
    <VStack gap={4} hAlign="stretch" height="100%">
      {result && !result.success ? (
        <AdvanceTableErrorBanner message={result.message} />
      ) : null}

      <StackItem size="fill">
        <AdvanceTable
          title={
            <MetaListTitle
              title="Khách hàng Kế toán"
              count={result?.success ? customers.length : undefined}
              unit="khách hàng"
            />
          }
          isFramed
          isStriped
          dividers="rows"
          primaryAction={{
            label: 'Thêm khách hàng',
            icon: <Icon icon={Plus} size="sm" />,
            onClick: () => openForm(null),
          }}
          toolbarLabel="Thao tác danh sách khách hàng"
          searchFieldDefs={SEARCH_FIELD_DEFS}
          entityLabel="Khách hàng Kế toán"
          contentSearchFieldKey="name"
          searchPlaceholder="Tìm tên khách hàng..."
          columnOptions={COLUMN_OPTIONS}
          tableColumns={columns}
          data={customers}
          idKey="id"
          isLoading={customersQuery.isLoading}
          onRefresh={() => customersQuery.refetch()}
          isRefreshing={customersQuery.isFetching}
          fixedEndColumnKeys={['actions']}
        />
      </StackItem>

      <CustomerFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        customer={editing}
      />
      <ConfirmDeleteDialog
        title={deleting ? `Xoá khách hàng ${deleting.name}?` : null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutateAsync(deleting?.id ?? '')}
      />
    </VStack>
  );
}
