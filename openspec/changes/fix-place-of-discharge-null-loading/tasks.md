# Tasks

- [x] 1.1 `hooks/use-contract-form.js`: normalize `contract.placeOfDischarge`
      (`null` for EXW/FOB) to `''` in `valuesFromContract()`
- [x] 1.2 `types/index.js`: `Contract.placeOfDischarge` → `string | null`
- [x] 1.3 `./harness/verify.sh`; live browser verification against
      BE-kt-xnk (sample FOB Contract edits and saves cleanly)
