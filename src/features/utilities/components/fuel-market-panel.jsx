'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Fuel, Plus, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { CommonDialog } from '@/shared/components/common-dialog.jsx';
import {
  MetaInfoNote,
  MetaPill,
  MetaUtilityCard,
} from '@/shared/components/custom/meta/index.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import {
  formatPeriodDate,
  FUEL_PRODUCTS,
  productsIn,
  toPriceRows,
} from '../config/fuel-prices.js';
import {
  useDeleteFuelPricePeriodMutation,
  useFuelPricePeriodsQuery,
  useFuelPriceSourceCheckQuery,
  useSyncFuelPricesMutation,
} from '../hooks/use-fuel-prices.js';
import { FuelCurrentPrices } from './fuel-current-prices.jsx';
import { FuelPriceChart } from './fuel-price-chart.jsx';
import { FuelPriceHistory } from './fuel-price-history.jsx';
import { FuelPricePeriodDrawer } from './fuel-price-period-drawer.jsx';

/** @typedef {import('../config/fuel-prices.js').FuelPriceRow} FuelPriceRow */

/** The drawer's products when the market has no period yet. */
const DEFAULT_PRODUCTS = FUEL_PRODUCTS.filter((product) => product.isDefault);
/** @typedef {(typeof import('../config/fuel-prices.js').FUEL_MARKETS)[number]} FuelMarket */

/**
 * "Giá hôm nay đã thay đổi": shown when the market's source publishes
 * periods we don't have (or have with other prices). One click syncs them.
 * @param {{ market: FuelMarket, hasPeriods: boolean }} props
 */
function SourceUpdateBanner({ market, hasPeriods }) {
  const toast = useAppToast();
  const check = useFuelPriceSourceCheckQuery(
    market.market,
    Boolean(market.sourceLabel),
  );
  const sync = useSyncFuelPricesMutation(market.market);
  const pending = check.data?.success ? check.data.check.pending : [];

  if (!market.sourceLabel || !check.data?.success || pending.length === 0) {
    return null;
  }

  const latest = pending[pending.length - 1];
  const title = !hasPeriods
    ? `Chưa có dữ liệu — ${market.sourceLabel} có ${pending.length} kỳ giá`
    : latest.kind === 'New'
      ? `Giá xăng dầu đã thay đổi: kỳ ${formatPeriodDate(latest.effectiveDate)}`
      : `${market.sourceLabel} có ${pending.length} kỳ khác với dữ liệu đã lưu`;

  async function handleSync() {
    const result = await sync.mutateAsync();
    if (!result.success) {
      toast({ type: 'error', body: result.message });
      return;
    }
    await check.refetch();
    const { added, updated } = result.sync;
    toast({ body: `Đã cập nhật: ${added} kỳ mới, ${updated} kỳ sửa giá.` });
  }

  return (
    <Banner
      status="info"
      title={title}
      description={`Nguồn ${market.sourceLabel} · ${pending.length} kỳ chưa đồng bộ. Bấm cập nhật để lưu vào hệ thống.`}
      endContent={
        <Button
          label="Cập nhật giá"
          variant="primary"
          size="sm"
          icon={<Icon icon={RefreshCw} size="sm" />}
          isLoading={sync.isPending}
          onClick={handleSync}
        />
      }
    />
  );
}

/**
 * One market tab: update suggestion, current prices, chart, history and
 * the manual-input drawer.
 * @param {{ market: FuelMarket }} props
 */
export function FuelMarketPanel({ market }) {
  const toast = useAppToast();
  const query = useFuelPricePeriodsQuery(market.market);
  const remove = useDeleteFuelPricePeriodMutation(market.market);
  const [editing, setEditing] = useState(
    /** @type {{ row?: FuelPriceRow } | null} */ (null),
  );
  const [deleting, setDeleting] = useState(
    /** @type {FuelPriceRow | null} */ (null),
  );

  const periods = useMemo(
    () => (query.data?.success ? query.data.periods : []),
    [query.data],
  );
  const rows = useMemo(() => toPriceRows(periods), [periods]);
  const products = useMemo(() => productsIn(periods), [periods]);
  const latest = rows[rows.length - 1];

  async function confirmDelete() {
    if (!deleting) return;
    const result = await remove.mutateAsync(deleting.date);
    if (!result.success) {
      toast({ type: 'error', body: result.message });
      return;
    }
    toast({ body: `Đã xoá kỳ ${deleting.label}.` });
    setDeleting(null);
  }

  if (query.isPending) {
    return (
      <VStack gap={6} hAlign="stretch">
        <Skeleton height={140} />
        <Skeleton height={420} index={1} />
      </VStack>
    );
  }

  if (query.data && !query.data.success) {
    return <Banner status="error" title={query.data.message} />;
  }

  return (
    <VStack gap={6} hAlign="stretch">
      <SourceUpdateBanner market={market} hasPeriods={rows.length > 0} />

      {latest ? (
        <>
          <FuelCurrentPrices rows={rows} products={products} />
          <FuelPriceChart
            // Re-seed the product selection when the product set changes.
            key={products.map(({ code }) => code).join()}
            rows={rows}
            products={products}
          />
          <FuelPriceHistory
            rows={rows}
            products={products}
            onAdd={() => setEditing({})}
            onEdit={(row) => setEditing({ row })}
            onDelete={setDeleting}
          />
        </>
      ) : (
        <MetaUtilityCard
          icon={Fuel}
          title="Chưa có giá"
          description="Chưa có kỳ giá nào cho thị trường này. Cập nhật từ nguồn hoặc nhập tay."
        >
          <HStack>
            <Button
              label="Nhập giá kỳ mới"
              variant="primary"
              icon={<Icon icon={Plus} size="sm" />}
              onClick={() => setEditing({})}
            />
          </HStack>
        </MetaUtilityCard>
      )}

      <MetaInfoNote>
        {market.note}
        {market.sourceLabel ? (
          <>
            {' '}
            <MetaPill label={market.sourceLabel} size="sm" />.
          </>
        ) : null}
      </MetaInfoNote>

      {editing ? (
        <FuelPricePeriodDrawer
          market={market.market}
          products={products.length > 0 ? products : DEFAULT_PRODUCTS}
          period={
            editing.row
              ? { date: editing.row.date, prices: editing.row.prices }
              : undefined
          }
          onClose={() => setEditing(null)}
        />
      ) : null}

      <CommonDialog
        isOpen={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        purpose="required"
        width={440}
      >
        <Layout
          header={
            <DialogHeader
              title={`Xoá kỳ ${deleting?.label ?? ''}?`}
              onOpenChange={() => setDeleting(null)}
            />
          }
          content={
            <LayoutContent padding={4}>
              <Text>
                Toàn bộ giá của kỳ này sẽ bị xoá. Nếu kỳ có trên nguồn, lần cập
                nhật sau sẽ thêm lại.
              </Text>
            </LayoutContent>
          }
          footer={
            <LayoutFooter>
              <HStack hAlign="end" gap={2}>
                <Button
                  label="Huỷ"
                  variant="secondary"
                  onClick={() => setDeleting(null)}
                />
                <Button
                  label="Xoá kỳ"
                  variant="destructive"
                  isLoading={remove.isPending}
                  onClick={confirmDelete}
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </CommonDialog>
    </VStack>
  );
}
