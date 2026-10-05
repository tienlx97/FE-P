'use client';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { useId, useState } from 'react';

import { articlesInTopic, findTopic, relativeTime } from '../config/news.js';

const styles = stylex.create({
  region: { minWidth: 0, overflowWrap: 'anywhere' },
});

/** @typedef {import('../types/feed.js').Article} Article */
/** @typedef {import('../config/news.js').Topic} Topic */

/** @param {{article:Article, topic:Topic|null, now:number}} props */
function ArticleMeta({ article, topic, now }) {
  return (
    <HStack gap={2} align="center" wrap="wrap">
      {topic ? (
        <Token size="sm" color={topic.color} label={topic.label} />
      ) : null}
      <Text type="supporting">
        {article.source} · {relativeTime(article.publishedAt, now)}
      </Text>
    </HStack>
  );
}

/**
 * Card of publisher stories split into topic tabs, with an optional featured lead.
 * In the first ("all") tab each story is tagged with its coloured topic.
 * @param {{title:string, description:string, icon:import('lucide-react').LucideIcon,
 *   articles:Article[], topics:Topic[], initialCount:number, hasLead?:boolean,
 *   now:number}} props  `now` = when the client received the feed (relative times).
 */
export function NewsSection({
  title,
  description,
  icon,
  articles,
  topics,
  initialCount,
  hasLead = false,
  now,
}) {
  const panelId = useId();
  const [expanded, setExpanded] = useState(false);
  const [topic, setTopic] = useState(topics[0].value);
  const isAll = topic === topics[0].value;
  const filtered = articlesInTopic(articles, topic);
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
        <TabList
          role="tablist"
          size="sm"
          hasDivider
          isFullBleed
          value={topic}
          onChange={(value) => {
            setTopic(value);
            setExpanded(false);
          }}
        >
          {topics.map((item) => (
            <Tab
              key={item.value}
              value={item.value}
              label={item.label}
              panelId={panelId}
              endContent={
                <Text type="supporting" hasTabularNumbers>
                  {articlesInTopic(articles, item.value).length}
                </Text>
              }
            />
          ))}
        </TabList>
        <VStack id={panelId} role="tabpanel" gap={3}>
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
                  description={
                    <ArticleMeta
                      article={article}
                      topic={isAll ? findTopic(topics, article.topic) : null}
                      now={now}
                    />
                  }
                  endContent={
                    <Icon icon="externalLink" color="secondary" size="sm" />
                  }
                />
              ))}
            </List>
          ) : (
            <Text color="secondary">
              Chưa có tin trong mục này ở lần cập nhật này.
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
      </VStack>
    </Card>
  );
}
