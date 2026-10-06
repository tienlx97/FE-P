'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Check } from 'lucide-react';

import { MetaPill } from './pill.jsx';

/**
 * @typedef {{
 *   id: string,
 *   title: string,
 *   state: import('./event-timeline.jsx').MetaTimelineState,
 *   date: string,
 *   detail?: string,
 *   count?: { label: string, isComplete: boolean },
 * }} MetaMilestoneStep
 */

/**
 * Horizontal "Meta" milestone strip (a carrier's tracking bar): one step
 * per milestone left → right, each a state dot (same states as
 * `MetaEventTimeline`) on a rail that is solid through the done steps,
 * then the title, the date, a detail line (weekday · time) and the pills
 * (an optional "x/y" count, "Tiếp theo" / "Quá hạn") last, so the dates
 * line up across steps. Scrolls sideways when the steps do not fit. Values
 * arrive formatted. Composed from Astryx `HStack` / `VStack` / `Text` /
 * `Icon` + `MetaPill` (golden rule #15).
 *
 * @param {{ steps: MetaMilestoneStep[], label: string }} props
 */
export function MetaMilestoneStrip({ steps, label }) {
  return (
    <HStack
      as="ol"
      gap={0}
      vAlign="start"
      wrap="nowrap"
      aria-label={label}
      xstyle={styles.list}
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isMuted = step.state === 'upcoming';
        return (
          <VStack as="li" key={step.id} gap={2} hAlign="stretch" xstyle={styles.step}>
            <HStack gap={0} vAlign="center" wrap="nowrap">
              <HStack
                as="span"
                hAlign="center"
                vAlign="center"
                xstyle={[styles.dot, dotStyles[step.state]]}
              >
                {step.state === 'done' ? (
                  <Icon icon={Check} size="xsm" color="inherit" />
                ) : null}
              </HStack>
              {isLast ? null : (
                <HStack
                  as="span"
                  xstyle={[
                    styles.line,
                    step.state === 'done' ? styles.lineDone : styles.lineTodo,
                  ]}
                />
              )}
            </HStack>
            <VStack gap={1} hAlign="start" xstyle={styles.body}>
              <Text
                size="sm"
                weight="semibold"
                color={isMuted ? 'secondary' : 'primary'}
              >
                {step.title}
              </Text>
              <Text
                type="code"
                weight={step.state === 'done' ? 'bold' : 'medium'}
                color={isMuted ? 'secondary' : 'primary'}
              >
                {step.date}
              </Text>
              {step.detail ? (
                <Text size="sm" type="code" color="secondary">
                  {step.detail}
                </Text>
              ) : null}
              {step.count || step.state === 'next' || step.state === 'overdue' ? (
                <HStack gap={1.5} vAlign="center" wrap="wrap">
                  {step.count ? (
                    <MetaPill
                      label={step.count.label}
                      tone={step.count.isComplete ? 'success' : 'neutral'}
                      size="sm"
                    />
                  ) : null}
                  {step.state === 'next' ? (
                    <MetaPill label="Tiếp theo" tone="accent" size="sm" />
                  ) : step.state === 'overdue' ? (
                    <MetaPill label="Quá hạn" tone="warning" size="sm" />
                  ) : null}
                </HStack>
              ) : null}
            </VStack>
          </VStack>
        );
      })}
    </HStack>
  );
}

const styles = stylex.create({
  list: {
    listStyle: 'none',
    margin: 0,
    overflowX: 'auto',
    padding: 0,
    paddingBottom: 'var(--spacing-1)',
  },
  // Wide enough for "Gate-in cảng xuất" + a count pill on one or two lines.
  step: {
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 'calc(var(--spacing-32) + var(--spacing-4))',
  },
  body: {
    minWidth: 0,
    paddingInlineEnd: 'var(--spacing-3)',
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
    height: 'calc(var(--border-width) * 2)',
    marginInline: 'var(--spacing-1)',
  },
  lineDone: {
    backgroundColor: 'var(--meta-emerald-dot)',
  },
  lineTodo: {
    backgroundColor: 'var(--color-border)',
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
