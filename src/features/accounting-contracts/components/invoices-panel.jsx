'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { CirclePlus, ReceiptText } from 'lucide-react';
import { useState } from 'react';

import {
  MetaMetricsCard,
  MetaRowActions,
  MetaTableCard,
} from '@/shared/components/custom/meta/index.js';
import { Table } from '@/shared/components/table.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { formatVnd } from '../config/money.js';
import { useContractChildMutation } from '../hooks/use-contract-children.js';
import { ConfirmDeleteDialog } from './confirm-delete-dialog.jsx';
import { InvoiceFormDialog } from './invoice-form-dialog.jsx';

/** @typedef {import('../types/index.js').AccountingInvoice} Invoice */

/** More invoices than this scroll inside the card, header row pinned. */
const PINNED_HEADER_MIN_ROWS = 8;

const styles = stylex.create({
  // The table's own scroller needs a definite height to scroll its rows
  // (its header cells are sticky inside it); a long list gets one.
  bounded: { height: 'min(65vh, calc(var(--spacing-10) * 12))' },
});

/**
 * "Hoá đơn" tab: quyết toán / đã xuất / còn phải xuất cards, then the
 * invoice table card.
 * @param {{
 *   detail: import('../types/index.js').AccountingContractDetail,
 *   metrics: ReturnType<typeof import('../config/contract-view.js').contractMetrics>,
 *   createKey: number | null,
 * }} props
 */
export function InvoicesPanel({ detail, metrics, createKey }) {
  const contractId = detail.contract.id;
  const [editing, setEditing] = useState(/** @type {Invoice | null} */ (null));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(
    /** @type {Invoice | null} */ (null),
  );
  const mutation = useContractChildMutation(contractId);

  // "+ Thao tác" in the header asks for the create dialog by bumping `createKey`.
  const [handledCreateKey, setHandledCreateKey] = useState(
    /** @type {number | null} */ (null),
  );
  if (createKey !== handledCreateKey) {
    setHandledCreateKey(createKey);
    if (createKey !== null) {
      setEditing(null);
      setIsFormOpen(true);
    }
  }

  /** @type {import('@astryxdesign/core/Table').TableColumn<Invoice & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Số hoá đơn',
      width: pixel(220),
      renderCell: (i) => (
        <Text weight="bold" color="accent">
          {i.invoiceNumber}
        </Text>
      ),
    },
    {
      key: 'valueBeforeTax',
      header: 'Trước thuế (VND)',
      width: pixel(160),
      align: 'end',
      renderCell: (i) => (
        <Text hasTabularNumbers>{formatVnd(i.valueBeforeTax)}</Text>
      ),
    },
    {
      key: 'taxRatePercent',
      header: 'Thuế',
      width: pixel(80),
      align: 'end',
      renderCell: (i) => <Text hasTabularNumbers>{i.taxRatePercent}%</Text>,
    },
    {
      key: 'valueAfterTax',
      header: 'Sau thuế (VND)',
      width: pixel(170),
      align: 'end',
      renderCell: (i) => (
        <Text weight="bold" hasTabularNumbers>
          {formatVnd(i.valueAfterTax)}
        </Text>
      ),
    },
    {
      key: 'issuedDate',
      header: 'Ngày xuất',
      width: pixel(140),
      renderCell: (i) => (
        <Text color="secondary" hasTabularNumbers>
          {formatDisplayDate(i.issuedDate)}
        </Text>
      ),
    },
    {
      key: 'note',
      header: 'Ghi chú',
      width: proportional(2),
      renderCell: (i) => <Text color="secondary">{i.note ?? '—'}</Text>,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: pixel(110),
      renderCell: (i) => (
        <MetaRowActions
          recordLabel={`hoá đơn ${i.invoiceNumber}`}
          onEdit={() => {
            setEditing(i);
            setIsFormOpen(true);
          }}
          onDelete={() => setDeleting(i)}
        />
      ),
    },
  ];

  const invoiceTable = (
    <Table
      columns={columns}
      data={detail.invoices}
      idKey="id"
      dividers="rows"
      density="spacious"
    />
  );

  return (
    <VStack gap={5} hAlign="stretch">
      <MetaMetricsCard
        isStandalone
        title="TIẾN ĐỘ XUẤT HOÁ ĐƠN"
        metrics={[
          metrics.settlement,
          metrics.invoiced,
          metrics.remainingToInvoice,
        ]}
        maxColumns={3}
      />

      <MetaTableCard
        icon={ReceiptText}
        title="Hoá đơn đã xuất"
        actions={
          <Button
            label="Thêm hoá đơn"
            variant="primary"
            icon={<Icon icon={CirclePlus} size="sm" />}
            onClick={() => {
              setEditing(null);
              setIsFormOpen(true);
            }}
          />
        }
        isEmpty={detail.invoices.length === 0}
        emptyLabel="Chưa có hoá đơn"
        footerStart={
          <Text weight="medium" color="secondary">
            Tổng số {detail.invoices.length} hoá đơn
          </Text>
        }
        footerEnd={
          <HStack gap={2} vAlign="center" wrap="nowrap">
            <Text size="sm" weight="bold">
              TỔNG ĐÃ XUẤT:
            </Text>
            <Text weight="bold" color="accent" hasTabularNumbers>
              {formatVnd(detail.contract.invoicedValue)} VND
            </Text>
          </HStack>
        }
      >
        {detail.invoices.length > PINNED_HEADER_MIN_ROWS ? (
          <VStack hAlign="stretch" xstyle={styles.bounded}>
            {invoiceTable}
          </VStack>
        ) : (
          invoiceTable
        )}
      </MetaTableCard>

      <InvoiceFormDialog
        contractId={contractId}
        projectCode={detail.contract.projectCode}
        remainingToInvoice={detail.contract.remainingToInvoice}
        contractTaxRatePercent={detail.contract.taxRatePercent}
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
