'use client';

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
  ChartGrid,
  ChartLegend,
  ChartLine,
  ChartTooltip,
  useChartColors,
} from '@astryxdesign/lab';
import { LineChart } from 'lucide-react';
import { useState } from 'react';

import { MetaUtilityCard } from '@/shared/components/custom/meta/index.js';

import {
  CHART_RANGES,
  formatFuelPrice,
  sliceRange,
} from '../config/fuel-prices.js';
import { PriceWithChange } from './fuel-price-parts.jsx';

/** @typedef {import('../config/fuel-prices.js').FuelPriceRow} FuelPriceRow */

// Left: room for "30.000"-wide tick labels (drawn inside the margin).
// Top: room for the legend, an SVG foreignObject just above the plot.
const CHART_MARGIN = { top: 36, left: 64, right: 16 };

/**
 * "Biến động giá": one line per selected product over the chosen range.
 * Toggle buttons pick the products (at least one stays on); the range
 * control keeps the last 8 / 16 periods or all of them.
 * @param {{
 *   rows: FuelPriceRow[],
 *   products: Array<{ code: string, label: string, isDefault: boolean }>,
 * }} props
 */
export function FuelPriceChart({ rows, products }) {
  const palette = useChartColors().categorical(Math.max(products.length, 1));
  const [range, setRange] = useState('16');
  const [selected, setSelected] = useState(() => {
    const defaults = products.filter((product) => product.isDefault);
    return (defaults.length > 0 ? defaults : products).map(({ code }) => code);
  });

  const visible = products.filter(({ code }) => selected.includes(code));
  const colorOf = (/** @type {string} */ code) =>
    palette[products.findIndex((product) => product.code === code)];
  const data = sliceRange(rows, range);

  return (
    <MetaUtilityCard
      icon={LineChart}
      title="Biến động giá"
      description="Chọn mặt hàng để so sánh; rê chuột lên biểu đồ để xem giá từng kỳ (đ/lít)."
    >
      <VStack gap={4} hAlign="stretch">
        <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap">
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
          <SegmentedControl
            label="Khoảng thời gian"
            size="sm"
            value={range}
            onChange={setRange}
          >
            {CHART_RANGES.map((option) => (
              <SegmentedControlItem
                key={option.value}
                value={option.value}
                label={option.label}
              />
            ))}
          </SegmentedControl>
        </HStack>

        <Chart
          data={data}
          xKey="label"
          yKeys={visible.map(({ code }) => code)}
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
          <ChartAxis position="bottom" maxTicks={8} />
          <ChartAxis
            position="left"
            tickFormat={(value) => formatFuelPrice(Number(value))}
          />
          {visible.map(({ code }) => (
            <ChartLine
              key={code}
              dataKey={code}
              color={colorOf(code)}
              dots={data.length <= 20}
            />
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
      </VStack>
    </MetaUtilityCard>
  );
}
