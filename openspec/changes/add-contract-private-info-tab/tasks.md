# Tasks

- [x] 1.1 `src/shared/hooks/use-session-permissions.js` (new); `auth`'s
      `useSession` delegates to it instead of duplicating logic
- [x] 1.2 `types/index.js`: `ContractPrivateInfo`,
      `ContractPrivateInfoFormValues`
- [x] 1.3 `api/contract-private-info.js`: `getContractPrivateInfo`,
      `upsertContractPrivateInfo`
- [x] 1.4 `config/contract-private-info-schema.js` (zod, mirrors BE
      validator)
- [x] 1.5 `hooks/use-contract-private-info-query.js`,
      `hooks/use-contract-private-info-form.js`
- [x] 1.6 `components/contract-private-info-fields.jsx`,
      `contract-private-info-tab.jsx`, `contract-private-info-form-dialog.jsx`
- [x] 1.7 Wire into `contract-form-dialog.jsx` (permission-gated Tab),
      `contract-expanded-details.jsx` (tab body + query), `contracts-list.jsx`
      (dialog state/rendering)
- [x] 1.8 Tests: `api/contract-private-info.test.js`,
      `config/contract-private-info-schema.test.js`
- [x] 1.9 `./harness/verify.sh`; live browser verification against
      BE-kt-xnk (Nguyễn Văn A sees + edits it, Admin doesn't see the tab)
