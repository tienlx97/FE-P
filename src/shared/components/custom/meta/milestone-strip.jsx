'use client';

import { Carousel } from '@astryxdesign/core/Carousel';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Check, Pencil, Star } from 'lucide-react';
import { useEffect, useRef } from 'react';

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
 * muted text. The steps sit in an Astryx `Carousel` (user, 2026-10-08):
 * fixed-width slides that snap, prev / next buttons and edge fades when
 * they do not fit, opened on the next (else the last done) step. Values
 * arrive formatted. Composed from Astryx `Carousel` / `HStack` / `VStack` /
 * `Text` / `Icon` / `IconButton` + `MetaPill` (golden rule #15).
 *
 * @param {{ steps: MetaMilestoneStep[], label: string }} props
 */
export function MetaMilestoneStrip({ steps, label }) {
  const carousel = useRef(
    /** @type {import('@astryxdesign/core/Carousel').CarouselHandle | null} */ (
      null
    ),
  );
  // Open on where the shipment is: the next step, else the last done one.
  const nextIndex = steps.findIndex(
    (step) => step.state === 'next' || step.state === 'overdue',
  );
  const focusIndex =
    nextIndex !== -1
      ? nextIndex
      : steps.reduce(
          (last, step, index) => (step.state === 'done' ? index : last),
          0,
        );
  useEffect(() => {
    // Keep one done step in view before it, so the rail reads as progress.
    carousel.current?.scrollTo(Math.max(focusIndex - 1, 0));
  }, [focusIndex]);

  return (
    <Carousel
      aria-label={label}
      gap={0}
      hasSnap
      handleRef={carousel}
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
    </Carousel>
  );
}

const styles = stylex.create({
  list: {
    paddingBottom: 'var(--spacing-1)',
  },
  // Wide enough for "Shipped on Board" + an edit button, or a marker pill;
  // capped so a long caption (a Site Delivery address) ends in "…" with
  // its full text in the truncation tooltip instead of widening the column.
  // One slide per step, all the same width so the rail joins up.
  step: {
    width: 'calc(var(--spacing-12) * 4.5)',
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
