'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import * as stylex from '@stylexjs/stylex';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Page numbers to show: first, last, and the current page ±1, with `null`
 * marking a gap ("…") — mockup: `1 2 3 … 29`.
 * @param {number} current
 * @param {number} total
 * @returns {(number | null)[]}
 */
export function metaPageItems(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 2) pages.add(3);
  if (current >= total - 1) pages.add(total - 2);
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
  /** @type {(number | null)[]} */
  const items = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) items.push(null);
    items.push(page);
  });
  return items;
}

/**
 * "Meta" table footer — mockup: "Hiển thị [1 - 5] trong tổng số [142]
 * hợp đồng" on the left, circular page buttons (current one filled cobalt)
 * on the right, preceded by an "N dòng / trang" picker when
 * `pageSizeOptions` is given. Composed from Astryx `Button` / `IconButton` /
 * `Selector` / `Text` / `HStack` (golden rule #15); the circles come from
 * the Meta theme's pill `button` override plus a square min-width here.
 *
 * @param {{
 *   page: number,
 *   pageSize: number,
 *   totalCount: number,
 *   totalPages: number,
 *   onPageChange: (page: number) => void,
 *   pageSizeOptions?: number[],
 *   onPageSizeChange?: (size: number) => void,
 *   itemLabel?: string,
 *   isDisabled?: boolean,
 * }} props
 */
export function MetaPagination({
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  itemLabel = 'bản ghi',
  isDisabled = false,
}) {
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  return (
    <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
      <HStack gap={2} vAlign="center" wrap="wrap">
        <Text type="supporting" color="secondary" weight="medium">
          Hiển thị
        </Text>
        <SummaryPill value={`${from} - ${to}`} />
        <Text type="supporting" color="secondary" weight="medium">
          trong tổng số
        </Text>
        <SummaryPill value={totalCount} />
        <Text type="supporting" color="secondary" weight="medium">
          {itemLabel}
        </Text>
      </HStack>
      <HStack gap={1.5} vAlign="center" wrap="nowrap">
        {pageSizeOptions && onPageSizeChange ? (
          <Selector
            label="Số dòng mỗi trang"
            isLabelHidden
            size="sm"
            value={String(pageSize)}
            options={pageSizeOptions.map((size) => ({
              value: String(size),
              label: `${size} dòng / trang`,
            }))}
            isDisabled={isDisabled}
            xstyle={styles.pageSize}
            onChange={(value) => {
              if (value == null) return;
              onPageSizeChange(Number(value));
              onPageChange(1);
            }}
          />
        ) : null}
        <IconButton
          label="Trang trước"
          icon={<Icon icon={ChevronLeft} size="sm" />}
          variant="secondary"
          size="sm"
          xstyle={styles.circle}
          isDisabled={isDisabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        />
        {metaPageItems(page, totalPages).map((item, index) =>
          item == null ? (
            <Text
              key={`gap-${index}`}
              type="supporting"
              color="secondary"
              weight="bold"
              xstyle={styles.gap}
            >
              …
            </Text>
          ) : (
            <Button
              key={item}
              label={String(item)}
              variant={item === page ? 'primary' : 'ghost'}
              size="sm"
              isDisabled={isDisabled}
              xstyle={[styles.circle, styles.pageButton]}
              onClick={() => onPageChange(item)}
            />
          ),
        )}
        <IconButton
          label="Trang sau"
          icon={<Icon icon={ChevronRight} size="sm" />}
          variant="secondary"
          size="sm"
          xstyle={styles.circle}
          isDisabled={isDisabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        />
      </HStack>
    </HStack>
  );
}

/** @param {{ value: string | number }} props */
function SummaryPill({ value }) {
  return (
    <HStack as="span" vAlign="center" wrap="nowrap" xstyle={styles.pill}>
      <Text
        as="span"
        type="supporting"
        color="primary"
        weight="bold"
        hasTabularNumbers
      >
        {value}
      </Text>
    </HStack>
  );
}

const styles = stylex.create({
  gap: {
    paddingInline: 'var(--spacing-1)',
  },
  pageSize: {
    marginInlineEnd: 'var(--spacing-2)',
  },
  // Mockup: every page control is a 32px circle, 6px apart.
  circle: {
    height: 'var(--spacing-8)',
    minWidth: 'var(--spacing-8)',
    width: 'var(--spacing-8)',
  },
  pageButton: {
    justifyContent: 'center',
    paddingBlock: 'var(--spacing-0)',
    paddingInline: 'var(--spacing-0)',
  },
  pill: {
    backgroundColor: 'var(--meta-surface-container-low)',
    borderColor: 'var(--meta-outline-light)',
    borderRadius: 'var(--radius-full)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    display: 'inline-flex',
    paddingBlock: 'var(--spacing-0-5)',
    paddingInline: 'var(--spacing-2)',
  },
});
