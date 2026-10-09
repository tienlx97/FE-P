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
  MetaTintButton,
} from '@/shared/components/custom/meta/index.js';
import { Table } from '@/shared/components/table.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { labelOf, PAYMENT_KIND_OPTIONS } from '../config/child-schemas.js';
import { formatVnd } from '../config/money.js';
import { useContractChildMutation } from '../hooks/use-contract-children.js';
import { ConfirmDeleteDialog } from './confirm-delete-dialog.jsx';
import { InstallmentFormDialog } from './installment-form-dialog.jsx';
import { SubInstallmentFormDialog } from './sub-installment-form-dialog.jsx';

/** @typedef {import('../types/index.js').AccountingInstallment} Installment */
/** @typedef {import('../types/index.js').AccountingSubInstallment} Sub */

/**
 * "Đợt thanh toán" tab: quyết toán / đã thanh toán / chưa thanh toán
 * cards, then one table card per instalment ("Đợt 2") whose rows are its
 * sub-instalments 2.1, 2.2… (paid amounts emerald, status pill), with
 * "+ Đợt con", edit and delete in the card header.
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

  /** @param {Installment} installment */
  function subColumns(installment) {
    /** @type {import('@astryxdesign/core/Table').TableColumn<Sub & Record<string, unknown>>[]} */
    const columns = [
      {
        key: 'code',
        header: 'Lần thanh toán',
        width: pixel(90),
        renderCell: (s) => (
          <Text
            weight="bold"
            color={
              s.status === 'Paid'
                ? /** @type {any} */ ('meta-success')
                : 'accent'
            }
          >
            {s.code}
          </Text>
        ),
      },
      {
        key: 'amount',
        header: 'Số tiền (VND)',
        width: pixel(160),
        align: 'end',
        renderCell: (s) => (
          <Text
            weight="bold"
            hasTabularNumbers
            color={
              s.status === 'Paid'
                ? /** @type {any} */ ('meta-success')
                : 'primary'
            }
          >
            {formatVnd(s.amount)}
          </Text>
        ),
      },
      {
        key: 'kind',
        header: 'Hình thức / Điều kiện',
        width: proportional(2),
        renderCell: (s) => (
          <VStack gap={0}>
            <Text weight="semibold">
              {labelOf(PAYMENT_KIND_OPTIONS, s.kind)}
              {s.kind === 'Percent' ? ` · ${s.percent}%` : ''}
            </Text>
            {s.condition ? <Text color="secondary">{s.condition}</Text> : null}
          </VStack>
        ),
      },
      {
        key: 'paymentDate',
        header: 'Ngày thanh toán',
        width: pixel(160),
        renderCell: (s) => (
          <Text color="secondary" hasTabularNumbers>
            {s.paymentDate ? formatDisplayDate(s.paymentDate) : '—'}
          </Text>
        ),
      },
      {
        key: 'status',
        header: 'Trạng thái',
        width: pixel(150),
        renderCell: (s) =>
          s.status === 'Paid' ? (
            <MetaPill label="Đã thanh toán" tone="success" hasDot />
          ) : (
            <MetaPill label="Kế hoạch" tone="muted" hasDot />
          ),
      },
      {
        key: 'note',
        header: 'Ghi chú',
        width: proportional(1.5),
        renderCell: (s) => <Text color="secondary">{s.note ?? '—'}</Text>,
      },
      {
        key: 'actions',
        header: 'Thao tác',
        width: pixel(110),
        renderCell: (s) => (
          <MetaRowActions
            recordLabel={`đợt ${s.code}`}
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

  return (
    <VStack gap={5} hAlign="stretch">
      <MetaMetricsCard
        isStandalone
        title="TIẾN ĐỘ THANH TOÁN"
        metrics={[metrics.settlement, metrics.paid, metrics.unpaid]}
        maxColumns={3}
      />

      {detail.installments.length === 0 ? (
        <MetaTableCard
          icon={ListChecks}
          title="Đợt thanh toán"
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
          isEmpty
          emptyLabel="Chưa có đợt thanh toán"
        />
      ) : (
        <HStack hAlign="end">
          <Button
            label="Thêm đợt thanh toán"
            variant="primary"
            icon={<Icon icon={CirclePlus} size="sm" />}
            onClick={() =>
              setInstallmentForm({ isOpen: true, installment: null })
            }
          />
        </HStack>
      )}

      {detail.installments.map((installment) => (
        <MetaTableCard
          key={installment.id}
          icon={ListChecks}
          title={`Đợt ${installment.number}`}
          subtitle={installment.note ?? undefined}
          actions={
            <>
              <MetaTintButton
                label="Thêm lần thanh toán"
                icon={<Icon icon={Plus} size="sm" />}
                onClick={() =>
                  setSubForm({ isOpen: true, installment, sub: null })
                }
              />
              <MetaRowActions
                recordLabel={`đợt ${installment.number}`}
                onEdit={() => setInstallmentForm({ isOpen: true, installment })}
                onDelete={() =>
                  setDeleting({
                    title: `Xoá đợt ${installment.number} và các lần thanh toán?`,
                    path: `installments/${installment.id}`,
                  })
                }
              />
            </>
          }
          footerStart={
            <Text weight="medium" color="secondary">
              {installment.subInstallments.length} lần thanh toán · Tổng{' '}
              {formatVnd(installment.amount)} VND
            </Text>
          }
          footerEnd={
            <HStack gap={2} vAlign="center" wrap="nowrap">
              <Text size="sm" weight="bold">
                ĐÃ THANH TOÁN:
              </Text>
              <Text
                weight="bold"
                color={/** @type {any} */ ('meta-success')}
                hasTabularNumbers
              >
                {formatVnd(installment.paidAmount)} VND
              </Text>
            </HStack>
          }
        >
          <Table
            columns={subColumns(installment)}
            data={installment.subInstallments}
            idKey="id"
            dividers="rows"
            density="spacious"
          />
        </MetaTableCard>
      ))}

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
