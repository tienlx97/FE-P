# Tasks: Add contracts list totals row

## 1. Backend contract

- [x] 1.1 Consume BE-kt-xnk's `add-contract-totals-by-currency` response shape (`totals` replacing `valueTotals`) in `api/contracts.js` — verify: JSDoc/type updated, `pnpm exec tsc --noEmit -p jsconfig.json` clean.

## 2. Totals row rendering

- [x] 2.1 `AdvanceTable` gains `totalsRows` prop, appended post-filter — verify: `harness/verify.sh` lint+typecheck+build green.
- [x] 2.2 `contracts-list.jsx` builds per-currency totals rows and wraps every column's `renderCell` to special-case them; old `summary` line removed — verify: same.

## 3. Full verification

- [x] 3.1 `./harness/verify.sh` full gate green (lint, typecheck, structure, harness-tests, unit-tests, build, quality-thresholds).
