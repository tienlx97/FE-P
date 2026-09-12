# Tasks: Add totals row to Shipments, Commissions, and BOQ lists

## 1. Shipments

- [x] 1.1 `searchAllShipments` parses `{ page, totals }`; `shipments-list.jsx` builds `totalsRows` (by `invoiceCurrency`) and wraps `columns` — verify: `pnpm exec tsc --noEmit -p jsconfig.json` clean.

## 2. Commissions

- [x] 2.1 `searchCommissions` parses `{ page, totals }`; `commissions-list.jsx` builds `totalsRows` (by parent contract's currency) and wraps `columns` — verify: same.

## 3. BOQ (Contract Private Infos)

- [x] 3.1 `searchContractPrivateInfos` parses `{ page, totals }` (single object, not array); `contract-private-infos-list.jsx` builds one `totalsRows` entry (`containerCount`/`logisticsTotal`/`profit`, no currency grouping) and wraps `columns` — verify: same.

## 4. Full verification

- [x] 4.1 `./harness/verify.sh` full gate green (lint, typecheck, structure, harness-tests, unit-tests, build, quality-thresholds).
