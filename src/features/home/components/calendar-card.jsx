'use client';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import {
  colorVars,
  radiusVars,
  spacingVars,
} from '@astryxdesign/core/theme/tokens.stylex';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { CalendarDays, Quote } from 'lucide-react';

import {
  auspiciousHours,
  dailySaying,
  dayCanChi,
  holidayName,
  monthCanChi,
  solarToLunar,
  yearCanChi,
} from '../config/lunar.js';
import { useVietnamToday } from '../hooks/use-vietnam-today.js';

const WEEKDAYS = [
  'Chủ nhật',
  'Thứ hai',
  'Thứ ba',
  'Thứ tư',
  'Thứ năm',
  'Thứ sáu',
  'Thứ bảy',
];

// A tear-off wall calendar page ("lịch bloc"): red header band, a large solar
// day, then the lunar day, Can Chi, auspicious hours and a saying.
const styles = stylex.create({
  band: {
    backgroundColor: colorVars['--color-background-red'],
    color: colorVars['--color-text-red'],
    paddingBlock: spacingVars['--spacing-2'],
    paddingInline: spacingVars['--spacing-4'],
  },
  page: {
    paddingBlock: spacingVars['--spacing-4'],
    paddingInline: spacingVars['--spacing-4'],
  },
  center: { alignItems: 'center', textAlign: 'center' },
  // Solar day: the page's dominant figure, red on Sundays and holidays as on
  // printed Vietnamese calendars. The size sits on this wrapper and the Text
  // uses type="inherit", because an xstyle font size on Text loses to its type.
  dayFrame: { fontSize: '4.5rem', fontWeight: 700, lineHeight: 1 },
  day: { color: colorVars['--color-text-accent'] },
  red: { color: colorVars['--color-text-red'] },
  saying: {
    backgroundColor: colorVars['--color-background-muted'],
    borderRadius: radiusVars['--radius-container'],
    paddingBlock: spacingVars['--spacing-3'],
    paddingInline: spacingVars['--spacing-3'],
  },
  italic: { fontStyle: 'italic' },
  region: { minWidth: 0, overflowWrap: 'anywhere' },
});

/** @param {number} day */
function lunarDayLabel(day) {
  return day <= 10 ? `Mùng ${day}` : `Ngày ${day}`;
}

export function CalendarCard() {
  const today = useVietnamToday();
  if (!today) {
    return <Skeleton width="100%" height="26rem" />;
  }
  const { day, month, year } = today;
  const lunar = solarToLunar(day, month, year);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const holiday = holidayName(day, month, lunar);
  const isRed = weekday === 0 || holiday !== null;
  return (
    <Card padding={0} xstyle={styles.region}>
      <HStack
        justify="between"
        align="center"
        gap={2}
        wrap="wrap"
        xstyle={styles.band}
      >
        <HStack gap={2} align="center">
          <Icon icon={CalendarDays} color="inherit" />
          <Text weight="semibold" color="inherit">
            Tháng {month}, {year}
          </Text>
        </HStack>
        <Text type="supporting" color="inherit">
          Năm {yearCanChi(lunar.year)}
        </Text>
      </HStack>
      <VStack gap={4} xstyle={styles.page}>
        <VStack gap={2} xstyle={styles.center}>
          <Text
            type="label"
            color={isRed ? 'inherit' : 'secondary'}
            xstyle={isRed && styles.red}
          >
            {WEEKDAYS[weekday].toUpperCase()}
          </Text>
          <VStack xstyle={styles.dayFrame}>
            <Text
              type="inherit"
              hasTabularNumbers
              color="inherit"
              xstyle={[styles.day, isRed && styles.red]}
            >
              {day}
            </Text>
          </VStack>
          {holiday ? <Token color="red" label={holiday} /> : null}
        </VStack>
        <Divider />
        <Grid gap={3} columns={2}>
          <VStack gap={1} xstyle={styles.region}>
            <Text type="label" color="secondary">
              ÂM LỊCH
            </Text>
            <Text type="display-3" weight="semibold" hasTabularNumbers>
              {lunar.day}
            </Text>
            <Text type="supporting">
              {lunarDayLabel(lunar.day)} · Tháng {lunar.month}
              {lunar.isLeap ? ' nhuận' : ''}
            </Text>
          </VStack>
          <VStack gap={1} xstyle={styles.region}>
            <Text type="supporting">
              Ngày <Text weight="semibold">{dayCanChi(lunar.jd)}</Text>
            </Text>
            <Text type="supporting">
              Tháng{' '}
              <Text weight="semibold">
                {monthCanChi(lunar.month, lunar.year)}
              </Text>
            </Text>
            <Text type="supporting">
              Năm <Text weight="semibold">{yearCanChi(lunar.year)}</Text>
            </Text>
          </VStack>
        </Grid>
        <VStack gap={1}>
          <Text type="label" color="secondary">
            Giờ hoàng đạo
          </Text>
          <Text type="supporting">{auspiciousHours(lunar.jd).join(' · ')}</Text>
        </VStack>
        <HStack gap={2} align="start" xstyle={styles.saying}>
          <Icon icon={Quote} color="secondary" size="sm" />
          <Text xstyle={styles.italic}>{dailySaying(lunar.jd)}</Text>
        </HStack>
      </VStack>
    </Card>
  );
}
