'use client';

import { DateRangeInput } from '@astryxdesign/core/DateRangeInput';
import { HStack } from '@astryxdesign/core/HStack';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { Text } from '@astryxdesign/core/Text';
import {
  ToggleButton,
  ToggleButtonGroup,
} from '@astryxdesign/core/ToggleButton';
import { VStack } from '@astryxdesign/core/VStack';
import {
  Chart,
  ChartAxis,
  ChartBrush,
  ChartGrid,
  ChartLegend,
  ChartTooltip,
  useChartColors,
} from '@astryxdesign/lab';
import { LineChart } from 'lucide-react';
import { useState } from 'react';

import { MetaUtilityCard } from '@/shared/components/custom/meta/index.js';

import {
  DEFAULT_RANGE_PRESET,
  formatAxisTime,
  isoToTime,
  presetRange,
  RANGE_PRESETS,
  rowsInRange,
  timeToIso,
} from '../config/fuel-chart-range.js';
import { formatFuelPrice, formatPeriodDate } from '../config/fuel-prices.js';
import { FuelPriceLine, FuelRangeHighlight } from './fuel-price-line.jsx';
import { PriceWithChange } from './fuel-price-parts.jsx';

/** @typedef {import('../config/fuel-prices.js').FuelPriceRow} FuelPriceRow */
/** @typedef {import('@astryxdesign/core/Calendar').ISODateString} ISODateString */

// Left: room for "30.000"-wide tick labels (drawn inside the margin).
// Top: room for the legend, an SVG foreignObject just above the plot.
const CHART_MARGIN = { top: 36, left: 64, right: 24 };
// Overview strip: same left/right so its x lines up with the main chart.
const OVERVIEW_MARGIN = { top: 4, left: 64, right: 24, bottom: 24 };
const CUSTOM = 'custom';

/**
 * Chart rows: time as x, only the shown products as numeric keys (the
 * tooltip snaps on every numeric key), plus the tooltip's objects.
 * @param {Array<FuelPriceRow & { time: number, carriedFrom?: string }>} rows
 * @param {string[]} codes
 */
function toChartData(rows, codes) {
  return rows.map((row) => ({
    time: row.time,
    label: row.label,
    date: row.date,
    carriedFrom: row.carriedFrom,
    prices: row.prices,
    changes: row.changes,
    ...Object.fromEntries(codes.map((code) => [code, row.prices[code]])),
  }));
}

/**
 * "Biến động giá": one line per selected product over a time range.
 * - Product toggles (≥ 1 stays on).
 * - Range: quick presets (3 / 6 tháng, năm nay, 12 tháng, tất cả, counted
 *   from the latest period), any from–to in the date-range picker, or a
 *   drag on the overview strip under the chart (whole history, the
 *   window shaded).
 * The x axis is real time, so irregular periods sit where they happened.
 * @param {{
 *   rows: FuelPriceRow[],
 *   products: Array<{ code: string, label: string, isDefault: boolean }>,
 * }} props
 */
export function FuelPriceChart({ rows, products }) {
  const colors = useChartColors();
  const palette = colors.categorical(Math.max(products.length, 1));
  const firstIso = rows[0].date;
  const lastIso = rows[rows.length - 1].date;

  const [selected, setSelected] = useState(() => {
    const defaults = products.filter((product) => product.isDefault);
    return (defaults.length > 0 ? defaults : products).map(({ code }) => code);
  });
  const [preset, setPreset] = useState(DEFAULT_RANGE_PRESET);
  // Bumped after each drag: remounts ChartBrush so its own overlay clears
  // and only the shaded window (FuelRangeHighlight) marks the selection.
  const [brushKey, setBrushKey] = useState(0);
  const [range, setRange] = useState(() =>
    presetRange(DEFAULT_RANGE_PRESET, firstIso, lastIso),
  );

  const visible = products.filter(({ code }) => selected.includes(code));
  const codes = visible.map(({ code }) => code);
  const colorOf = (/** @type {string} */ code) =>
    palette[products.findIndex((product) => product.code === code)];

  const data = toChartData(rowsInRange(rows, range), codes);
  const overview = toChartData(
    rows.map((row) => ({ ...row, time: isoToTime(row.date) })),
    codes,
  );
  const xDomain = /** @type {[number, number]} */ ([
    isoToTime(range.start),
    isoToTime(range.end),
  ]);
  const span = xDomain[1] - xDomain[0];
  const fullSpan = isoToTime(lastIso) - isoToTime(firstIso);
  const periodCount = data.filter((row) => !row.carriedFrom).length;

  /** @param {string} value */
  function choosePreset(value) {
    if (value === CUSTOM) return;
    setPreset(value);
    setRange(presetRange(value, firstIso, lastIso));
  }

  /** @param {{ start: string, end: string }} next */
  function chooseCustom(next) {
    const start = next.start < firstIso ? firstIso : next.start;
    const end = next.end > lastIso ? lastIso : next.end;
    if (start >= end) return;
    setPreset(CUSTOM);
    setRange({ start, end });
  }

  return (
    <MetaUtilityCard
      icon={LineChart}
      title="Biến động giá"
      tag={`${formatPeriodDate(range.start)} – ${formatPeriodDate(range.end)} · ${periodCount} kỳ`}
      description="Chọn mặt hàng và khoảng thời gian; rê chuột lên biểu đồ để xem giá từng kỳ (đ/lít)."
    >
      <VStack gap={4} hAlign="stretch">
        <ToggleButtonGroup
          label="Mặt hàng hiển thị"
          type="multiple"
          size="sm"
          value={selected}
          onChange={(value) => {
            const next = Array.isArray(value) ? value : [];
            if (next.length > 0) setSelected(next);
          }}
        >
          {products.map(({ code, label }) => (
            <ToggleButton key={code} value={code} label={label} />
          ))}
        </ToggleButtonGroup>

        <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap">
          <SegmentedControl
            label="Khoảng nhanh"
            size="sm"
            value={preset}
            onChange={choosePreset}
          >
            {RANGE_PRESETS.map((option) => (
              <SegmentedControlItem
                key={option.value}
                value={option.value}
                label={option.label}
              />
            ))}
            <SegmentedControlItem value={CUSTOM} label="Tuỳ chọn" />
          </SegmentedControl>
          <DateRangeInput
            label="Khoảng thời gian"
            isLabelHidden
            size="sm"
            hasClear={false}
            value={{
              start: /** @type {ISODateString} */ (range.start),
              end: /** @type {ISODateString} */ (range.end),
            }}
            onChange={(value) => {
              if (value) chooseCustom(value);
            }}
            min={/** @type {ISODateString} */ (firstIso)}
            max={/** @type {ISODateString} */ (lastIso)}
            presets={RANGE_PRESETS.map((option) => ({
              label: option.label,
              getRange: () => {
                const next = presetRange(option.value, firstIso, lastIso);
                return {
                  start: /** @type {ISODateString} */ (next.start),
                  end: /** @type {ISODateString} */ (next.end),
                };
              },
            }))}
          />
        </HStack>

        <Chart
          data={data}
          xKey="time"
          yKeys={codes}
          xDomain={xDomain}
          height={340}
          margin={CHART_MARGIN}
          yBaseline="data"
          label="Biến động giá xăng dầu qua các kỳ điều hành"
        >
          <ChartGrid horizontal />
          <ChartLegend
            items={visible.map(({ code, label }) => ({
              label,
              color: colorOf(code),
            }))}
          />
          <ChartAxis
            position="bottom"
            maxTicks={8}
            tickFormat={(value) => formatAxisTime(Number(value), span)}
          />
          <ChartAxis
            position="left"
            tickFormat={(value) => formatFuelPrice(Number(value))}
          />
          {visible.map(({ code }) => (
            <FuelPriceLine
              key={code}
              dataKey={code}
              color={colorOf(code)}
              hasDots={periodCount <= 30}
            />
          ))}
          <ChartTooltip
            crosshair="x"
            render={(datum) => {
              const row =
                /** @type {ReturnType<typeof toChartData>[number]} */ (datum);
              return (
                <VStack gap={1} hAlign="stretch">
                  <Text as="span" weight="semibold">
                    {row.carriedFrom
                      ? `${formatPeriodDate(row.date)} · giá kỳ ${row.carriedFrom}`
                      : `Kỳ ${row.label}`}
                  </Text>
                  {visible.map(({ code, label }) => (
                    <HStack key={code} gap={3} hAlign="between" wrap="nowrap">
                      <Text as="span" size="sm" color="secondary">
                        {label}
                      </Text>
                      <PriceWithChange
                        price={row.prices[code]}
                        change={row.changes[code]}
                      />
                    </HStack>
                  ))}
                </VStack>
              );
            }}
          />
        </Chart>

        <VStack gap={1} hAlign="stretch">
          <Text as="span" size="sm" color="secondary">
            Toàn bộ lịch sử — kéo chuột trên dải này để chọn khoảng thời gian.
          </Text>
          <Chart
            data={overview}
            xKey="time"
            yKeys={codes}
            height={88}
            margin={OVERVIEW_MARGIN}
            yBaseline="data"
            interactive
            label="Toàn bộ lịch sử giá, kéo để chọn khoảng thời gian"
          >
            <FuelRangeHighlight
              start={xDomain[0]}
              end={xDomain[1]}
              color={colors.semantic.neutral}
            />
            <ChartAxis
              position="bottom"
              maxTicks={10}
              tickFormat={(value) => formatAxisTime(Number(value), fullSpan)}
            />
            {visible.map(({ code }) => (
              <FuelPriceLine
                key={code}
                dataKey={code}
                color={colorOf(code)}
                hasDots={false}
                strokeWidth={1}
              />
            ))}
            <ChartBrush
              key={brushKey}
              onBrush={({ x }) => {
                chooseCustom({
                  start: timeToIso(Math.min(x[0], x[1])),
                  end: timeToIso(Math.max(x[0], x[1])),
                });
                setBrushKey((current) => current + 1);
              }}
            />
          </Chart>
        </VStack>
      </VStack>
    </MetaUtilityCard>
  );
}
