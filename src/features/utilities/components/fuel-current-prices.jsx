'use client';

import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  Droplet,
  Fuel,
  Minus,
  PauseCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import {
  MetaPill,
  MetaShipmentKpiCard,
  MetaUtilityCard,
} from '@/shared/components/custom/meta/index.js';

import {
  formatFuelPrice,
  formatPeriodDate,
  formatPriceChange,
  FUEL_PRODUCTS,
  productStatuses,
  weekdayLabel,
} from '../config/fuel-prices.js';

/** @typedef {import('../config/fuel-prices.js').FuelPriceRow} FuelPriceRow */
/** @typedef {import('../config/fuel-prices.js').FuelProductStatus} FuelProductStatus */

const GROUPS = /** @type {const} */ ([
  { category: 'xang', label: 'Xăng', icon: Fuel, tone: 'accent' },
  { category: 'dau', label: 'Dầu', icon: Droplet, tone: 'indigo' },
]);

/**
 * Tăng = danger ▲, giảm = success ▼, giữ nguyên = neutral.
 * @param {number | undefined} change
 */
function changeStatus(change) {
  if (change === undefined) return undefined;
  if (change > 0) {
    return {
      label: formatPriceChange(change),
      icon: TrendingUp,
      tone: 'danger',
    };
  }
  if (change < 0) {
    return {
      label: formatPriceChange(change),
      icon: TrendingDown,
      tone: 'success',
    };
  }
  return { label: 'Giữ nguyên', icon: Minus, tone: 'neutral' };
}

/**
 * "Ngưng niêm yết": a product the latest period no longer lists — its last
 * price, when it was last priced and since which period it is gone.
 * @param {{ status: FuelProductStatus }} props
 */
function StoppedProduct({ status }) {
  const note = FUEL_PRODUCTS.find(
    (product) => product.code === status.code,
  )?.stoppedNote;
  return (
    <HStack gap={3} vAlign="center" wrap="wrap" xstyle={styles.stopped}>
      <MetaPill label="Ngưng niêm yết" tone="neutral" icon={PauseCircle} />
      <Text weight="semibold">{status.label}</Text>
      <Text color="secondary">
        không còn niêm yết từ kỳ{' '}
        <Text as="span" weight="semibold" color="primary">
          {formatPeriodDate(/** @type {string} */ (status.stoppedFrom))}
        </Text>
        {' · '}giá cuối{' '}
        <Text as="span" weight="semibold" color="primary" hasTabularNumbers>
          {formatFuelPrice(status.price)} đ/lít
        </Text>{' '}
        (kỳ {formatPeriodDate(status.pricedOn)}){note ? `. ${note}` : ''}
      </Text>
    </HStack>
  );
}

/**
 * "Giá hiện hành": one KPI card per product still sold, grouped Xăng /
 * Dầu (price, change vs the product's previous price), then the products
 * the latest period no longer lists.
 * @param {{
 *   rows: FuelPriceRow[],
 *   products: Array<{ code: string, label: string }>,
 * }} props
 */
export function FuelCurrentPrices({ rows, products }) {
  const latest = /** @type {FuelPriceRow} */ (rows.at(-1));
  const { active, stopped } = productStatuses(rows, products);

  return (
    <MetaUtilityCard
      icon={Fuel}
      title="Giá hiện hành"
      tag={`Kỳ ${latest.label}`}
      description={`Giá bán lẻ (đ/lít) áp dụng từ 15:00 ${weekdayLabel(latest.date)}, ${latest.label}; so với giá kỳ trước của từng mặt hàng.`}
    >
      <VStack gap={5} hAlign="stretch">
        {GROUPS.map((group) => {
          const items = active.filter(
            (status) => status.category === group.category,
          );
          if (items.length === 0) return null;
          return (
            <VStack key={group.category} gap={3} hAlign="stretch">
              <Text
                as="h3"
                size="sm"
                weight="bold"
                color="secondary"
                xstyle={styles.caps}
              >
                {group.label} · {items.length} mặt hàng
              </Text>
              <Grid columns={{ minWidth: 240, max: 3 }} gap={4}>
                {items.map((status) => (
                  <MetaShipmentKpiCard
                    key={status.code}
                    icon={group.icon}
                    tone={group.tone}
                    label={status.label}
                    value={formatFuelPrice(status.price)}
                    unit="đ/lít"
                    footLabel={
                      status.previousOn
                        ? `So với ${formatPeriodDate(status.previousOn)}`
                        : 'Kỳ đầu tiên có giá'
                    }
                    footStatus={
                      /** @type {any} */ (changeStatus(status.change))
                    }
                  />
                ))}
              </Grid>
            </VStack>
          );
        })}
        {stopped.map((status) => (
          <StoppedProduct key={status.code} status={status} />
        ))}
      </VStack>
    </MetaUtilityCard>
  );
}

const styles = stylex.create({
  caps: {
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  stopped: {
    backgroundColor: 'var(--meta-surface-container-low)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--meta-radius-inset)',
    borderStyle: 'dashed',
    borderWidth: 'var(--border-width)',
    paddingBlock: 'var(--spacing-3)',
    paddingInline: 'var(--spacing-4)',
  },
});
