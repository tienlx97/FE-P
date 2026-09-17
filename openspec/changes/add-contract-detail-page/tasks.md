# Tasks: Contract Detail Page (`/logistics/contract/[id]`)

**Status:** all tasks complete (2026-09-17)

- [x] 0.1 Confirm `GET /api/v1/contracts/{id}` already exists on
      BE-kt-xnk (`ContractsController.GetContract`) — no BE change
      needed for the core fetch.
- [x] 1.1 `api/contracts.js`: `getContract(id)`. `hooks/use-contracts-query.js`:
      `useContractQuery(id)`.
- [x] 1.2 Extract `useContractEditingState({ contract, onSuccess })`
      (isEditing/discard-confirm/finish/requestExit/form) out of
      `ContractFormDialog` into `hooks/use-contract-editing-state.js` —
      refactor `ContractFormDialog` to use it, no behavior change.
- [x] 1.3 Extract the "Hồ sơ" tab body (submit-error banner +
      `CollapsibleGroup` of `ContractGeneralFields`/`PaymentTermsFields`/
      `ContractBanksFields`) out of `ContractFormDialog` into
      `components/contract-profile-fields.jsx` — refactor
      `ContractFormDialog` to use it, no behavior change.
- [x] 1.4 Extract `ContractExpandedDetails` + every related-entity dialog
      it can open (Annex/Payment/Shipment/VGM/Commission/CommissionAnnex/
      CommissionPayment/BOQ) out of `contracts-list.jsx` into
      `components/contract-related-entities-panel.jsx` — one component
      owning all of that state, embedded directly by the new page.
- [x] 1.5 New `components/contract-overview-panel.jsx` — dashboard tab
      using only fields already on `Contract`/`Shipment`/`ContractAnnex`/
      `PaymentSchedule`/`ContractBank` (KPI cards for contract value/
      paid/remaining, seller+buyer+consignee snapshot, shipment/incoterm/
      loading-discharge summary, bank + latest payment + annex count).
- [x] 1.6 New route `src/app/(protected)/logistics/contract/[id]/page.jsx`
      + `components/contract-detail-workspace.jsx` (client): breadcrumb/
      title/status/edit button page chrome, `TabList` (Tổng quan/Hồ sơ/
      Phụ lục/Thanh toán/Liên quan/Xem đầy đủ) synced to `?tab=`, wires
      `useContractEditingState` + `ContractProfileFields` +
      `ContractRelatedEntitiesPanel` + `ContractOverviewPanel`. Added
      `/logistics/contract` to `routeAccessRules` (distinct prefix from
      the plural `/logistics/contracts` list page).
- [x] 1.7 `contracts-list.jsx`: row "Xem"/"Sửa" and `RecordActionsMenu`
      navigate to `/logistics/contract/{id}` instead of opening
      `ContractFormDialog`. "Tạo hợp đồng" keeps the dialog
      (`contract == null`); on successful create, navigates to the new
      contract's detail page instead of staying in the dialog. Removed
      the now-dead `expandedTab`/related-dialog state this displaces.
- [x] 1.8 `shipments-list.jsx`/`commissions-list.jsx`/
      `customer-contract-history.jsx`: "Số hợp đồng" cross-links become
      `Link` to `/logistics/contract/{id}` instead of opening
      `ContractFormDialog` with no `children` — removes the bug 1 root
      cause instead of wiring around it.
- [x] 1.9 Added `Contract.consignee`/`notifyParty` (`ContractPartyContact`)
      to the FE type (BE already returns them) and surfaced `consignee`
      read-only in the overview panel.
- [x] 1.10 `./harness/verify.sh` PASSED (lint, typecheck, structure, unit
      tests, build, quality thresholds) —
      `harness/runs/20260917-095451-1004/`. Browser/e2e visual
      verification **not** performed — same Claude-in-Chrome
      `localhost:3001` permission gap noted in prior sessions
      (`harness/PROGRESS.md`, 2026-09-16 entries). A human should click
      through: contracts-list row → detail page, all 6 tabs, "Sửa hợp
      đồng" edit-in-place, and a cross-link from Shipment/Commission/
      Customer before trusting this without a screenshot.
