'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { X } from 'lucide-react';

/**
 * Header of a Meta edit drawer (Figma 103:4983): a 40px cobalt-wash icon
 * tile, title, then the record code in cobalt with an optional status
 * `badge` after a "•", and a ghost close button. Shared by the contract
 * and BOQ edit drawers. Composed from Astryx components only.
 *
 * @param {{
 *   icon: import('lucide-react').LucideIcon,
 *   title: string,
 *   code?: string,
 *   badge?: import('react').ReactNode,
 *   titleBadge?: import('react').ReactNode,
 *   meta?: import('react').ReactNode,
 *   onClose: () => void,
 * }} props
 *
 * `meta` replaces the code / badge line with a caller-built one (Figma
 * 104:5399: "Hợp đồng gốc: … • Dự án: … • USD"); `titleBadge` sits after
 * the title.
 */
export function MetaDrawerHeader({
  icon,
  title,
  code,
  badge,
  titleBadge,
  meta,
  onClose,
}) {
  return (
    <HStack hAlign="between" vAlign="center" gap={3} wrap="nowrap">
      <HStack gap={3} vAlign="center" wrap="nowrap">
        <HStack as="span" hAlign="center" vAlign="center" xstyle={styles.tile}>
          <Icon icon={icon} size="md" color="inherit" />
        </HStack>
        <VStack gap={0.5}>
          <HStack gap={2} vAlign="center" wrap="wrap">
            <Heading level={3}>{title}</Heading>
            {titleBadge}
          </HStack>
          {meta ?? (
            <HStack gap={2} vAlign="center" wrap="wrap">
              <Text size="sm" weight="bold" color="accent">
                {code}
              </Text>
              {badge ? (
                <>
                  <Text size="sm" color="secondary" aria-hidden>
                    •
                  </Text>
                  {badge}
                </>
              ) : null}
            </HStack>
          )}
        </VStack>
      </HStack>
      <IconButton
        label="Đóng"
        icon={<Icon icon={X} size="sm" />}
        variant="ghost"
        onClick={onClose}
      />
    </HStack>
  );
}

const styles = stylex.create({
  tile: {
    backgroundColor: 'var(--meta-blue-wash)',
    borderRadius: 'var(--meta-radius-inset)',
    color: 'var(--color-accent)',
    flexShrink: 0,
    height: 'var(--spacing-10)',
    width: 'var(--spacing-10)',
  },
});
