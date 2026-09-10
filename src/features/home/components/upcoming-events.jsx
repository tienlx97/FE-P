'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { formatEventWhen, parseIsoDate } from '../api/date.js';
import { events } from '../config/events.js';
import { MiniCalendar } from './mini-calendar.jsx';
import { SectionHeading } from './section-heading.jsx';

const styles = stylex.create({
  region: { minWidth: 0 },
  agenda: { minWidth: 0, width: '100%' },
});

/** @param {{ initialDate: string }} props */
export function UpcomingEvents({ initialDate }) {
  const [cursor, setCursor] = useState(() => {
    const date = parseIsoDate(initialDate);
    return { year: date.getFullYear(), month: date.getMonth() };
  });
  const monthEvents = events.filter((event) => {
    const date = parseIsoDate(event.date);
    return (
      date.getFullYear() === cursor.year && date.getMonth() === cursor.month
    );
  });
  /** @param {number} delta */
  function moveMonth(delta) {
    setCursor(({ year, month }) => {
      const date = new Date(year, month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  }
  const agendaHeading = (
    <Text color="secondary" weight="semibold">
      Trong tháng {cursor.month + 1}/{cursor.year}
    </Text>
  );
  return (
    <VStack gap={4} xstyle={styles.region}>
      <HStack justify="between" gap={3} wrap="wrap">
        <SectionHeading id="su-kien" title="Lịch công ty" />
        <HStack gap={1}>
          <IconButton
            label="Tháng trước"
            tooltip="Tháng trước"
            variant="ghost"
            size="sm"
            icon={<Icon icon="chevronLeft" />}
            onClick={() => moveMonth(-1)}
          />
          <IconButton
            label="Tháng sau"
            tooltip="Tháng sau"
            variant="ghost"
            size="sm"
            icon={<Icon icon="chevronRight" />}
            onClick={() => moveMonth(1)}
          />
        </HStack>
      </HStack>
      <VStack gap={3}>
        <MiniCalendar
          year={cursor.year}
          month={cursor.month}
          entries={monthEvents}
        />
        <VStack
          gap={2}
          xstyle={styles.agenda}
          aria-live="polite"
          data-testid="home-agenda"
        >
          {monthEvents.length ? (
            <List hasDividers density="balanced" header={agendaHeading}>
              {monthEvents.map((event) => (
                <ListItem
                  key={event.id}
                  label={event.kind === 'holiday' ? 'Nghỉ lễ' : 'Sự kiện'}
                  description={
                    <VStack gap={1}>
                      <Text weight="semibold">{event.title}</Text>
                      <Text type="supporting" color="secondary">
                        {formatEventWhen(event)}
                      </Text>
                    </VStack>
                  }
                />
              ))}
            </List>
          ) : (
            <VStack gap={2}>
              {agendaHeading}
              <Text color="secondary">
                Chưa có lịch được đăng trong tháng này.
              </Text>
            </VStack>
          )}
        </VStack>
      </VStack>
    </VStack>
  );
}
