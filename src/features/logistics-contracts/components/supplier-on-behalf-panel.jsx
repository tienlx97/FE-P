'use client';

import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Button } from '@astryxdesign/core/Button';
import { DateInput } from '@astryxdesign/core/DateInput';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Link } from '@astryxdesign/core/Link';
import { Selector } from '@astryxdesign/core/Selector';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  CircleCheck,
  Download,
  HandCoins,
  Hourglass,
  Undo2,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';

import {
  MetaCellText,
  MetaPill,
  MetaShipmentKpiCard,
  MetaShipmentSection,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';
import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { TanStackDataTable } from '@/shared/components/tanstack-data-table.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import {
  formatDateInputValue,
  formatDisplayDate,
  todayIsoDate,
} from '@/shared/config/date-input-format.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { formatVndAmount } from '../config/currencies.js';
import {
  useMarkOnBehalfCostsReimbursedMutation,
  useSupplierOnBehalfCostsQuery,
} from '../hooks/use-supplier-on-behalf-costs-query.js';

/** @typedef {import('../types/index.js').SupplierOnBehalfCost} OnBehalfCost */
/** @typedef {import('@astryxdesign/core/Calendar').ISODateString} ISODate */

const STATUS_OPTIONS = /** @type {const} */ ([
  { value: 'all', label: 'Tất cả' },
  { value: 'outstanding', label: 'Chưa hoàn trả' },
  { value: 'reimbursed', label: 'Đã hoàn trả' },
]);

/**
 * Supplier detail "Chi hộ" tab: fees the supplier paid on our behalf
 * (port lift / drop…) across shipments — paid / reimbursed / still owed
 * for the period, the lines (filter by period and status), and marking
 * selected lines reimbursed (date + reference) or back to owed. Excel
 * export of the lines shown.
 * @param {{ supplierId: string, supplierName: string }} props
 */
export function SupplierOnBehalfPanel({ supplierId, supplierName }) {
  const toast = useAppToast();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState(
    /** @type {import('../types/index.js').OnBehalfCostStatus} */ ('all'),
  );
  const [selectedIds, setSelectedIds] = useState(
    /** @type {Set<string>} */ (new Set()),
  );
  const [isMarking, setIsMarking] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [reimbursedOn, setReimbursedOn] = useState('');
  const [reference, setReference] = useState('');
  const [markError, setMarkError] = useState('');

  const query = useSupplierOnBehalfCostsQuery(supplierId, { from, to, status });
  const mark = useMarkOnBehalfCostsReimbursedMutation(supplierId);
  const result = query.data;
  const costs = result?.success ? result.costs : null;
  const items = costs?.items ?? [];
  const selected = items.filter((item) => selectedIds.has(item.costId));
  const selectedAmount = selected.reduce((sum, item) => sum + item.amount, 0);
  const outstandingCount = items.filter((item) => !item.reimbursedOn).length;

  /** @param {Set<string>} next */
  function updateSelection(next) {
    setSelectedIds(next);
  }

  function resetSelection() {
    setSelectedIds(new Set());
  }

  function openMark() {
    setReimbursedOn(todayIsoDate());
    setReference('');
    setMarkError('');
    setIsMarking(true);
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function submitMark(event) {
    event.preventDefault();
    if (!reimbursedOn) {
      setMarkError('Chọn ngày hoàn trả.');
      return;
    }
    const saved = await mark.mutateAsync({
      costIds: selected.map((item) => item.costId),
      reimbursedOn,
      reference,
    });
    if (!saved.success) {
      setMarkError(saved.message);
      return;
    }
    setIsMarking(false);
    toast({ body: `Đã đánh dấu hoàn trả ${selected.length} khoản.` });
    resetSelection();
  }

  async function confirmClear() {
    const saved = await mark.mutateAsync({
      costIds: selected.map((item) => item.costId),
      reimbursedOn: null,
    });
    setIsClearing(false);
    toast(
      saved.success
        ? { body: `Đã chuyển ${selected.length} khoản về chưa hoàn trả.` }
        : { body: saved.message, type: 'error' },
    );
    if (saved.success) resetSelection();
  }

  async function handleExport() {
    const XLSX = await import('xlsx');
    const sheet = XLSX.utils.json_to_sheet(
      items.map((item) => ({
        Ngày: formatDisplayDate(item.date ?? ''),
        'Mã shipment': item.shipmentCode,
        'Khoản phí': item.name,
        'Đơn vị thu': item.payeeName ?? '',
        'Số hoá đơn': item.invoiceNumber ?? '',
        'Số tiền (VNĐ)': item.amount,
        'Ngày hoàn trả': formatDisplayDate(item.reimbursedOn ?? ''),
        'Chứng từ hoàn trả': item.reimbursementReference ?? '',
      })),
    );
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Chi hộ');
    XLSX.writeFile(
      book,
      `chi-ho-${supplierName.replace(/[/\\:*?"<>|]/g, '-')}.xlsx`,
    );
  }

  /** @type {import('@/shared/components/advance-table.jsx').AdvanceTableColumn<OnBehalfCost>[]} */
  const columns = [
    {
      key: 'date',
      header: 'Ngày',
      width: pixel(124),
      renderCell: (row) =>
        row.date ? (
          <Text hasTabularNumbers xstyle={styles.nowrap}>
            {formatDisplayDate(row.date)}
          </Text>
        ) : (
          <MetaCellText value={null} />
        ),
    },
    {
      key: 'shipment',
      header: 'Shipment',
      width: proportional(1),
      renderCell: (row) => (
        <Link
          href={`/logistics/contract/${row.contractId}/shipment/${row.shipmentId}?tab=costs`}
          weight="semibold"
        >
          {row.shipmentCode}
        </Link>
      ),
    },
    {
      key: 'name',
      header: 'Khoản phí',
      width: proportional(1.4),
      renderCell: (row) => (
        <VStack gap={0.5}>
          <Text weight="medium">{row.name}</Text>
          {row.payeeName ? (
            <Text size="sm" color="secondary">
              {`Thu bởi ${row.payeeName}`}
            </Text>
          ) : null}
        </VStack>
      ),
    },
    {
      key: 'invoice',
      header: 'Hoá đơn',
      width: proportional(0.8),
      renderCell: (row) => <MetaCellText value={row.invoiceNumber} />,
    },
    {
      key: 'amount',
      header: 'Số tiền',
      width: proportional(0.8),
      align: 'end',
      renderCell: (row) => (
        <Text weight="bold" hasTabularNumbers>
          {formatVndAmount(row.amount)}
        </Text>
      ),
    },
    {
      key: 'reimbursement',
      header: 'Hoàn trả',
      width: proportional(1),
      renderCell: (row) =>
        row.reimbursedOn ? (
          <VStack gap={0.5}>
            <MetaPill
              label={`Đã hoàn ${formatDisplayDate(row.reimbursedOn)}`}
              tone="success"
              size="sm"
              hasDot
            />
            {row.reimbursementReference ? (
              <Text size="sm" color="secondary">
                {row.reimbursementReference}
              </Text>
            ) : null}
          </VStack>
        ) : (
          <MetaPill label="Chưa hoàn trả" tone="warning" size="sm" hasDot />
        ),
    },
  ];

  return (
    <VStack gap={5} hAlign="stretch">
      <Grid columns={{ minWidth: 260, max: 3 }} gap={5}>
        <MetaShipmentKpiCard
          icon={HandCoins}
          tone="accent"
          label="TỔNG CHI HỘ"
          value={costs ? formatVndAmount(costs.totalAmount) : '—'}
          footLabel={from || to ? 'Trong kỳ đã chọn' : 'Tất cả thời gian'}
        />
        <MetaShipmentKpiCard
          icon={CircleCheck}
          tone="success"
          label="ĐÃ HOÀN TRẢ"
          value={costs ? formatVndAmount(costs.reimbursedAmount) : '—'}
          footLabel="Đã trả lại nhà cung cấp"
        />
        <MetaShipmentKpiCard
          icon={Hourglass}
          tone="indigo"
          label="CÒN PHẢI TRẢ"
          value={costs ? formatVndAmount(costs.outstandingAmount) : '—'}
          footLabel="Mình còn nợ nhà cung cấp"
        />
      </Grid>

      <MetaShipmentSection
        icon={Wallet}
        title="Phí nhà cung cấp chi hộ"
        subtitle="Phí do cảng / depot thu mà nhà cung cấp đã trả trước, theo từng lô hàng"
        pill={
          costs
            ? {
                label: `${items.length} khoản · ${outstandingCount} chưa hoàn`,
              }
            : undefined
        }
        actions={
          <HStack gap={3} vAlign="end" wrap="wrap">
            <DateInput
              label="Từ ngày"
              value={/** @type {ISODate | undefined} */ (from || undefined)}
              onChange={(value) => {
                setFrom(value ?? '');
                resetSelection();
              }}
              format={formatDateInputValue}
              placeholder="Chọn ngày"
              width={160}
            />
            <DateInput
              label="Đến ngày"
              value={/** @type {ISODate | undefined} */ (to || undefined)}
              onChange={(value) => {
                setTo(value ?? '');
                resetSelection();
              }}
              format={formatDateInputValue}
              placeholder="Chọn ngày"
              width={160}
            />
            <Selector
              label="Trạng thái"
              value={status}
              onChange={(value) => {
                setStatus(
                  /** @type {import('../types/index.js').OnBehalfCostStatus} */ (
                    value ?? 'all'
                  ),
                );
                resetSelection();
              }}
              options={[...STATUS_OPTIONS]}
              width={180}
            />
            <Button
              label="Xuất Excel"
              variant="secondary"
              icon={
                <Icon
                  icon={Download}
                  size="sm"
                  color={/** @type {any} */ ('meta-green')}
                />
              }
              isDisabled={items.length === 0}
              onClick={handleExport}
            />
          </HStack>
        }
      >
        <VStack gap={4} hAlign="stretch">
          {selected.length > 0 ? (
            <HStack
              hAlign="between"
              vAlign="center"
              gap={3}
              wrap="wrap"
              xstyle={styles.selectionBar}
            >
              <Text weight="medium">
                {`Đã chọn ${selected.length} khoản · `}
                <Text as="span" weight="bold" hasTabularNumbers>
                  {formatVndAmount(selectedAmount)}
                </Text>
              </Text>
              <HStack gap={2} vAlign="center" wrap="wrap">
                <Button
                  label="Bỏ chọn"
                  variant="ghost"
                  onClick={resetSelection}
                />
                <Button
                  label="Chuyển về chưa hoàn trả"
                  variant="secondary"
                  icon={<Icon icon={Undo2} size="sm" />}
                  isDisabled={selected.every((item) => !item.reimbursedOn)}
                  onClick={() => setIsClearing(true)}
                />
                <Button
                  label="Đánh dấu đã hoàn trả"
                  variant="primary"
                  icon={<Icon icon={CircleCheck} size="sm" />}
                  onClick={openMark}
                />
              </HStack>
            </HStack>
          ) : null}

          <TanStackDataTable
            data={items}
            columns={columns}
            idKey="costId"
            density="spacious"
            dividers="rows"
            ariaLabel="Phí nhà cung cấp chi hộ"
            headerCellXstyle={styles.headerCell}
            rowSelection={{
              excludedIds: new Set(
                items
                  .filter((item) => !selectedIds.has(item.costId))
                  .map((item) => item.costId),
              ),
              onToggleRow: (id, checked) => {
                const next = new Set(selectedIds);
                if (checked) next.add(id);
                else next.delete(id);
                updateSelection(next);
              },
              onToggleVisible: (ids, checked) => {
                const next = new Set(selectedIds);
                for (const id of ids) {
                  if (checked) next.add(id);
                  else next.delete(id);
                }
                updateSelection(next);
              },
              getLabel: (row) => `${row.shipmentCode} · ${row.name}`,
            }}
            emptyState={
              <Text color="secondary">
                {query.isLoading
                  ? 'Đang tải…'
                  : result && !result.success
                    ? result.message
                    : from || to || status !== 'all'
                      ? 'Không có khoản chi hộ phù hợp bộ lọc.'
                      : 'Nhà cung cấp chưa chi hộ khoản nào. Đánh dấu “Nhà cung cấp chi hộ” khi nhập chi phí lô hàng.'}
              </Text>
            }
          />
        </VStack>
      </MetaShipmentSection>

      <FormDialog
        isOpen={isMarking}
        onOpenChange={(open) => {
          if (!open) setIsMarking(false);
        }}
        title="Đánh dấu đã hoàn trả"
        subtitle={`${selected.length} khoản · ${formatVndAmount(selectedAmount)} trả lại cho ${supplierName}`}
        submitLabel="Xác nhận"
        draft={{ reimbursedOn, reference }}
        isSubmitting={mark.isPending}
        submitError={markError}
        onSubmit={submitMark}
        width={520}
      >
        <DateInput
          label="Ngày hoàn trả"
          isRequired
          value={/** @type {ISODate | undefined} */ (reimbursedOn || undefined)}
          onChange={(value) => {
            setReimbursedOn(value ?? '');
            setMarkError('');
          }}
          format={formatDateInputValue}
          placeholder="Chọn ngày"
          width="100%"
        />
        <TextInput
          label="Số chứng từ"
          isOptional
          value={reference}
          onChange={(value) => setReference(value.slice(0, 100))}
          placeholder="Ví dụ: UNC-0031"
          width="100%"
        />
      </FormDialog>

      <MetaThemeProvider>
        <AlertDialog
          isOpen={isClearing}
          onOpenChange={(open) => {
            if (!open) setIsClearing(false);
          }}
          title="Chuyển về chưa hoàn trả?"
          description={`${selected.length} khoản đã chọn sẽ bỏ ngày và chứng từ hoàn trả.`}
          actionLabel="Chuyển về chưa hoàn trả"
          onAction={confirmClear}
        />
      </MetaThemeProvider>
    </VStack>
  );
}

const styles = stylex.create({
  headerCell: {
    backgroundColor: 'var(--meta-surface-container-low)',
  },
  nowrap: {
    whiteSpace: 'nowrap',
  },
  selectionBar: {
    backgroundColor: 'var(--meta-surface-container-low)',
    borderRadius: 'var(--radius-element)',
    paddingBlock: 'var(--spacing-2)',
    paddingInline: 'var(--spacing-3)',
  },
});
