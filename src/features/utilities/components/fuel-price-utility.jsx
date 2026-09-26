'use client';

import { VStack } from '@astryxdesign/core/VStack';
import { Fuel } from 'lucide-react';
import { useState } from 'react';

import {
  MetaPageHeader,
  MetaTabNav,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';

import { FUEL_MARKETS } from '../config/fuel-prices.js';
import { FuelMarketPanel } from './fuel-market-panel.jsx';
import { FuelNewsSection } from './fuel-news-section.jsx';

const PANEL_ID = 'fuel-market-panel';

/**
 * "Tiện ích › Xăng dầu": one tab per market (`FUEL_MARKETS`; Việt Nam for
 * now), the market's prices, then the latest news.
 * @param {{ articles: import('../api/fuel-news.js').FuelNewsArticle[] }} props
 */
export function FuelPriceUtility({ articles }) {
  const [activeId, setActiveId] = useState(FUEL_MARKETS[0].id);
  const market =
    FUEL_MARKETS.find((candidate) => candidate.id === activeId) ??
    FUEL_MARKETS[0];

  return (
    <MetaThemeProvider>
      <VStack gap={6} hAlign="stretch">
        <MetaPageHeader
          trail={[
            { label: 'Logistics', href: '/logistics' },
            { label: 'Tiện ích' },
            { label: 'Xăng dầu' },
          ]}
          icon={Fuel}
          title="Giá xăng dầu"
          description="Giá bán lẻ qua từng kỳ điều hành, biểu đồ biến động và tin tức mới nhất."
        />
        <MetaTabNav
          tabs={FUEL_MARKETS.map(({ id, label }) => ({ id, label }))}
          activeId={market.id}
          onChange={setActiveId}
          panelId={PANEL_ID}
          isSticky={false}
        />
        <VStack id={PANEL_ID} role="tabpanel" gap={6} hAlign="stretch">
          <FuelMarketPanel key={market.id} market={market} />
        </VStack>
        <FuelNewsSection articles={articles} />
      </VStack>
    </MetaThemeProvider>
  );
}
