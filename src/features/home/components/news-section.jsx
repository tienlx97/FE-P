'use client';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { Heading, Text } from '@astryxdesign/core/Text';
import { spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { publisherColor, relativeTime } from '../config/news.js';

const styles = stylex.create({
  // Lets a long publisher filter scroll sideways on phones instead of
  // overflowing the card.
  filters: {
    overflowX: 'auto',
    paddingBlockEnd: spacingVars['--spacing-1'],
    scrollbarWidth: 'none',
  },
  region: { minWidth: 0, overflowWrap: 'anywhere' },
});

/** @typedef {import('../types/feed.js').Article} Article */
/** @typedef {{value:string, label:string, match:(article:Article)=>boolean}} NewsFilter */

/** @param {{article:Article, now:number}} props */
function ArticleMeta({ article, now }) {
  return (
    <HStack gap={2} align="center" wrap="wrap">
      <Token
        size="sm"
        color={publisherColor(article.source)}
        label={article.source}
      />
      <Text type="supporting">{relativeTime(article.publishedAt, now)}</Text>
    </HStack>
  );
}

/**
 * Card of publisher headlines with an optional filter and a featured lead.
 * @param {{title:string, description:string, icon:import('lucide-react').LucideIcon,
 *   articles:Article[], filters:NewsFilter[], initialCount:number, hasLead?:boolean,
 *   now:number}} props  `now` = when the client received the feed (relative times).
 */
export function NewsSection({
  title,
  description,
  icon,
  articles,
  filters,
  initialCount,
  hasLead = false,
  now,
}) {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState(filters[0]?.value ?? 'all');
  const matcher = filters.find((item) => item.value === filter)?.match;
  const filtered = matcher ? articles.filter(matcher) : articles;
  const visible = expanded ? filtered : filtered.slice(0, initialCount);
  return (
    <Card xstyle={styles.region}>
      <VStack gap={3}>
        <HStack gap={2} justify="between" align="center" wrap="wrap">
          <HStack gap={2} align="center">
            <Icon icon={icon} color="accent" />
            <Heading level={2}>{title}</Heading>
          </HStack>
          <Text type="supporting">{description}</Text>
        </HStack>
        {filters.length > 1 ? (
          <HStack xstyle={styles.filters}>
            <SegmentedControl
              size="sm"
              label={`Lọc ${title}`}
              value={filter}
              onChange={(value) => {
                setFilter(value);
                setExpanded(false);
              }}
            >
              {filters.map((item) => (
                <SegmentedControlItem
                  key={item.value}
                  value={item.value}
                  label={`${item.label} · ${articles.filter(item.match).length}`}
                />
              ))}
            </SegmentedControl>
          </HStack>
        ) : null}
        {visible.length ? (
          <List hasDividers>
            {visible.map((article, index) => (
              <ListItem
                key={article.url}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                label={
                  hasLead && index === 0 ? (
                    <Text size="lg" weight="semibold">
                      {article.title}
                    </Text>
                  ) : (
                    article.title
                  )
                }
                description={<ArticleMeta article={article} now={now} />}
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
        {filtered.length > initialCount ? (
          <Button
            variant="ghost"
            label={
              expanded
                ? `Thu gọn · ${title}`
                : `Xem thêm ${filtered.length - initialCount} tin · ${title}`
            }
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          />
        ) : null}
      </VStack>
    </Card>
  );
}
