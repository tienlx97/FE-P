'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { CirclePlus, FileSpreadsheet, ListChecks, Plus } from 'lucide-react';
import { useState } from 'react';

import {
  MetaMetricsCard,
  MetaPill,
  MetaRowActions,
  MetaTableCard,
} from '@/shared/components/custom/meta/index.js';
import { Table } from '@/shared/components/table.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';
import { downloadBlob } from '@/shared/config/download-blob.js';

import {
  buildInstallmentWorkbook,
  installmentWorkbookFileName,
} from '../config/installments-workbook.js';
import { formatVnd } from '../config/money.js';
import { useContractChildMutation } from '../hooks/use-contract-children.js';
import { ConfirmDeleteDialog } from './confirm-delete-dialog.jsx';
import { InstallmentFormDialog } from './installment-form-dialog.jsx';
import { SubInstallmentFormDialog } from './sub-installment-form-dialog.jsx';

/** @typedef {import('../types/index.js').AccountingInstallment} Installment */
/** @typedef {import('../types/index.js').AccountingSubInstallment} Sub */

/**
 * "Đợt thanh toán" tab: quyết toán / đã thanh toán / chưa thanh toán
 * cards, then one card per stage (its payments as table rows, totals in the footer).
 * @param {{
 *   detail: import('../types/index.js').AccountingContractDetail,
 *   metrics: ReturnType<typeof import('../config/contract-view.js').contractMetrics>,
 *   createKey: number | null,
 * }} props
 */
export function InstallmentsPanel({ detail, metrics, createKey }) {
  const contractId = detail.contract.id;
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

  /** @param {Installment} stage @returns {import('@/shared/components/advance-table.jsx').AdvanceTableColumn<Sub>[]} */
  function paymentColumns(stage) {
    return [
      {
        key: 'code',
        header: 'Lần',
        width: pixel(150),
        renderCell: (sub) => <Text weight="bold">{sub.code}</Text>,
      },
      {
        key: 'valueBeforeTax',
        header: 'Trước thuế (VND)',
        width: pixel(160),
        align: 'end',
        renderCell: (sub) => (
          <Text hasTabularNumbers>{formatVnd(sub.valueBeforeTax)}</Text>
        ),
      },
      {
        key: 'taxRatePercent',
        header: 'Thuế',
        width: pixel(80),
        align: 'end',
        renderCell: (sub) => (
          <Text hasTabularNumbers>{sub.taxRatePercent}%</Text>
        ),
      },
      {
        key: 'valueAfterTax',
        header: 'Sau thuế (VND)',
        width: pixel(160),
        align: 'end',
        renderCell: (sub) => (
          <Text weight="bold" hasTabularNumbers>
            {formatVnd(sub.valueAfterTax)}
          </Text>
        ),
      },
      {
        key: 'actualPaidAmount',
        header: 'Thực tế thanh toán (VND)',
        width: pixel(190),
        align: 'end',
        renderCell: (sub) => (
          <Text color={/** @type {any} */ ('meta-success')} hasTabularNumbers>
            {formatVnd(sub.actualPaidAmount)}
          </Text>
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

  const [isExporting, setIsExporting] = useState(false);

  /** ExcelJS is loaded on first use, like the list exports. */
  async function exportExcel() {
    setIsExporting(true);
    try {
      const excelModule = await import('exceljs');
      const ExcelJS = /** @type {typeof import('exceljs')} */ (
        'default' in excelModule ? excelModule.default : excelModule
      );
      const exportedAt = new Date();
      const contractNumber = detail.contract.contractNumber;
      const workbook = buildInstallmentWorkbook(ExcelJS, {
        contract: detail.contract,
        installments: detail.installments,
        exportedAt,
      });
      const buffer = await workbook.xlsx.writeBuffer();
      downloadBlob(
        new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        installmentWorkbookFileName(contractNumber, exportedAt),
      );
    } finally {
      setIsExporting(false);
    }
  }

  const stages = detail.installments
    .slice()
    .sort((a, b) => a.number - b.number);

  const stageActions = (
    <HStack gap={2} vAlign="center" wrap="nowrap">
      <Button
        label="Xuất Excel"
        variant="secondary"
        icon={<Icon icon={FileSpreadsheet} size="sm" />}
        isLoading={isExporting}
        isDisabled={stages.every((stage) => stage.subInstallments.length === 0)}
        onClick={exportExcel}
      />
      <Button
        label="Thêm đợt thanh toán"
        variant="primary"
        icon={<Icon icon={CirclePlus} size="sm" />}
        onClick={() => setInstallmentForm({ isOpen: true, installment: null })}
      />
    </HStack>
  );

  /** @param {Installment} stage */
  function stageStatus(stage) {
    const subs = stage.subInstallments;
    if (subs.length > 0 && subs.every((sub) => sub.status === 'Paid')) {
      return <MetaPill label="Đã thanh toán" tone="success" hasDot />;
    }
    if (subs.some((sub) => sub.status === 'Paid')) {
      return <MetaPill label="Thanh toán một phần" tone="accent" hasDot />;
    }
    return <MetaPill label="Kế hoạch" tone="muted" hasDot />;
  }

  return (
    <VStack gap={5} hAlign="stretch">
      <MetaMetricsCard
        isStandalone
        title="TIẾN ĐỘ THANH TOÁN"
        metrics={[metrics.settlement, metrics.paid, metrics.unpaid]}
        maxColumns={3}
      />

      {stages.length === 0 ? (
        <MetaTableCard
          icon={ListChecks}
          title="Đợt thanh toán"
          subtitle="Mỗi đợt có một hoặc nhiều lần thanh toán"
          actions={stageActions}
          isEmpty
          emptyLabel="Chưa có đợt thanh toán"
        />
      ) : (
        <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap">
          <VStack gap={0}>
            <Heading level={3}>Các đợt thanh toán</Heading>
            <Text color="secondary">
              {stages.length} đợt · mỗi đợt có một hoặc nhiều lần thanh toán
            </Text>
          </VStack>
          {stageActions}
        </HStack>
      )}

      {stages.map((stage) => {
        const unpaid = Math.max(0, stage.amount - stage.paidAmount);
        return (
          <MetaTableCard
            key={stage.id}
            icon={ListChecks}
            title={`Đợt ${stage.number}`}
            subtitle={stage.note ?? undefined}
            actions={
              <>
                {stageStatus(stage)}
                <Button
                  label="Thêm lần"
                  variant="secondary"
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
              </>
            }
            footerStart={
              <Text weight="medium" color="secondary">
                {stage.subInstallments.length} lần thanh toán
              </Text>
            }
            footerEnd={
              <HStack gap={5} vAlign="center" wrap="wrap">
                <HStack gap={2} vAlign="center" wrap="nowrap">
                  <Text size="sm" weight="bold">
                    GIÁ TRỊ ĐỢT:
                  </Text>
                  <Text weight="bold" hasTabularNumbers>
                    {formatVnd(stage.amount)} VND
                  </Text>
                </HStack>
                <HStack gap={2} vAlign="center" wrap="nowrap">
                  <Text size="sm" weight="bold">
                    ĐÃ THANH TOÁN:
                  </Text>
                  <Text
                    color={/** @type {any} */ ('meta-success')}
                    weight="bold"
                    hasTabularNumbers
                  >
                    {formatVnd(stage.paidAmount)} VND
                  </Text>
                </HStack>
                <HStack gap={2} vAlign="center" wrap="nowrap">
                  <Text size="sm" weight="bold">
                    CHƯA THANH TOÁN:
                  </Text>
                  <Text
                    color={/** @type {any} */ ('meta-danger')}
                    weight="bold"
                    hasTabularNumbers
                  >
                    {formatVnd(unpaid)} VND
                  </Text>
                </HStack>
              </HStack>
            }
          >
            <Table
              columns={paymentColumns(stage)}
              data={stage.subInstallments}
              idKey="id"
              dividers="rows"
              density="spacious"
            />
          </MetaTableCard>
        );
      })}

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
        contract={detail.contract}
      />
      <SubInstallmentFormDialog
        contractId={contractId}
        isOpen={subForm.isOpen}
        onOpenChange={(isOpen) =>
          setSubForm((current) => ({ ...current, isOpen }))
        }
        installment={subForm.installment}
        sub={subForm.sub}
        contract={detail.contract}
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
