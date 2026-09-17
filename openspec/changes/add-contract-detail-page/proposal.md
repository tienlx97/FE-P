# Proposal: Contract Detail Page (`/logistics/contract/[id]`)

**Status:** implemented
**Created:** 2026-09-17

## Why

Two bugs reported against the dialog-based Contract workspace
(`ContractFormDialog`):

1. Opening a Contract from a cross-link (`shipments-list.jsx`'s "Số hợp
   đồng", `commissions-list.jsx`'s "Số hợp đồng",
   `customer-contract-history.jsx`'s "Hợp đồng đã làm") only ever shows
   the "Hồ sơ" tab — the other 3-4 tab headers are clickable but render
   empty content. Root cause (confirmed by reading the code): those 3
   call sites open `ContractFormDialog` without passing `children`
   (`ContractExpandedDetails`), unlike `contracts-list.jsx`'s own
   "Xem/Sửa" flow, which does. Wiring `ContractExpandedDetails`'
   handler-heavy prop surface (add/edit Annex, Payment, Shipment, VGM;
   open Commission/BOQ) into all 3 files would duplicate a lot of state
   `contracts-list.jsx` already owns.
2. There is no URL that opens a specific Contract directly — sharing/
   bookmarking "hợp đồng CT-2024/EXP-088" isn't possible; grepped the
   whole app for `useSearchParams`/`router.push`, confirmed no
   deep-linking pattern exists anywhere yet.

User's chosen direction (2026-09-17, superseding the earlier "dialog is
enough" recommendation): add a real route, `/logistics/contract/{id}`,
reusing the existing dialog's tab bodies. User also shared a reference
mockup (another product's contract screen) and asked for a per-tab
design adapted to this app's actual data model — answered in chat,
confirmed to use **only fields that already exist** (no new BE fields
for bank guarantee / e-signature / audit log / consignee-as-a-visible-
field — that data structurally doesn't exist in `Contract` yet, except
`Consignee`, which the BE-kt-xnk response already includes but the FE
type/UI never surfaces).

## What changes

- `GET /api/v1/contracts/{id}` already exists on BE-kt-xnk
  (`ContractsController.GetContract`) — **no backend change needed** for
  the core fetch. Confirmed by reading `ContractsController.cs` directly
  before assuming a gap.
- New FE API wrapper `getContract(id)` (`api/contracts.js`) +
  `useContractQuery(id)` hook.
- New route `src/app/(protected)/logistics/contract/[id]/page.jsx` —
  gated the same way as `/logistics/contracts`
  (`logistics:contracts:view`).
- Extract the "workspace" (Contract tabs + every related-entity dialog
  it can open — Annex/Payment/Shipment/VGM/Commission/BOQ/Customer) out
  of `contracts-list.jsx` into a shared component so both the list's
  row-open flow and the new page use the exact same code path — this is
  the actual fix for bug 1 (no more duplicated, partially-wired call
  sites).
- New "Tổng quan & Tiến độ" tab (first tab on the page) — dashboard-style
  summary using only existing fields (contract value / paid-to-date via
  `PaymentSchedule` sum / remaining, seller/buyer/consignee snapshot,
  shipment count + incoterm + loading/discharge, bank + latest payment +
  annex count). No new BE fields.
- Cross-link call sites (`shipments-list.jsx`, `commissions-list.jsx`,
  `customer-contract-history.jsx`) change from opening `ContractFormDialog`
  to a plain `Link` to `/logistics/contract/{id}` — deleting their
  broken partial wiring instead of completing it.
- `ContractFormDialog` narrows to the **create-only** flow (`contract
  == null`); viewing/editing an existing Contract happens on the page
  from now on.

## Scope decisions

- **Reuse over rewrite**: "Hồ sơ"/"Phụ lục"/"Thanh toán"/"Liên quan"/
  "Xem đầy đủ" tab bodies are unchanged components, just remounted under
  a page instead of a dialog.
- **Existing fields only** (user's explicit choice, 2026-09-17): mockup
  elements with no backing field (bank guarantee, e-signature status,
  audit log, sailing-progress %) are left out of this change. `Consignee`
  is the one exception — BE already returns it, so it is added to the
  FE type/UI as read-only.
- **Page owns the related-entity dialogs going forward**: `contracts-list.jsx`
  keeps only the "Tạo hợp đồng" dialog; every "view an existing contract"
  path funnels through the new page.

## Out of scope

- Any BE change (endpoint already exists).
- Bank guarantee, e-signature/DocuSign, audit log, sailing-progress —
  no backing data model; would be a separate proposal if wanted later.
