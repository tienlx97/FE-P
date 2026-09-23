'use client';

import { Button } from '@astryxdesign/core/Button';
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
            size="sm"
            weight="bold"
            color="primary"
            xstyle={styles.title}
          >
            {index}. {title}
          </Text>
        </HStack>
        {action ??
          (meta ? (
            <Text size="xsm" weight="medium" color="secondary">
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
    <VStack gap={4} hAlign="stretch" xstyle={styles.card}>
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
      size="sm"
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
    height: 'var(--spacing-3)',
    width: 'var(--spacing-1-5)',
  },
  title: {
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: 'var(--color-background-muted)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--meta-radius-inset)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    padding: 'var(--spacing-4)',
  },
});
