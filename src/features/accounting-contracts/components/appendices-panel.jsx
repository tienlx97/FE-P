'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { CirclePlus, Paperclip, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';

import {
  MetaMetricsCard,
  MetaPill,
  MetaRowActions,
  MetaTableCard,
} from '@/shared/components/custom/meta/index.js';
import { Table } from '@/shared/components/table.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { APPENDIX_TYPE_OPTIONS, labelOf } from '../config/child-schemas.js';
import { appendixTotals } from '../config/contract-view.js';
import { formatVnd } from '../config/money.js';
import { useContractChildMutation } from '../hooks/use-contract-children.js';
import { AppendixFormDialog } from './appendix-form-dialog.jsx';
import { ConfirmDeleteDialog } from './confirm-delete-dialog.jsx';

/** @typedef {import('../types/index.js').AccountingAppendix} Appendix */

/**
 * "+10,000,000" / "−2,000,000" (green when it increases the settlement); "—"
 * for an information change.
 * @param {Appendix} appendix
 * @param {number} value
 * @param {'normal' | 'bold'} weight
 */
function signedValue(appendix, value, weight) {
  if (appendix.type === 'InfoChange') return <Text color="secondary">—</Text>;
  return (
    <Text
      weight={weight}
      hasTabularNumbers
      color={
        appendix.type === 'Increase'
          ? /** @type {any} */ ('meta-success')
          : 'primary'
      }
    >
      {appendix.type === 'Increase' ? '+' : '−'}
      {formatVnd(value)}
    </Text>
  );
}

/** @param {Appendix} appendix */
function typePill(appendix) {
  const label = labelOf(APPENDIX_TYPE_OPTIONS, appendix.type);
  if (appendix.type === 'Increase')
    return <MetaPill label={label} tone="success" icon={TrendingUp} />;
  if (appendix.type === 'Decrease')
    return <MetaPill label={label} tone="neutral" icon={TrendingDown} />;
  return <MetaPill label={label} tone="accent" />;
}

/**
 * "Phụ lục" tab: HĐ sau thuế / phát sinh tăng / giảm cards, then the
 * appendix table card (type pill, signing pills, signed amount, actions).
 * @param {{
 *   detail: import('../types/index.js').AccountingContractDetail,
 *   metrics: ReturnType<typeof import('../config/contract-view.js').contractMetrics>,
 *   createKey: number | null,
 * }} props
 */
export function AppendicesPanel({ detail, metrics, createKey }) {
  const contractId = detail.contract.id;
  const [editing, setEditing] = useState(/** @type {Appendix | null} */ (null));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(
    /** @type {Appendix | null} */ (null),
  );
  const mutation = useContractChildMutation(contractId);
  const { increase, decrease } = appendixTotals(detail.appendices);

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

  /** @type {import('@astryxdesign/core/Table').TableColumn<Appendix & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'type',
      header: 'Phân loại',
      width: pixel(190),
      renderCell: (a) => typePill(a),
    },
    {
      key: 'note',
      header: 'Nội dung',
      width: proportional(2),
      renderCell: (a) => <Text color="secondary">{a.note ?? '—'}</Text>,
    },
    {
      key: 'valueBeforeTax',
      header: 'Giá trị trước thuế',
      width: pixel(160),
      align: 'end',
      renderCell: (a) => signedValue(a, a.valueBeforeTax, 'normal'),
    },
    {
      key: 'valueAfterTax',
      header: 'Giá trị sau thuế',
      width: pixel(160),
      align: 'end',
      renderCell: (a) => signedValue(a, a.valueAfterTax, 'bold'),
    },
    {
      key: 'signedDate',
      header: 'Ngày ký',
      width: pixel(120),
      renderCell: (a) => (
        <Text hasTabularNumbers>{formatDisplayDate(a.signedDate)}</Text>
      ),
    },
    {
      key: 'signing',
      header: 'Tình trạng chữ ký',
      width: pixel(200),
      renderCell: (a) => (
        <VStack gap={1} hAlign="start">
          <MetaPill
            label={a.sellerSigned ? 'Bên bán đã ký' : 'Bên bán chưa ký'}
            tone={a.sellerSigned ? 'success' : 'muted'}
            size="sm"
          />
          <MetaPill
            label={a.buyerSigned ? 'Bên mua đã ký' : 'Bên mua chưa ký'}
            tone={a.buyerSigned ? 'success' : 'muted'}
            size="sm"
          />
        </VStack>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: pixel(110),
      renderCell: (a) => (
        <MetaRowActions
          recordLabel="phụ lục"
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
    <VStack gap={5} hAlign="stretch">
      <MetaMetricsCard
        isStandalone
        title="GIÁ TRỊ & PHỤ LỤC"
        metrics={[metrics.base, metrics.increase, metrics.decrease]}
        maxColumns={3}
      />

      <MetaTableCard
        icon={Paperclip}
        title="Danh sách phụ lục"
        subtitle="Phát sinh tăng / giảm làm thay đổi giá trị quyết toán"
        actions={
          <Button
            label="Thêm phụ lục"
            variant="primary"
            icon={<Icon icon={CirclePlus} size="sm" />}
            onClick={() => {
              setEditing(null);
              setIsFormOpen(true);
            }}
          />
        }
        isEmpty={detail.appendices.length === 0}
        emptyLabel="Chưa có phụ lục"
        footerStart={
          <Text weight="medium" color="secondary">
            Tổng số {detail.appendices.length} phụ lục
          </Text>
        }
        footerEnd={
          <HStack gap={2} vAlign="center" wrap="nowrap">
            <Text size="sm" weight="bold">
              TỔNG ĐIỀU CHỈNH:
            </Text>
            <Text weight="bold" color="accent" hasTabularNumbers>
              {increase - decrease >= 0 ? '+' : '−'}
              {formatVnd(Math.abs(increase - decrease))} VND
            </Text>
          </HStack>
        }
      >
        <Table
          columns={columns}
          data={detail.appendices}
          idKey="id"
          dividers="rows"
          density="spacious"
        />
      </MetaTableCard>

      <AppendixFormDialog
        contractId={contractId}
        taxRatePercent={detail.contract.taxRatePercent}
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
