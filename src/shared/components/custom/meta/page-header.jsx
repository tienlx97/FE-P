'use client';

import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';

/**
 * "Meta" page header for tool pages (Tiện ích): the breadcrumb trail with
 * the current page in bold, then a card with the page's icon tile, title,
 * description and optional pills (`meta`) on the right. Same card
 * language as `MetaUtilityCard` / `MetaContractHeaderCard`. Composed from
 * Astryx only (golden rule #15).
 * @param {{
 *   trail: Array<{ label: string, href?: string }>,
 *   icon: import('lucide-react').LucideIcon,
 *   title: string,
 *   description?: string,
 *   meta?: import('react').ReactNode,
 * }} props
 */
export function MetaPageHeader({ trail, icon, title, description, meta }) {
  return (
    <VStack gap={3} hAlign="stretch">
      <Breadcrumbs variant="supporting">
        {trail.map((item, index) =>
          index === trail.length - 1 ? (
            <BreadcrumbItem key={item.label} isCurrent>
              <Text as="span" type="inherit" weight="bold">
                {item.label}
              </Text>
            </BreadcrumbItem>
          ) : (
            <BreadcrumbItem key={item.label} href={item.href}>
              {item.label}
            </BreadcrumbItem>
          ),
        )}
      </Breadcrumbs>
      <Card padding={5} xstyle={styles.card}>
        <HStack hAlign="between" vAlign="center" gap={4} wrap="wrap">
          <HStack gap={3} vAlign="center" wrap="nowrap">
            <HStack
              as="span"
              hAlign="center"
              vAlign="center"
              xstyle={styles.iconTile}
            >
              <Icon icon={icon} size="md" color="inherit" />
            </HStack>
            <VStack gap={0.5} hAlign="start">
              <Heading level={1}>{title}</Heading>
              {description ? (
                <Text as="p" size="sm" color="secondary">
                  {description}
                </Text>
              ) : null}
            </VStack>
          </HStack>
          {meta ? (
            <HStack gap={2} vAlign="center" wrap="wrap">
              {meta}
            </HStack>
          ) : null}
        </HStack>
      </Card>
    </VStack>
  );
}

const styles = stylex.create({
  card: {
    borderColor: 'var(--color-border-emphasized)',
    borderRadius: 'var(--meta-radius-inset)',
    boxShadow: 'var(--meta-shadow-card)',
  },
  iconTile: {
    backgroundColor: 'var(--meta-surface-container)',
    borderRadius: 'var(--meta-radius-inset)',
    color: 'var(--meta-primary-strong)',
    flexShrink: 0,
    height: 'var(--spacing-12)',
    width: 'var(--spacing-12)',
  },
});
