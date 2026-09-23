'use client';

import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';

/**
 * Numbered form group of the "Chỉnh sửa hợp đồng" drawer (Figma 103:4983):
 * a short cobalt bar + uppercase title over a hairline, with either a muted
 * note ("Bắt buộc") or an action (tinted "+ Thêm …" pill) on the right.
 * Composed from Astryx `HStack`/`VStack`/`Text` only (golden rule #15).
 *
 * @param {{
 *   index: number,
 *   title: string,
 *   meta?: import('react').ReactNode,
 *   action?: import('react').ReactNode,
 *   children: import('react').ReactNode,
 * }} props
 */
export function MetaFormSection({ index, title, meta, action, children }) {
  return (
    <VStack as="section" gap={4} hAlign="stretch">
      <HStack
        hAlign="between"
        vAlign="center"
        gap={3}
        wrap="wrap"
        xstyle={styles.header}
      >
        <HStack gap={2} vAlign="center" wrap="nowrap">
          <HStack as="span" xstyle={styles.bar} />
          <Text
            as="span"
            size="base"
            weight="bold"
            color="primary"
            xstyle={styles.title}
          >
            {index}. {title}
          </Text>
        </HStack>
        {action ??
          (meta ? (
            <Text size="sm" weight="medium" color="secondary">
              {meta}
            </Text>
          ) : null)}
      </HStack>
      {children}
    </VStack>
  );
}

/**
 * Muted inset card inside a `MetaFormSection` (Figma 103:4983: "BÊN BÁN",
 * "BÊN MUA", payment-terms block). `header` sits above a hairline.
 *
 * @param {{
 *   header?: import('react').ReactNode,
 *   children: import('react').ReactNode,
 * }} props
 */
export function MetaFormCard({ header, children }) {
  return (
    // Astryx `Card` (not a padded stack) so nested edge-to-edge content —
    // e.g. the extra-fields `Table` — bleeds to this card's own padding.
    <Card variant="muted" padding={4} xstyle={styles.card}>
      <VStack gap={4} hAlign="stretch">
        {header ? (
          <HStack
            hAlign="between"
            vAlign="center"
            gap={3}
            wrap="wrap"
            xstyle={styles.header}
          >
            {header}
          </HStack>
        ) : null}
        {children}
      </VStack>
    </Card>
  );
}

/**
 * Blue-wash pill action of a `MetaFormSection` header (Figma 103:4983:
 * "+ Thêm mới đối tác", "+ Thêm điều khoản") — an Astryx ghost `Button`
 * tinted through `xstyle`.
 * @param {Omit<import('react').ComponentProps<typeof Button>, 'variant' | 'size'>} props
 */
export function MetaTintButton({ xstyle, ...props }) {
  return (
    <Button
      {...props}
      variant="ghost"
      size="md"
      xstyle={[
        styles.tint,
        ...(Array.isArray(xstyle) ? xstyle : xstyle ? [xstyle] : []),
      ]}
    />
  );
}

const styles = stylex.create({
  tint: {
    backgroundColor: 'var(--meta-blue-wash)',
    color: 'var(--color-accent)',
  },
  header: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBottom: 'var(--spacing-2)',
  },
  bar: {
    backgroundColor: 'var(--color-accent)',
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
    height: 'var(--spacing-4)',
    width: 'var(--spacing-1-5)',
  },
  title: {
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 'var(--meta-radius-inset)',
  },
});
