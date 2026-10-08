'use client';

import { Button } from '@astryxdesign/core/Button';
import { Grid } from '@astryxdesign/core/Grid';
import { HoverCard } from '@astryxdesign/core/HoverCard';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { ScrollableArea } from '@astryxdesign/core/ScrollableArea';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

import {
  addDays,
  addMonths,
  dayOverflow,
  dayRange,
  groupByDay,
  isSameMonth,
  monthTitle,
  monthWeeks,
  rangeTitle,
  rowsThatFit,
  WEEKDAY_LABELS,
  weekdayLabel,
} from '@/shared/config/schedule-calendar.js';

/** Days in the "2 tuần" view. */
const LIST_DAYS = 14;

/** Month-cell rows before the grid has been measured. */
const DEFAULT_ROWS = 3;

/**
 * @typedef {'accent' | 'success' | 'warning' | 'danger' | 'neutral' | 'indigo' | 'pink' | 'teal'} MetaScheduleTone
 * @typedef {{ id: string, date: string, title: string, tone: MetaScheduleTone }} MetaScheduleItem
 * @typedef {'month' | 'twoWeeks'} MetaScheduleView
 */

/**
 * Meta schedule (the Astryx lab `Schedule` restyled from scratch — its
 * event pills, month grid and labels cannot be themed): a full-height card
 * with a Vietnamese header (‹ Hôm nay › · title · view switch) and either
 * a month grid whose week rows stretch to the card's height, or a 14-day
 * list. Items are one-day, clickable pills with a colored rail (`tone`);
 * past days keep their colors. A month day shows as many items as its
 * cell fits (measured; `maxPerDay` caps it), otherwise one row less and
 * "+n mục", which opens that day in the list view; items keep the order
 * given. `renderItemPreview` (optional) shows a hover card on each item —
 * also opened by keyboard focus. `isLoading` draws skeleton rows instead of
 * items.
 * @param {{
 *   label: string,
 *   view: MetaScheduleView,
 *   onViewChange: (view: MetaScheduleView) => void,
 *   anchor: string,
 *   onAnchorChange: (anchor: string) => void,
 *   today: string,
 *   items: MetaScheduleItem[],
 *   onItemClick?: (item: MetaScheduleItem) => void,
 *   renderItemPreview?: (item: MetaScheduleItem) => import('react').ReactNode,
 *   headerStart?: import('react').ReactNode,
 *   headerEnd?: import('react').ReactNode,
 *   maxPerDay?: number,
 *   isLoading?: boolean,
 * }} props
 */
export function MetaSchedule({
  label,
  view,
  onViewChange,
  anchor,
  onAnchorChange,
  today,
  items,
  onItemClick,
  renderItemPreview,
  headerStart,
  headerEnd,
  maxPerDay = Infinity,
  isLoading = false,
}) {
  const byDay = groupByDay(items);
  const listDays = dayRange(anchor, LIST_DAYS);
  const title =
    view === 'month' ? monthTitle(anchor) : rangeTitle(listDays[0], listDays[LIST_DAYS - 1]);
  const step = (/** @type {number} */ direction) =>
    onAnchorChange(
      view === 'month' ? addMonths(anchor, direction) : addDays(anchor, direction * LIST_DAYS),
    );

  return (
    <VStack gap={0} hAlign="stretch" xstyle={styles.card} aria-label={label}>
      <HStack gap={3} vAlign="center" wrap="wrap" xstyle={styles.header}>
        <HStack gap={1} vAlign="center">
          <IconButton
            label={view === 'month' ? 'Tháng trước' : '2 tuần trước'}
            icon={<Icon icon={ChevronLeft} size="sm" />}
            variant="ghost"
            size="sm"
            onClick={() => step(-1)}
          />
          <Button
            label="Hôm nay"
            variant="secondary"
            size="sm"
            onClick={() => onAnchorChange(today)}
          />
          <IconButton
            label={view === 'month' ? 'Tháng sau' : '2 tuần sau'}
            icon={<Icon icon={ChevronRight} size="sm" />}
            variant="ghost"
            size="sm"
            onClick={() => step(1)}
          />
        </HStack>
        <Heading level={2} xstyle={styles.title}>
          {title}
        </Heading>
        {headerStart}
        <HStack gap={2} vAlign="center" xstyle={styles.headerEnd}>
          <SegmentedControl
            label="Chế độ xem"
            size="sm"
            value={view}
            onChange={(value) => onViewChange(/** @type {MetaScheduleView} */ (value))}
          >
            <SegmentedControlItem value="month" label="Tháng" />
            <SegmentedControlItem value="twoWeeks" label="2 tuần" />
          </SegmentedControl>
          {headerEnd}
        </HStack>
      </HStack>

      {view === 'month' ? (
        <MonthGrid
          anchor={anchor}
          today={today}
          byDay={byDay}
          maxPerDay={maxPerDay}
          isLoading={isLoading}
          onItemClick={onItemClick}
          renderItemPreview={renderItemPreview}
          onShowDay={(day) => {
            onAnchorChange(day);
            onViewChange('twoWeeks');
          }}
        />
      ) : (
        <DayList
          days={listDays}
          today={today}
          byDay={byDay}
          isLoading={isLoading}
          onItemClick={onItemClick}
          renderItemPreview={renderItemPreview}
        />
      )}
    </VStack>
  );
}

/**
 * Rows that fit in the month grid's cells (all the same height), measured
 * whenever the grid resizes; {@link DEFAULT_ROWS} until then.
 * @param {string} gridId
 */
function useMonthCellRows(gridId) {
  const [rows, setRows] = useState(DEFAULT_ROWS);

  useEffect(() => {
    const grid = document.getElementById(gridId);
    if (!grid || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => {
      const cell = /** @type {HTMLElement | null} */ (grid.firstElementChild);
      const dayNumber = /** @type {HTMLElement | null} */ (cell?.firstElementChild ?? null);
      if (!cell || !dayNumber) return;
      const style = getComputedStyle(cell);
      setRows(
        rowsThatFit({
          available: cell.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom),
          rowHeight: dayNumber.getBoundingClientRect().height,
          gap: parseFloat(style.rowGap) || 0,
        }),
      );
    });
    observer.observe(grid);
    return () => observer.disconnect();
  }, [gridId]);

  return rows;
}

/** Skeleton rows of a day while loading (0–2, fixed per day so it does not flicker). */
const skeletonRows = (/** @type {string} */ day) => Number(day.slice(8, 10)) % 3;

/**
 * @param {{
 *   anchor: string,
 *   today: string,
 *   byDay: Map<string, MetaScheduleItem[]>,
 *   maxPerDay: number,
 *   isLoading: boolean,
 *   onItemClick?: (item: MetaScheduleItem) => void,
 *   renderItemPreview?: (item: MetaScheduleItem) => import('react').ReactNode,
 *   onShowDay: (day: string) => void,
 * }} props
 */
function MonthGrid({ anchor, today, byDay, maxPerDay, isLoading, onItemClick, renderItemPreview, onShowDay }) {
  const weeks = monthWeeks(anchor);
  const gridId = useId();
  const rows = Math.min(useMonthCellRows(gridId), maxPerDay);

  return (
    <VStack gap={0} hAlign="stretch" xstyle={styles.fill}>
      <Grid columns={7} gap={0} xstyle={styles.weekdays}>
        {WEEKDAY_LABELS.map((weekday) => (
          <Text key={weekday} size="sm" weight="semibold" color={weekday === 'CN' ? 'inherit' : 'secondary'} xstyle={[styles.weekday, weekday === 'CN' && styles.sunday]}>
            {weekday}
          </Text>
        ))}
      </Grid>
      <Grid id={gridId} columns={7} gap={0} xstyle={[styles.fill, styles.monthRows(weeks.length)]}>
        {weeks.flat().map((day) => {
          const dayItems = byDay.get(day) ?? [];
          const { shown, hidden } = dayOverflow(dayItems.length, rows);
          const isOutside = !isSameMonth(day, anchor);
          return (
            <VStack
              key={day}
              gap={1}
              hAlign="stretch"
              xstyle={[styles.cell, isOutside && styles.cellOutside, day === today && styles.cellToday]}
            >
              <DayNumber day={day} today={today} isMuted={isOutside} />
              {isLoading
                ? Array.from({ length: Math.min(skeletonRows(day), rows) }, (_, index) => (
                    <Skeleton key={index} height="var(--spacing-6)" radius={1} index={index} />
                  ))
                : dayItems.slice(0, shown).map((item) => (
                    <ScheduleItem key={item.id} item={item} onClick={onItemClick} renderPreview={renderItemPreview} />
                  ))}
              {!isLoading && hidden > 0 ? (
                <HStack
                  as="button"
                  gap={0}
                  vAlign="center"
                  aria-label={`Xem thêm ${hidden} mục ngày ${day}`}
                  onClick={() => onShowDay(day)}
                  xstyle={styles.more}
                >
                  <Text size="sm" weight="semibold" color="secondary">
                    {`+${hidden} mục`}
                  </Text>
                </HStack>
              ) : null}
            </VStack>
          );
        })}
      </Grid>
    </VStack>
  );
}

/**
 * @param {{
 *   days: string[],
 *   today: string,
 *   byDay: Map<string, MetaScheduleItem[]>,
 *   isLoading: boolean,
 *   onItemClick?: (item: MetaScheduleItem) => void,
 *   renderItemPreview?: (item: MetaScheduleItem) => import('react').ReactNode,
 * }} props
 */
function DayList({ days, today, byDay, isLoading, onItemClick, renderItemPreview }) {
  return (
    <ScrollableArea label="Các ngày" height="100%" xstyle={styles.fill}>
      <VStack gap={0} hAlign="stretch">
        {days.map((day) => {
          const dayItems = byDay.get(day) ?? [];
          return (
            <HStack key={day} gap={4} vAlign="start" xstyle={[styles.listRow, day === today && styles.cellToday]}>
              <VStack gap={0.5} hAlign="center" xstyle={styles.listDate}>
                <Text size="sm" color={weekdayLabel(day) === 'CN' ? 'inherit' : day === today ? 'accent' : 'secondary'} weight="semibold" xstyle={weekdayLabel(day) === 'CN' && styles.sunday}>
                  {weekdayLabel(day)}
                </Text>
                <DayNumber day={day} today={today} />
              </VStack>
              {isLoading ? (
                <HStack gap={1.5} wrap="wrap" xstyle={styles.listItems}>
                  {Array.from({ length: skeletonRows(day) + 1 }, (_, index) => (
                    <Skeleton key={index} width="12rem" height="var(--spacing-6)" radius={1} index={index} />
                  ))}
                </HStack>
              ) : dayItems.length > 0 ? (
                <HStack gap={1.5} wrap="wrap" xstyle={styles.listItems}>
                  {dayItems.map((item) => (
                    <ScheduleItem
                      key={item.id}
                      item={item}
                      onClick={onItemClick}
                      renderPreview={renderItemPreview}
                      isWide
                    />
                  ))}
                </HStack>
              ) : (
                <Text size="sm" color="meta-subtle" xstyle={styles.listEmpty}>
                  Không có mốc nào
                </Text>
              )}
            </HStack>
          );
        })}
      </VStack>
    </ScrollableArea>
  );
}

/** @param {{ day: string, today: string, isMuted?: boolean }} props */
function DayNumber({ day, today, isMuted = false }) {
  const isToday = day === today;
  const isSunday = weekdayLabel(day) === 'CN';
  return (
    <HStack hAlign="center" vAlign="center" xstyle={[styles.dayNumber, isToday && (isSunday ? styles.dayNumberSundayToday : styles.dayNumberToday)]}>
      <Text
        size="sm"
        weight={isToday ? 'bold' : 'semibold'}
        color={isToday ? 'inherit' : isSunday ? 'inherit' : isMuted ? 'meta-subtle' : 'primary'}
        xstyle={isSunday && !isToday && styles.sunday}
        hasTabularNumbers
      >
        {String(Number(day.slice(8, 10)))}
      </Text>
    </HStack>
  );
}

/**
 * One clickable item: colored rail + tint, text truncated in the month
 * grid, wrapping in the list; wrapped in a hover card when `renderPreview`
 * is given.
 * @param {{
 *   item: MetaScheduleItem,
 *   onClick?: (item: MetaScheduleItem) => void,
 *   renderPreview?: (item: MetaScheduleItem) => import('react').ReactNode,
 *   isWide?: boolean,
 * }} props
 */
function ScheduleItem({ item, onClick, renderPreview, isWide = false }) {
  const trigger = (
    <HStack
      as="button"
      gap={0}
      vAlign="center"
      aria-label={item.title}
      onClick={() => onClick?.(item)}
      xstyle={[styles.item, tones[item.tone], isWide ? styles.itemWide : styles.itemRow]}
    >
      <Text size="sm" weight="semibold" color="inherit" xstyle={isWide ? styles.itemTextWide : styles.itemText}>
        {item.title}
      </Text>
    </HStack>
  );
  if (!renderPreview) return trigger;

  return (
    <HoverCard
      content={renderPreview(item)}
      label={item.title}
      placement="end"
      alignment="start"
      hasHoverIndication={false}
    >
      {trigger}
    </HoverCard>
  );
}

/**
 * The color sample of a tone (rail + tint), e.g. for a legend.
 * @param {{ tone: MetaScheduleTone }} props
 */
export function MetaScheduleSwatch({ tone }) {
  return <HStack as="span" gap={0} xstyle={[styles.swatch, swatches[tone]]} />;
}

const styles = stylex.create({
  swatch: {
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
    height: 'var(--spacing-2)',
    width: 'var(--spacing-2)',
  },
  card: {
    // Facebook card (2026-10-08): shadow, no hairline.
    backgroundColor: 'var(--color-background-card)',
    borderColor: 'transparent',
    borderRadius: 'var(--radius-container)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    boxShadow: 'var(--meta-shadow-card)',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBlock: 'var(--spacing-3)',
    paddingInline: 'var(--spacing-4)',
  },
  title: {
    fontSize: 'var(--font-size-lg)',
    whiteSpace: 'nowrap',
  },
  headerEnd: {
    marginInlineStart: 'auto',
  },
  fill: {
    flexGrow: 1,
    minHeight: 0,
  },
  weekdays: {
    backgroundColor: 'var(--meta-inset-bg)',
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
  },
  weekday: {
    paddingBlock: 'var(--spacing-2)',
    paddingInline: 'var(--spacing-3)',
    textTransform: 'uppercase',
  },
  // Sundays in blue (was red): red stays for sailings that cannot be booked.
  sunday: {
    color: 'var(--color-accent)',
  },
  monthRows: (count) => ({
    gridTemplateRows: `repeat(${count}, minmax(0, 1fr))`,
  }),
  cell: {
    borderBottomColor: 'var(--meta-outline-light)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    borderInlineEndColor: 'var(--meta-outline-light)',
    borderInlineEndStyle: 'solid',
    borderInlineEndWidth: 'var(--border-width)',
    minWidth: 0,
    overflow: 'hidden',
    padding: 'var(--spacing-1-5)',
  },
  cellOutside: {
    backgroundColor: 'var(--meta-inset-bg)',
  },
  cellToday: {
    backgroundColor: 'var(--meta-accent-tint)',
  },
  dayNumber: {
    borderRadius: 'var(--radius-full)',
    height: 'var(--spacing-6)',
    width: 'var(--spacing-6)',
  },
  dayNumberToday: {
    backgroundColor: 'var(--color-accent)',
    color: 'var(--color-on-accent)',
  },
  dayNumberSundayToday: {
    backgroundColor: 'var(--color-accent)',
    color: 'var(--color-on-accent)',
  },
  more: {
    alignSelf: 'flex-start',
    backgroundColor: {
      default: 'transparent',
      ':hover': 'var(--meta-inset-bg)',
    },
    borderRadius: 'var(--radius-element)',
    borderWidth: 0,
    cursor: 'pointer',
    flexShrink: 0,
    height: 'var(--spacing-6)',
    outlineColor: {
      default: null,
      ':focus-visible': 'var(--color-accent)',
    },
    outlineStyle: {
      default: null,
      ':focus-visible': 'solid',
    },
    paddingInline: 'var(--spacing-1-5)',
  },
  /** A month-grid item: exactly one row, as tall as the day number. */
  itemRow: {
    flexShrink: 0,
    height: 'var(--spacing-6)',
  },
  item: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderEndEndRadius: 'var(--radius-element)',
    borderEndStartRadius: 0,
    borderInlineStartWidth: 'var(--spacing-1)',
    borderStartEndRadius: 'var(--radius-element)',
    borderStartStartRadius: 0,
    borderStyle: 'solid',
    borderWidth: 0,
    cursor: 'pointer',





    filter: {
      default: null,
      ':hover': 'brightness(0.96)',
    },
    minWidth: 0,
    outlineColor: {
      default: null,
      ':focus-visible': 'var(--color-accent)',
    },
    outlineStyle: {
      default: null,
      ':focus-visible': 'solid',
    },
    paddingBlock: 'var(--spacing-0-5)',
    paddingInline: 'var(--spacing-1-5)',
    textAlign: 'start',
    width: '100%',
  },
  itemWide: {
    width: 'auto',
  },
  itemText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemTextWide: {
    whiteSpace: 'normal',
  },
  listRow: {
    borderBottomColor: 'var(--meta-outline-light)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBlock: 'var(--spacing-2)',
    paddingInline: 'var(--spacing-4)',
  },
  listDate: {
    flexShrink: 0,
    width: 'var(--spacing-10)',
  },
  listItems: {
    flexGrow: 1,
    minWidth: 0,
    paddingBlockStart: 'var(--spacing-1)',
  },
  listEmpty: {
    paddingBlockStart: 'var(--spacing-1-5)',
  },
});

/** Rail + tint + ink per tone (same palette as `MetaPill`). */
const tones = stylex.create({
  accent: {
    backgroundColor: 'var(--meta-blue-wash)',
    borderInlineStartColor: 'var(--color-accent)',
    color: 'var(--meta-primary-strong)',
  },
  success: {
    backgroundColor: 'var(--meta-emerald-wash)',
    borderInlineStartColor: 'var(--meta-emerald-fill)',
    color: 'var(--meta-emerald-deep)',
  },
  warning: {
    backgroundColor: 'var(--meta-amber-wash)',
    borderInlineStartColor: 'var(--meta-amber)',
    color: 'var(--meta-amber-text)',
  },
  danger: {
    backgroundColor: 'var(--color-error-muted)',
    borderInlineStartColor: 'var(--color-error)',
    color: 'var(--meta-on-error-container)',
  },
  neutral: {
    backgroundColor: 'var(--meta-hairline)',
    borderInlineStartColor: 'var(--color-text-secondary)',
    color: 'var(--color-text-primary)',
  },
  indigo: {
    backgroundColor: 'var(--meta-indigo-wash)',
    borderInlineStartColor: 'var(--meta-indigo)',
    color: 'var(--meta-indigo-deep)',
  },
  pink: {
    backgroundColor: 'var(--meta-pink-wash)',
    borderInlineStartColor: 'var(--meta-pink)',
    color: 'var(--meta-pink-deep)',
  },
  teal: {
    backgroundColor: 'var(--meta-teal-wash)',
    borderInlineStartColor: 'var(--meta-teal)',
    color: 'var(--meta-teal-deep)',
  },
});

/** Solid rail color per tone (legend swatches). */
const swatches = stylex.create({
  accent: { backgroundColor: 'var(--color-accent)' },
  success: { backgroundColor: 'var(--meta-emerald-fill)' },
  warning: { backgroundColor: 'var(--meta-amber)' },
  danger: { backgroundColor: 'var(--color-error)' },
  neutral: { backgroundColor: 'var(--color-text-secondary)' },
  indigo: { backgroundColor: 'var(--meta-indigo)' },
  pink: { backgroundColor: 'var(--meta-pink)' },
  teal: { backgroundColor: 'var(--meta-teal)' },
});
