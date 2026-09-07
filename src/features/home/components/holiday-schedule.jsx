import { HStack } from '@astryxdesign/core/HStack';
import { Link } from '@astryxdesign/core/Link';
import { Heading, Text } from '@astryxdesign/core/Text';
import { colorVars, radiusVars } from '@astryxdesign/core/theme/tokens.stylex';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';

import { formatDateBadge, parseIsoDate } from '../api/date.js';
import { events } from '../config/events.js';

const holidays = events.filter((event) => event.kind === 'holiday');
const styles = stylex.create({
  panel: {
    backgroundColor: colorVars['--color-accent-muted'],
    borderRadius: radiusVars['--radius-container'],
    minWidth: 0,
  },
  date: { flexShrink: 0 },
});

export function HolidaySchedule() {
  return (
    <VStack
      role="region"
      gap={5}
      padding={5}
      xstyle={styles.panel}
      aria-labelledby="lich-nghi"
    >
      <VStack gap={1}>
        <Heading id="lich-nghi" level={2} type="display-3">
          Lịch nghỉ lễ
        </Heading>
        <Text color="secondary">Các ngày nghỉ đã đăng</Text>
      </VStack>
      {holidays.length ? (
        holidays.map((holiday) => {
          const { day, month } = formatDateBadge(holiday.date);
          return (
            <HStack key={holiday.id} gap={4} vAlign="center">
              <VStack hAlign="center" xstyle={styles.date}>
                <Text type="display-1" weight="bold" color="accent">
                  {day.padStart(2, '0')}
                </Text>
                <Text type="supporting" color="accent">
                  {month}/{parseIsoDate(holiday.date).getFullYear()}
                </Text>
              </VStack>
              <VStack gap={1}>
                <Heading level={3}>{holiday.title}</Heading>
                <Text type="supporting" color="secondary">
                  {holiday.audience}
                </Text>
              </VStack>
            </HStack>
          );
        })
      ) : (
        <Text>Chưa có lịch nghỉ được đăng.</Text>
      )}
      <Text type="supporting">
        Thời gian nghỉ và bố trí trực theo thông báo của từng đơn vị.
      </Text>
      <Link href="/docs/nghi-phep" isStandalone>
        Quy định nghỉ phép →
      </Link>
    </VStack>
  );
}
