'use client';

import { Button } from '@astryxdesign/core/Button';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import {
  radiusVars,
  spacingVars,
} from '@astryxdesign/core/theme/tokens.stylex';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import Image from 'next/image';
import { useState } from 'react';

import { formatDayMonth } from '../api/date.js';
import { latestNews } from '../config/news.js';

const styles = stylex.create({
  thumbnail: {
    borderRadius: radiusVars['--radius-inner'],
    height: spacingVars['--spacing-10'],
    objectFit: 'cover',
    width: spacingVars['--spacing-10'],
  },
});

export function NewsHighlights() {
  const [expanded, setExpanded] = useState(false);
  const visibleNews = expanded ? latestNews : latestNews.slice(0, 3);
  return (
    <VStack gap={2}>
      <List
        hasDividers
        density="compact"
        header="Tin khác"
        data-testid="home-news"
      >
        {visibleNews.map(({ id, title, category, date, image, href }) => (
          <ListItem
            key={id}
            label={`${category} · ${formatDayMonth(date)}`}
            href={href}
            startContent={
              <Image
                src={image.src}
                alt=""
                width={80}
                height={80}
                {...stylex.props(styles.thumbnail)}
              />
            }
            description={<Text weight="semibold">{title}</Text>}
          />
        ))}
      </List>
      {latestNews.length > 3 ? (
        <Button
          variant="ghost"
          size="sm"
          label={
            expanded ? 'Thu gọn tin' : `Xem thêm ${latestNews.length - 3} tin`
          }
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        />
      ) : null}
    </VStack>
  );
}
