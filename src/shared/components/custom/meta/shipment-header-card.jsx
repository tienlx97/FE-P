'use client';

import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { useClipboard } from '@astryxdesign/core/hooks';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Heading } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Check, Copy, Ellipsis, Pencil, Printer } from 'lucide-react';

import { MetaPill } from './pill.jsx';

/**
 * "Meta" shipment-detail header card — Figma node 111:7829 ("Section -
 * Main Shipment Header"): shipment code + copy button + type / status
 * pills, the incoterm chip under it, "In" / "Chỉnh sửa" / "…" on the
 * right. The journey (Figma 115:8469) no longer lives here: it is the
 * milestone strip of the "Timeline & lịch tàu" tab, so every tab starts
 * with its own content (FE-P `shipment-journey-in-timeline-tab`).
 * Composed from Astryx components + `MetaPill` (golden rule #15).
 *
 * @param {{
 *   code: string,
 *   typeLabel: string,
 *   statusLabel: string,
 *   statusTone: 'accent' | 'success' | 'indigo' | 'warning' | 'neutral',
 *   incotermLabel?: string,
 *   printLabel?: string,
 *   onPrint?: () => void,
 *   editLabel?: string,
 *   onEdit?: () => void,
 *   moreLabel?: string,
 *   moreItems?: import('@astryxdesign/core/DropdownMenu').DropdownMenuOption[],
 * }} props
 */
export function MetaShipmentHeaderCard({
  code,
  typeLabel,
  statusLabel,
  statusTone,
  incotermLabel,
  printLabel = 'In',
  onPrint,
  editLabel = 'Chỉnh sửa',
  onEdit,
  moreLabel = 'Thao tác khác',
  moreItems = [],
}) {
  const { copy, isCopied } = useClipboard({
    announce: 'Đã sao chép mã lô hàng',
  });

  return (
    <Card padding={6} xstyle={styles.card}>
      <HStack hAlign="between" vAlign="start" gap={4} wrap="wrap">
        <VStack gap={2} hAlign="start">
          <HStack gap={2} vAlign="center" wrap="wrap">
            <Heading level={1}>{code}</Heading>
            <IconButton
              label="Sao chép mã lô hàng"
              tooltip={isCopied ? 'Đã sao chép' : 'Sao chép'}
              icon={
                <Icon
                  icon={isCopied ? Check : Copy}
                  size="sm"
                  color="secondary"
                />
              }
              variant="secondary"
              size="sm"
              onClick={() => copy(code)}
            />
            <MetaPill label={typeLabel} tone="accent" />
            <MetaPill label={statusLabel} tone={statusTone} hasDot />
          </HStack>
          {incotermLabel ? (
            <MetaPill label={incotermLabel} tone="neutral" hasBorder />
          ) : null}
        </VStack>

        <HStack gap={2} vAlign="center" wrap="wrap">
          {onPrint ? (
            <Button
              label={printLabel}
              variant="secondary"
              icon={<Icon icon={Printer} size="sm" color="secondary" />}
              onClick={onPrint}
            />
          ) : null}
          {onEdit ? (
            <Button
              label={editLabel}
              variant="primary"
              icon={<Icon icon={Pencil} size="sm" />}
              onClick={onEdit}
            />
          ) : null}
          {moreItems.length > 0 ? (
            <DropdownMenu
              button={{
                label: moreLabel,
                isIconOnly: true,
                variant: 'secondary',
                icon: <Icon icon={Ellipsis} size="sm" />,
              }}
              items={moreItems}
            />
          ) : null}
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
