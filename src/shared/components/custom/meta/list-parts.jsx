'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Heading, Text } from '@astryxdesign/core/Text';
import * as stylex from '@stylexjs/stylex';
import { Eye, Pencil, Trash2 } from 'lucide-react';

import { MetaStatusBadge } from './status-badge.jsx';

/**
 * Shared pieces of the "Meta" list screens, lifted from the Shipment /
 * Contract lists so every catalogue list (Commission, BOQ, Khách hàng, Nhà
 * cung cấp, Quốc gia, Cảng / Nơi) reads the same: a page heading with an
 * accent record-count badge, a "Σ TỔNG CỘNG (…)" totals caption, a bold
 * primary cell and a muted "—" for empty cells. Composed from Astryx
 * components only (golden rule #15).
 */

/**
 * "Danh sách Shipment [47 lô hàng]" — `AdvanceTable`'s `title`.
 * @param {{ title: string, count?: number, unit: string }} props
 */
export function MetaListTitle({ title, count, unit }) {
  return (
    <HStack gap={2} vAlign="center" wrap="wrap">
      <Heading level={1}>{title}</Heading>
      {count == null ? null : (
        <MetaStatusBadge label={`${count} ${unit}`} tone="accent" hasBorder />
      )}
    </HStack>
  );
}

/**
 * "Σ TỔNG CỘNG (12 COMMISSION · USD)" — `AdvanceTable`'s `totalsRowLabel`.
 * @param {{ caption: string }} props
 */
export function MetaTotalsLabel({ caption }) {
  return (
    <HStack gap={2} vAlign="center" wrap="nowrap">
      <Text size="lg" weight="bold" color="accent">
        Σ
      </Text>
      <Text
        weight="bold"
        color="accent"
        xstyle={[styles.nowrap, styles.caption]}
      >
        {caption.toLocaleUpperCase('vi')}
      </Text>
    </HStack>
  );
}

/**
 * A row's identifying value (company / country / port name) — bold, the
 * same weight as the record-code links in the Shipment list.
 * @param {{ children: import('react').ReactNode }} props
 */
export function MetaPrimaryCell({ children }) {
  return <Text weight="bold">{children}</Text>;
}

/**
 * Cell text, or a muted "—" when empty.
 * @param {{ value: import('react').ReactNode }} props
 */
export function MetaCellText({ value }) {
  return value == null || value === '' ? (
    <Text color="meta-subtle">—</Text>
  ) : (
    <>{value}</>
  );
}

/**
 * "Thao tác" column cell — ghost icon buttons (Xem / Sửa / Xoá) like the
 * Shipment list, instead of a "Chức năng" menu. Clicks don't reach the row.
 * @param {{
 *   recordLabel: string,
 *   onView: () => void,
 *   onEdit: () => void,
 *   onDelete?: () => void,
 * }} props
 */
export function MetaRowActions({ recordLabel, onView, onEdit, onDelete }) {
  return (
    <HStack
      gap={1}
      vAlign="center"
      hAlign="center"
      wrap="nowrap"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <IconButton
        label={`Xem ${recordLabel}`}
        tooltip="Xem"
        icon={<Icon icon={Eye} size="sm" />}
        variant="ghost"
        size="sm"
        onClick={onView}
      />
      <IconButton
        label={`Sửa ${recordLabel}`}
        tooltip="Sửa"
        icon={<Icon icon={Pencil} size="sm" />}
        variant="ghost"
        size="sm"
        onClick={onEdit}
      />
      {onDelete ? (
        <IconButton
          label={`Xoá ${recordLabel}`}
          tooltip="Xoá"
          icon={<Icon icon={Trash2} size="sm" />}
          variant="ghost"
          size="sm"
          onClick={onDelete}
        />
      ) : null}
    </HStack>
  );
}

const styles = stylex.create({
  nowrap: {
    whiteSpace: 'nowrap',
  },
  caption: {
    letterSpacing: '0.05em',
  },
});
