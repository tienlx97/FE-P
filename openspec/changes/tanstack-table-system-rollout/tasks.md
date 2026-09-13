# Tasks

## 1. Engine switch

- [x] 1.1 Make `TanStackDataTable` the only renderer in `AdvanceTable` (delete the legacy `Table` branch, always pass `activeColumnKeys`/`startKeys`/`endKeys`/`filterPlugin`) — verify: every current `AdvanceTable` consumer still compiles/renders; `harness/checks/tanstack-table-only.sh` passes
- [x] 1.2 Add row-expansion support to `TanStackDataTable` (`rowExpansion` prop: `expandedIds`, `onToggle`, `getRowKey`, `isExpandable`, `renderExpanded`) — verify: `harness/tests/selector-dialog-stacking.test.cjs` passes

## 2. No-expansion lists (mechanical, low risk)

- [x] 2.1 `countries-list.jsx` — verify: list renders, filters/CSV/pagination unchanged (browser-checked)
- [x] 2.2 `places-list.jsx` — verify: same (compiles/typechecks; same code path as 2.1)
- [x] 2.3 `contract-private-infos-list.jsx` — verify: same
- [x] 2.4 `backup-list.jsx` — verify: same (browser-checked, empty state)
- [x] 2.5 `commissions-list.jsx` — verify: same (rule #12 fix untouched — no `renderExpanded` in this file)
- [x] 2.6 `contract-full-view-panel.jsx` — verify: same
- [x] 2.7 `shipments-list.jsx` — verify: same (browser-checked, sticky totals bar intact)

## 3. Row-expansion lists

- [x] 3.1 `user-list.jsx` — swap `extraPlugins` expansion plugins for `rowExpansion` — verify: expand/collapse still works, rule #12 holds (browser-checked live)
- [x] 3.2 `customers-list.jsx` — same — verify: same (browser-checked live)

## 4. Close out

- [x] 4.1 Delete now-dead legacy-renderer code paths/props left unused after 1–3; `./harness/verify.sh` full green; update `harness/PROGRESS.md`
