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

import { MetaPill } from './pill.jsx';

/**
 * "Meta" contract-detail breadcrumb — Figma node 89:1065 ("1. BREADCRUMB"):
 * a back-arrow link to the list, then the current contract number in bold.
 * Astryx `Breadcrumbs` owns the separators and `aria-current`. `onBack`
 * (e.g. `router.back()`, keeping the list's filters/scroll) runs instead of
 * following `backHref`; `backHref` stays the link target for new-tab /
 * no-JS navigation.
 *
 * @param {{
 *   backLabel?: string,
 *   backHref: string,
 *   onBack?: () => void,
 *   currentLabel: string,
 * }} props
 */
export function MetaContractBreadcrumb({
  backLabel = 'Danh sách hợp đồng',
  backHref,
  onBack,
  currentLabel,
}) {
  return (
    <Breadcrumbs variant="supporting">
      <BreadcrumbItem
        href={backHref}
        onClick={
          onBack
            ? (event) => {
                event.preventDefault();
                onBack();
              }
            : undefined
        }
        startIcon={<Icon icon={ArrowLeft} size="xsm" color="inherit" />}
      >
        {backLabel}
      </BreadcrumbItem>
      <BreadcrumbItem isCurrent>
        <Text as="span" type="inherit" weight="bold">
          {currentLabel}
        </Text>
      </BreadcrumbItem>
    </Breadcrumbs>
  );
}

/**
 * "Meta" contract-detail header card — Figma node 89:1064's "2. HEADER
 * TITLE & GLOBAL ACTION BAR": contract number + copy button + type/status
 * pills on the first row, project name • incoterm chip on the second, and
 * "Xuất PDF" / "Chỉnh sửa" / "+ Thao tác" on the right. Same props as
 * `MaritimeContractOverviewCard` so `ContractDetailWorkspace` can swap
 * one for the other. Composed from Astryx `Card` / `Heading` / `Button` /
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
