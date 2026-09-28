'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Check } from 'lucide-react';

import { MetaPill } from './pill.jsx';

/**
 * @typedef {'done' | 'next' | 'overdue' | 'upcoming'} MetaTimelineState
 * @typedef {'accent' | 'success' | 'warning' | 'danger' | 'neutral'} MetaTimelineTone
 * @typedef {{
 *   id: string,
 *   title: string,
 *   state: MetaTimelineState,
 *   date: string,
 *   time?: string,
 *   subtitle?: string,
 *   meta?: string,
 *   note?: { label: string, tone: MetaTimelineTone },
 *   tags?: Array<{ label: string, tone: MetaTimelineTone }>,
 * }} MetaTimelineItem
 */

/**
 * Vertical "Meta" event timeline: one row per event — the date column on
 * the left (on phones, the date leads the event text instead), a rail with a state dot (done = filled check, next = ringed
 * accent, overdue = amber, upcoming = hollow) joined by a line that is
 * solid through the done events, then the event title with its place,
 * context line, a plan-vs-actual note and optional tags. Values arrive
 * formatted. Composed from Astryx `HStack` / `VStack` / `Text` / `Icon` +
 * `MetaPill` (golden rule #15).
 *
 * @param {{
 *   items: MetaTimelineItem[],
 *   emptyLabel: string,
 * }} props
 */
export function MetaEventTimeline({ items, emptyLabel }) {
  if (items.length === 0) {
    return (
      <HStack hAlign="center" xstyle={styles.empty}>
        <Text color="secondary">{emptyLabel}</Text>
      </HStack>
    );
  }

  return (
    <VStack as="ol" gap={0} hAlign="stretch" xstyle={styles.list}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isMuted = item.state === 'upcoming';
        return (
          <HStack
            as="li"
            key={item.id}
            gap={3}
            vAlign="stretch"
            wrap="nowrap"
            xstyle={styles.row}
          >
            <VStack gap={0.5} hAlign="end" xstyle={styles.dateColumn}>
              <Text
                type="code"
                weight={item.state === 'done' ? 'bold' : 'medium'}
                color={isMuted ? 'secondary' : 'primary'}
              >
                {item.date}
              </Text>
              {item.time ? (
                <Text size="sm" type="code" color="secondary">
                  {item.time}
                </Text>
              ) : null}
            </VStack>

            <VStack gap={0} hAlign="center" xstyle={styles.rail}>
              <HStack
                as="span"
                hAlign="center"
                vAlign="center"
                xstyle={[styles.dot, dotStyles[item.state]]}
              >
                {item.state === 'done' ? (
                  <Icon icon={Check} size="xsm" color="inherit" />
                ) : null}
              </HStack>
              {isLast ? null : (
                <HStack
                  as="span"
                  xstyle={[
                    styles.line,
                    item.state === 'done' ? styles.lineDone : styles.lineTodo,
                  ]}
                />
              )}
            </VStack>

            <VStack
              gap={1}
              hAlign="stretch"
              xstyle={[styles.content, isLast && styles.contentLast]}
            >
              {/* Phones: the date column is hidden and the date leads the
                  event text instead, leaving the width to the notes. */}
              <Text
                size="sm"
                type="code"
                weight="bold"
                color={isMuted ? 'secondary' : 'primary'}
                xstyle={styles.inlineDate}
              >
                {item.time ? `${item.date} · ${item.time}` : item.date}
              </Text>
              <HStack gap={2} vAlign="center" wrap="wrap">
                <Text
                  weight={item.state === 'upcoming' ? 'medium' : 'semibold'}
                  color={isMuted ? 'secondary' : 'primary'}
                >
                  {item.title}
                </Text>
                {item.state === 'next' ? (
                  <MetaPill label="Tiếp theo" tone="accent" size="sm" />
                ) : null}
                {(item.tags ?? []).map((tag) => (
                  <MetaPill
                    key={tag.label}
                    label={tag.label}
                    tone={tag.tone}
                    size="sm"
                  />
                ))}
              </HStack>
              {item.subtitle ? (
                <Text size="sm" color="secondary">
                  {item.subtitle}
                </Text>
              ) : null}
              {item.meta || item.note ? (
                <HStack gap={2} vAlign="center" wrap="wrap">
                  {item.note ? (
                    <MetaPill
                      label={item.note.label}
                      tone={item.note.tone}
                      size="sm"
                      hasBorder
                    />
                  ) : null}
                  {item.meta ? (
                    <Text size="sm" color="meta-subtle">
                      {item.meta}
                    </Text>
                  ) : null}
                </HStack>
              ) : null}
            </VStack>
          </HStack>
        );
      })}
    </VStack>
  );
}

const styles = stylex.create({
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  row: {
    minWidth: 0,
  },
  // Fits "dd/mm/yyyy" in the code face; the rail lines up under it.
  dateColumn: {
    display: {
      default: 'flex',
      '@media (max-width: 640px)': 'none',
    },
    flexShrink: 0,
    paddingTop: 'var(--spacing-0-5)',
    width: 'calc(var(--spacing-12) * 2)',
  },
  rail: {
    flexShrink: 0,
    paddingTop: 'var(--spacing-1)',
    width: 'var(--spacing-5)',
  },
  dot: {
    // Longhands: the StyleX lint autofix splits a `borderWidth` shorthand
    // on spaces, which breaks a `calc()` value.
    borderBottomWidth: 'calc(var(--border-width) * 2)',
    borderLeftWidth: 'calc(var(--border-width) * 2)',
    borderRadius: 'var(--radius-full)',
    borderRightWidth: 'calc(var(--border-width) * 2)',
    borderStyle: 'solid',
    borderTopWidth: 'calc(var(--border-width) * 2)',
    boxSizing: 'border-box',
    flexShrink: 0,
    height: 'var(--spacing-5)',
    width: 'var(--spacing-5)',
  },
  line: {
    flexGrow: 1,
    marginBlock: 'var(--spacing-1)',
    minHeight: 'var(--spacing-4)',
    width: 'calc(var(--border-width) * 2)',
  },
  lineDone: {
    backgroundColor: 'var(--meta-emerald-dot)',
  },
  lineTodo: {
    backgroundColor: 'var(--color-border)',
  },
  content: {
    flexGrow: 1,
    minWidth: 0,
    paddingBottom: 'var(--spacing-5)',
  },
  inlineDate: {
    display: {
      default: 'none',
      '@media (max-width: 640px)': 'block',
    },
  },
  contentLast: {
    paddingBottom: 0,
  },
  empty: {
    paddingBlock: 'var(--spacing-8)',
  },
});

const dotStyles = stylex.create({
  done: {
    backgroundColor: 'var(--meta-emerald-dot)',
    borderColor: 'var(--meta-emerald-dot)',
    color: 'var(--color-on-accent)',
  },
  next: {
    backgroundColor: 'var(--meta-blue-wash)',
    borderColor: 'var(--color-accent)',
    boxShadow: '0 0 0 var(--spacing-1) var(--meta-blue-wash)',
  },
  overdue: {
    backgroundColor: 'var(--meta-amber-wash)',
    borderColor: 'var(--meta-amber-text)',
  },
  upcoming: {
    backgroundColor: 'var(--color-background-surface)',
    borderColor: 'var(--color-border-emphasized)',
  },
});
