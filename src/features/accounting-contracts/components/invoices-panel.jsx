'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Table } from '@/shared/components/table.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { formatVnd } from '../config/money.js';
import { useContractChildMutation } from '../hooks/use-contract-children.js';
import { ConfirmDeleteDialog } from './confirm-delete-dialog.jsx';
import { InvoiceFormDialog } from './invoice-form-dialog.jsx';
import { RowActions } from './row-actions.jsx';

/** @typedef {import('../types/index.js').AccountingInvoice} Invoice */

/**
 * "Hoá đơn" tab.
 * @param {{ detail: import('../types/index.js').AccountingContractDetail }} props
 */
export function InvoicesPanel({ detail }) {
  const contractId = detail.contract.id;
  const [editing, setEditing] = useState(/** @type {Invoice | null} */ (null));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(
    /** @type {Invoice | null} */ (null),
  );
  const mutation = useContractChildMutation(contractId);

  /** @type {import('@astryxdesign/core/Table').TableColumn<Invoice & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Số hoá đơn',
      width: pixel(140),
      renderCell: (i) => i.invoiceNumber,
    },
    {
      key: 'issuedDate',
      header: 'Ngày xuất',
      width: pixel(110),
      renderCell: (i) => formatDisplayDate(i.issuedDate),
    },
    {
      key: 'note',
      header: 'Ghi chú',
      width: proportional(1),
      renderCell: (i) => i.note ?? '—',
    },
    {
      key: 'amount',
      header: 'Giá trị',
      width: pixel(150),
      align: 'end',
      renderCell: (i) => formatVnd(i.amount),
    },
    {
      key: 'actions',
      header: '',
      width: pixel(90),
      renderCell: (i) => (
        <RowActions
          name={`hoá đơn ${i.invoiceNumber}`}
          onEdit={() => {
            setEditing(i);
            setIsFormOpen(true);
          }}
          onDelete={() => setDeleting(i)}
        />
      ),
    },
  ];

  return (
    <VStack gap={3} hAlign="stretch">
      <HStack hAlign="between" vAlign="center">
        <Text weight="semibold">Hoá đơn đã xuất</Text>
        <IconButton
          label="Thêm hoá đơn"
          tooltip="Thêm hoá đơn"
          icon={<Icon icon={Plus} size="sm" />}
          variant="secondary"
          size="sm"
          onClick={() => {
            setEditing(null);
            setIsFormOpen(true);
          }}
        />
      </HStack>
      {detail.invoices.length === 0 ? (
        <Text color="secondary">Chưa có hoá đơn</Text>
      ) : (
        <Table
          columns={columns}
          data={detail.invoices}
          idKey="id"
          dividers="rows"
          density="compact"
        />
      )}
      <InvoiceFormDialog
        contractId={contractId}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        invoice={editing}
      />
      <ConfirmDeleteDialog
        title={deleting ? `Xoá hoá đơn ${deleting.invoiceNumber}?` : null}
        onClose={() => setDeleting(null)}
        onConfirm={() =>
          mutation.mutateAsync({
            kind: 'delete',
            path: `invoices/${deleting?.id}`,
          })
        }
      />
    </VStack>
  );
}
