import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

import { formatDayMonth } from '../api/date.js';
import { announcements } from '../config/announcements.js';
import { SectionHeading } from './section-heading.jsx';

const orderedAnnouncements = [...announcements].sort((a, b) => {
  if (Boolean(a.isPinned) !== Boolean(b.isPinned)) return a.isPinned ? -1 : 1;
  return b.date.localeCompare(a.date);
});

export function AnnouncementsBoard() {
  return (
    <VStack gap={3}>
      <List
        hasDividers
        density="balanced"
        data-testid="home-notices"
        header={<SectionHeading id="thong-bao" title="Thông báo nội bộ" />}
      >
        {orderedAnnouncements.map(
          ({ id, tag, date, title, href, isPinned }) => (
            <ListItem
              key={id}
              href={href}
              label={`${isPinned ? 'Đã ghim · ' : ''}${tag} · ${formatDayMonth(date)}`}
              description={<Text weight="semibold">{title}</Text>}
              endContent={
                <Icon icon="chevronRight" size="sm" color="secondary" />
              }
            />
          ),
        )}
      </List>
    </VStack>
  );
}
