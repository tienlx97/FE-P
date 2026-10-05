'use client';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { CloudSun, Coins, Newspaper, RefreshCw, Ship } from 'lucide-react';
import { useState } from 'react';

import { newsTime } from '../config/weather.js';
import { useHomeFeed } from '../hooks/use-home-feed.js';
import { GoldPanel, WeatherPanel } from './market-panels.jsx';

const styles = stylex.create({
  dashboard: { maxWidth: '80rem', width: '100%', marginInline: 'auto' },
  columns: {
    alignItems: 'stretch',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      '@media (min-width: 60rem)': 'minmax(0, 1fr) minmax(0, 1fr)',
    },
  },
  region: { minWidth: 0, overflowWrap: 'anywhere' },
});
/** @param {{title:string, description:string, icon:typeof Newspaper, articles:import('../types/feed.js').Article[]}} props */
function NewsSection({ title, description, icon, articles }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? articles : articles.slice(0, 5);
  return (
    <VStack gap={3} xstyle={styles.region}>
      <HStack gap={2}>
        <Icon icon={icon} color="accent" />
        <Heading level={2}>{title}</Heading>
      </HStack>
      <Text type="supporting">{description}</Text>
      {articles.length ? (
        <List hasDividers density="spacious">
          {visible.map((article) => (
            <ListItem
              key={article.url}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              label={article.title}
              description={`${article.source} · ${newsTime(article.publishedAt)}`}
              endContent={
                <Icon icon="externalLink" color="secondary" size="sm" />
              }
            />
          ))}
        </List>
      ) : (
        <Text color="secondary">
          Chưa có tin từ nguồn trong lần cập nhật này.
        </Text>
      )}
      {articles.length > 5 ? (
        <Button
          variant="ghost"
          label={
            expanded
              ? `Thu gọn · ${title}`
              : `Xem thêm ${articles.length - 5} tin · ${title}`
          }
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        />
      ) : null}
    </VStack>
  );
}
/** @param {{operations?:import('react').ReactNode}} props */
export function LiveHome({ operations }) {
  const query = useHomeFeed();
  const feed = query.data;
  return (
    <VStack gap={6} xstyle={[styles.region, styles.dashboard]}>
      <HStack gap={3} wrap="wrap" justify="between">
        <VStack gap={2}>
          <Text type="label" color="accent">
            THÔNG TIN & VẬN HÀNH
          </Text>
          <Heading level={1}>Bản tin hôm nay</Heading>
          <Text color="secondary">
            Một góc nhìn nhanh cho ngày làm việc của bạn.
          </Text>
          {feed ? (
            <Text type="supporting">
              Cập nhật lúc {newsTime(feed.fetchedAt)} · Tự làm mới mỗi 15 phút
            </Text>
          ) : null}
        </VStack>
        <Button
          variant="secondary"
          icon={<Icon icon={RefreshCw} />}
          label="Làm mới bản tin"
          isLoading={query.isFetching}
          onClick={() => query.refetch()}
        />
      </HStack>
      {query.isPending ? (
        <Grid gap={4} xstyle={styles.columns}>
          <Skeleton width="100%" height="18rem" />
          <Skeleton width="100%" height="18rem" />
        </Grid>
      ) : null}
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
      {feed ? (
        <Grid gap={4} xstyle={styles.columns}>
          <Card variant="blue" xstyle={styles.region}>
            <VStack gap={4}>
              <HStack gap={2}>
                <Icon icon={CloudSun} color="accent" />
                <Heading level={2}>Thời tiết</Heading>
              </HStack>
              <WeatherPanel weather={feed.weather} />
            </VStack>
          </Card>
          <Card variant="yellow" xstyle={styles.region}>
            <VStack gap={4}>
              <HStack gap={2}>
                <Icon icon={Coins} color="warning" />
                <Heading level={2}>Giá vàng</Heading>
              </HStack>
              <GoldPanel gold={feed.gold} />
            </VStack>
          </Card>
        </Grid>
      ) : null}
      {operations}
      {feed ? (
        <Grid gap={6} xstyle={styles.columns}>
          <NewsSection
            title="Tin nổi bật"
            description="Tin mới từ VnExpress & Tuổi Trẻ"
            icon={Newspaper}
            articles={feed.headlines}
          />
          <NewsSection
            title="Logistics & xuất nhập khẩu"
            description="Vận tải biển, thương mại & chuỗi cung ứng"
            icon={Ship}
            articles={feed.logistics}
          />
        </Grid>
      ) : null}
    </VStack>
  );
}
