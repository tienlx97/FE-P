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

import { APPENDIX_TYPE_OPTIONS, labelOf } from '../config/child-schemas.js';
import { formatVnd } from '../config/money.js';
import { useContractChildMutation } from '../hooks/use-contract-children.js';
import { AppendixFormDialog } from './appendix-form-dialog.jsx';
import { ConfirmDeleteDialog } from './confirm-delete-dialog.jsx';
import { RowActions } from './row-actions.jsx';

/** @typedef {import('../types/index.js').AccountingAppendix} Appendix */

/** @param {Appendix} appendix */
function signedAmount(appendix) {
  if (appendix.type === 'Increase') return `+ ${formatVnd(appendix.amount)}`;
  if (appendix.type === 'Decrease') return `− ${formatVnd(appendix.amount)}`;
  return '—';
}

/**
 * "Phụ lục" tab.
 * @param {{ detail: import('../types/index.js').AccountingContractDetail }} props
 */
export function AppendicesPanel({ detail }) {
  const contractId = detail.contract.id;
  const [editing, setEditing] = useState(/** @type {Appendix | null} */ (null));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(
    /** @type {Appendix | null} */ (null),
  );
  const mutation = useContractChildMutation(contractId);

  /** @type {import('@astryxdesign/core/Table').TableColumn<Appendix & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'type',
      header: 'Loại phụ lục',
      width: proportional(1),
      renderCell: (a) => labelOf(APPENDIX_TYPE_OPTIONS, a.type),
    },
    {
      key: 'signedDate',
      header: 'Ngày ký',
      width: pixel(110),
      renderCell: (a) => formatDisplayDate(a.signedDate),
    },
    {
      key: 'buyerSigned',
      header: 'Bên mua',
      width: pixel(90),
      renderCell: (a) => (a.buyerSigned ? 'Đã ký' : 'Chưa ký'),
    },
    {
      key: 'sellerSigned',
      header: 'Bên bán',
      width: pixel(90),
      renderCell: (a) => (a.sellerSigned ? 'Đã ký' : 'Chưa ký'),
    },
    {
      key: 'note',
      header: 'Ghi chú',
      width: proportional(1.5),
      renderCell: (a) => a.note ?? '—',
    },
    {
      key: 'amount',
      header: 'Số tiền',
      width: pixel(150),
      align: 'end',
      renderCell: (a) => signedAmount(a),
    },
    {
      key: 'actions',
      header: '',
      width: pixel(90),
      renderCell: (a) => (
        <RowActions
          name="phụ lục"
          onEdit={() => {
            setEditing(a);
            setIsFormOpen(true);
          }}
          onDelete={() => setDeleting(a)}
        />
      ),
    },
  ];

  return (
    <VStack gap={3} hAlign="stretch">
      <HStack hAlign="between" vAlign="center">
        <Text weight="semibold">Phụ lục hợp đồng</Text>
        <IconButton
          label="Thêm phụ lục"
          tooltip="Thêm phụ lục"
          icon={<Icon icon={Plus} size="sm" />}
          variant="secondary"
          size="sm"
          onClick={() => {
            setEditing(null);
            setIsFormOpen(true);
          }}
        />
      </HStack>
      {detail.appendices.length === 0 ? (
        <Text color="secondary">Chưa có phụ lục</Text>
      ) : (
        <Table
          columns={columns}
          data={detail.appendices}
          idKey="id"
          dividers="rows"
          density="compact"
        />
      )}
      <AppendixFormDialog
        contractId={contractId}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        appendix={editing}
      />
      <ConfirmDeleteDialog
        title={deleting ? 'Xoá phụ lục này?' : null}
        onClose={() => setDeleting(null)}
        onConfirm={() =>
          mutation.mutateAsync({
            kind: 'delete',
            path: `appendices/${deleting?.id}`,
          })
        }
      />
    </VStack>
  );
}
