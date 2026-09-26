'use client';

import { useChart } from '@astryxdesign/lab';

/**
 * Pixel x of a datum on either x scale the Chart builds: a linear (time)
 * scale, or a band scale (centre of the band) — lab's `xPixel`, which the
 * package root does not export.
 * @param {unknown} xScale lab's `ChartScale`
 * @param {unknown} value
 */
function toPixel(xScale, value) {
  const scale =
    /** @type {((key: unknown) => number | undefined) & { bandwidth?: () => number }} */ (
      xScale
    );
  if (typeof scale.bandwidth === 'function') {
    return (scale(String(value)) ?? 0) + scale.bandwidth() / 2;
  }
  return scale(value) ?? 0;
}

/**
 * A `ChartLine` that breaks where the product has no price. Lab's
 * `ChartLine` draws a missing value as 0, so a product sold only part of
 * the time (RON 95-III until 05/2026, E10 from 06/2026) would dive to the
 * axis. Straight segments between consecutive priced periods, optional
 * dots. Must be a child of `<Chart>`.
 * @param {{ dataKey: string, color: string, hasDots?: boolean, strokeWidth?: number }} props
 */
export function FuelPriceLine({
  dataKey,
  color,
  hasDots = true,
  strokeWidth = 2,
}) {
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
    current.push({ x: toPixel(xScale, datum[xKey]), y: yScale(value), index });
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
        strokeWidth={strokeWidth}
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

/**
 * Shades `[start, end]` (x data units) on a time-scale chart — the
 * selected window on the overview strip. Must be a child of `<Chart>`.
 * @param {{ start: number, end: number, color: string }} props
 */
export function FuelRangeHighlight({ start, end, color }) {
  const { xScale, yScale } = useChart();
  const [bottom, top] = yScale.range();
  const x0 = toPixel(xScale, start);
  const x1 = toPixel(xScale, end);
  return (
    <rect
      x={Math.min(x0, x1)}
      y={top}
      width={Math.max(Math.abs(x1 - x0), 2)}
      height={bottom - top}
      fill={color}
      fillOpacity={0.12}
      stroke={color}
      strokeOpacity={0.6}
    />
  );
}
