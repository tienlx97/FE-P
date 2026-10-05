'use client';
import { Card } from '@astryxdesign/core/Card';
import { Carousel } from '@astryxdesign/core/Carousel';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Sparkles } from 'lucide-react';

import {
  findTopic,
  leadPerTopic,
  NEWS_TOPICS,
  relativeTime,
} from '../config/news.js';

// Fixed-size slides so the row reads as an even strip whatever the title
// length: topic tag on top, a three-line title, source and time pinned to the
// bottom.
const SLIDE_WIDTH = '16rem';
const SLIDE_HEIGHT = '10rem';

const styles = stylex.create({
  slide: { height: '100%', justifyContent: 'space-between', minWidth: 0 },
  region: { minWidth: 0, overflowWrap: 'anywhere' },
});

/**
 * "Tin nổi bật": the newest story of each news topic as a carousel of cards.
 * @param {{articles:import('../types/feed.js').Article[], now:number}} props
 */
export function FeaturedNews({ articles, now }) {
  const leads = leadPerTopic(articles, NEWS_TOPICS);
  if (!leads.length) return null;
  return (
    <Card xstyle={styles.region}>
      <VStack gap={3}>
        <HStack gap={2} justify="between" align="center" wrap="wrap">
          <HStack gap={2} align="center">
            <Icon icon={Sparkles} color="accent" />
            <Heading level={2}>Tin nổi bật</Heading>
          </HStack>
          <Text type="supporting">Tin mới nhất của mỗi chủ đề</Text>
        </HStack>
        <Carousel aria-label="Tin nổi bật" gap={3} hasSnap>
          {leads.map((article) => {
            const topic = findTopic(NEWS_TOPICS, article.topic);
            return (
              <ClickableCard
                key={article.url}
                href={article.url}
                target="_blank"
                label={`${article.title} (${article.source})`}
                variant="muted"
                padding={3}
                width={SLIDE_WIDTH}
                height={SLIDE_HEIGHT}
              >
                <VStack gap={2} xstyle={styles.slide}>
                  <VStack gap={2} xstyle={styles.region}>
                    {topic ? (
                      <HStack>
                        <Token
                          size="sm"
                          color={topic.color}
                          label={topic.label}
                        />
                      </HStack>
                    ) : null}
                    <Text weight="semibold" maxLines={3}>
                      {article.title}
                    </Text>
                  </VStack>
                  <Text type="supporting" maxLines={1}>
                    {article.source} · {relativeTime(article.publishedAt, now)}
                  </Text>
                </VStack>
              </ClickableCard>
            );
          })}
        </Carousel>
      </VStack>
    </Card>
  );
}
