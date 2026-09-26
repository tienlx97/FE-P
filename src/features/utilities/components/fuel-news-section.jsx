'use client';

import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { ArrowUpRight, Clock, Newspaper } from 'lucide-react';
import { useState } from 'react';

import {
  MetaPill,
  MetaUtilityCard,
} from '@/shared/components/custom/meta/index.js';

/** @typedef {import('../api/fuel-news.js').FuelNewsArticle} FuelNewsArticle */

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Ho_Chi_Minh',
});

/**
 * "3 giờ trước" for the last day, else "dd/MM, HH:mm".
 * @param {string} iso
 * @param {number} now
 */
function publishedLabel(iso, now) {
  const hours = Math.floor((now - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return 'Vừa đăng';
  if (hours < 24) return `${hours} giờ trước`;
  return timeFormatter.format(new Date(iso));
}

/**
 * One article as a clickable card: source pill + time, title, "Đọc bài".
 * `isFeatured` = the newest one: larger title, tinted surface.
 * @param {{ article: FuelNewsArticle, now: number, isFeatured?: boolean }} props
 */
function NewsCard({ article, now, isFeatured = false }) {
  return (
    <ClickableCard
      label={`${article.title} — ${article.source}`}
      href={article.url}
      target="_blank"
      padding={isFeatured ? 5 : 4}
      height="100%"
      xstyle={[styles.card, isFeatured && styles.featured]}
    >
      <VStack gap={3} hAlign="stretch" xstyle={styles.fill}>
        <HStack hAlign="between" vAlign="center" gap={2} wrap="wrap">
          <HStack gap={2} vAlign="center">
            {isFeatured ? (
              <MetaPill label="Mới nhất" tone="accent" size="sm" />
            ) : null}
            <MetaPill label={article.source} tone="neutral" size="sm" />
          </HStack>
          <HStack gap={1} vAlign="center">
            <Icon icon={Clock} size="xsm" color="secondary" />
            <Text as="span" size="sm" color="secondary">
              {publishedLabel(article.publishedAt, now)}
            </Text>
          </HStack>
        </HStack>
        <Text
          as="p"
          size={isFeatured ? 'lg' : 'base'}
          weight="semibold"
          maxLines={3}
        >
          {article.title}
        </Text>
        <HStack gap={1} vAlign="center" xstyle={styles.readMore}>
          <Text as="span" size="sm" weight="semibold" color="accent">
            Đọc bài
          </Text>
          <Icon icon={ArrowUpRight} size="xsm" color="accent" />
        </HStack>
      </VStack>
    </ClickableCard>
  );
}

/**
 * "Tin tức giá xăng dầu": the newest article featured on top, the others
 * in a card grid; each opens the original in a new tab. Hidden when the
 * feed gave nothing.
 * @param {{ articles: FuelNewsArticle[] }} props
 */
export function FuelNewsSection({ articles }) {
  // Read once per mount ("x giờ trước"), not on every render.
  const [now] = useState(() => Date.now());
  if (articles.length === 0) return null;
  const [featured, ...others] = articles;

  return (
    <MetaUtilityCard
      icon={Newspaper}
      title="Tin tức giá xăng dầu"
      tag="Google News"
      description="Bài viết mới nhất từ các báo, cập nhật mỗi giờ. Nội dung thuộc các báo nguồn."
    >
      <VStack gap={4} hAlign="stretch">
        <NewsCard article={featured} now={now} isFeatured />
        {others.length > 0 ? (
          <Grid columns={{ minWidth: 260, max: 3 }} gap={4}>
            {others.map((article) => (
              <NewsCard key={article.url} article={article} now={now} />
            ))}
          </Grid>
        ) : null}
      </VStack>
    </MetaUtilityCard>
  );
}

const styles = stylex.create({
  card: {
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--meta-radius-inset)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
  },
  featured: {
    backgroundColor: 'var(--meta-surface-container-low)',
    borderColor: 'var(--color-border-emphasized)',
  },
  fill: {
    height: '100%',
  },
  // Pins "Đọc bài" to the bottom so cards in a row line up.
  readMore: {
    marginTop: 'auto',
  },
});
