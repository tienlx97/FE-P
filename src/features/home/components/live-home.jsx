'use client';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { List, ListItem } from '@astryxdesign/core/List';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';

import { newsTime, weatherLabel } from '../config/weather.js';
import { useHomeFeed } from '../hooks/use-home-feed.js';

const styles = stylex.create({
  columns: {
    alignItems: 'start',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      '@media (min-width: 960px)': 'minmax(0, 1fr) minmax(0, 1fr)',
    },
  },
  region: { minWidth: 0, overflowWrap: 'anywhere' },
});
/** @param {{title:string, articles:import('../types/feed.js').Article[]}} props */
function NewsSection({ title, articles }) {
  return (
    <VStack gap={3} xstyle={styles.region}>
      {articles.length ? (
        <List
          header={<Heading level={2}>{title}</Heading>}
          hasDividers
          density="spacious"
        >
          {articles.map((article) => (
            <ListItem
              key={article.url}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              label={article.title}
              description={`${article.source} · ${newsTime(article.publishedAt)}`}
            />
          ))}
        </List>
      ) : (
        <VStack gap={2}>
          <Heading level={2}>{title}</Heading>
          <Text color="secondary">
            Chưa có tin từ nguồn trong lần cập nhật này.
          </Text>
        </VStack>
      )}
    </VStack>
  );
}
export function LiveHome() {
  const query = useHomeFeed();
  const feed = query.data;
  return (
    <VStack gap={6}>
      <HStack gap={3} wrap="wrap" justify="between">
        <VStack gap={1}>
          <Heading level={1}>Bản tin hôm nay</Heading>
          <Text color="secondary">
            Thời tiết, thời sự và nhịp vận hành logistics
          </Text>
        </VStack>
        <Button
          variant="secondary"
          label={query.isFetching ? 'Đang cập nhật…' : 'Cập nhật'}
          isDisabled={query.isFetching}
          onClick={() => query.refetch()}
        />
      </HStack>
      {query.isPending ? <Skeleton width="100%" height="12rem" /> : null}
      {query.isError ? (
        <Banner
          status="error"
          title="Không thể cập nhật bản tin"
          description={query.error.message}
        />
      ) : null}
      {feed ? (
        <>
          <Text size="sm" color="secondary">
            Lấy dữ liệu lúc {newsTime(feed.fetchedAt)} · Tự cập nhật mỗi 15 phút
          </Text>
          {feed.unavailableSources.length ? (
            <Banner
              status="warning"
              title="Một số nguồn tạm thời chưa có dữ liệu"
              description={feed.unavailableSources.join(', ')}
            />
          ) : null}
          <Card>
            <VStack gap={4}>
              <Heading level={2}>Thời tiết · TP. Hồ Chí Minh</Heading>
              {feed.weather ? (
                <HStack wrap="wrap" gap={6} align="start">
                  <VStack gap={1}>
                    <Heading level={3}>{feed.weather.temperature} °C</Heading>
                    <Text>{weatherLabel(feed.weather.code)}</Text>
                    <Text size="sm" color="secondary">
                      Độ ẩm {feed.weather.humidity}% · Gió{' '}
                      {feed.weather.windSpeed} km/h
                    </Text>
                    <Text size="sm" color="secondary">
                      Dữ liệu mô hình lúc {feed.weather.time.replace('T', ' ')}{' '}
                      (giờ Việt Nam)
                    </Text>
                  </VStack>
                  {feed.weather.days.map((day) => (
                    <VStack key={day.date} gap={1}>
                      <Text weight="semibold">
                        {new Intl.DateTimeFormat('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                        }).format(new Date(day.date + 'T12:00:00+07:00'))}
                      </Text>
                      <Text>
                        {day.min}–{day.max} °C
                      </Text>
                      <Text size="sm" color="secondary">
                        {weatherLabel(day.code)} · Mưa {day.rainProbability}%
                      </Text>
                    </VStack>
                  ))}
                </HStack>
              ) : (
                <Text color="secondary">
                  Không thể tải thời tiết. Hãy thử cập nhật lại.
                </Text>
              )}
              <Button
                as="a"
                href="https://open-meteo.com/"
                target="_blank"
                rel="noopener noreferrer"
                variant="ghost"
                size="sm"
                label="Nguồn thời tiết: Open-Meteo"
              />
            </VStack>
          </Card>
          <Grid gap={6} xstyle={styles.columns}>
            <NewsSection title="Tin nổi bật" articles={feed.headlines} />
            <NewsSection
              title="Logistics & xuất nhập khẩu"
              articles={feed.logistics}
            />
          </Grid>
        </>
      ) : null}
    </VStack>
  );
}
