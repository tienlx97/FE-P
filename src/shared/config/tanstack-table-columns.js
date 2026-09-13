/** Preserve Astryx fixed/proportional column widths in TanStack's pixel model.
 * @template {Record<string, unknown>} T
 * @param {ReadonlyArray<import('@astryxdesign/core/Table').TableColumn<T>>} columns
 * @param {readonly string[]} visibleKeys
 * @param {number} availableWidth
 */
export function resolveTableSizes(columns, visibleKeys, availableWidth) {
  const visible = columns.filter((column) => visibleKeys.includes(column.key));
  const minimum = (
    /** @type {import('@astryxdesign/core/Table').TableColumn<T>} */ column,
  ) =>
    column.width?.type === 'pixel'
      ? column.width.value
      : (column.width?.minWidth ?? 120);
  const floor = visible.reduce((sum, column) => sum + minimum(column), 0);
  const weight = visible.reduce(
    (sum, column) =>
      sum + (column.width?.type === 'pixel' ? 0 : (column.width?.value ?? 1)),
    0,
  );
  return Object.fromEntries(
    visible.map((column) => [
      column.key,
      minimum(column) +
        (column.width?.type === 'pixel' || !weight
          ? 0
          : (Math.max(0, availableWidth - floor) * (column.width?.value ?? 1)) /
            weight),
    ]),
  );
}
