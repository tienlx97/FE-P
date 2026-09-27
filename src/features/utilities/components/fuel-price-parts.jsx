'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';

import { MetaPill } from '@/shared/components/custom/meta/index.js';

import { formatFuelPrice, formatPriceChange } from '../config/fuel-prices.js';

/** @typedef {import('../config/fuel-prices.js').FuelNumberFormat} FuelNumberFormat */

/**
 * Change vs the previous period: tăng = danger, giảm = success, giữ nguyên
 * = neutral; nothing when there is no previous price.
 * @param {{ market: FuelNumberFormat, change: number | undefined }} props
 */
export function PriceChangePill({ market, change }) {
  if (change === undefined) return null;
  const tone = change > 0 ? 'danger' : change < 0 ? 'success' : 'neutral';
  return (
    <MetaPill label={formatPriceChange(change, market)} tone={tone} size="sm" />
  );
}

/**
 * Price + its change pill, end-aligned (table cells, tooltip rows); "—"
 * when the product was not priced that period.
 * @param {{
 *   market: FuelNumberFormat,
 *   price: number | undefined,
 *   change: number | undefined,
 * }} props
 */
export function PriceWithChange({ market, price, change }) {
  if (price === undefined) {
    return (
      <Text as="span" color="secondary">
        —
      </Text>
    );
  }
  return (
    <HStack gap={2} vAlign="center" hAlign="end" wrap="nowrap">
      <Text as="span" weight="semibold">
        {formatFuelPrice(price, market)}
      </Text>
      <PriceChangePill market={market} change={change} />
    </HStack>
  );
}
