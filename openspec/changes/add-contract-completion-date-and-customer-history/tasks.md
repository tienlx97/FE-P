# Tasks

- [x] 1.1 `contract-schema.js`: `projectCompletionDate` field + `>=
      createdDate` refine; `contract-schema.test.js` coverage
- [x] 1.2 `use-contract-form.js` (empty/from-contract values),
      `contract-general-fields.jsx` (DateInput), `types/index.js`
      (`Contract`/`ContractFormValues`), `api/contracts.js`
      (`buildContractBody` + `contracts.test.js`)
- [x] 1.3 `api/contracts.js`: `searchContracts` gains `sort` passthrough +
      test; `use-contracts-query.js`: `useCustomerContractsQuery`
- [x] 1.4 New `customer-detail-dialog.jsx` (profile + "Hợp đồng đã làm"
      table + "Xuất file" CSV export + embedded `ContractFormDialog`);
      wired from `contracts-list.jsx`'s Buyer column (link only when
      `sourceCustomerId` is set)
- [x] 1.5 `./harness/verify.sh` green; `harness/PROGRESS.md` entry
