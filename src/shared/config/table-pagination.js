/** @param {{ pageIndex: number, pageSize: number, totalCount: number, totalPages: number } | undefined} pagination
 * @param {number} visibleCount
 */
export function tablePagination(pagination, visibleCount) {
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const currentPage = Math.max(
    1,
    Math.min(pagination?.pageIndex ?? 1, totalPages),
  );
  const pageStart = (currentPage - 1) * (pagination?.pageSize ?? visibleCount);
  const totalCount = pagination?.totalCount ?? visibleCount;
  const rangeStart = visibleCount === 0 || totalCount === 0 ? 0 : pageStart + 1;
  const rangeEnd =
    rangeStart === 0 ? 0 : Math.min(pageStart + visibleCount, totalCount);
  return { currentPage, totalPages, rangeStart, rangeEnd };
}

/**
 * The pagination footer's "Tổng số" label (and `PowerSearch`'s own
 * `resultCount`, where a caller renders one): `pagination.totalCount` (the
 * server's true across-all-pages count) is right when nothing narrows
 * beyond what the server already filtered — but client-only filters (a
 * `searchFieldDefs`/advanced-search field that isn't also in
 * `filterFieldDefs`, so never sent to the server) only ever run against
 * the already-fetched page, so they can narrow `filteredCount` below
 * `unfilteredCount` without the server ever finding out. Comparing the two
 * counts — rather than inspecting `filterFieldDefs` — catches that case
 * exactly: no additional client-side narrowing means `filteredCount ===
 * unfilteredCount`, so trust the server total (or the plain filtered count
 * when there's no `pagination` at all); a smaller `filteredCount` means
 * show what's actually on screen instead of a stale, too-large number
 * (caught 2026-09-17).
 * @param {{ pagination: { totalCount: number } | undefined, filteredCount: number, unfilteredCount: number }} args
 */
export function resolveResultCount({
  pagination,
  filteredCount,
  unfilteredCount,
}) {
  return filteredCount === unfilteredCount
    ? (pagination?.totalCount ?? filteredCount)
    : filteredCount;
}
