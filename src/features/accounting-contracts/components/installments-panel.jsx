'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { CirclePlus, ListChecks, Plus } from 'lucide-react';
import { useState } from 'react';

import {
  MetaMetricsCard,
  MetaPill,
  MetaRowActions,
  MetaTableCard,
} from '@/shared/components/custom/meta/index.js';
import { TanStackDataTable } from '@/shared/components/tanstack-data-table.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { formatVnd } from '../config/money.js';
import { useContractChildMutation } from '../hooks/use-contract-children.js';
import { ConfirmDeleteDialog } from './confirm-delete-dialog.jsx';
import { InstallmentFormDialog } from './installment-form-dialog.jsx';
import { SubInstallmentFormDialog } from './sub-installment-form-dialog.jsx';

/** @typedef {import('../types/index.js').AccountingInstallment} Installment */
/** @typedef {import('../types/index.js').AccountingSubInstallment} Sub */

/**
 * "Đợt thanh toán" tab: quyết toán / đã thanh toán / chưa thanh toán
 * cards and one summary table row per stage. Edit opens the stage payment table.
 * @param {{
 *   detail: import('../types/index.js').AccountingContractDetail,
 *   metrics: ReturnType<typeof import('../config/contract-view.js').contractMetrics>,
 *   createKey: number | null,
 * }} props
 */
export function InstallmentsPanel({ detail, metrics, createKey }) {
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
  const [expandedIds, setExpandedIds] = useState(new Set());

  /** @param {Installment} stage */
  function renderPayments(stage) {
    /** @type {import('@/shared/components/advance-table.jsx').AdvanceTableColumn<Sub>[]} */
    const paymentColumns = [
      {
        key: 'code',
        header: 'Lần thanh toán',
        width: pixel(150),
        renderCell: (sub) => <Text weight="bold">{sub.code}</Text>,
      },
      {
        key: 'amount',
        header: 'Số tiền (VND)',
        width: pixel(180),
        align: 'end',
        renderCell: (sub) => (
          <Text hasTabularNumbers>{formatVnd(sub.amount)}</Text>
        ),
      },
      {
        key: 'paymentDate',
        header: 'Ngày thanh toán',
        width: pixel(160),
        renderCell: (sub) =>
          sub.paymentDate ? formatDisplayDate(sub.paymentDate) : '—',
      },
      {
        key: 'status',
        header: 'Trạng thái',
        width: pixel(170),
        renderCell: (sub) => (
          <MetaPill
            label={sub.status === 'Paid' ? 'Đã thanh toán' : 'Kế hoạch'}
            tone={sub.status === 'Paid' ? 'success' : 'muted'}
          />
        ),
      },
      {
        key: 'condition',
        header: 'Điều kiện',
        width: proportional(1),
        renderCell: (sub) => sub.condition ?? '—',
      },
      {
        key: 'note',
        header: 'Ghi chú',
        width: proportional(2),
        renderCell: (sub) => <Text color="secondary">{sub.note ?? '—'}</Text>,
      },
      {
        key: 'actions',
        header: 'Thao tác',
        width: pixel(110),
        renderCell: (sub) => (
          <MetaRowActions
            recordLabel={`lần ${sub.code}`}
            onEdit={() => setSubForm({ isOpen: true, installment: stage, sub })}
            onDelete={
              stage.subInstallments.length > 1
                ? () =>
                    setDeleting({
                      title: `Xoá lần thanh toán ${sub.code}?`,
                      path: `installments/${stage.id}/sub-installments/${sub.id}`,
                    })
                : undefined
            }
          />
        ),
      },
    ];
    return (
      <TanStackDataTable
        data={stage.subInstallments}
        columns={paymentColumns}
        idKey="id"
        density="balanced"
        dividers="rows"
        ariaLabel={`Các lần thanh toán của đợt ${stage.number}`}
        emptyState={<Text>Chưa có lần thanh toán</Text>}
      />
    );
  }

  // "+ Thao tác" in the header asks for the create dialog by bumping `createKey`.
  const [handledCreateKey, setHandledCreateKey] = useState(
    /** @type {number | null} */ (null),
  );
  if (createKey !== handledCreateKey) {
    setHandledCreateKey(createKey);
    if (createKey !== null) {
      setInstallmentForm({ isOpen: true, installment: null });
    }
  }

  /** @type {import('@/shared/components/advance-table.jsx').AdvanceTableColumn<Installment>[]} */
  const columns = [
    {
      key: 'number',
      header: 'Đợt thanh toán',
      width: pixel(150),
      renderCell: (stage) => (
        <Text weight="bold" color="accent">
          Đợt {stage.number}
        </Text>
      ),
    },
    {
      key: 'count',
      header: 'Số lần',
      width: pixel(90),
      renderCell: (stage) => stage.subInstallments.length,
    },
    {
      key: 'amount',
      header: 'Giá trị (VND)',
      width: pixel(180),
      align: 'end',
      renderCell: (stage) => (
        <Text weight="bold" hasTabularNumbers>
          {formatVnd(stage.amount)}
        </Text>
      ),
    },
    {
      key: 'paidAmount',
      header: 'Đã thanh toán',
      width: pixel(180),
      align: 'end',
      renderCell: (stage) => (
        <Text
          color={/** @type {any} */ ('meta-success')}
          weight="bold"
          hasTabularNumbers
        >
          {formatVnd(stage.paidAmount)}
        </Text>
      ),
    },
    {
      key: 'unpaid',
      header: 'Chưa thanh toán',
      width: pixel(180),
      align: 'end',
      renderCell: (stage) => (
        <Text color={/** @type {any} */ ('meta-danger')} hasTabularNumbers>
          {formatVnd(Math.max(0, stage.amount - stage.paidAmount))}
        </Text>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: pixel(210),
      renderCell: (stage) =>
        stage.subInstallments.length > 0 &&
        stage.subInstallments.every((sub) => sub.status === 'Paid') ? (
          <MetaPill label="Đã thanh toán" tone="success" hasDot />
        ) : stage.subInstallments.some((sub) => sub.status === 'Paid') ? (
          <MetaPill label="Thanh toán một phần" tone="accent" hasDot />
        ) : (
          <MetaPill label="Kế hoạch" tone="muted" hasDot />
        ),
    },
    {
      key: 'note',
      header: 'Ghi chú',
      width: pixel(300),
      renderCell: (stage) => <Text color="secondary">{stage.note ?? '—'}</Text>,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: pixel(190),
      renderCell: (stage) => (
        <HStack gap={2} wrap="nowrap">
          <Button
            label={`Thêm lần vào đợt ${stage.number}`}
            isIconOnly
            variant="ghost"
            icon={<Icon icon={Plus} size="sm" />}
            onClick={() =>
              setSubForm({ isOpen: true, installment: stage, sub: null })
            }
          />
          <MetaRowActions
            recordLabel={`đợt ${stage.number}`}
            onEdit={() =>
              setInstallmentForm({ isOpen: true, installment: stage })
            }
            onDelete={() =>
              setDeleting({
                title: `Xoá đợt ${stage.number} và các lần thanh toán?`,
                path: `installments/${stage.id}`,
              })
            }
          />
        </HStack>
      ),
    },
  ];

  return (
    <VStack gap={5} hAlign="stretch">
      <MetaMetricsCard
        isStandalone
        title="TIẾN ĐỘ THANH TOÁN"
        metrics={[metrics.settlement, metrics.paid, metrics.unpaid]}
        maxColumns={3}
      />

      <MetaTableCard
        icon={ListChecks}
        title="Đợt thanh toán"
        subtitle="Mỗi đợt có một hoặc nhiều lần thanh toán"
        actions={
          <Button
            label="Thêm đợt thanh toán"
            variant="primary"
            icon={<Icon icon={CirclePlus} size="sm" />}
            onClick={() =>
              setInstallmentForm({ isOpen: true, installment: null })
            }
          />
        }
      >
        <TanStackDataTable
          data={detail.installments.slice().sort((a, b) => a.number - b.number)}
          columns={columns}
          idKey="id"
          density="balanced"
          dividers="rows"
          startKeys={['number']}
          endKeys={['actions']}
          rowExpansion={{
            expandedIds,
            getRowKey: (stage) => stage.id,
            onToggle: (id) =>
              setExpandedIds((current) => {
                const next = new Set(current);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              }),
            renderExpanded: renderPayments,
          }}
          ariaLabel="Các đợt thanh toán"
          emptyState={<Text color="secondary">Chưa có đợt thanh toán</Text>}
        />
      </MetaTableCard>

      <InstallmentFormDialog
        contractId={contractId}
        isOpen={installmentForm.isOpen}
        onOpenChange={(isOpen) =>
          setInstallmentForm((current) => ({ ...current, isOpen }))
        }
        installment={installmentForm.installment}
        nextNumber={
          Math.max(0, ...detail.installments.map((stage) => stage.number)) + 1
        }
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
