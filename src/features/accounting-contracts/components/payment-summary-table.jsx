'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import {
  pixel,
  proportional,
  useTableStickyColumns,
} from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { ListChecks, Plus } from 'lucide-react';

import {
  MetaRowActions,
  MetaTableCard,
} from '@/shared/components/custom/meta/index.js';
import { Table } from '@/shared/components/table.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { formatVnd } from '../config/money.js';
import { paymentTableRows } from '../config/payment-table.js';
import { QuickEditValue } from './quick-edit-value.jsx';

const styles = stylex.create({
  indent: { paddingInlineStart: 'var(--spacing-6)' },
  // Keeps the ＋ slot on rows that have no ＋, so the ✎ / 🗑 buttons line up.
  hidden: { visibility: 'hidden' },
});

/** @typedef {import('../config/payment-table.js').PaymentRow & Record<string, unknown>} PaymentRow */

/**
 * A đợt per row, its lần indented underneath; the last column holds the
 * row's actions.
 * @param {PaymentActions} actions
 * @returns {import('@astryxdesign/core/Table').TableColumn<PaymentRow>[]}
 */
const paymentColumns = (actions) => [
  {
    key: 'code',
    header: 'Đợt',
    width: pixel(100),
    renderCell: (row) =>
      row.kind === 'stage' ? (
        <Text weight="bold" color="accent">
          {row.code}
        </Text>
      ) : (
        <VStack hAlign="end">
          <Text color="secondary">{row.code}</Text>
        </VStack>
      ),
  },
  {
    key: 'content',
    header: 'Nội dung thanh toán theo hợp đồng',
    width: proportional(2, { minWidth: 260 }),
    renderCell: (row) =>
      row.kind === 'stage' ? (
        <Text weight={row.isParent ? 'bold' : undefined}>
          {row.content || '—'}
        </Text>
      ) : (
        <VStack xstyle={styles.indent}>
          <Text>{row.content || '—'}</Text>
        </VStack>
      ),
  },
  {
    key: 'percent',
    header: '%',
    width: pixel(80),
    align: 'end',
    renderCell: (row) =>
      row.percent === null ? (
        <Text color="secondary">—</Text>
      ) : (
        <Text hasTabularNumbers>{row.percent}%</Text>
      ),
  },
  {
    key: 'amount',
    header: 'Số tiền (VND)',
    width: pixel(170),
    align: 'end',
    renderCell: (row) => {
      const sub = actions.findSub(row.stageId, row.subId);
      // A summary row is the sum of its lần: nothing to type over.
      if (!sub) {
        return (
          <Text hasTabularNumbers weight="bold">
            {formatVnd(row.amount)}
          </Text>
        );
      }
      return (
        <QuickEditValue
          label={`Giá trị sau thuế lần ${sub.code}`}
          value={sub.valueAfterTax}
          computed={actions.autoAfterTax(sub)}
          isTyped={sub.isValueAfterTaxManual}
          text={formatVnd(sub.valueAfterTax)}
          isBold={row.kind === 'stage'}
          onSave={(typed) => actions.onSaveAfterTax(row.stageId, sub, typed)}
        />
      );
    },
  },
  {
    key: 'date',
    header: 'Ngày thanh toán',
    width: pixel(170),
    renderCell: (row) => (
      <Text hasTabularNumbers>
        {row.date ? formatDisplayDate(row.date) : '—'}
      </Text>
    ),
  },
  {
    key: 'paid',
    header: 'Thực tế đã thanh toán',
    width: pixel(190),
    align: 'end',
    renderCell: (row) =>
      row.paid === 0 ? (
        <Text color="secondary">—</Text>
      ) : (
        <Text
          hasTabularNumbers
          weight={row.isParent ? 'bold' : undefined}
          color={/** @type {any} */ ('meta-success')}
        >
          {formatVnd(row.paid)}
        </Text>
      ),
  },
  {
    key: 'remaining',
    header: 'Còn lại',
    width: pixel(170),
    align: 'end',
    renderCell: (row) =>
      row.remaining === null ? null : (
        <Text
          hasTabularNumbers
          weight="bold"
          color={
            row.remaining > 0
              ? /** @type {any} */ ('meta-danger')
              : /** @type {any} */ ('meta-success')
          }
        >
          {formatVnd(row.remaining)}
        </Text>
      ),
  },
  {
    key: 'note',
    header: 'Ghi chú',
    width: proportional(1, { minWidth: 160 }),
    renderCell: (row) => <Text color="secondary">{row.note || '—'}</Text>,
  },
  {
    key: 'actions',
    header: 'Thao tác',
    width: pixel(150),
    renderCell: (row) =>
      row.kind === 'stage' ? (
        <HStack gap={1} vAlign="center" wrap="nowrap">
          <Button
            label={`Thêm lần vào ${row.code.toLowerCase()}`}
            isIconOnly
            variant="ghost"
            icon={<Icon icon={Plus} size="sm" />}
            onClick={() => actions.onAddSub(row.id)}
          />
          <MetaRowActions
            recordLabel={row.code.toLowerCase()}
            onEdit={() => actions.onEditStage(row.id)}
            onDelete={() => actions.onDeleteStage(row.id)}
          />
        </HStack>
      ) : (
        <HStack gap={1} vAlign="center" wrap="nowrap">
          <Button
            label="Chỗ trống"
            aria-hidden
            tabIndex={-1}
            isIconOnly
            variant="ghost"
            icon={<Icon icon={Plus} size="sm" />}
            xstyle={styles.hidden}
          />
          <MetaRowActions
            recordLabel={`lần ${row.code}`}
            onEdit={() => actions.onEditSub(row.stageId, row.id)}
            onDelete={() => actions.onDeleteSub(row.stageId, row.id)}
          />
        </HStack>
      ),
  },
];

/**
 * @typedef {Object} PaymentActions
 * @property {(stageId: string) => void} onAddSub
 * @property {(stageId: string) => void} onEditStage
 * @property {(stageId: string) => void} onDeleteStage
 * @property {(stageId: string, subId: string) => void} onEditSub
 * @property {(stageId: string, subId: string) => void} onDeleteSub
 * @property {(stageId: string, subId: string | null) => import('../types/index.js').AccountingSubInstallment | null} findSub
 * @property {(sub: import('../types/index.js').AccountingSubInstallment) => number | undefined} autoAfterTax What the value after tax would be if not typed.
 * @property {(stageId: string, sub: import('../types/index.js').AccountingSubInstallment, typed: number | undefined) => Promise<{ success: boolean, message?: string }>} onSaveAfterTax
 */

/**
 * The payments as one table, like the Excel export: every đợt with its lần
 * and a running "còn lại", row actions at the end, the totals in the card's
 * footer.
 * @param {{ detail: import('../types/index.js').AccountingContractDetail } & PaymentActions} props
 */
export function PaymentSummaryTable({ detail, ...actions }) {
  // "Đợt" and "Thao tác" stay pinned while the table scrolls sideways.
  const sticky =
    /** @type {import('@astryxdesign/core/Table').TablePlugin<PaymentRow>} */ (
      useTableStickyColumns({ startKeys: ['code'], endKeys: ['actions'] })
    );
  const { rows, totalAmount, totalPaid, stageCount } = paymentTableRows(detail);
  const remaining = totalAmount - totalPaid;
  return (
    <MetaTableCard
      icon={ListChecks}
      title="Các đợt thanh toán"
      subtitle="Mỗi đợt một dòng, các lần thanh toán thụt vào bên dưới"
      isEmpty={rows.length === 0}
      emptyLabel="Chưa có đợt thanh toán"
      footerStart={
        <Text weight="medium" color="secondary">
          Tổng cộng · {stageCount} đợt
        </Text>
      }
      footerEnd={
        <HStack gap={5} vAlign="center" wrap="wrap">
          <HStack gap={2} vAlign="center" wrap="nowrap">
            <Text size="sm" weight="bold">
              SỐ TIỀN:
            </Text>
            <Text weight="bold" hasTabularNumbers>
              {formatVnd(totalAmount)} VND
            </Text>
          </HStack>
          <HStack gap={2} vAlign="center" wrap="nowrap">
            <Text size="sm" weight="bold">
              THỰC TẾ ĐÃ THANH TOÁN:
            </Text>
            <Text
              color={/** @type {any} */ ('meta-success')}
              weight="bold"
              hasTabularNumbers
            >
              {formatVnd(totalPaid)} VND
            </Text>
          </HStack>
          <HStack gap={2} vAlign="center" wrap="nowrap">
            <Text size="sm" weight="bold">
              CÒN LẠI:
            </Text>
            <Text
              color={
                remaining > 0
                  ? /** @type {any} */ ('meta-danger')
                  : /** @type {any} */ ('meta-success')
              }
              weight="bold"
              hasTabularNumbers
            >
              {formatVnd(remaining)} VND
            </Text>
          </HStack>
        </HStack>
      }
    >
      <Table
        columns={paymentColumns(actions)}
        plugins={{ stickyColumns: sticky }}
        data={/** @type {PaymentRow[]} */ (rows)}
        idKey="id"
        dividers="rows"
        density="spacious"
      />
    </MetaTableCard>
  );
}
