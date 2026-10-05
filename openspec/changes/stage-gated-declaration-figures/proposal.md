# Proposal: Stage-gated declaration figures (FE)

**Status:** done
**Created:** 2026-10-05

## Why

BE-P `stage-gated-declaration-figures` (54823e7) made declared value,
declaration exchange rate, quantity and declared weight nullable: optional
while Booked/Packing, required from AtYardAwaitingExport. VNĐ totals skip
unrated shipments and report how many (`shipmentsMissingExchangeRate`,
`missingExchangeRateCount`). The FE must accept, send and display nulls.

## What changes

- Form: the four figures move to "Hải quan & C/O" (they are customs
  figures), are required by status (`requiresDeclarationFigures`), sent as
  null when empty.
- Displays: missing figures show "—"; client-side VNĐ sums skip unrated
  shipments; lists show "chưa gồm N lô chưa có tỷ giá" when N > 0.

## Out of scope

- Backend (done in BE-P).

## Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-10-05 | Required from AtYardAwaitingExport; skip + count in VNĐ totals | User choice |
