'use client';
import { HStack } from '@astryxdesign/core/HStack';
import { Pagination } from '@astryxdesign/core/Pagination';
import { Text } from '@astryxdesign/core/Text';

import { MetaPagination } from '@/shared/components/custom/meta/pagination.jsx';
import { tablePagination } from '@/shared/config/table-pagination.js';
/** @typedef {{ pageIndex: number, pageSize: number, totalCount: number, totalPages: number, onPageIndexChange: (page: number) => void, onPageSizeChange: (size: number) => void, pageSizeOptions?: string[] }} AdvanceTablePagination */
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
/**
 * `visibleCount` drives the "Tổng số" label as-is — the caller (`advance-
 * table.jsx`) already resolves it to whichever is actually correct: the
 * server's across-all-pages `pagination.totalCount`, or a narrower
 * client-side-filtered count when a filter that isn't server-routed
 * (`filterFieldDefs`) narrows the currently-loaded page further than the
 * server total says. This component used to prefer `pagination.totalCount`
 * unconditionally whenever paginated, which went stale the moment a
 * client-only filter (e.g. an enum field in the "Tìm kiếm nâng cao"
 * dialog, or a quick-filter chip) narrowed the table below that number
 * (fixed 2026-09-17).
 * `isFramed` renders the Meta list footer instead ("Hiển thị a - b trong
 * tổng số N {itemLabel}" + "N dòng / trang" picker + circular page buttons).
 * @param {{ pagination?: AdvanceTablePagination, visibleCount: number, isLoading: boolean, isFramed?: boolean, itemLabel?: string }} props
 */
export function AdvanceTablePagination({
  pagination,
  visibleCount,
  isLoading,
  isFramed = false,
  itemLabel,
}) {
  // Astryx's Selector (inside Pagination) wants numeric option values;
  // callers still pass the historical string tuples (e.g. ['10', '25']).
  const pageSizeOptions = (
    pagination?.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS
  ).map(Number);
  const { currentPage, totalPages } = tablePagination(pagination, visibleCount);
  if (isFramed && pagination) {
    return (
      <MetaPagination
        page={currentPage}
        pageSize={pagination.pageSize}
        totalCount={visibleCount}
        totalPages={totalPages}
        onPageChange={pagination.onPageIndexChange}
        pageSizeOptions={pageSizeOptions}
        onPageSizeChange={pagination.onPageSizeChange}
        itemLabel={itemLabel}
        isDisabled={isLoading}
      />
    );
  }
  return (
    <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
      <Text type="supporting" color="secondary">
        Tổng số:{' '}
        <Text as="span" type="supporting" color="primary" weight="semibold">
          {visibleCount}
        </Text>
      </Text>
      {pagination ? (
        <Pagination
          page={currentPage}
          onChange={pagination.onPageIndexChange}
          totalPages={totalPages}
          pageSize={pagination.pageSize}
          pageSizeOptions={pageSizeOptions}
          onPageSizeChange={pagination.onPageSizeChange}
          variant="pages"
          size="sm"
          isDisabled={isLoading}
        />
      ) : null}
    </HStack>
  );
}
