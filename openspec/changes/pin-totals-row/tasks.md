# Tasks: Pin the totals row to the viewport bottom

## 1. Sticky totals bar

- [x] 1.1 New `TableStickyTotalsBar` component — measures real header `<th>` positions, re-renders each column's totals cell at a fixed viewport position, stacks multiple currency rows, only visible while the table is on screen — verify: `pnpm exec tsc --noEmit -p jsconfig.json` clean.
- [x] 1.2 `AdvanceTable` renders it automatically when `totalsRows` is non-empty (via a new `tableWrapperRef` around `<Table>`) — verify: `./harness/verify.sh` full gate green.

## 2. Full verification

- [x] 2.1 `./harness/verify.sh` green (lint, typecheck, structure, harness-tests, unit-tests, build, quality-thresholds). Not verified live in-browser — the dev server can't run a second instance while another `next dev`/prod process holds the directory lock on this machine; ask the user to check visually.
