'use client';

import { useChart } from '@astryxdesign/lab';

/**
 * Centre of the period's band (the x axis is the "dd/MM/yyyy" label, so
 * the Chart builds a band scale). Same maths as lab's unexported `xPixel`.
 * @param {unknown} xScale lab's `ChartScale`; a band scale here
 * @param {unknown} value
 */
function bandCenter(xScale, value) {
  const band =
    /** @type {((key: string) => number | undefined) & { bandwidth: () => number }} */ (
      xScale
    );
  return (band(String(value)) ?? 0) + band.bandwidth() / 2;
}

/**
 * A `ChartLine` that breaks where the product has no price. Lab's
 * `ChartLine` draws a missing value as 0, so a product sold only part of
 * the year (RON 95-III until 05/2026, E10 from 06/2026) would dive to the
 * axis. Straight segments between consecutive priced periods + a dot on
 * each price. Must be a child of `<Chart>`.
 * @param {{ dataKey: string, color: string, hasDots?: boolean }} props
 */
export function FuelPriceLine({ dataKey, color, hasDots = true }) {
  const { data, xKey, xScale, yScale } = useChart();

  /** @type {Array<Array<{ x: number, y: number, index: number }>>} */
  const segments = [];
  /** @type {Array<{ x: number, y: number, index: number }>} */
  let current = [];
  data.forEach((datum, index) => {
    const value = datum[dataKey];
    if (typeof value !== 'number') {
      if (current.length > 0) segments.push(current);
      current = [];
      return;
    }
    current.push({
      x: bandCenter(xScale, datum[xKey]),
      y: yScale(value),
      index,
    });
  });
  if (current.length > 0) segments.push(current);

  const path = segments
    .map((points) =>
      points
        .map((point, i) => `${i === 0 ? 'M' : 'L'}${point.x},${point.y}`)
        .join(''),
    )
    .join('');

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {hasDots
        ? segments
            .flat()
            .map((point) => (
              <circle
                key={point.index}
                cx={point.x}
                cy={point.y}
                r={3}
                fill={color}
              />
            ))
        : null}
    </g>
  );
}
