# Tasks: Fix contract list view-options bugs

## 1. Status quick-filter scrollbar

- [x] 1.1 Pin `overflowY: 'hidden'` on `contracts-list.jsx`'s `statusFilter` xstyle — verify: browser-checked, `overflowY` computed as `hidden`, scrollbar gone from the "Lọc theo trạng thái" row

## 2. Missing Contract fields in "Tuỳ chọn hiển thị"

- [x] 2.1 Add `projectCompletionDate`, `sellerSigned`, `buyerSigned` to `COLUMN_OPTIONS` (`contracts-table.js`) and matching column definitions (`contracts-list.jsx`); add `projectCompletionDate` to `SORTABLE_COLUMN_KEYS` — verify: browser-checked, all three toggle on/off and render correct data
- [x] 2.2 Fix the same-class inverse bug found on `note` (had a `COLUMN_OPTIONS` entry, no column definition) — verify: browser-checked, "Ghi chú" now renders when toggled on
- [x] 2.3 `harness/GOLDEN_RULES.md` v5, rule #14 — verify: rule documents both directions of the drift and cites this session's two examples

## 3. Persist "Tuỳ chọn hiển thị" to localStorage

- [x] 3.1 `src/shared/hooks/use-persisted-table-view-options.js` (`useSyncExternalStore`-based, keyed per list via slugified `entityLabel`) — verify: `pnpm exec eslint`/`typecheck` clean, no `react-hooks/set-state-in-effect` violation
- [x] 3.2 Wire into `advance-table.jsx`, replacing the 4 local `useState` calls — verify: browser-checked on contracts, columns survive a full page reload; `localStorage` key/value inspected directly
- [x] 3.3 `./harness/verify.sh` full green — verify: `harness/runs/20260916-154018-1073/`
