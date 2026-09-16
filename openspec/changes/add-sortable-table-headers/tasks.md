# Tasks

- [x] 1.1 `tanstack-data-table.jsx`: `sort`/`onSortChange`/
      `sortableColumnKeys` props; column-key ↔ wire-sort-field
      translation; clickable sortable header + indicator icon
- [x] 1.2 `advance-table.jsx`: `AdvanceTableColumn.sortField`;
      `sort`/`onSortChange`/`sortableColumnKeys` passthrough
- [x] 1.3 `api/{contracts,customers,shipments,commissions,contract-private-info}.js`
      + matching `use*Query` hooks: `sort` passthrough
- [x] 1.4 Wire `sort` state + `SORTABLE_COLUMN_KEYS` into all 5 lists:
      `contracts-list.jsx`, `customers-list.jsx`, `shipments-list.jsx`
      (+ `supplier` column's explicit `sortField`), `commissions-list.jsx`,
      `contract-private-infos-list.jsx`
- [x] 1.5 `./harness/verify.sh` green; `harness/PROGRESS.md` entry
