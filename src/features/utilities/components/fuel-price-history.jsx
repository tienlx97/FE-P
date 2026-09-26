'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Selector } from '@astryxdesign/core/Selector';
import { pixel, proportional, Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { History, Plus } from 'lucide-react';
import { useState } from 'react';

import {
  MetaPagination,
  MetaPill,
  MetaRowActions,
  MetaUtilityCard,
} from '@/shared/components/custom/meta/index.js';

import {
  formatFuelPrice,
  formatPriceChange,
  weekdayLabel,
} from '../config/fuel-prices.js';

/** @typedef {import('../config/fuel-prices.js').FuelPriceRow} FuelPriceRow */

const PAGE_SIZES = [20, 50, 100];
const ALL_YEARS = 'all';

/**
 * Price over its change, end-aligned: "27.080" then "▲ 1.450" in danger /
 * "▼ 1.450" in success / "0" muted; "—" when not priced that period.
 * @param {{ price: number | undefined, change: number | undefined }} props
 */
function HistoryPriceCell({ price, change }) {
  if (price === undefined) {
    return (
      <Text as="span" color="placeholder">
        —
      </Text>
    );
  }
  const tone =
    change === undefined || change === 0
      ? 'secondary'
      : change > 0
        ? 'meta-danger'
        : 'meta-success';
  const arrow =
    change === undefined || change === 0 ? '' : change > 0 ? '▲ ' : '▼ ';
  return (
    <VStack gap={0} hAlign="end">
      <Text as="span" weight="semibold" hasTabularNumbers>
        {formatFuelPrice(price)}
      </Text>
      <Text
        as="span"
        size="sm"
        weight="medium"
        hasTabularNumbers
        color={/** @type {any} */ (tone)}
      >
        {change === undefined
          ? ' '
          : `${arrow}${formatPriceChange(Math.abs(change)).replace('+', '')}`}
      </Text>
    </VStack>
  );
}

/**
 * "Lịch sử điều chỉnh": periods newest first, filtered by year and paged
 * (20 / 50 / 100). Only products priced on the current page get a column
 * (RON 95-III disappears after 05/2026, E10 RON 95-V appears in 07/2026).
 * @param {{
 *   rows: FuelPriceRow[],
 *   products: Array<{ code: string, label: string }>,
 *   onAdd: () => void,
 *   onEdit: (row: FuelPriceRow) => void,
 *   onDelete: (row: FuelPriceRow) => void,
 * }} props
 */
export function FuelPriceHistory({ rows, products, onAdd, onEdit, onDelete }) {
  const [year, setYear] = useState(ALL_YEARS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);

  const latestDate = rows.at(-1)?.date;
  const years = [...new Set(rows.map((row) => row.date.slice(0, 4)))].reverse();
  const filtered = [...rows]
    .reverse()
    .filter((row) => year === ALL_YEARS || row.date.startsWith(year));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const shown = products.filter(({ code }) =>
    pageRows.some((row) => row.prices[code] !== undefined),
  );

  const columns = [
    {
      key: 'label',
      header: 'Kỳ điều chỉnh',
      width: pixel(168),
      renderCell: (/** @type {FuelPriceRow} */ row) => (
        <VStack gap={0.5} hAlign="start">
          <Text as="span" weight="bold" hasTabularNumbers>
            {row.label}
          </Text>
          <HStack gap={2} vAlign="center" wrap="nowrap">
            <Text as="span" size="sm" color="secondary">
              {weekdayLabel(row.date)}
              {row.source === 'manual' ? ' · Nhập tay' : ''}
            </Text>
            {row.date === latestDate ? (
              <MetaPill label="Mới nhất" tone="accent" size="sm" />
            ) : null}
          </HStack>
        </VStack>
      ),
    },
    ...shown.map(({ code, label }) => ({
      key: code,
      header: label,
      width: proportional(1),
      align: /** @type {const} */ ('end'),
      renderCell: (/** @type {FuelPriceRow} */ row) => (
        <HistoryPriceCell price={row.prices[code]} change={row.changes[code]} />
      ),
    })),
    {
      key: 'actions',
      header: '',
      width: pixel(88),
      align: /** @type {const} */ ('end'),
      renderCell: (/** @type {FuelPriceRow} */ row) => (
        <MetaRowActions
          recordLabel={`kỳ ${row.label}`}
          onEdit={() => onEdit(row)}
          onDelete={() => onDelete(row)}
        />
      ),
    },
  ];

  return (
    <MetaUtilityCard
      icon={History}
      title="Lịch sử điều chỉnh"
      tag={`${filtered.length} kỳ`}
      description="Giá từng kỳ (đ/lít) và mức tăng ▲ / giảm ▼ so với lần có giá trước đó của mặt hàng."
    >
      <VStack gap={3} hAlign="stretch">
        <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap">
          <Selector
            label="Năm"
            isLabelHidden
            size="sm"
            value={year}
            onChange={(value) => {
              setYear(value);
              setPage(1);
            }}
            options={[
              { value: ALL_YEARS, label: 'Tất cả các năm' },
              ...years.map((value) => ({ value, label: `Năm ${value}` })),
            ]}
          />
          <Button
            label="Nhập giá kỳ mới"
            variant="secondary"
            size="sm"
            icon={<Icon icon={Plus} size="sm" />}
            onClick={onAdd}
          />
        </HStack>
        <Table
          data={pageRows}
          columns={columns}
          idKey="date"
          hasHover
          isStriped
        />
        <MetaPagination
          page={currentPage}
          pageSize={pageSize}
          totalCount={filtered.length}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSizeOptions={PAGE_SIZES}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          itemLabel="kỳ"
        />
      </VStack>
    </MetaUtilityCard>
  );
}
