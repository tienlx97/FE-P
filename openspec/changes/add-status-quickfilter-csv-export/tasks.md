# Tasks: Status quick-filter + CSV export

## 1. Shared helper

- [x] 1.1 `upsertEqualsFilterCondition` (`src/shared/config/upsert-filter-condition.js`) — verify: `pnpm exec tsc --noEmit -p jsconfig.json` clean.

## 2. Status quick filter

- [x] 2.1 Contracts: `SegmentedControl` pill row wired to `filterConditions` — verify: live-tested (Đang thực hiện → 1 result, Đã hoàn thành → 0 results/empty state, Tất cả → clears back to just the default contractType condition).
- [x] 2.2 Shipments: `Selector` dropdown wired to `filterConditions` — verify: live-tested (Đã hoàn thành → 1 result, `hasClear` clears it).

## 3. CSV export

- [x] 3.1 `AdvanceTable` gains `exportVisibleRowsToCsv` + toolbar button, `AdvanceTableColumn<T>` type — verify: `./harness/verify.sh` green.
- [x] 3.2 `exportValue` added to Contracts (contractType, status, buyer, settlementValue/paidValue/unpaidValue, incoterm, paymentTerms, bankIds) and Shipments (type, status, quantity, supplier) and Commissions (sellerSigned, partySigned) columns where the raw field dump would be wrong — verify: live-tested export from Contracts list, downloaded CSV content matched what's on screen (translated labels, not raw enum codes).

## 4. Full verification

- [x] 4.1 `./harness/verify.sh` full gate green (lint, typecheck, structure, harness-tests, unit-tests, build, quality-thresholds).
