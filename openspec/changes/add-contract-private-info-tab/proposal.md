# Add Contract "Thông tin private" tab

**Status:** done
**Created:** 2026-09-07

## Why

BE-kt-xnk shipped `GET`/`PUT /api/v1/contracts/{id}/private-info` (internal
BOQ — cost/pricing/profit) gated by a new `logistics:secret` permission
that is deliberately NOT granted by role/department, unlike every other
`logistics:*` permission (see BE-kt-xnk's
`openspec/changes/add-contract-private-info/`). This FE work wires it up,
per the user's own instruction ("Thực hiện ở BE sau đó là FE").

## What changes

- New "Thông tin private" tab in `ContractFormDialog`/
  `ContractExpandedDetails` — same shape as the existing Commission tab
  (read-only summary + a "Sửa"/"Nhập" button opening a dedicated
  `ContractPrivateInfoFormDialog`), except the tab itself only renders at
  all for a caller holding `logistics:secret` — every other tab renders
  unconditionally.
- **New shared hook**: `useSessionPermissions()`
  (`src/shared/hooks/use-session-permissions.js`) — reads the `permissions`
  session cookie reactively. Needed because `logistics-contracts` gating
  this tab on a permission cannot import `auth`'s own `useSession` (cross-
  feature imports are banned by `harness/structure.rules.cjs`); `auth`'s
  `useSession` now delegates to this same hook for its own `permissions`
  field instead of duplicating the logic.
- New feature files (mirrors `Commission`'s api/hooks/components split):
  `api/contract-private-info.js`, `config/contract-private-info-schema.js`,
  `hooks/use-contract-private-info-query.js`,
  `hooks/use-contract-private-info-form.js`,
  `components/contract-private-info-fields.jsx`,
  `components/contract-private-info-tab.jsx`,
  `components/contract-private-info-form-dialog.jsx`.
- Unlike `Commission` (which 404s when none exists yet), the private-info
  `GET` always 200s once the contract exists (every field `null` until
  first filled in) — so there is no create/exists split: one dialog, one
  `PUT` (upsert), a button whose label just says "Nhập" vs "Sửa" depending
  on whether every field is still empty.
- `Logistics`/`Đơn giá vốn`/`Khối lượng` × `Tổng`/`Tờ khai` — the two
  backend-computed fields (`logisticsTotal`, `volumeDeclaration`) render
  as plain text/read-only inputs, never editable, matching the backend's
  "computed at read time, never stored" contract.

## Not changing

- No separate view/manage permission split — mirrors the backend's single
  `logistics:secret` gate for both actions.
- `ContractResponse`'s own fields are untouched — private info is fetched
  only through its own endpoint/query.

## Verification

- `./harness/verify.sh`: lint, typecheck, `depcruise` structure (no
  cross-feature import violation), unit tests (126, up from 120), build,
  quality thresholds — all green.
- Live browser check against the real BE-kt-xnk stack (not just tests):
  logged in as Nguyễn Văn A (individually granted `logistics:secret` in
  BE-kt-xnk's sample data, NOT via his Logistics department) — the tab
  renders, shows the seeded BOQ values, editing `Số cont` from 2→3 and
  saving correctly recomputed `Tổng` from 17,000,000 to 25,500,000 VNĐ
  (reverted back to 2 afterward). Logged in as Admin (no individual grant)
  — the tab does not render at all, confirming the permission gate is not
  role/department-derived on the FE either.
- Noted, not fixed (pre-existing, out of scope): the shared
  `FormattedNumberTextInput`'s documented left-to-right integer grouping
  (`formatNumberInput`'s own comment: "1234 -> 123,4") makes large BOQ
  values look confusing while editing (e.g. 6,500,000 draws as
  "650,000,0") — cosmetic only, the underlying number round-trips
  correctly (verified live), and every other money field in the app
  already has this same quirk.
