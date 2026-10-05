'use client';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Heading, Text } from '@astryxdesign/core/Text';
import { spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Newspaper, RefreshCw, Ship } from 'lucide-react';

import { publishers } from '../config/news.js';
import { newsTime } from '../config/weather.js';
import { useHomeFeed } from '../hooks/use-home-feed.js';
import { GoldPanel, WeatherPanel } from './market-panels.jsx';
import { NewsSection } from './news-section.jsx';

// Desktop: reading column (operations → news) beside a sticky 24rem rail of
// quick-look widgets. Below 64rem the rail moves first so weather and gold stay
// above the fold; between 40 and 64rem its two cards sit side by side.
const styles = stylex.create({
  dashboard: { marginInline: 'auto', maxWidth: '80rem', width: '100%' },
  layout: {
    alignItems: 'start',
    gridTemplateAreas: {
      default: '"rail" "ops" "news"',
      '@media (min-width: 64rem)': '"ops rail" "news rail"',
    },
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      '@media (min-width: 64rem)': 'minmax(0, 1fr) 24rem',
    },
    gridTemplateRows: {
      default: 'auto',
      '@media (min-width: 64rem)': 'auto 1fr',
    },
  },
  layoutNoOps: {
    gridTemplateAreas: {
      default: '"rail" "news"',
      '@media (min-width: 64rem)': '"news rail"',
    },
    gridTemplateRows: 'auto',
  },
  rail: {
    gridArea: 'rail',
    insetBlockStart: `calc(64px + ${spacingVars['--spacing-4']})`,
    position: { default: 'static', '@media (min-width: 64rem)': 'sticky' },
  },
  railCards: {
    alignItems: 'start',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      '@media (min-width: 40rem) and (max-width: 63.99rem)':
        'minmax(0, 1fr) minmax(0, 1fr)',
    },
  },
  ops: { gridArea: 'ops' },
  news: { gridArea: 'news' },
  region: { minWidth: 0, overflowWrap: 'anywhere' },
});

/** @typedef {import('./news-section.jsx').NewsFilter} NewsFilter */
const ALL = /** @type {NewsFilter} */ ({
  value: 'all',
  label: 'Tất cả',
  match: () => true,
});
const LOGISTICS_FILTERS = /** @type {NewsFilter[]} */ ([
  ALL,
  {
    value: 'vn',
    label: 'Việt Nam',
    match: (article) => article.region === 'vn',
  },
  {
    value: 'global',
    label: 'Quốc tế',
    match: (article) => article.region === 'global',
  },
]);
/** @param {import('../types/feed.js').Article[]} articles @returns {NewsFilter[]} */
function publisherFilters(articles) {
  return [
    ALL,
    ...publishers(articles).map((source) => ({
      value: source,
      label: source,
      match: (/** @type {import('../types/feed.js').Article} */ article) =>
        article.source === source,
    })),
  ];
}

/** @param {string} iso */
function longDate(iso) {
  const text = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(iso));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** @param {{operations?:import('react').ReactNode}} props */
export function LiveHome({ operations }) {
  const query = useHomeFeed();
  const feed = query.data;
  return (
    <VStack gap={6} xstyle={[styles.region, styles.dashboard]}>
      <HStack gap={3} wrap="wrap" justify="between" align="end">
        <VStack gap={1}>
          <Text type="label" color="accent">
            {feed ? longDate(feed.fetchedAt) : 'THÔNG TIN & VẬN HÀNH'}
          </Text>
          <Heading level={1}>Bản tin hôm nay</Heading>
          <Text type="supporting">
            {feed
              ? `Cập nhật lúc ${newsTime(feed.fetchedAt)} · Tự làm mới mỗi 15 phút`
              : 'Một góc nhìn nhanh cho ngày làm việc của bạn.'}
          </Text>
        </VStack>
        <Button
          variant="secondary"
          icon={<Icon icon={RefreshCw} />}
          label="Làm mới bản tin"
          isLoading={query.isFetching}
          onClick={() => query.refetch()}
        />
      </HStack>
      {query.isError ? (
        <Banner
          status="error"
          title="Không thể cập nhật bản tin"
          description={query.error.message}
        />
      ) : null}
      {feed?.unavailableSources.length ? (
        <Banner
          status="warning"
          title="Một số nguồn tạm thời chưa có dữ liệu"
          description={feed.unavailableSources.join(', ')}
        />
      ) : null}
      <Grid gap={6} xstyle={[styles.layout, !operations && styles.layoutNoOps]}>
        <Grid gap={4} xstyle={[styles.rail, styles.railCards]}>
          {feed ? (
            <>
              <WeatherPanel weather={feed.weather} />
              <GoldPanel gold={feed.gold} />
            </>
          ) : query.isPending ? (
            <>
              <Skeleton width="100%" height="16rem" />
              <Skeleton width="100%" height="14rem" />
            </>
          ) : null}
        </Grid>
        {operations ? (
          <VStack xstyle={[styles.region, styles.ops]}>{operations}</VStack>
        ) : null}
        <VStack gap={6} xstyle={[styles.region, styles.news]}>
          {feed ? (
            <>
              <NewsSection
                title="Tin nổi bật"
                description={`${feed.headlines.length} tin mới nhất từ ${publishers(feed.headlines).length} báo`}
                icon={Newspaper}
                articles={feed.headlines}
                filters={publisherFilters(feed.headlines)}
                initialCount={8}
                now={query.dataUpdatedAt}
                hasLead
              />
              <NewsSection
                title="Logistics & xuất nhập khẩu"
                description="Vận tải biển, thương mại & chuỗi cung ứng"
                icon={Ship}
                articles={feed.logistics}
                filters={LOGISTICS_FILTERS}
                initialCount={8}
                now={query.dataUpdatedAt}
              />
            </>
          ) : query.isPending ? (
            <Skeleton width="100%" height="24rem" />
          ) : null}
        </VStack>
      </Grid>
    </VStack>
  );
}
