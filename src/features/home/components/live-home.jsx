'use client';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Newspaper, RefreshCw, Ship } from 'lucide-react';

import { LOGISTICS_TOPICS, NEWS_TOPICS } from '../config/news.js';
import { newsTime } from '../config/weather.js';
import { useHomeFeed } from '../hooks/use-home-feed.js';
import { CalendarCard } from './calendar-card.jsx';
import { GoldPanel, WeatherPanel } from './market-panels.jsx';
import { NewsSection } from './news-section.jsx';

// Desktop: reading column (operations → news) beside a 24rem rail of quick-look
// widgets (weather, calendar, gold). The rail is taller than a viewport, so it
// scrolls with the page rather than sticking. Below 64rem the rail moves first;
// between 40 and 64rem its cards sit two per row.
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
  rail: { gridArea: 'rail' },
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
            <WeatherPanel weather={feed.weather} />
          ) : query.isPending ? (
            <Skeleton width="100%" height="16rem" />
          ) : null}
          {/* The calendar is computed locally, so it shows even when the feed fails. */}
          <CalendarCard />
          {feed ? (
            <GoldPanel gold={feed.gold} />
          ) : query.isPending ? (
            <Skeleton width="100%" height="14rem" />
          ) : null}
        </Grid>
        {operations ? (
          <VStack xstyle={[styles.region, styles.ops]}>{operations}</VStack>
        ) : null}
        <VStack gap={6} xstyle={[styles.region, styles.news]}>
          {feed ? (
            <>
              <NewsSection
                title="Tin tức"
                description="Theo chủ đề, từ các trang chuyên mục"
                icon={Newspaper}
                articles={feed.headlines}
                topics={NEWS_TOPICS}
                initialCount={8}
                now={query.dataUpdatedAt}
                hasLead
              />
              <NewsSection
                title="Logistics & xuất nhập khẩu"
                description="Từ báo chí chuyên ngành logistics"
                icon={Ship}
                articles={feed.logistics}
                topics={LOGISTICS_TOPICS}
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
