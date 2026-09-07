# Fix: editing an EXW/FOB Contract always failed validation

**Status:** done
**Created:** 2026-09-07

## Why

BE-kt-xnk's `Contract.placeOfDischarge` was unconditionally required
(non-nullable) — a mismatch with kt-xnk's own `incoterm-driven-place-
fields` rule (`requiresPlaceOfDischarge()`: required for CIF/DDP, must be
`null` for EXW/FOB) that this app had already shipped. Every EXW/FOB
contract kt-xnk tried to save sent `placeOfDischarge: null` and the
backend rejected it with `400`. See BE-kt-xnk's
`openspec/changes/fix-place-of-discharge-incoterm-validation/` for the
backend half of this fix, which brings it in line with what kt-xnk
already sends.

Fixing only the backend surfaced a second, kt-xnk-side bug: once the
backend legitimately started returning `placeOfDischarge: null` for
EXW/FOB contracts, `use-contract-form.js`'s `valuesFromContract()`
assigned that `null` straight into form state instead of normalizing it
to `''` — `contractSchema`'s own "must be empty for EXW/FOB" refine calls
`.length` on it, which throws/fails validation on a `null`. So loading
any EXW/FOB contract into the edit form, even without touching anything,
could never pass validation on save.

## What changes

- `use-contract-form.js`: `valuesFromContract()` now does
  `contract.placeOfDischarge ?? ''`, matching the normalize-nullable-
  snapshot-field convention already used for `note` and others here.
- `types/index.js`: `Contract.placeOfDischarge` typed as `string | null`
  (was `string`), matching the corrected backend contract.

## Verification

- `./harness/verify.sh`: lint, typecheck, structure, unit tests (131),
  build, quality — all green (no test needed new coverage; the existing
  `contract-schema.test.js` FOB/EXW tests already exercised the schema
  itself in isolation and were passing before and after — the bug was
  only in the load-from-API path).
- Live browser check against the real running BE-kt-xnk stack: opened
  the sample Contract (Incoterm FOB) for edit — "Cảng/nơi đến" no longer
  shows the error/disabled state — and saved it with no changes; `GET`
  on the contract afterward confirmed `placeOfDischarge: null` persisted
  correctly.
