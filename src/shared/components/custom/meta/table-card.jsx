'use client';

import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
  // The table header band is the lavender `surface-container-low`, like
  // `MetaPaymentProgressPanel`'s table.
  card: {
    // eslint-disable-next-line @stylexjs/valid-styles
    '--color-background-muted': 'var(--meta-surface-container-low)',
    boxShadow: 'var(--meta-shadow-card)',
    overflow: 'hidden',
  },
  // Header / footer bands bleed to the card edges through the card's
  // `--container-padding-*` vars, like `MetaPaymentProgressPanel`'s table card.
  header: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    marginInline: 'calc(-1 * var(--container-padding-inline-start))',
    marginTop: 'calc(-1 * var(--container-padding-block-start))',
    paddingBlock: 'var(--spacing-5)',
    paddingInline: 'var(--container-padding-inline-start)',
  },
  bubble: {
    backgroundColor: 'var(--meta-blue-wash)',
    borderRadius: 'var(--radius-full)',
    color: 'var(--color-accent)',
    flexShrink: 0,
    height: 'var(--spacing-8)',
    width: 'var(--spacing-8)',
  },
  bodyPadded: {
    paddingTop: 'var(--spacing-5)',
  },
  empty: {
    paddingBlock: 'var(--spacing-8)',
  },
  footer: {
    backgroundColor: 'var(--meta-surface-container-low)',
    borderTopColor: 'var(--color-border)',
    borderTopStyle: 'solid',
    borderTopWidth: 'var(--border-width)',
    marginBottom: 'calc(-1 * var(--container-padding-block-end))',
    marginInline: 'calc(-1 * var(--container-padding-inline-start))',
    paddingBlock: 'var(--spacing-4)',
    paddingInline: 'var(--container-padding-inline-start)',
  },
});

/**
 * "Meta" section card of a detail tab — the shape of the contract page's
 * "Tiến độ thanh toán chi tiết" / "Danh sách phụ lục" cards: icon bubble +
 * title (+ muted subtitle) and actions in a header band, a body that is
 * usually an Astryx `Table` (it bleeds to the card's edges), an optional
 * empty message and a tinted footer band (`footerStart` / `footerEnd`).
 * `isBodyPadded` adds top room for non-table bodies (metadata lists).
 * Composed from Astryx `Card` / `HStack` / `Heading` / `Icon` / `Text`
 * (golden rule #15).
 *
 * @param {{
 *   icon: import('react').ComponentType,
 *   title: string,
 *   subtitle?: string,
 *   actions?: import('react').ReactNode,
 *   emptyLabel?: string,
 *   isEmpty?: boolean,
 *   isBodyPadded?: boolean,
 *   footerStart?: import('react').ReactNode,
 *   footerEnd?: import('react').ReactNode,
 *   children?: import('react').ReactNode,
 * }} props
 */
export function MetaTableCard({
  icon,
  title,
  subtitle,
  actions,
  emptyLabel,
  isEmpty = false,
  isBodyPadded = false,
  footerStart,
  footerEnd,
  children,
}) {
  return (
    <Card padding={6} xstyle={styles.card}>
      <VStack hAlign="stretch">
        <HStack
          hAlign="between"
          vAlign="center"
          gap={4}
          wrap="wrap"
          xstyle={styles.header}
        >
          <HStack gap={3} vAlign="center" wrap="nowrap">
            <HStack
              as="span"
              hAlign="center"
              vAlign="center"
              xstyle={styles.bubble}
            >
              <Icon icon={icon} size="sm" color="inherit" />
            </HStack>
            <VStack gap={0}>
              <Heading level={3}>{title}</Heading>
              {subtitle ? <Text color="secondary">{subtitle}</Text> : null}
            </VStack>
          </HStack>
          {actions ? (
            <HStack gap={2} vAlign="center" wrap="nowrap">
              {actions}
            </HStack>
          ) : null}
        </HStack>

        {isEmpty ? (
          <HStack hAlign="center" xstyle={styles.empty}>
            <Text color="secondary">{emptyLabel}</Text>
          </HStack>
        ) : isBodyPadded ? (
          <VStack hAlign="stretch" xstyle={styles.bodyPadded}>
            {children}
          </VStack>
        ) : (
          // Astryx `Table` bleeds to the card edges itself; no wrapper.
          children
        )}

        {footerStart || footerEnd ? (
          <HStack
            hAlign="between"
            vAlign="center"
            gap={3}
            wrap="wrap"
            xstyle={styles.footer}
          >
            {footerStart ?? <HStack />}
            {footerEnd ?? null}
          </HStack>
        ) : null}
      </VStack>
    </Card>
  );
}
