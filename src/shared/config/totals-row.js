/**
 * Wraps a list feature's `columns` so each one's `renderCell` also handles
 * the synthetic totals row(s) `AdvanceTable`'s `totalsRows` prop appends
 * (`row.__isTotalsRow`) — same pattern `contracts-list.jsx`,
 * `shipments-list.jsx`, `commissions-list.jsx` and
 * `contract-private-infos-list.jsx` each used to hand-roll. `cellRenderers`
 * is keyed by column `key`, one entry per summed amount column; the
 * "Tổng cộng" label itself is `AdvanceTable`'s own `totalsRowLabel` prop,
 * not a column here — only `AdvanceTable` knows which column is actually
 * leftmost once view presets and column visibility are applied.
 * @param {ReadonlyArray<{ key: string, renderCell?: (row: any) => import('react').ReactNode }>} columns
 * @param {Record<string, (row: any) => import('react').ReactNode>} cellRenderers
 */
export function withTotalsRowCells(columns, cellRenderers) {
  return columns.map((column) => {
    const totalsRenderCell = cellRenderers[column.key];
    return {
      ...column,
      renderCell: (/** @type {any} */ row) =>
        row.__isTotalsRow
          ? (totalsRenderCell?.(row) ?? null)
          : column.renderCell?.(row),
    };
  });
}
