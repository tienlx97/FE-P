# Add sortable column headers

## Why

Final step of the multi-repo request: "Filter các column table header bạn
hãy cho sort tăng hoặc giảm" — clickable ascending/descending sort on
column headers. Every list table in this app renders through one shared
engine, `TanStackDataTable`/`AdvanceTable` (Golden Rule #13), which
already declares `manualSorting: true` but never wired a `sorting`
state/handler or any clickable header — sorting was entirely dead. Tables
are server-paginated (`manualPagination: true`), so sorting had to happen
server-side, before paging — matches BE-kt-xnk's `add-search-sort`
(already shipped: `sort: { field, direction }` on all 5 business search
endpoints).

## What changes

1. `TanStackDataTable` gains `sort`/`onSortChange`/`sortableColumnKeys`
   props. `sortableColumnKeys` (column keys, not wire field names) turns
   on TanStack's `enableSorting` per leaf column; a sortable header
   becomes clickable (mouse + Enter/Space) with an arrow-up/down/
   arrows-up-down indicator icon, cycling asc → desc → unsorted like
   TanStack's own default toggle (`enableSortingRemoval`).
   `enableMultiSort: false` — the backend only ever sorts by one field.
2. A column's **wire** sort field name (`SortRequest.Field`, BE-kt-xnk)
   isn't always its column `key` — e.g. `contracts-list.jsx`'s Khách hàng
   column is keyed `buyer` but sorts on `buyerCompanyName`. Resolved via a
   new optional `sortField` on `AdvanceTableColumn`, falling back to the
   existing `filter` (already the wire name for header/advanced filters,
   and usually the same string), then `key`. Only 2 columns across all 5
   lists needed an explicit `sortField` (`shipments-list.jsx`'s
   `supplier` column → `supplierName`; everything else already matched
   via `filter` or `key`).
3. `AdvanceTable` passes `sort`/`onSortChange`/`sortableColumnKeys`
   straight through to `TanStackDataTable`.
4. Each of the 5 list components (`contracts-list.jsx`,
   `customers-list.jsx`, `shipments-list.jsx`, `commissions-list.jsx`,
   `contract-private-infos-list.jsx`) gets its own `sort` state + a
   `handleSortChange` that also resets to page 1 (same as any other
   filter change), a `SORTABLE_COLUMN_KEYS` list matching that entity's
   BE-kt-xnk `<Entity>SortFields` allow-list — restricted to fields that
   actually have a column in that particular table (BOQ, for instance,
   reuses Contract's sort fields but only has columns for 2 of them) —
   and passes `sort`/`onSortChange` through to their `use*Query` hook.
5. `searchContracts`/`searchCustomers`/`searchAllShipments`/
   `searchCommissions`/`searchContractPrivateInfos` (api) and their
   `use*Query` hooks all gain the same `sort` passthrough (`{ field,
   direction }` → wire `Sort: { Field, Direction }`), mirroring what
   `add-contract-completion-date-and-customer-history` already added to
   `searchContracts` alone.

## Not covered

Browser/e2e visual verification — the Claude-in-Chrome extension has no
site permission for `localhost:3001` in this environment (a human must
grant it via the extension's own UI). Static verification (full
`./harness/verify.sh`: lint, typecheck, unit tests, `next build`) is
strong, but nothing in this repo unit-tests `TanStackDataTable`/
`AdvanceTable` directly (no existing test file for either) — a human
should click a few column headers before relying on this without a
screenshot.
