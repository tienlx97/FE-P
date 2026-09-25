'use client';

import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { useClipboard } from '@astryxdesign/core/hooks';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  ArrowLeft,
  Building2,
  Check,
  Copy,
  FileText,
  Pencil,
  SquarePen,
} from 'lucide-react';

import { useBackNavigation } from '@/shared/hooks/use-back-navigation.js';

import { MetaPill } from './pill.jsx';

/**
 * "Meta" detail-page breadcrumb — Figma node 89:1065 ("1. BREADCRUMB"):
 * a "← Quay lại" link, then the page's trail from
 * `shared/config/breadcrumbs.js` with the current page in bold. Astryx
 * `Breadcrumbs` owns the separators and `aria-current`.
 *
 * "Quay lại" runs `useBackNavigation(trail.fallbackHref)`: browser back
 * when the previous page is in the app (keeps the list's filters/scroll),
 * else the parent page. Its `href` stays the fallback for new-tab /
 * middle-click.
 *
 * @param {{
 *   trail: import('@/shared/config/breadcrumbs.js').BreadcrumbTrail,
 *   backLabel?: string,
 * }} props
 */
export function MetaContractBreadcrumb({ trail, backLabel = 'Quay lại' }) {
  const onBack = useBackNavigation(trail.fallbackHref);
  const current = trail.items.at(-1);

  return (
    <Breadcrumbs variant="supporting">
      <BreadcrumbItem
        href={trail.fallbackHref}
        onClick={(event) => {
          // Let modified clicks (new tab / window) follow the href.
          if (event.metaKey || event.ctrlKey || event.shiftKey) return;
          event.preventDefault();
          onBack();
        }}
        startIcon={<Icon icon={ArrowLeft} size="xsm" color="inherit" />}
      >
        {backLabel}
      </BreadcrumbItem>
      {trail.items.slice(0, -1).map((item) => (
        <BreadcrumbItem key={item.href ?? item.label} href={item.href}>
          {item.label}
        </BreadcrumbItem>
      ))}
      <BreadcrumbItem isCurrent>
        <Text as="span" type="inherit" weight="bold">
          {current?.label}
        </Text>
      </BreadcrumbItem>
    </Breadcrumbs>
  );
}

/**
 * "Meta" contract-detail header card — Figma node 89:1064's "2. HEADER
 * TITLE & GLOBAL ACTION BAR": contract number + copy button + type/status
 * pills on the first row, project name • incoterm chip on the second, and
 * "Xuất PDF" (only with `onExportPdf`) / "Chỉnh sửa" / "+ Thao tác" on
 * the right; also the commission detail page's header. Composed from Astryx `Card` / `Heading` / `Button` /
 * `DropdownMenu` / `IconButton` + `MetaPill` (golden rule #15).
 *
 * @param {{
 *   contractCode: string,
 *   projectName: string,
 *   projectIcon?: import('react').ComponentType,
 *   typeLabel: string,
 *   typeTone?: 'accent' | 'neutral',
 *   statusLabel: string,
 *   statusTone?: 'accent' | 'success' | 'neutral',
 *   incotermLabel?: string,
 *   copyAriaLabel?: string,
 *   copyTooltip?: string,
 *   copiedTooltip?: string,
 *   copyAnnounce?: string,
 *   exportPdfLabel?: string,
 *   onExportPdf?: () => void,
 *   editLabel?: string,
 *   onEdit?: () => void,
 *   actionsLabel?: string,
 *   actionItems: import('@astryxdesign/core/DropdownMenu').DropdownMenuOption[],
 * }} props
 */
export function MetaContractHeaderCard({
  contractCode,
  projectName,
  projectIcon = Building2,
  typeLabel,
  typeTone = 'accent',
  statusLabel,
  statusTone = 'success',
  incotermLabel,
  copyAriaLabel = 'Sao chép mã hợp đồng',
  copyTooltip = 'Sao chép',
  copiedTooltip = 'Đã sao chép',
  copyAnnounce = 'Đã sao chép số hợp đồng',
  exportPdfLabel = 'Xuất PDF',
  onExportPdf,
  editLabel = 'Chỉnh sửa',
  onEdit,
  actionsLabel = '+ Thao tác',
  actionItems,
}) {
  const { copy, isCopied } = useClipboard({ announce: copyAnnounce });

  return (
    <Card padding={5} xstyle={styles.card}>
      <HStack hAlign="between" vAlign="center" gap={4} wrap="wrap">
        <VStack gap={2} hAlign="stretch">
          <HStack gap={2} vAlign="center" wrap="wrap">
            <HStack gap={1} vAlign="center">
              <Heading level={1}>{contractCode}</Heading>
              <IconButton
                label={copyAriaLabel}
                tooltip={isCopied ? copiedTooltip : copyTooltip}
                icon={
                  <Icon
                    icon={isCopied ? Check : Copy}
                    size="sm"
                    color="secondary"
                  />
                }
                variant="ghost"
                size="sm"
                onClick={() => copy(contractCode)}
              />
            </HStack>
            <MetaPill label={typeLabel} tone={typeTone} />
            <MetaPill label={statusLabel} tone={statusTone} hasDot />
          </HStack>

          <HStack gap={3} vAlign="center" wrap="wrap">
            <HStack gap={1.5} vAlign="center">
              <Icon icon={projectIcon} size="sm" color="accent" />
              <Text weight="semibold">{projectName}</Text>
            </HStack>
            {incotermLabel ? (
              <>
                <Text color={/** @type {any} */ ('meta-subtle')}>•</Text>
                <MetaPill label={incotermLabel} tone="neutral" size="sm" />
              </>
            ) : null}
          </HStack>
        </VStack>

        <HStack gap={2} vAlign="center" wrap="wrap">
          {onExportPdf ? (
            <Button
              label={exportPdfLabel}
              variant="secondary"
              icon={
                <Icon
                  icon={FileText}
                  size="sm"
                  color={/** @type {any} */ ('meta-danger')}
                />
              }
              onClick={onExportPdf}
            />
          ) : null}
          <Button
            label={editLabel}
            variant="secondary"
            icon={<Icon icon={Pencil} size="sm" color="primary" />}
            onClick={onEdit}
          />
          <DropdownMenu
            button={{
              label: actionsLabel,
              variant: 'primary',
              icon: <Icon icon={SquarePen} size="sm" />,
            }}
            hasChevron
            items={actionItems}
          />
        </HStack>
      </HStack>
    </Card>
  );
}

const styles = stylex.create({
  card: {
    boxShadow: 'var(--meta-shadow-card)',
  },
});
