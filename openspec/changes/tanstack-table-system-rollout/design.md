# Design

## Approach

`AdvanceTable` (`src/shared/components/advance-table.jsx`) currently picks
its renderer with `const TableRenderer = headerGroups ? TanStackDataTable :
Table;` — TanStack only when a caller opts in with `headerGroups`. Since
`TanStackDataTable` already treats `headerGroups` as optional (defaults to
`[]`, renders flat single-row headers), the fix is mechanical: always use
`TanStackDataTable` and always pass the props it needs
(`activeColumnKeys`, `startKeys`, `endKeys`, `filterPlugin`) instead of
only passing them in the `headerGroups` branch. The legacy `Table`
branch and its now-unreachable props (`plugins`, `hasHover` on the
renderer) are deleted from `advance-table.jsx`.

Two consumers (`user-list.jsx`, `customers-list.jsx`) rely on Astryx's
row-expansion plugins (`useTableRowExpansion`,
`createRowExpansionInteractionPlugin`) via `extraPlugins`, which only the
legacy renderer understood. `TanStackDataTable` gains equivalent, simpler
support: an optional `renderExpanded(row)` + `expandedRowIds`/`onToggle`
prop pair, rendered as an extra full-width `TableRow` under the toggled
row. `AdvanceTable` forwards a new `rowExpansion` prop
(`{ expandedIds, onToggle, getRowKey, isExpandable, renderExpanded }`)
into `TanStackDataTable`, and `extraPlugins` is removed once both callers
migrate off it. Golden Rule #12 keeps applying: `renderExpanded` content
must not render a `*FormDialog` — verified for the two callers by
`harness/tests/selector-dialog-stacking.test.cjs`.

All other consumers (`backup-list.jsx`, `commissions-list.jsx`,
`contract-full-view-panel.jsx`, `contract-private-infos-list.jsx`,
`countries-list.jsx`, `places-list.jsx`, `shipments-list.jsx`) have no
plugin usage beyond column width helpers (`pixel`/`proportional`, already
consumed by `tanstack-table-columns.js`) — for these, flipping the
renderer is a no-behavior-change migration.

## Affected layers & files

| Layer | Files | Change |
|---|---|---|
| components (shared) | `src/shared/components/advance-table.jsx` | Remove legacy renderer branch; always render `TanStackDataTable`; add `rowExpansion` passthrough |
| components (shared) | `src/shared/components/tanstack-data-table.jsx` | Add row-expansion rendering |
| components (features) | `backup-list.jsx`, `user-list.jsx`, `commissions-list.jsx`, `contract-full-view-panel.jsx`, `contract-private-infos-list.jsx`, `countries-list.jsx`, `customers-list.jsx`, `places-list.jsx`, `shipments-list.jsx` | Swap `extraPlugins` row-expansion (where present) for `rowExpansion`; otherwise unchanged props |
| harness | `harness/checks/tanstack-table-only.sh`, `harness/verify.sh`, `harness/GOLDEN_RULES.md` | New mechanical rule #13 |

## New dependencies

None — `@tanstack/react-table` is already a dependency from
`tanstack-contracts-table`.

## Risks & mitigations

- Row-expansion is the highest-risk piece (two callers, one with a
  documented past bug) → build it once in `TanStackDataTable`, verify
  both callers keep the Golden Rule #12 fix, run
  `harness/tests/selector-dialog-stacking.test.cjs`.
- Column pinning/width edge cases differ per list (fixed vs proportional
  widths, sticky start/end) → `resolveTableSizes` already handles both;
  spot-check each list's pinned columns after migration.
- Regression risk across 9 lists at once → one task per list file so a
  single bad migration doesn't block the rest; `verify.sh` + a quick
  screenshot per list before checking its task off.

## Verification plan (agreed BEFORE implementation)

- [ ] `./harness/verify.sh` passes, including the new
      `tanstack-table-only` step
- [ ] Each migrated list renders its columns, pinning, filters, CSV
      export and pagination unchanged (spot-checked)
- [ ] `user-list.jsx` and `customers-list.jsx` row expansion still opens
      the same detail content, still respects Golden Rule #12
- [ ] `harness/tests/selector-dialog-stacking.test.cjs` passes
