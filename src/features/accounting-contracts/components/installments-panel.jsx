'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Table } from '@/shared/components/table.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { labelOf, PAYMENT_KIND_OPTIONS } from '../config/child-schemas.js';
import { formatVnd } from '../config/money.js';
import { useContractChildMutation } from '../hooks/use-contract-children.js';
import { ConfirmDeleteDialog } from './confirm-delete-dialog.jsx';
import { InstallmentFormDialog } from './installment-form-dialog.jsx';
import { RowActions } from './row-actions.jsx';
import { SubInstallmentFormDialog } from './sub-installment-form-dialog.jsx';

/** @typedef {import('../types/index.js').AccountingInstallment} Installment */
/** @typedef {import('../types/index.js').AccountingSubInstallment} Sub */

/**
 * "Đợt thanh toán" tab: each instalment is a group header with its
 * sub-instalments (2.1, 2.2…) as rows.
 * @param {{ detail: import('../types/index.js').AccountingContractDetail }} props
 */
export function InstallmentsPanel({ detail }) {
  const contractId = detail.contract.id;
  const valueAfterTax = detail.contract.valueAfterTax;
  const mutation = useContractChildMutation(contractId);

  const [installmentForm, setInstallmentForm] = useState(
    /** @type {{ isOpen: boolean, installment: Installment | null }} */ ({
      isOpen: false,
      installment: null,
    }),
  );
  const [subForm, setSubForm] = useState(
    /** @type {{ isOpen: boolean, installment: Installment | null, sub: Sub | null }} */ ({
      isOpen: false,
      installment: null,
      sub: null,
    }),
  );
  const [deleting, setDeleting] = useState(
    /** @type {{ title: string, path: string } | null} */ (null),
  );

  /** @param {Installment} installment */
  function subColumns(installment) {
    /** @type {import('@astryxdesign/core/Table').TableColumn<Sub & Record<string, unknown>>[]} */
    const columns = [
      {
        key: 'code',
        header: 'Đợt',
        width: pixel(60),
        renderCell: (s) => s.code,
      },
      {
        key: 'kind',
        header: 'Loại',
        width: pixel(130),
        renderCell: (s) =>
          s.kind === 'Percent'
            ? `${labelOf(PAYMENT_KIND_OPTIONS, s.kind)} · ${s.percent}%`
            : labelOf(PAYMENT_KIND_OPTIONS, s.kind),
      },
      {
        key: 'condition',
        header: 'Điều kiện thanh toán',
        width: proportional(1.5),
        renderCell: (s) => s.condition ?? '—',
      },
      {
        key: 'paymentDate',
        header: 'Ngày thanh toán',
        width: pixel(120),
        renderCell: (s) =>
          s.paymentDate ? formatDisplayDate(s.paymentDate) : '—',
      },
      {
        key: 'status',
        header: 'Trạng thái',
        width: pixel(130),
        renderCell: (s) =>
          s.status === 'Paid' ? (
            <Token size="sm" color="green" label="Đã thanh toán" />
          ) : (
            <Token size="sm" color="gray" label="Kế hoạch" />
          ),
      },
      {
        key: 'note',
        header: 'Ghi chú',
        width: proportional(1),
        renderCell: (s) => s.note ?? '—',
      },
      {
        key: 'amount',
        header: 'Giá trị',
        width: pixel(150),
        align: 'end',
        renderCell: (s) => formatVnd(s.amount),
      },
      {
        key: 'actions',
        header: '',
        width: pixel(90),
        renderCell: (s) => (
          <RowActions
            name={`đợt ${s.code}`}
            onEdit={() => setSubForm({ isOpen: true, installment, sub: s })}
            onDelete={() =>
              setDeleting({
                title: `Xoá đợt ${s.code}?`,
                path: `installments/${installment.id}/sub-installments/${s.id}`,
              })
            }
          />
        ),
      },
    ];
    return columns;
  }

  const nextNumber = detail.installments.length + 1;

  return (
    <VStack gap={4} hAlign="stretch">
      <HStack hAlign="between" vAlign="center">
        <Text weight="semibold">Đợt thanh toán</Text>
        <IconButton
          label="Thêm đợt thanh toán"
          tooltip="Thêm đợt thanh toán"
          icon={<Icon icon={Plus} size="sm" />}
          variant="secondary"
          size="sm"
          onClick={() =>
            setInstallmentForm({ isOpen: true, installment: null })
          }
        />
      </HStack>

      {detail.installments.length === 0 ? (
        <Text color="secondary">Chưa có đợt thanh toán</Text>
      ) : null}

      {detail.installments.map((installment) => (
        <VStack key={installment.id} gap={2} hAlign="stretch">
          <HStack hAlign="between" vAlign="center" gap={2}>
            <Text weight="semibold">
              Đợt {installment.number}
              {installment.note ? ` · ${installment.note}` : ''}
            </Text>
            <HStack gap={2} vAlign="center">
              <Text color="secondary">
                {formatVnd(installment.amount)} · đã trả{' '}
                {formatVnd(installment.paidAmount)}
              </Text>
              <IconButton
                label={`Thêm đợt con của đợt ${installment.number}`}
                tooltip="Thêm đợt con"
                icon={<Icon icon={Plus} size="sm" />}
                variant="ghost"
                size="sm"
                onClick={() =>
                  setSubForm({ isOpen: true, installment, sub: null })
                }
              />
              <RowActions
                name={`đợt ${installment.number}`}
                onEdit={() => setInstallmentForm({ isOpen: true, installment })}
                onDelete={() =>
                  setDeleting({
                    title: `Xoá đợt ${installment.number} và các đợt con?`,
                    path: `installments/${installment.id}`,
                  })
                }
              />
            </HStack>
          </HStack>
          <Table
            columns={subColumns(installment)}
            data={installment.subInstallments}
            idKey="id"
            dividers="rows"
            density="compact"
          />
        </VStack>
      ))}

      <InstallmentFormDialog
        contractId={contractId}
        isOpen={installmentForm.isOpen}
        onOpenChange={(isOpen) =>
          setInstallmentForm((current) => ({ ...current, isOpen }))
        }
        installment={installmentForm.installment}
        nextNumber={nextNumber}
        valueAfterTax={valueAfterTax}
      />
      <SubInstallmentFormDialog
        contractId={contractId}
        isOpen={subForm.isOpen}
        onOpenChange={(isOpen) =>
          setSubForm((current) => ({ ...current, isOpen }))
        }
        installment={subForm.installment}
        sub={subForm.sub}
        valueAfterTax={valueAfterTax}
      />
      <ConfirmDeleteDialog
        title={deleting?.title ?? null}
        onClose={() => setDeleting(null)}
        onConfirm={() =>
          mutation.mutateAsync({ kind: 'delete', path: deleting?.path ?? '' })
        }
      />
    </VStack>
  );
}
