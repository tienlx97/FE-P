'use client';

import { Card } from '@astryxdesign/core/Card';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { useClipboard } from '@astryxdesign/core/hooks';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Building2, Check, Copy, FileDown, Pencil, Plus } from 'lucide-react';

import { MaritimeBadge } from './badge.jsx';
import { MaritimeButton, maritimeButtonHoverStyles } from './button.jsx';
import { MaritimeChip } from './chip.jsx';

/**
 * Maritime theme — Contract Overview card: the first card built from the
 * Stitch mockup at `.stitch/designs/maritime-contract-shipment-table.html`
 * (screen "Chi tiết Hợp đồng - Lô hàng (Thêm Tab Xem Dạng Bảng)", node
 * `c771b82a02a14cfb9b06fa5dbdc825bb`), 2026-09-18. Rebuilt with real
 * Astryx components per `CLAUDE.md`'s no-raw-`<div>` rule instead of the
 * mockup's hand-rolled Tailwind markup — visual parity comes from
 * `MaritimeThemeProvider` (this same folder), not from copied classes.
 * Not wired into any page yet; `add-contract-detail-page`'s own header
 * card (`ContractDetailWorkspace`) still uses the IBM Plex Corporate
 * theme.
 *
 * Mockup → component mapping:
 * - Contract code `<h1>` + copy `<button>` → `Heading` + `IconButton`,
 *   copy behavior from `useClipboard` (same hook `ContractDetailWorkspace`
 *   already uses).
 * - "Chính thức" / "Đang thực hiện" tinted pills → `MaritimeBadge`
 *   (`badge.jsx`, this same folder) instead of Astryx's own `Badge` — see
 *   that file's own comment for why (the status dot needs to sit outside
 *   `Badge`'s icon slot to read as a plain inline dot, not a distinct
 *   icon chip).
 * - "CIF 2020" mono pill → `MaritimeChip` (`chip.jsx`, this same folder).
 * - "Xuất PDF" / "Chỉnh sửa" / "+ Thao tác" action row → `MaritimeButton`
 *   ×2 + `DropdownMenu` (`button.jsx`, this same folder, for the same
 *   hover-color reason).
 * All copy/labels below default to the mockup's own Vietnamese strings
 * but are overridable props, not hardcoded — this card has no fixed
 * "contract" shape of its own, it only renders whatever a caller (a real
 * `Contract` entity via config functions like
 * `badgeVariantForContractStatus`, a Stitch preview page's demo data,
 * a future locale) passes in.
 * @param {{
 *   contractCode: string,
 *   projectName: string,
 *   projectIcon?: import('react').ComponentType,
 *   typeLabel: string,
 *   typeTone?: import('./badge.jsx').MaritimeBadgeProps['tone'],
 *   statusLabel: string,
 *   statusTone?: import('./badge.jsx').MaritimeBadgeProps['tone'],
 *   statusDotVariant?: import('@astryxdesign/core/StatusDot').StatusDotProps['variant'],
 *   incotermLabel?: string,
 *   copyAriaLabel?: string,
 *   copyTooltip?: string,
 *   copiedTooltip?: string,
 *   copyAnnounce?: string,
 *   exportPdfLabel?: string,
 *   exportPdfIcon?: import('react').ComponentType,
 *   onExportPdf?: () => void,
 *   editLabel?: string,
 *   editIcon?: import('react').ComponentType,
 *   onEdit?: () => void,
 *   actionsLabel?: string,
 *   actionsIcon?: import('react').ComponentType,
 *   actionItems: import('@astryxdesign/core/DropdownMenu').DropdownMenuOption[],
 * }} props
 */
export function MaritimeContractOverviewCard({
  contractCode,
  projectName,
  projectIcon = Building2,
  typeLabel,
  typeTone = 'blue',
  statusLabel,
  statusTone = 'success',
  statusDotVariant = 'success',
  incotermLabel,
  copyAriaLabel = 'Sao chép mã hợp đồng',
  copyTooltip = 'Sao chép',
  copiedTooltip = 'Đã sao chép',
  copyAnnounce = 'Đã sao chép số hợp đồng',
  exportPdfLabel = 'Xuất PDF',
  exportPdfIcon = FileDown,
  onExportPdf,
  editLabel = 'Chỉnh sửa',
  editIcon = Pencil,
  onEdit,
  actionsLabel = 'Thao tác',
  actionsIcon = Plus,
  actionItems,
}) {
  const { copy, isCopied } = useClipboard({
    announce: copyAnnounce,
  });

  return (
    <Card padding={4}>
      <HStack hAlign="between" vAlign="center" gap={4} wrap="wrap">
        <VStack gap={2} hAlign="stretch">
          <HStack gap={2} vAlign="center" wrap="wrap">
            <HStack gap={1.5} vAlign="center">
              <Heading level={1}>{contractCode}</Heading>
              <IconButton
                label={copyAriaLabel}
                tooltip={isCopied ? copiedTooltip : copyTooltip}
                icon={
                  <Icon
                    icon={isCopied ? Check : Copy}
                    size="md"
                    // `maritime-subtle` is a real registered variant
                    // (`theme.js`'s `components.icon`) but `IconColor`
                    // isn't augmentable the way `TextColor`/`TokenColor`
                    // are (`astryx theme build` only emits `Text`/`Token`
                    // module augmentations) — same `any` cast escape
                    // hatch `StatCard`'s own `noteIcon` already uses in
                    // `payment-summary-card.jsx`.
                    color={/** @type {any} */ ('maritime-subtle')}
                  />
                }
                variant="ghost"
                size="sm"
                onClick={() => copy(contractCode)}
              />
            </HStack>
            <MaritimeBadge label={typeLabel} tone={typeTone} />
            <MaritimeBadge
              label={statusLabel}
              tone={statusTone}
              dotVariant={statusDotVariant}
              isDotPulsing
            />
          </HStack>

          <HStack gap={1.5} vAlign="center" wrap="wrap">
            <Icon icon={projectIcon} size="sm" color="accent" />
            <Text weight="semibold">{projectName}</Text>
          </HStack>

          {incotermLabel ? (
            <HStack gap={2} vAlign="center" wrap="wrap">
              <MaritimeChip label={incotermLabel} size="md" />
            </HStack>
          ) : null}
        </VStack>

        <HStack gap={2} wrap="wrap">
          <MaritimeButton
            label={exportPdfLabel}
            variant="secondary"
            size="md"
            icon={<Icon icon={exportPdfIcon} size="md" color="error" />}
            onClick={onExportPdf}
          />
          <MaritimeButton
            label={editLabel}
            variant="secondary"
            size="md"
            icon={
              <Icon
                icon={editIcon}
                size="md"
                color={/** @type {any} */ ('maritime-subtle')}
              />
            }
            onClick={onEdit}
          />
          <DropdownMenu
            button={{
              label: actionsLabel,
              variant: 'primary',
              size: 'md',
              icon: <Icon icon={actionsIcon} size="sm" />,
              xstyle: /** @type {any} */ (maritimeButtonHoverStyles.primary),
            }}
            hasChevron
            items={actionItems}
          />
        </HStack>
      </HStack>
    </Card>
  );
}
