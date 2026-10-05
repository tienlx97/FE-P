'use client';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import {
  colorVars,
  fontWeightVars,
  radiusVars,
  spacingVars,
  textSizeVars,
} from '@astryxdesign/core/theme/tokens.stylex';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { CalendarDays } from 'lucide-react';

import { holidayName, solarToLunar, yearCanChi } from '../config/lunar.js';
import { dailyQuote } from '../config/quotes.js';
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
// day with its lunar date, then the quote of the day.
const styles = stylex.create({
  band: {
    backgroundColor: colorVars['--color-background-red'],
    color: colorVars['--color-text-red'],
    paddingBlock: spacingVars['--spacing-2'],
    paddingInline: spacingVars['--spacing-4'],
  },
  page: {
    paddingBlock: spacingVars['--spacing-5'],
    paddingInline: spacingVars['--spacing-4'],
  },
  center: { alignItems: 'center', textAlign: 'center' },
  // Solar day: the page's dominant figure, red on Sundays and holidays as on
  // printed Vietnamese calendars. The size sits on this wrapper and the Text
  // uses type="inherit", because an xstyle font size on Text loses to its type.
  dayFrame: { fontSize: '4.5rem', fontWeight: 700, lineHeight: 1 },
  day: { color: colorVars['--color-text-accent'] },
  red: { color: colorVars['--color-text-red'] },
  lunar: {
    backgroundColor: colorVars['--color-background-muted'],
    borderRadius: radiusVars['--radius-full'],
    paddingBlock: spacingVars['--spacing-1'],
    paddingInline: spacingVars['--spacing-3'],
  },
  // Quote of the day, hand-built: a tinted note with an oversized faded
  // quotation mark behind the text and a red-ruled attribution.
  quote: {
    backgroundColor: colorVars['--color-background-muted'],
    borderRadius: radiusVars['--radius-container'],
    margin: 0,
    overflow: 'hidden',
    paddingBlockEnd: spacingVars['--spacing-4'],
    paddingBlockStart: spacingVars['--spacing-6'],
    paddingInline: spacingVars['--spacing-5'],
    position: 'relative',
  },
  glyph: {
    color: colorVars['--color-text-red'],
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '6rem',
    insetBlockStart: '-0.75rem',
    insetInlineStart: spacingVars['--spacing-2'],
    lineHeight: 1,
    opacity: 0.18,
    pointerEvents: 'none',
    position: 'absolute',
    userSelect: 'none',
  },
  quoteText: {
    color: colorVars['--color-text-primary'],
    fontSize: textSizeVars['--font-size-lg'],
    fontStyle: 'italic',
    fontWeight: fontWeightVars['--font-weight-medium'],
    lineHeight: 1.55,
    margin: 0,
    position: 'relative',
    textWrap: 'balance',
  },
  author: {
    alignItems: 'center',
    color: colorVars['--color-text-secondary'],
    display: 'flex',
    fontSize: textSizeVars['--font-size-sm'],
    fontWeight: fontWeightVars['--font-weight-semibold'],
    gap: spacingVars['--spacing-2'],
    letterSpacing: '0.02em',
    marginBlockStart: spacingVars['--spacing-3'],
    '::before': {
      backgroundColor: colorVars['--color-text-red'],
      blockSize: '2px',
      content: '""',
      inlineSize: spacingVars['--spacing-5'],
    },
  },
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
  const quote = dailyQuote(lunar.jd);
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
      <VStack gap={5} xstyle={styles.page}>
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
          <HStack gap={2} align="center" xstyle={styles.lunar}>
            <Text type="label" color="secondary">
              Âm lịch
            </Text>
            <Text type="supporting" color="primary">
              <Text weight="semibold" hasTabularNumbers>
                {lunarDayLabel(lunar.day)}
              </Text>{' '}
              · Tháng {lunar.month}
              {lunar.isLeap ? ' nhuận' : ''}
            </Text>
          </HStack>
        </VStack>
        <figure {...stylex.props(styles.quote)}>
          <span aria-hidden="true" {...stylex.props(styles.glyph)}>
            “
          </span>
          <blockquote {...stylex.props(styles.quoteText)}>
            {quote.text}
          </blockquote>
          <figcaption {...stylex.props(styles.author)}>
            {quote.author}
          </figcaption>
        </figure>
      </VStack>
    </Card>
  );
}
