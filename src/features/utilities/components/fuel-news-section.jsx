'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { ExternalLink, Newspaper } from 'lucide-react';

import { MetaUtilityCard } from '@/shared/components/custom/meta/index.js';

/** @typedef {import('../api/fuel-news.js').FuelNewsArticle} FuelNewsArticle */

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Ho_Chi_Minh',
});

/**
 * "Tin tức giá xăng dầu": the newest articles (Google News), opened in a
 * new tab. Hidden when the feed gave nothing.
 * @param {{ articles: FuelNewsArticle[] }} props
 */
export function FuelNewsSection({ articles }) {
  if (articles.length === 0) return null;

  return (
    <MetaUtilityCard
      icon={Newspaper}
      title="Tin tức giá xăng dầu"
      tag="Google News"
      description="Bài viết mới nhất từ các báo, cập nhật mỗi giờ."
    >
      <List hasDividers>
        {articles.map((article) => (
          <ListItem
            key={article.url}
            label={article.title}
            description={`${article.source} · ${timeFormatter.format(new Date(article.publishedAt))}`}
            href={article.url}
            target="_blank"
            endContent={
              <HStack>
                <Icon icon={ExternalLink} size="sm" color="secondary" />
              </HStack>
            }
          />
        ))}
      </List>
      <Text as="p" size="sm" color="secondary">
        Nội dung thuộc các báo nguồn; bấm để đọc bài gốc.
      </Text>
    </MetaUtilityCard>
  );
}
