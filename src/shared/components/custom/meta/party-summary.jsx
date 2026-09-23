'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Copy, Landmark } from 'lucide-react';

/** @param {string} name */
function initials(name) {
  const words = name
    .replace(/^(công ty|cty)\s+(tnhh|cp|cổ phần)?\s*/i, '')
    .split(/\s+/)
    .filter(Boolean);
  return (words[0]?.[0] ?? '?').concat(words[1]?.[0] ?? '').toUpperCase();
}

/**
 * Selected party summary (Figma 104:5399, "Bên nhận hoa hồng"): initials
 * tile, name, a "•"-separated detail line (tax code, address) and an
 * `action` at the end (e.g. a "Thay đổi" button). Composed from Astryx
 * components only.
 *
 * @param {{
 *   name: string,
 *   details: string[],
 *   action?: import('react').ReactNode,
 * }} props
 */
export function MetaPartySummary({ name, details, action }) {
  return (
    <HStack gap={3} vAlign="center" wrap="nowrap" xstyle={styles.panel}>
      <HStack as="span" hAlign="center" vAlign="center" xstyle={styles.avatar}>
        <Text as="span" size="sm" weight="bold" color="inherit">
          {initials(name)}
        </Text>
      </HStack>
      <StackItem size="fill" xstyle={styles.minZero}>
        <VStack gap={0.5} hAlign="stretch">
          <Text weight="bold" maxLines={1}>
            {name}
          </Text>
          {details.length > 0 ? (
            <Text size="sm" color="secondary" maxLines={1}>
              {details.join('  •  ')}
            </Text>
          ) : null}
        </VStack>
      </StackItem>
      {action}
    </HStack>
  );
}

/**
 * Beneficiary bank account block (Figma 104:5399): header row, then two
 * white inset tiles — bank & branch, account number (copyable) & holder.
 * With no `account`, shows `emptyText` instead of the tiles.
 *
 * @param {{
 *   title: string,
 *   action?: import('react').ReactNode,
 *   account?: { bankName: string, branch?: string, accountNumber: string, holder: string } | null,
 *   emptyText: string,
 *   onCopy?: (accountNumber: string) => void,
 * }} props
 */
export function MetaBankAccountCard({
  title,
  action,
  account,
  emptyText,
  onCopy,
}) {
  return (
    <VStack gap={3} hAlign="stretch" xstyle={styles.panel}>
      <HStack
        hAlign="between"
        vAlign="center"
        gap={2}
        wrap="wrap"
        xstyle={styles.header}
      >
        <HStack gap={2} vAlign="center" wrap="nowrap">
          <HStack
            as="span"
            hAlign="center"
            vAlign="center"
            xstyle={styles.icon}
          >
            <Icon icon={Landmark} size="sm" color="inherit" />
          </HStack>
          <Text weight="bold">{title}</Text>
        </HStack>
        {action}
      </HStack>
      {account ? (
        <HStack gap={3} wrap="wrap" vAlign="stretch">
          <StackItem size="fill" xstyle={styles.tile}>
            <VStack gap={1} hAlign="stretch">
              <Text size="sm" color="secondary" xstyle={styles.caps}>
                Ngân hàng & chi nhánh
              </Text>
              <Text weight="bold">{account.bankName}</Text>
              {account.branch ? (
                <Text size="sm" color="secondary">
                  {account.branch}
                </Text>
              ) : null}
            </VStack>
          </StackItem>
          <StackItem size="fill" xstyle={styles.tile}>
            <VStack gap={1} hAlign="stretch">
              <Text size="sm" color="secondary" xstyle={styles.caps}>
                Số tài khoản & người thụ hưởng
              </Text>
              <HStack gap={1} vAlign="center" wrap="nowrap">
                <Text size="lg" weight="bold" color="accent" hasTabularNumbers>
                  {account.accountNumber}
                </Text>
                {onCopy ? (
                  <IconButton
                    label="Sao chép số tài khoản"
                    tooltip="Sao chép"
                    icon={<Icon icon={Copy} size="sm" />}
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => onCopy(account.accountNumber)}
                  />
                ) : null}
              </HStack>
              <Text size="sm" weight="semibold" color="secondary">
                {account.holder}
              </Text>
            </VStack>
          </StackItem>
        </HStack>
      ) : (
        <Text size="sm" color="secondary">
          {emptyText}
        </Text>
      )}
    </VStack>
  );
}

const styles = stylex.create({
  panel: {
    backgroundColor: 'var(--meta-surface-container-low)',
    borderColor: 'var(--color-border-emphasized)',
    borderRadius: 'var(--meta-radius-inset)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    padding: 'var(--spacing-3)',
  },
  header: {
    borderBottomColor: 'var(--color-border-emphasized)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBottom: 'var(--spacing-2)',
  },
  avatar: {
    backgroundColor: 'var(--meta-primary-strong)',
    borderRadius: 'var(--radius-element)',
    color: 'var(--color-on-accent)',
    flexShrink: 0,
    height: 'var(--spacing-10)',
    width: 'var(--spacing-10)',
  },
  icon: {
    backgroundColor: 'var(--meta-primary-fixed)',
    borderRadius: 'var(--radius-element)',
    color: 'var(--meta-primary-strong)',
    flexShrink: 0,
    height: 'var(--spacing-7)',
    width: 'var(--spacing-7)',
  },
  tile: {
    backgroundColor: 'var(--color-background-surface)',
    borderColor: 'var(--color-border-emphasized)',
    borderRadius: 'var(--radius-element)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    minWidth: 'calc(var(--spacing-12) * 5)',
    padding: 'var(--spacing-3)',
  },
  caps: {
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  minZero: {
    minWidth: 0,
  },
});
