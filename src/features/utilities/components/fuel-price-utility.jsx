'use client';

import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { pixel, proportional, Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import {
  Chart,
  ChartAxis,
  ChartGrid,
  ChartLegend,
  ChartLine,
  ChartTooltip,
  useChartColors,
} from '@astryxdesign/lab';
import { Fuel, History, LineChart } from 'lucide-react';
import { useMemo } from 'react';

import {
  MetaInfoNote,
  MetaThemeProvider,
  MetaUtilityCard,
} from '@/shared/components/custom/meta/index.js';

import {
  formatFuelPrice,
  formatPriceChange,
  FUEL_PRICE_PERIODS,
  FUEL_PRODUCTS,
  withPriceChanges,
} from '../config/fuel-prices.js';

/** @typedef {import('../config/fuel-prices.js').FuelPriceRow} FuelPriceRow */

/**
 * Tăng = red, giảm = green, giữ nguyên = gray; nothing for the first period.
 * @param {{ change: number | undefined }} props
 */
function PriceChangeToken({ change }) {
  if (change === undefined) return null;
  const color = change > 0 ? 'red' : change < 0 ? 'green' : 'gray';
  return <Token size="sm" color={color} label={formatPriceChange(change)} />;
}

/**
 * Price and its change, right-aligned in a table cell.
 * @param {{ price: number, change: number | undefined }} props
 */
function PriceCell({ price, change }) {
  return (
    <HStack gap={2} vAlign="center" hAlign="end" wrap="nowrap">
      <Text as="span" weight="semibold">
        {formatFuelPrice(price)}
      </Text>
      <PriceChangeToken change={change} />
    </HStack>
  );
}

/**
 * "Giá hiện hành": latest price per product + change vs the period before.
 * @param {{ latest: FuelPriceRow }} props
 */
function CurrentPrices({ latest }) {
  return (
    <MetaUtilityCard
      icon={Fuel}
      title="Giá hiện hành"
      tag={`Kỳ ${latest.label}`}
      description="Giá bán lẻ Petrolimex vùng 1 (đ/lít) và mức thay đổi so với kỳ trước."
    >
      <Grid columns={{ minWidth: 200, max: 4 }} gap={4}>
        {FUEL_PRODUCTS.map(({ key, label }) => (
          <VStack key={key} gap={1} hAlign="start">
            <Text as="span" size="sm" color="secondary">
              {label}
            </Text>
            <HStack gap={2} vAlign="center">
              <Text as="span" size="2xl" weight="bold">
                {formatFuelPrice(latest[key])}
              </Text>
              <PriceChangeToken change={latest.changes[key]} />
            </HStack>
          </VStack>
        ))}
      </Grid>
    </MetaUtilityCard>
  );
}

/**
 * "Biến động giá": one line per product across the periods.
 * @param {{ rows: FuelPriceRow[] }} props
 */
function PriceChart({ rows }) {
  const colors = useChartColors().categorical(FUEL_PRODUCTS.length);
  const legendItems = FUEL_PRODUCTS.map(({ label }, index) => ({
    label,
    color: colors[index],
  }));

  return (
    <MetaUtilityCard
      icon={LineChart}
      title="Biến động giá"
      description="Giá từng mặt hàng qua các kỳ điều hành (đ/lít)."
    >
      <VStack gap={3} hAlign="stretch">
        <ChartLegend items={legendItems} />
        <Chart
          data={rows}
          xKey="label"
          yKeys={FUEL_PRODUCTS.map(({ key }) => key)}
          height={320}
          yBaseline="data"
          label="Biến động giá xăng dầu qua các kỳ điều hành"
        >
          <ChartGrid horizontal />
          <ChartAxis position="bottom" />
          <ChartAxis
            position="left"
            tickFormat={(value) => formatFuelPrice(Number(value))}
          />
          {FUEL_PRODUCTS.map(({ key }, index) => (
            <ChartLine key={key} dataKey={key} color={colors[index]} dots />
          ))}
          <ChartTooltip
            crosshair="x"
            render={(datum) => {
              const row = /** @type {FuelPriceRow} */ (datum);
              return (
                <VStack gap={1} hAlign="stretch">
                  <Text as="span" weight="semibold">
                    Kỳ {row.label}
                  </Text>
                  {FUEL_PRODUCTS.map(({ key, label }) => (
                    <HStack key={key} gap={3} hAlign="between" wrap="nowrap">
                      <Text as="span" size="sm" color="secondary">
                        {label}
                      </Text>
                      <PriceCell price={row[key]} change={row.changes[key]} />
                    </HStack>
                  ))}
                </VStack>
              );
            }}
          />
        </Chart>
      </VStack>
    </MetaUtilityCard>
  );
}

/**
 * "Lịch sử điều chỉnh": every period, newest first.
 * @param {{ rows: FuelPriceRow[] }} props
 */
function PriceHistory({ rows }) {
  const columns = [
    { key: 'label', header: 'Kỳ điều chỉnh', width: pixel(140) },
    ...FUEL_PRODUCTS.map(({ key, label }) => ({
      key,
      header: label,
      width: proportional(1),
      align: /** @type {const} */ ('end'),
      renderCell: (/** @type {FuelPriceRow} */ row) => (
        <PriceCell price={row[key]} change={row.changes[key]} />
      ),
    })),
  ];

  return (
    <MetaUtilityCard
      icon={History}
      title="Lịch sử điều chỉnh"
      description="Giá mỗi kỳ và mức tăng (đỏ) / giảm (xanh) so với kỳ liền trước."
    >
      <Table
        data={[...rows].reverse()}
        columns={columns}
        idKey="date"
        density="compact"
        hasHover
      />
    </MetaUtilityCard>
  );
}

/** "Tiện ích › Xăng dầu": current prices, price chart, adjustment history. */
export function FuelPriceUtility() {
  const rows = useMemo(() => withPriceChanges(FUEL_PRICE_PERIODS), []);
  const latest = rows[rows.length - 1];

  return (
    <MetaThemeProvider>
      <VStack gap={6} hAlign="stretch">
        <CurrentPrices latest={latest} />
        <PriceChart rows={rows} />
        <PriceHistory rows={rows} />
        <MetaInfoNote>
          Giá bán lẻ tối đa vùng 1 của Petrolimex, điều hành theo chu kỳ thứ Năm
          hằng tuần. Từ 01/06/2026 xăng E10 RON 95 thay xăng RON 95-III khoáng.
        </MetaInfoNote>
      </VStack>
    </MetaThemeProvider>
  );
}
