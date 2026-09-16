# Tasks

- [x] 1.1 `CustomerDetailDialog`: width 720 → 1080
- [x] 1.2 `ProjectCompletionDate` gated on `status === 'Completed'`:
      `contract-schema.js` refine (+ test updates/additions),
      `use-contract-form.js`'s `setField` clear-on-status-change,
      `contract-general-fields.jsx`'s `isDisabled`/`disabledMessage`
- [x] 1.3 `AdvanceTable`: stop wiring the per-column popover filter
      plugin into `TanStackDataTable`
- [x] 1.4 New `record-link-style.js`; applied to
      `shipments-list.jsx`/`commissions-list.jsx`/
      `contract-private-infos-list.jsx`'s contract-number links
- [x] 1.5 New `customer-contract-history.jsx` (extracted from
      `CustomerDetailDialog`); wired into `customers-list.jsx`'s
      `CustomerExpandedDetails`
- [x] 1.6 `./harness/verify.sh` green; manual browser verification of all
      5 items; `harness/PROGRESS.md` entry
