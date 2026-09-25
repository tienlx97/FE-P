'use client';

import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { useClipboard } from '@astryxdesign/core/hooks';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Link } from '@astryxdesign/core/Link';
import { StackItem } from '@astryxdesign/core/Stack';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  ArrowRight,
  Building2,
  Check,
  Copy,
  Ellipsis,
  Pencil,
  Printer,
} from 'lucide-react';

import { MetaPill } from './pill.jsx';

/**
 * Pieces of the "Meta" partner (supplier / customer) detail page — Figma
 * "CHI TIẾT NHÀ CUNG CẤP" (node 141:4). Composed from Astryx components
 * only (golden rule #15); sizes from Astryx scales (golden rule #16).
 */

/**
 * Header card: icon tile, partner name + copy button + pills, a
 * "•"-separated meta line (code, tax code), and In / Chỉnh sửa / "…"
 * actions on the right.
 *
 * @param {{
 *   name: string,
 *   icon?: import('react').ComponentType,
 *   pills: Array<{ label: string, tone: 'accent' | 'neutral' | 'success' }>,
 *   metaItems: string[],
 *   onPrint?: () => void,
 *   onEdit?: () => void,
 *   menuItems?: import('@astryxdesign/core/DropdownMenu').DropdownMenuOption[],
 * }} props
 */
export function MetaPartyHeaderCard({
  name,
  icon = Building2,
  pills,
  metaItems,
  onPrint,
  onEdit,
  menuItems,
}) {
  const { copy, isCopied } = useClipboard({ announce: 'Đã sao chép tên' });

  return (
    <Card padding={5} xstyle={styles.card}>
      <HStack hAlign="between" vAlign="center" gap={4} wrap="wrap">
        <HStack gap={4} vAlign="center" xstyle={styles.minZero}>
          <HStack hAlign="center" vAlign="center" xstyle={styles.headerIcon}>
            <Icon icon={icon} size="lg" color="inherit" />
          </HStack>
          <VStack gap={1.5} hAlign="stretch" xstyle={styles.minZero}>
            <HStack gap={2} vAlign="center" wrap="wrap">
              <HStack gap={1} vAlign="center">
                <Heading level={1} xstyle={styles.uppercase}>
                  {name}
                </Heading>
                <IconButton
                  label="Sao chép tên"
                  tooltip={isCopied ? 'Đã sao chép' : 'Sao chép'}
                  icon={
                    <Icon
                      icon={isCopied ? Check : Copy}
                      size="sm"
                      color="secondary"
                    />
                  }
                  variant="ghost"
                  size="sm"
                  onClick={() => copy(name)}
                />
              </HStack>
              {pills.map((pill) => (
                <MetaPill key={pill.label} label={pill.label} tone={pill.tone} />
              ))}
            </HStack>
            {metaItems.length > 0 ? (
              <Text color="secondary" hasTabularNumbers>
                {metaItems.join('  •  ')}
              </Text>
            ) : null}
          </VStack>
        </HStack>

        <HStack gap={2} vAlign="center">
          {onPrint ? (
            <Button
              label="In"
              variant="secondary"
              icon={<Icon icon={Printer} size="sm" />}
              onClick={onPrint}
            />
          ) : null}
          {onEdit ? (
            <Button
              label="Chỉnh sửa"
              variant="primary"
              icon={<Icon icon={Pencil} size="sm" />}
              onClick={onEdit}
            />
          ) : null}
          {menuItems && menuItems.length > 0 ? (
            <DropdownMenu
              button={{
                label: 'Thao tác khác',
                isIconOnly: true,
                variant: 'ghost',
                icon: <Icon icon={Ellipsis} size="sm" />,
              }}
              items={menuItems}
            />
          ) : null}
        </HStack>
      </HStack>
    </Card>
  );
}

/**
 * "Người liên hệ làm việc" body: initials tile + name + role, then tinted
 * label/value rows with a copy button each. With no `name`, `emptyText`.
 * `initialsOf` (default `name`) lets a salutation ("Anh") stay out of the
 * initials.
 *
 * @param {{
 *   name?: string,
 *   initialsOf?: string,
 *   role?: string,
 *   rows: Array<{ label: string, value: string }>,
 *   emptyText: string,
 * }} props
 */
export function MetaPartyContactBody({
  name,
  initialsOf,
  role,
  rows,
  emptyText,
}) {
  if (!name && rows.length === 0) {
    return (
      <Text size="sm" color="secondary">
        {emptyText}
      </Text>
    );
  }

  return (
    <VStack gap={3} hAlign="stretch">
      {name ? (
        <HStack gap={3} vAlign="center">
          <HStack hAlign="center" vAlign="center" xstyle={styles.avatar}>
            <Text as="span" size="sm" weight="bold" color="inherit">
              {initials(initialsOf || name)}
            </Text>
          </HStack>
          <VStack gap={0.5}>
            <Text weight="bold">{name}</Text>
            {role ? (
              <Text size="sm" color="secondary">
                {role}
              </Text>
            ) : null}
          </VStack>
        </HStack>
      ) : null}
      {rows.map((row) => (
        <CopyRow key={row.label} label={row.label} value={row.value} />
      ))}
    </VStack>
  );
}

/**
 * "Tài khoản ngân hàng" body: the first account (number, bank · branch ·
 * province), then "+n tài khoản khác →". No "Mặc định" tag: BE-kt-xnk
 * keeps no account order or default flag yet.
 *
 * @param {{
 *   account?: { accountNumber: string, bankName: string, branch?: string, province?: string } | null,
 *   moreCount: number,
 *   onViewAll?: () => void,
 *   emptyText: string,
 * }} props
 */
export function MetaPartyBankBody({ account, moreCount, onViewAll, emptyText }) {
  const { copy, isCopied } = useClipboard({
    announce: 'Đã sao chép số tài khoản',
  });

  if (!account) {
    return (
      <Text size="sm" color="secondary">
        {emptyText}
      </Text>
    );
  }

  return (
    <VStack gap={3} hAlign="stretch">
      <VStack gap={1.5} hAlign="stretch" xstyle={styles.inset}>
        <Text size="sm" color="secondary">
          Tài khoản thụ hưởng
        </Text>
        <HStack hAlign="between" vAlign="center" gap={2}>
          <Text size="lg" weight="bold" type="code" hasTabularNumbers>
            {account.accountNumber}
          </Text>
          <IconButton
            label="Sao chép số tài khoản"
            tooltip={isCopied ? 'Đã sao chép' : 'Sao chép'}
            icon={<Icon icon={isCopied ? Check : Copy} size="sm" />}
            variant="ghost"
            size="sm"
            onClick={() => copy(account.accountNumber)}
          />
        </HStack>
        <Text size="sm" color="secondary">
          {[account.bankName, account.branch, account.province]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </VStack>
      {moreCount > 0 && onViewAll ? (
        <HStack hAlign="center">
          <Button
            label={`+${moreCount} tài khoản khác`}
            variant="ghost"
            size="sm"
            endContent={<Icon icon={ArrowRight} size="sm" />}
            onClick={onViewAll}
          />
        </HStack>
      ) : null}
    </VStack>
  );
}

/**
 * External website value: the bare host as a link opening in a new tab.
 * @param {{ url: string }} props
 */
export function MetaWebsiteLink({ url }) {
  const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  return (
    <Link href={href} target="_blank" weight="bold">
      {url.replace(/^https?:\/\//i, '').replace(/\/$/, '')}
    </Link>
  );
}

/** @param {{ label: string, value: string }} props */
function CopyRow({ label, value }) {
  const { copy, isCopied } = useClipboard({ announce: `Đã sao chép ${label}` });
  return (
    <HStack hAlign="between" vAlign="center" gap={2} xstyle={styles.inset}>
      <Text size="sm" color="secondary">
        {label}
      </Text>
      <HStack gap={1} vAlign="center" xstyle={styles.minZero}>
        <StackItem xstyle={styles.minZero}>
          <Text weight="medium" hasTabularNumbers maxLines={1}>
            {value}
          </Text>
        </StackItem>
        <IconButton
          label={`Sao chép ${label}`}
          tooltip={isCopied ? 'Đã sao chép' : 'Sao chép'}
          icon={<Icon icon={isCopied ? Check : Copy} size="sm" />}
          variant="ghost"
          size="sm"
          onClick={() => copy(value)}
        />
      </HStack>
    </HStack>
  );
}

/** @param {string} name */
function initials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '?';
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

const styles = stylex.create({
  card: {
    boxShadow: 'var(--meta-shadow-card)',
  },
  minZero: {
    minWidth: 0,
  },
  uppercase: {
    textTransform: 'uppercase',
  },
  headerIcon: {
    backgroundColor: 'var(--meta-primary-fixed)',
    borderRadius: 'var(--radius-element)',
    color: 'var(--meta-primary-strong)',
    flexShrink: 0,
    height: 'var(--spacing-12)',
    width: 'var(--spacing-12)',
  },
  avatar: {
    backgroundColor: 'var(--meta-primary-fixed)',
    borderRadius: 'var(--radius-element)',
    color: 'var(--meta-primary-strong)',
    flexShrink: 0,
    height: 'var(--spacing-10)',
    width: 'var(--spacing-10)',
  },
  inset: {
    backgroundColor: 'var(--meta-surface-container-low)',
    borderRadius: 'var(--radius-element)',
    paddingBlock: 'var(--spacing-2)',
    paddingInline: 'var(--spacing-3)',
  },
});
