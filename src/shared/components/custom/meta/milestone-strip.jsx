'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Check, Pencil, Star } from 'lucide-react';

import { MetaPill } from './pill.jsx';

/**
 * @typedef {'accent' | 'success' | 'warning' | 'danger' | 'neutral' | 'indigo' | 'muted'} MetaMilestoneTone
 * @typedef {{
 *   id: string,
 *   title: string,
 *   state: import('./event-timeline.jsx').MetaTimelineState,
 *   date: string,
 *   detail?: string,
 *   caption?: string,
 *   isOutOfScope?: boolean,
 *   pills?: Array<{ label: string, tone: MetaMilestoneTone, isMarker?: boolean }>,
 *   action?: { label: string, onClick: () => void },
 * }} MetaMilestoneStep
 */

/**
 * Horizontal "Meta" milestone strip (a carrier's tracking bar): one step
 * per milestone left → right, each a state dot (same states as
 * `MetaEventTimeline`) on a rail that is solid through the done steps,
 * then the title (+ an optional edit action), the date, a detail line
 * (weekday · time, or what the date is), a caption (place / vessel) and
 * the pills last — counts, markers ("Chuyển rủi ro", star icon), alerts,
 * "Tiếp theo" / "Quá hạn" — so the dates line up across steps. A step
 * outside the tracked scope (the buyer's legs) has a dashed hollow dot and
 * muted text. Scrolls sideways when the steps do not fit. Values arrive
 * formatted. Composed from Astryx `HStack` / `VStack` / `Text` / `Icon` /
 * `IconButton` + `MetaPill` (golden rule #15).
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
        const isMuted = step.state === 'upcoming' || step.isOutOfScope;
        const pills = [
          ...(step.pills ?? []),
          ...(step.state === 'next'
            ? [{ label: 'Tiếp theo', tone: /** @type {const} */ ('accent') }]
            : step.state === 'overdue'
              ? [{ label: 'Quá hạn', tone: /** @type {const} */ ('warning') }]
              : []),
        ];
        return (
          <VStack
            as="li"
            key={step.id}
            gap={2}
            hAlign="stretch"
            aria-current={step.state === 'next' ? 'step' : undefined}
            xstyle={styles.step}
          >
            <HStack gap={0} vAlign="center" wrap="nowrap">
              <HStack
                as="span"
                hAlign="center"
                vAlign="center"
                xstyle={[
                  styles.dot,
                  dotStyles[step.state],
                  step.isOutOfScope &&
                    step.state === 'upcoming' &&
                    styles.dotOutOfScope,
                ]}
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
            <VStack gap={1} hAlign="stretch" xstyle={styles.body}>
              <HStack gap={1} vAlign="center" wrap="nowrap">
                <Text
                  size="sm"
                  weight="semibold"
                  color={isMuted ? 'secondary' : 'primary'}
                  maxLines={1}
                >
                  {step.title}
                </Text>
                {step.action ? (
                  <IconButton
                    label={step.action.label}
                    tooltip={step.action.label}
                    icon={<Icon icon={Pencil} size="xsm" color="secondary" />}
                    variant="ghost"
                    size="sm"
                    onClick={step.action.onClick}
                  />
                ) : null}
              </HStack>
              <Text
                type="code"
                weight={step.state === 'done' ? 'bold' : 'medium'}
                color={isMuted ? 'secondary' : 'primary'}
                maxLines={1}
              >
                {step.date}
              </Text>
              {step.detail ? (
                <Text size="sm" type="code" color="secondary" maxLines={1}>
                  {step.detail}
                </Text>
              ) : null}
              {step.caption ? (
                <Text
                  size="sm"
                  color={/** @type {any} */ ('meta-subtle')}
                  maxLines={1}
                >
                  {step.caption}
                </Text>
              ) : null}
              {pills.length > 0 ? (
                <HStack gap={1} vAlign="center" wrap="wrap">
                  {pills.map((pill) => (
                    <MetaPill
                      key={pill.label}
                      label={pill.label}
                      tone={pill.tone}
                      size="sm"
                      icon={
                        'isMarker' in pill && pill.isMarker ? Star : undefined
                      }
                    />
                  ))}
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
  // Wide enough for "Shipped on Board" + an edit button, or a marker pill.
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
  dotOutOfScope: {
    borderStyle: 'dashed',
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
