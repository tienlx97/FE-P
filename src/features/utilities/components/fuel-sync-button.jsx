'use client';

import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { RefreshCw } from 'lucide-react';

import { useFuelPriceSync } from '../hooks/use-fuel-prices.js';

/**
 * "Cập nhật giá" next to the market tabs: syncs the active market from its
 * source any time (the update banner only shows when a check finds new
 * periods). Nothing for a market without a source.
 * @param {{ market: import('../config/fuel-prices.js').FuelMarket }} props
 */
export function FuelSyncButton({ market }) {
  const { sync, isPending } = useFuelPriceSync(market.market);

  if (!market.sourceLabel) return null;

  return (
    <Button
      label="Cập nhật giá"
      variant="primary"
      icon={<Icon icon={RefreshCw} size="sm" />}
      tooltip={`Lấy các kỳ giá mới nhất của ${market.label} từ ${market.sourceLabel}`}
      isLoading={isPending}
      onClick={sync}
    />
  );
}
