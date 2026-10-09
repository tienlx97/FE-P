'use client';

import { Button } from '@astryxdesign/core/Button';
import { DateInput } from '@astryxdesign/core/DateInput';
import { Grid } from '@astryxdesign/core/Grid';
import { Icon } from '@astryxdesign/core/Icon';
import { Selector } from '@astryxdesign/core/Selector';
import { pixel } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { MetaFormSection } from '@/shared/components/custom/meta/index.js';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { TanStackDataTable } from '@/shared/components/tanstack-data-table.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';

import {
  PAYMENT_KIND_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from '../config/child-schemas.js';
import { formatVnd, subInstallmentAmount } from '../config/money.js';

/** @typedef {import('../types/index.js').AccountingSubInstallmentFormValues} Values */
/** @type {NonNullable<Parameters<typeof TanStackDataTable>[0]['headerGroups']>} */
const NO_HEADER_GROUPS = [];
/** @type {string[]} */
const NO_SORT_COLUMNS = [];
/** @typedef {{ id: string, code: string, values: Values, index: number, valueAfterTax: number,
 * onChange: <K extends keyof Values>(index: number, field: K, value: Values[K]) => void,
 * status: (field: string) => { type: 'error', message: string } | undefined,
 * onRemove?: (index: number) => void, canRemove: boolean, onSelect: (id: string) => void, isSelected: boolean }} EditRow */
// Cell renderer identities stay stable while values change, preserving editor/input focus.
/** @type {import('@/shared/components/advance-table.jsx').AdvanceTableColumn<EditRow>[]} */
const COLUMNS = [
  {
    key: 'code',
    header: 'Lần',
    width: pixel(80),
    renderCell: (r) => (
      <Text weight="bold" color="accent">
        {r.code}
      </Text>
    ),
  },
  {
    key: 'kind',
    header: 'Hình thức',
    width: pixel(180),
    renderCell: (r) => (
      <Selector
        label={`Hình thức ${r.code}`}
        isLabelHidden
        value={r.values.kind}
        options={PAYMENT_KIND_OPTIONS}
        onChange={(v) =>
          r.onChange(
            r.index,
            'kind',
            /** @type {Values['kind']} */ (v ?? 'Percent'),
          )
        }
      />
    ),
  },
  {
    key: 'value',
    header: 'Tỷ lệ / Giá trị',
    width: pixel(180),
    renderCell: (r) => (
      <FormattedNumberTextInput
        label={`${r.values.kind === 'Percent' ? 'Tỷ lệ' : 'Giá trị'} ${r.code}`}
        isLabelHidden
        isRequired
        value={r.values.kind === 'Percent' ? r.values.percent : r.values.amount}
        units={r.values.kind === 'Percent' ? '%' : 'VND'}
        onChange={(v) =>
          r.onChange(
            r.index,
            r.values.kind === 'Percent' ? 'percent' : 'amount',
            v,
          )
        }
        status={r.status(r.values.kind === 'Percent' ? 'percent' : 'amount')}
      />
    ),
  },
  {
    key: 'amount',
    header: 'Số tiền (VND)',
    width: pixel(190),
    align: 'end',
    renderCell: (r) => (
      <Text weight="bold" hasTabularNumbers>
        {formatVnd(
          subInstallmentAmount(
            r.values.kind,
            r.values.percent,
            r.values.amount,
            r.valueAfterTax,
          ),
        )}
      </Text>
    ),
  },
  {
    key: 'status',
    header: 'Trạng thái',
    width: pixel(190),
    renderCell: (r) => (
      <Selector
        label={`Trạng thái ${r.code}`}
        isLabelHidden
        value={r.values.status}
        options={PAYMENT_STATUS_OPTIONS}
        onChange={(v) =>
          r.onChange(
            r.index,
            'status',
            /** @type {Values['status']} */ (v ?? 'Planned'),
          )
        }
      />
    ),
  },
  {
    key: 'paymentDate',
    header: 'Ngày thanh toán',
    width: pixel(210),
    renderCell: (r) => (
      <DateInput
        label={`Ngày thanh toán ${r.code}`}
        isLabelHidden
        value={
          /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
            r.values.paymentDate
          )
        }
        format={formatDateInputValue}
        onChange={(v) => r.onChange(r.index, 'paymentDate', v ?? '')}
      />
    ),
  },
  {
    key: 'details',
    header: 'Bổ sung',
    width: pixel(130),
    renderCell: (r) => (
      <Button
        label="Chi tiết"
        variant={r.isSelected ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => r.onSelect(r.id)}
      />
    ),
  },
  {
    key: 'actions',
    header: '',
    width: pixel(64),
    renderCell: (r) =>
      r.onRemove ? (
        <Button
          label={`Xoá lần ${r.code}`}
          isIconOnly
          icon={<Icon icon={Trash2} size="sm" />}
          variant="ghost"
          isDisabled={!r.canRemove}
          onClick={() => r.onRemove?.(r.index)}
        />
      ) : null,
  },
];
const EDIT_COLUMNS = COLUMNS.filter((column) => column.key !== 'actions');

/** @param {{ rows: { id: string, code: string, values: Values }[], valueAfterTax: number,
 * onChange: <K extends keyof Values>(index: number, field: K, value: Values[K]) => void,
 * fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 * onRemove?: (index: number) => void, statusPrefix?: string }} props */
export function PaymentEditTable({
  rows,
  valueAfterTax,
  onChange,
  fieldStatuses,
  onRemove,
  statusPrefix = 'subInstallments.',
}) {
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? '');
  const activeId = rows.some((row) => row.id === selectedId)
    ? selectedId
    : rows[0]?.id;
  const data = rows.map((row, index) => ({
    ...row,
    index,
    valueAfterTax,
    onSelect: setSelectedId,
    isSelected: row.id === activeId,
    onChange,
    onRemove,
    canRemove: rows.length > 1,
    status: (/** @type {string} */ field) =>
      fieldStatuses[
        `${statusPrefix}${statusPrefix ? `${index}.` : ''}${field}`
      ],
  }));
  const active = data.find((row) => row.id === activeId);
  return (
    <VStack gap={4} hAlign="stretch">
      <TanStackDataTable
        data={data}
        columns={onRemove ? COLUMNS : EDIT_COLUMNS}
        headerGroups={NO_HEADER_GROUPS}
        sortableColumnKeys={NO_SORT_COLUMNS}
        idKey="id"
        density="compact"
        dividers="rows"
        startKeys={['code']}
        endKeys={onRemove ? ['details', 'actions'] : ['details']}
        ariaLabel="Nhập các lần thanh toán"
        emptyState={<Text>Chưa có lần thanh toán</Text>}
      />
      {active ? (
        <MetaFormSection
          isBoxed
          title={`Chi tiết lần thanh toán ${active.code}`}
          isTitleUppercase={false}
        >
          <Grid columns={{ minWidth: 260, max: 2 }} gap={4}>
            <TextArea
              label="Điều kiện thanh toán"
              placeholder="Điều kiện, hồ sơ cần hoàn tất…"
              rows={3}
              value={active.values.condition}
              onChange={(v) => onChange(active.index, 'condition', v)}
              maxLength={1000}
              isOptional
              status={active.status('condition')}
            />
            <TextArea
              label="Ghi chú lần thanh toán"
              placeholder="Nhập ghi chú…"
              rows={3}
              value={active.values.note}
              onChange={(v) => onChange(active.index, 'note', v)}
              maxLength={1000}
              isOptional
              status={active.status('note')}
            />
          </Grid>
        </MetaFormSection>
      ) : null}
    </VStack>
  );
}
