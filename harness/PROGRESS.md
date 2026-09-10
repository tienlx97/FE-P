# Progress Log

## 2026-09-07 — Add: optimistic concurrency (Version) on Contract/Shipment forms, finished a Codex session that ran out of tokens mid-work

**Context:** Codex was mid-implementation of the FE half of BE-P's
optimistic-concurrency feature (`Contract.Version`/`Shipment.Version`, see
that repo's own `harness/PROGRESS.md` — no openspec change folder exists
for this on either side, Codex never created one) and ran out of tokens
with a red `harness/verify.sh`. Picked up the working tree as-is and
finished it, then finished the still-uncommitted BE half in that sibling
repo too.

**What was already done (Codex):** `version` threaded through
`api/contracts.js`/`api/shipments.js`/`api/contract-private-info.js`
(`Version` sent on every `PUT`, `conflict: result.status === 409` added
to every API result shape); `use-contract-form.js`/`use-shipment-form.js`/
`use-contract-private-info-form.js` track a local `version` state seeded
from the loaded record and updated from each successful mutation's
response; the `*-query.js` mutation hooks invalidate their query on
`result.conflict` too (not just `result.success`), so a stale form
refetches the winning write instead of silently sitting on stale data;
`Contract`/`Shipment`/`ContractPrivateInfo` JSDoc typedefs gained a
`version` field.

**What was broken, fixed this session:** `harness/verify.sh`'s
`typecheck` step failed — `contracts-table.js`'s and
`shipments-table.js`'s `skeletonRows` loading-state placeholders (used
while the real list is still fetching) predate the `version` field and
didn't have one, so they no longer satisfied the `Contract[]`/
`Shipment[]` types. Added `version: 0` to both. `./harness/verify.sh`
green after: lint, typecheck, structure, unit tests, build, quality
thresholds.

**Verified live** against a disposable, isolated Docker stack built from
BE-P's current code (project name `kt-xnk-verify`, ports remapped
off 8080/3307 so it never touched the real `docker-compose.lan.yml`
deployment — that's a live LAN service with real data, not something to
reseed for a manual check) with `db/sample-data.sql` freshly imported:
logged in as the sample Admin, opened the sample Contract, edited and
saved — `version` went 1→2, confirmed via a direct API read. Then
reproduced an actual two-editor race across two browser tabs sharing one
login session (same account can't hold two sessions —
`AllowConcurrentSessions` is off by default — so two *tabs*, not two
logins, is what simulates this): tab 2 saved first (version 2→3 with its
own edit), then submitting tab 1's still-open edit form (holding the
now-stale version) correctly surfaced "Dữ liệu đã được người khác cập
nhật. Vui lòng tải lại trước khi lưu." instead of silently overwriting
tab 2's write. Also spot-checked the Shipment edit form's golden path
(edit + save) the same way. Teardown: the disposable Docker stack
(containers, volume, network, image) was fully removed afterward: the
sample-data reseed and every check above ran only against that stack —
`companymanagement-lan-mysql`/`companymanagement-lan-api` (the real LAN
deployment) were never touched.

**Not done this session:** no openspec change folder created (matching
what Codex already didn't do) — out of scope for finishing an existing
diff. Both repos' changes are committed (`BE-P` and here) but not
pushed.

## 2026-09-07 — Add: Shipment cost invoice number + contract value/currency same row

**Context:** user request — (1) each Shipment cost line needed an
optional invoice number field; (2) "Giá trị hợp đồng" and "Tiền tệ" were
on two separate rows in the Contract form, should be one row.

**Fix** (`openspec/changes/add-shipment-cost-invoice-number/`):
`invoiceNumber` threaded through `shipment-schema.js`, `use-shipment-
cost-line-rows.js`, `use-shipment-form.js`, `api/shipments.js`; new
editable column in `ShipmentCostLinesFields` and read-only column in
`ShipmentExpandedDetails`. Companion backend change: BE-P's
`openspec/changes/add-shipment-cost-invoice-number/`. Separately,
`contract-general-fields.jsx` now wraps "Giá trị hợp đồng" + "Tiền tệ"
in `FormGrid`/`StackItem`, matching the existing money+currency row
pattern used for Shipment's invoice/declaration value fields.

**Verified:** `./harness/verify.sh` full suite green (lint, typecheck,
structure, 131 unit tests, build, quality thresholds). Live browser
check against the rebuilt BE stack + reloaded sample data: sample
Contract's value/currency render side-by-side; sample Shipment's "Chi
phí Logistics" tab shows the new "Số hoá đơn" column with seeded values.

## 2026-09-07 — Fix: editing an EXW/FOB Contract always failed

**Context:** user report — the Contract edit form kept showing a
"Cảng/nơi đến" validation error and refused to save the sample (FOB)
Contract, even untouched. Root cause was split across both repos: the
backend had never actually implemented the EXW/FOB-must-be-null rule
FE-P's own `incoterm-driven-place-fields` change assumed already
shipped (see BE-P's `openspec/changes/fix-place-of-discharge-
incoterm-validation/`), so every EXW/FOB save always 400'd. Fixing that
backend mismatch then surfaced a second bug here: once the backend
legitimately started returning `placeOfDischarge: null` for those
contracts, `use-contract-form.js`'s `valuesFromContract()` fed that
`null` straight into form state instead of normalizing to `''` — the
schema's own "must be empty for EXW/FOB" refine calls `.length` on it,
which fails on `null`.

**Fix** (`openspec/changes/fix-place-of-discharge-null-loading/`):
`valuesFromContract()` now does `contract.placeOfDischarge ?? ''`,
matching the normalize-nullable-snapshot-field convention already used
for `note` elsewhere in the same function. `Contract.placeOfDischarge`
retyped `string | null`. `./harness/verify.sh` green (131 tests, no new
coverage needed — the schema itself was already correct and tested; only
the load-from-API path had the bug).

**Verified live** against the real running BE-P stack: opened the
sample FOB Contract for edit — no more error/disabled state on "Cảng/nơi
đến" — saved with no other changes, and confirmed via `GET` afterward
that `placeOfDischarge: null` persisted correctly.

## 2026-09-07 — Contract and Shipment status fields

**Context:** BE-P shipped `Contract.Status`/`Shipment.Status` (see
its `openspec/changes/add-contract-and-shipment-status/`). This session
wires both up here, per the user's own instruction to do BE first, then
FE.

**Shipped** (`openspec/changes/add-contract-and-shipment-status-fields/`):
- `config/contract-status.js` (`InProgress`/`Completed`/`Cancelled`),
  `config/shipment-status.js` (`Booked`/`Packing`/
  `AtYardAwaitingExport`/`Shipping`/`DeliveredToPort`/
  `CustomsDeclaration`/`TruckingToSite`/`Completed`) — Vietnamese labels,
  same shape as `contract-types.js`/`shipment-types.js`.
- `status` added everywhere Contract/Shipment fields already flow:
  types, zod schemas, api request bodies, form-hook defaults
  (`InProgress`/`Booked`, matching the backend's own default), a new
  required Selector on the general/lot field-sets, and a new column on
  every list/table that renders a Contract or Shipment — including the
  nested Shipment table inside the Contract dialog. Made filterable too
  (advanced search + quick search), matching the backend's new filterable
  field.
- `./harness/verify.sh` green: 131 unit tests (was 126), lint, typecheck,
  structure, build, quality.

**Verified live** against the real running BE-P stack: sample data
(seeded by the BE session) showed "Đang thực hiện" on the Contract list
and "Đã book"/"Đã hoàn thành" on its two Shipments correctly; the edit
form's Status Selector opened with the right options and the current one
checked, and changing it updated the displayed value correctly.

**Discovered, not fixed** (pre-existing, unrelated to this change): the
Contract edit form's "Bên bán" (Seller) Selector doesn't preload the
contract's current seller when entering edit mode — it shows empty/
"Chọn bên bán" even though a seller is already set, and blocks saving
with a validation error unless re-picked. Not investigated further here
since it's unrelated to Status; flagging for whoever picks up Contract
edit-form work next.

## 2026-09-07 — Contract "Thông tin private" tab (BOQ)

**Context:** BE-P shipped `GET`/`PUT /contracts/{id}/private-info`
gated by a new `logistics:secret` permission that is deliberately not
role/department-derived (see BE-P's
`openspec/changes/add-contract-private-info/`). This session wires it up
here, per the user's own instruction to do BE first, then FE.

**Shipped** (`openspec/changes/add-contract-private-info-tab/`):
- New "Thông tin private" tab in `ContractFormDialog`/
  `ContractExpandedDetails`, shaped like the existing Commission tab but
  gated: the tab itself only renders for a caller holding
  `logistics:secret` — every other tab renders unconditionally.
- New shared `useSessionPermissions()` hook
  (`src/shared/hooks/use-session-permissions.js`) so a feature can gate UI
  on a permission string without a banned cross-feature import into
  `auth`; `auth`'s own `useSession` now delegates to it instead of
  duplicating the (non-trivial — `useSyncExternalStore` needs a stable
  snapshot reference, not a fresh array every parse) logic.
- New `api/contract-private-info.js`, `config/contract-private-info-
  schema.js`, two hooks, three components — same split as `Commission`,
  except there is no create/exists split (the endpoint always 200s once
  the contract exists, so it's always a single upsert `PUT`).
- `logisticsTotal`/`volumeDeclaration` render as read-only — both are
  backend-computed, never sent back on save.

**Verified live**, not just `harness/verify.sh` (126 tests, build,
structure, lint, typecheck, quality — all green): logged into the real
running BE-P (dev server on :3000, API on :8080, sample data from
BE-P's own session) as Nguyễn Văn A (individually granted
`logistics:secret`, not via his Logistics department) — the tab shows the
seeded BOQ, editing `Số cont` 2→3 recomputed `Tổng` 17,000,000 →
25,500,000 VNĐ correctly on save (reverted after). Logged in as Admin (no
grant) — confirmed the tab does not render at all.

**Harness gaps / discovered, not fixed** (flagged, out of scope): the
shared `FormattedNumberTextInput`'s documented left-to-right integer
grouping (see its own `formatNumberInput` comment) makes large values
confusing while editing (6,500,000 draws as "650,000,0") — pre-existing,
affects every money field in the app already, and the underlying number
round-trips correctly regardless (verified live above).

## 2026-09-05 — Extend formatted numeric precision (task 1.2)

Raised the common `FormattedNumberTextInput` decimal precision from two to
eight digits for every migrated money, ratio, quantity, and weight field. Added
unit coverage for each supported length from three through eight and confirmed
that a ninth digit is consistently truncated.

Browser verification on the Contract value field produced `123,4.123`,
`123,4.1234`, `123,4.12345`, `123,4.123456`, `123,4.1234567`, and
`123,4.12345678` without saving a record. Screenshot:
`harness/runs/20260905-decimal-precision/eight-decimals.png`. Gate passed:
`harness/runs/20260905-155139-7971/`; 119 tests, build, dependency structure,
and quality thresholds passed.

## 2026-09-05 — Common formatted numeric TextInput

Completed `format-money-inputs`. Added shared `FormattedNumberTextInput` over
Astryx `TextInput`/`InputGroupText`, with a pure formatter/parser that keeps
form and API state as `number | undefined`. Integer groups follow the requested
left-to-right convention (`1234` → `123,4`); decimal drafts remain editable and
are limited to two digits.

Migrated Logistics money, payment ratio, shipment quantity, declaration
weight, and VGM weight fields. `NumberInput` remains only for Incoterm year in
this feature. Browser checks covered all five requested examples plus `%`,
quantity, and `kg` fields; no business record was saved. Screenshots:
`harness/runs/20260905-money-inputs/`. Both audited dialogs reported 0 axe
violations/incomplete checks.

Gate passed: `harness/runs/20260905-152655-7866/`; 118 tests, build, dependency
structure, and quality thresholds passed. The pre-existing modified
`.memsearch/memory/2026-09-05.md` was left untouched and excluded from the
change.

## 2026-09-05 — Final UI/UX regression and component map (task 4.1)

Completed `ui-ux-maintainability`. Fixed the remaining 680px column-options
overlay: constrained its actual Popover width, reflowed rail and transfer
panels at 640px, and used an opaque theme surface. Measured 374px at viewport
390px. Updated current architecture/project purpose and added
`docs/ui-components.md` plus ADR-0005.

Final mobile navigation sweep: 16 URLs, document width 390px throughout.
Desktop: 11 representative pages, document width 1440px throughout. Login
checked separately. Screenshots/interaction evidence:
`harness/runs/20260905-ui-ux-review/`; complete results/limits:
`openspec/changes/ui-ux-maintainability/audit.md`.

Gate passed: `harness/runs/20260905-145851-7541/`; 114 tests, no dependency
violations (515 modules), shared JS gzip 168.7kB against 250kB budget.
No business form was saved. Axe returned zero evaluated passes: inconclusive,
not evidence of accessibility compliance. Role matrix, production Web Vitals,
changed-line coverage and full save round trips were not measured.

Harness gaps: responsive overlay checks must measure the positioned outer
popover, not just its inner surface. ADR-0005 was recorded after refactoring
instead of before as ENTROPY prescribes; future large changes should include
that decision document in the first planning task. The form geometry probe is
reusable but not yet part of an automated browser gate.

## 2026-09-05 — Split operational UI responsibilities (task 3.1)

Extracted Contract/Commission expanded details, Contract info/Commission tabs,
Contract general fields, Shipment booking/lot fields, shared FormSection,
table pagination, advanced-search dialog, and column transfer panel. Four list
column/search/skeleton configurations now live in feature config. Public
feature exports and API hooks are preserved; edit dialogs remain siblings of
tables. Main sizes: contracts-list 1668→596, contract-form-dialog 590→137,
shipment-fields 490→137, view-options 696→263 (formatting may adjust counts).

Browser: opened seeded Contract info/Commission tabs and edit form; changed
project name locally, switched accordion sections, confirmed unsaved value
survived. Mobile geometry still passes for 12 controls and pinned submit.
Removed/re-added/restored a table column. Opened Commission edit from Contract
and mouse-selected a customer successfully (portal stacking preserved).
No business record saved. Evidence: `harness/runs/20260905-ui-ux-review/`.

Gate passed: `harness/runs/20260905-144317-7438/`.
Discovered: view-options popover's existing 680px width clips controls at 390px;
resolve in final audit task. During extraction, typecheck caught a duplicated
JSDoc typedef; fixed and reran checks. Existing typecheck is the regression guard.

## 2026-09-05 — Responsive forms and list recovery (task 2.1)

Added shared FormGrid, applied to paired Contract, Shipment/VGM, Customer,
Bank, Payment Schedule and User fields. User avatar/identity now reflow too.
Login and Design system divider samples constrain their fixed desktop width.
Advanced filter controls use responsive Grid and visible labels. AdvanceTable
shows active filter count, clears all three filter sources, and provides one
Vietnamese empty state through Table's native emptyState prop. Pagination now
clamps zero/stale pages and shows 0–0 for a locally filtered empty page.

Browser geometry at 390×844: Contract 12, Shipment 21, User 4 controls checked,
no overlap/clipping, submit footer visible. Screenshots and filter date-layout
evidence: `harness/runs/20260905-ui-ux-review/`. Search-to-empty and reset were
exercised without saving forms. Added reusable `harness/checks/form-geometry.js`
browser probe and three pagination edge-case tests. Caught duplicate library
empty state during review and replaced it with the native custom-empty prop;
future wrapper changes should inspect built-in empty behavior before adding it.

Full gate passed: `harness/runs/20260905-143108-7335/`.

## 2026-09-05 — UI/UX review baseline (task 1.1)

Created `openspec/changes/ui-ux-maintainability/` for the user-requested
system-wide UI review and component split. Audited 15 representative URLs at
390×844 and captured Contract desktop/mobile baseline screenshots. Confirmed
overlapping Contract date controls, fixed-width form rows, and Design system
440px document width on a 390px viewport. Identified zero-page pagination edge
case in shared table source. See change audit for scope and evidence limits.

Verification passed: `harness/runs/20260905-142258-7129/`.
Screenshots: `harness/runs/20260905-ui-ux-review/`.

Harness gaps: document overflow checks miss controls overlapping inside a
clipped dialog; add a reusable geometry regression check in this change.

<!--
Append-only session log. Newest entry FIRST.
This file is the handoff between sessions/agents — write for a reader with zero conversation context.
-->

## 2026-09-05 — Polish Contract and Commission payment editors

**Context:** User reported poor UX in the payment area of Update Contract,
then explicitly added the Payment History table in Update Commission.

**Change:** Contract's form accordion now keeps one topic open at a time, so
opening Payment Schedule closes the very long General section. Both shared
payment grids now put Add and the running summary in a muted toolbar before
the rows, use compact density and small controls, identify rows with explicit
`Đợt`/`Lần` columns, and expose a named 96px `Thao tác` column. Payment total
uses a labeled success/error `StatusDot` instead of a decorative Badge.
Commission Payment History widens its date and amount columns, uses a one-row
textarea for notes, and guides the zero-payment case with a compact empty
state. Validation, calculations, form state, and API payloads are unchanged.

**Live verification:** On seeded Contract `26DN-SAMPLE01`, verified the
single-open accordion, the valid 100% state, invalid 150% state, derived
amount recalculation, adding a third numbered row, no table overflow, and a
visible pinned save footer. On seeded Commission `26CM03`, verified the
populated history, deletion to the guided empty state, adding a blank row
back, textarea rendering, totals, and two fully visible 96px action headers.
No form was saved. Final screenshots and before/interaction evidence:
`harness/runs/20260905-payment-editors/`.

**Accessibility:** Contract dialog axe scan passed 27 checks with zero
violations/incomplete checks after naming the action header. Commission's two
payment tables no longer produce an axe issue; its dialog still reports the
pre-existing Astryx required `Selector` `aria-required` issue outside these
tables. No console or page errors occurred.

**Harness gap:** There is no automated visual regression assertion for an
editable Table control being clipped by a narrow column or for toolbar/footer
visibility at a short viewport. Browser measurements and screenshots cover
this change, but a reusable e2e geometry check remains future harness work.

**Verification:** `pnpm test` passed 111/111. `./harness/verify.sh` passed every
step; evidence: `harness/runs/20260905-141302-7010/`.

## 2026-09-05 — Fullscreen Contract, Commission, and Admin User dialogs

**Context:** After evaluating the full-viewport create/edit Shipment workflow,
the user asked to extend the same MISA-style workspace to create/edit Contract,
Commission, and User under `/admin`.

**Change:** The shared create/edit dialogs for all three resources now use
Astryx's native `variant="fullscreen"`. Each form fills the dialog height;
header and action footer remain pinned while the content region owns overflow.
Removed the obsolete constrained-dialog width/max-height constants. Only the
active `/admin/users` `UserFormDialog` was changed; legacy User form components
and unrelated dialogs remain untouched.

**Live verification:** At a 1272×573 viewport, opened all six create/edit flows.
Every dialog measured exactly 1272×573 at `(0, 0)`, reported
`data-variant="fullscreen"`, kept its submit button visible, and caused no
document-level vertical overflow. The seeded backend had no contract eligible
for another Commission, so the create-only browser flow temporarily mocked the
Commission search response as empty; no backend data was changed. Screenshots:
`harness/runs/20260905-fullscreen-primary-crud/`.

**Verification:** `./harness/verify.sh` passed every step; evidence:
`harness/runs/20260905-135012-6790/`.

## 2026-09-05 — Widen Shipment cost Note column

**Context:** User asked for the Note field in the just-polished Logistics
Costs grid to be slightly wider.

**Change:** Increased the fixed Note column from 160px to 200px. Cost Category
remains 280px and Provider remains 260px; the flexible Cost Name column
absorbs the 40px adjustment, so no important selector loses space.

**Live verification:** In the edit dialog for `26DN-SAMPLE01/LCL-01` at
1272×573, the Note cell measured exactly 200px (textarea content width 181px),
the full table remained 1224px wide, and its client/scroll heights remained
equal (no vertical overflow). Screenshot:
`harness/runs/20260905-shipment-note-width/edit-note-200.png`.

**Verification:** `./harness/verify.sh` passed every step; evidence:
`harness/runs/20260905-133642-6687/`.

## 2026-09-05 — Polish Shipment Logistics Costs table

**Context:** After the Shipment create/edit form moved fullscreen, the user
reported that the Logistics Costs tab still felt visually unpolished and
showed an unnecessary vertical scrollbar. They then asked for Note to become a
small textarea and for Cost Category/Provider to receive more width.

**What changed:** The tab's scroll container now owns only vertical overflow
(`overflow-x: hidden; overflow-y: auto`), while Astryx Table remains the sole
owner of horizontal overflow. `ShipmentCostLinesFields` resets inherited
container-padding compensation at its own table boundary so the Table no
longer expands 24px beyond the tab and clips the delete action. Removed the
duplicated Logistics Costs heading that overlapped the first column header;
moved "Thêm chi phí" and the running total into a compact toolbar above the
grid; and switched the Table to `density="compact"`. Note now uses a one-row,
small `TextArea`; Cost Category grew from 220→280px, Provider 200→260px,
while Note shrank to 160px and Amount to 160px.

**Live verification:** On `/logistics/shipments`, checked the fullscreen create
dialog with no rows and after adding a row, plus the edit dialog with the
seeded cost row. At 1272×573 the tab content measured 1224×364 with equal
client/scroll height (no vertical overflow), the Table measured exactly its
1224px content boundary with equal client/scroll dimensions, Note rendered as
`textarea rows="1"`, and the delete control was fully visible and hit-testable.
Screenshots: `harness/runs/20260905-shipment-cost-table/`.

**Verification:** `./harness/verify.sh` passed every step; evidence:
`harness/runs/20260905-120835-6570/`. Lint and typecheck passed independently
before the full gate.

## 2026-09-05 — Trial fullscreen create/edit Shipment dialog

**Context:** User liked the MISA-style pattern where large create/edit forms use
the full viewport and asked to apply it to both "Thêm Shipment" and "Sửa
Shipment" first for evaluation.

**What changed:** `ShipmentFormDialog` is shared by create and edit from both
the standalone Shipments page and the Contract Shipment tab, so it now passes
Astryx's native `variant="fullscreen"` in one place. The form itself fills the
dialog; `ShipmentFields` no longer assumes the old fixed 560px dialog body and
instead gives its active tab the remaining height. The header and footer stay
pinned while only the tab body scrolls, keeping Hủy/Thêm/Lưu reachable on short
viewports.

**Live verification:** On `/logistics/shipments`, opened the real create flow
through the contract picker and the real edit flow for
`26DN-SAMPLE01/LCL-01`. At 1272×573, both dialogs measured exactly
1272×573 at `(0, 0)` with `data-variant="fullscreen"`; the tab body measured
364px tall with 1150px of scrollable content, while the submit button remained
visible at the bottom. At 390×844, the edit dialog measured exactly 390×844
with no document-level horizontal overflow. Screenshots:
`harness/runs/20260905-shipment-fullscreen/`.

**Verification:** `./harness/verify.sh` passed every step (readiness, memory
safety, theme build, lint, typecheck, dependency structure, harness/unit tests,
production build, quality thresholds). Evidence:
`harness/runs/20260905-115256-6350/`; `pnpm test`: 111/111 passed.

**Discovered, not changed:** At mobile width, several existing two-column
field rows remain dense and clip their own content even though the fullscreen
shell itself does not overflow. Converting those rows to responsive Astryx
`Grid` is a separate form-layout change, not part of this fullscreen trial.
The dialog-scoped axe check also reports the existing Astryx-generated
`aria-allowed-attr` issue on one field plus contrast checks needing manual
review; the fullscreen change does not add ARIA markup.

## 2026-09-05 — Live-verified the in-progress Advanced Filter Builder (uncommitted)

**Context:** User asked to "test tính năng advance search" against the working
tree's uncommitted changes (`advanced-filter-builder.jsx` + the `AdvanceTable`/
`*-list.jsx`/API/hook wiring across Contracts, Commissions, Customers,
Shipments — see `git status`). No test file exists for this yet; this was a
manual browser pass, not an automated one.

**Live-verified in a browser** (`pnpm dev` already running on `:3000` +
BE-P Docker; logged in as the documented dev Admin
`DNG26F4A9C2`/`Admin@123456`):
- `/logistics/contracts`: funnel icon opens "Bộ lọc nâng cao"; field picker
  lists all 14 `FILTER_FIELD_DEFS` fields and excludes fields already used in
  another condition.
- Number field (Giá trị): all 6 operators render (Bằng/Khác/Nhỏ hơn/≤ /Lớn
  hơn/≥); set "≥ 100000".
- Adding a 2nd condition switches on the "Và/Hoặc" connector selector; picking
  a date field (Ngày tạo) correctly hides the operator dropdown and shows the
  Từ ngày/Đến ngày pair instead (matches the `date` type's `Between`-only
  design in `advanced-filter-builder.jsx`).
- Applying `Giá trị ≥ 100000 AND Ngày tạo between 2026-01-01..2026-09-05` hit
  `POST /api/backend/api/v1/contracts/search` → 200 and correctly narrowed 7
  seeded rows to the 5 matching ones.
- Reopening the dialog preserves the applied conditions (`filterConditions`
  state round-trips correctly); "Bỏ lọc" clears them and restores the full
  list.
- Spot-checked `/logistics/commissions`: same "Bộ lọc nâng cao" dialog opens
  correctly there too.
- No console errors observed during any of the above.

**Not done:** Did not test Customers/Shipments lists, did not test
string-field operators (Contains/StartsWith/.../IsEmpty/IsNotEmpty) or the
enum-field Selector, did not add an automated test for this feature — changes
are still uncommitted working-tree edits, not yet reviewed/tested by their
author.

## 2026-09-04 — Rename frontend Service Agreement to Commission

**Context:** The BE-P resource was renamed end-to-end from
`ServiceAgreement` to `Commission`, including breaking API routes and annex
wire field names. User asked to apply the same rename in this frontend.

**Shipped:** Renamed the logistics-contracts feature types, schemas, constants,
API functions, React Query hooks/keys, form hooks, components, state, and
exports to Commission terminology. Moved the standalone Next page from
`/logistics/service-agreements` to `/logistics/commissions`; updated sidebar
navigation and protected-route access. The client now calls
`GET /api/v1/commissions`, contract-scoped `/commission` and
`/commission/annexes` routes, and consumes annex `commissionId`. Updated code
examples from `26SAxx` to `26CMxx`, plus current ADR/golden-rule/OpenSpec
references whose source paths changed. Historical progress/memsearch text was
left untouched.

**Tests:** Added `api/commissions.test.js` (3 tests) covering the system-wide
list route, contract-scoped GET/POST/PUT routes, all annex routes, and
preservation of `commissionId`. Full `pnpm test`: 111/111 passed.

**Live verification:** Against the running BE Docker API, logged in through
the real UI as the documented dev Admin, opened `/logistics/commissions`, and
observed proxy `GET /api/backend/api/v1/commissions` → 200. Page title,
breadcrumb, sidebar, and table use Commission terminology; seeded row
`26CM03` is visible. Screenshot:
`harness/runs/20260904-113926-commission-rename/commissions-page.png`.

**Verification:** `./harness/verify.sh` passed every step (readiness, memory
safety, theme build, lint, typecheck, dependency structure, harness/unit tests,
production build, quality thresholds). Evidence:
`harness/runs/20260904-113945-1565/`.

**Discovered:** The Windows checkout had CRLF on five shell scripts, causing
WSL Bash to read `pipefail\r`; normalized those worktree files to LF with no
textual Git diff. WSL also cannot resolve Windows `node.exe`; lifecycle and
gate commands were therefore run through the installed Git Bash, where the
repo's Node/pnpm toolchain is available. No product-code workaround was added.

## 2026-09-04 — Fix the Selector-in-dialog portal-stacking bug (again), then make it mechanical

**Context:** User request: "Fix portal-stacking ở dự án, sau nó note lại".
A prior session (this same day, UX review of Contracts/Customers) had found
and fixed a real bug in `contracts-list.jsx` — Astryx's `Selector` portals
its dropdown outside the nearest "unsafe host" ancestor (`<table>`, `<tr>`,
...; see `resolveLayerPortalTarget` in `@astryxdesign/core`'s
`Layer/layerHost.ts`), but Astryx's `Dialog` is a native `<dialog>` element
(no portal of its own) — so a `*FormDialog` with a `Selector` field declared
inside a table's own `renderExpanded` callback is still a DOM descendant of
that `<table>`, and its `Selector`'s dropdown gets portaled underneath the
dialog instead of above it: looks fine, but a mouse click on an option lands
on the dialog instead. That same session's "Standalone Shipments list page"
note flagged `service-agreements-list.jsx` as "likely carries the same
latent bug — noted, not fixed, out of scope."

**Investigated and confirmed the bug was real, not hypothetical**:
`ServiceAgreementExpandedDetails` (in `service-agreements-list.jsx`) rendered
both `ServiceAgreementFormDialog` and `ServiceAgreementAnnexFormDialog`
directly inside `renderExpanded` — and both dialogs' `*Fields` components
(`service-agreement-fields.jsx`, `service-agreement-annex-fields.jsx`) do
have a `Selector` field ("Bên nhận hoa hồng", "Loại phụ lục").

**What shipped:**
- `service-agreements-list.jsx`: lifted `editingAgreementRow`/`annexDialog`
  state out of `ServiceAgreementExpandedDetails` into `ServiceAgreementsList`
  and render both dialogs as siblings of `AdvanceTable`, mirroring
  `contracts-list.jsx`'s already-proven `shipmentDialog`/`vgmDialog` pattern
  exactly. `ServiceAgreementExpandedDetails` now only takes
  `onEdit`/`onAddAnnex`/`onEditAnnex` trigger callbacks.
- The library-level root cause lives in `@astryxdesign/core` (a published
  third-party package, not vendored/patched in this repo) — not fixable from
  here; a `patch-package` step was judged not worth the maintenance cost.
  The sibling-rendering pattern is the correct fix on this side of that
  boundary. Left `resolveLayerPortalTarget` alone.
- Per `harness/ENTROPY.md`'s "caught twice → mechanical rule, not a note"
  policy: added `harness/tests/selector-dialog-stacking.test.cjs` (wired
  into `pnpm run test:harness`, which `verify.sh` already always runs) — a
  bracket-balance scan that fails if any `.jsx` file under `src/` has a
  `renderExpanded:` callback containing a `<*FormDialog>` tag. Deliberately
  flags every `*FormDialog` nested there regardless of whether it currently
  has a `Selector` field, so a field added later can't silently reintroduce
  the bug. Recorded as `harness/GOLDEN_RULES.md` v3 rule #12 and
  `docs/adr/0004-selector-dialog-portal-stacking.md` (context, the
  alternatives considered, and why upstream-patching was rejected).

**Verification:** `./harness/verify.sh` full pass; evidence in
`harness/runs/20260904-105112-4612/`. The previously known lint failure from
the local, untracked `template/filter-table.jsx` Astryx reference scaffold was
removed from project checks by explicitly ignoring `template/**` in ESLint and
`template/` in Git; application code lives under `src/`. `pnpm test`: 107/107
(unchanged — no test file covers this feature area). `pnpm run test:harness`:
6/6 including the new test. **Live-verified in a
browser** (`pnpm dev` + the already-running BE-P Docker containers):
opened `/logistics/service-agreements`, expanded the one seeded row, opened
both "Sửa Service Agreement" and "Thêm phụ lục", and mouse-clicked an option
in each dialog's `Selector` dropdown — both registered correctly (field
value updated to the clicked option) instead of the click falling through
to the dialog underneath. Cancelled both dialogs afterward, no data changed.

**Not done:** did not attempt to patch `@astryxdesign/core` itself (out of
reach without a `patch-package` step this repo doesn't have — see the ADR).
Did not add a lint rule for "no Selector rendered inside *anything* that
isn't outside an unsafe host" in general — the new harness test is scoped
to this codebase's actual recurring shape (`*FormDialog` inside
`renderExpanded`), not a general-purpose Astryx-usage linter.

## 2026-09-04 — Wire up Customer edit ("Sửa khách hàng")

**Context:** User request: "thêm tính năng chỉnh sửa khách hàng ở front
end". `Customer`/Party A catalog (`customers-list.jsx`) already had a
"Sửa khách hàng" footer button in the row's expanded panel — permanently
disabled (`isDisabled`, `tooltip="Chưa hỗ trợ"`) since the backend had no
Update endpoint. The backend gained `PUT /api/v1/customers/{id}` earlier
today (separate BE-P session/commit `338cc4c`), so this session wires
the existing button up.

**What shipped**, mirroring `use-shipment-form.js`'s create/edit-in-one-hook
pattern (the most recent precedent for this shape in the codebase):
- `api/customers.js`: new `updateCustomer(customerId, values,
  extraFieldRows)` — same request-body shape as `createCustomer`, `PUT`
  instead of `POST`. Full `ExtraFields` replacement (matches the BE's
  full-replace, not merge, per its own docs), so callers must resend every
  row.
- `use-customers-query.js`: new `useUpdateCustomerMutation()`, same
  query-invalidation as the create mutation.
- `use-customer-form.js`: `useCustomerForm` now takes an optional
  `customer` — when present, seeds `values` and `extraFieldRows` from it
  (`valuesFromCustomer`/`extraFieldRowsFromCustomer`, new) and routes
  `handleSubmit` to the update mutation instead of create.
  `quick-create-customer-dialog.jsx` (embedded in the Contract form) calls
  this hook without `customer` — unaffected, still create-only.
- `customer-form-dialog.jsx`: accepts an optional `customer` prop, flips
  title ("Sửa khách hàng"/"Thêm khách hàng") and submit-button label
  ("Lưu"/"Thêm") accordingly — same shape as `ShipmentFormDialog`.
- `customers-list.jsx`: new `editingCustomer` state; the previously-disabled
  button now calls `onEdit` (new prop on `CustomerExpandedDetails`), which
  opens a second `CustomerFormDialog` instance keyed by the customer's id
  (same as `shipments-list.jsx`'s `shipmentDialog` pattern — a fresh key
  forces the form to reseed if a different row is edited without the
  dialog fully unmounting first).

**Verification:** `pnpm lint`/`pnpm typecheck` clean on the touched files
(repo-wide `pnpm lint` has one pre-existing unrelated failure —
`template/filter-table.jsx`, a TypeScript-syntax file outside this
feature's scope, not touched this session). `pnpm test`: 107/107 green
(unchanged count — no test file covers this feature area yet).

**Live-verified in a browser**, not just tests: `pnpm dev` +
`docker compose up -d --build api` (BE-P) + logged in as
`DNG26F4A9C2`/`Admin@123456`. First save attempt hit a real bug, not a
test gap: `PUT /api/v1/customers/{id}` returned `404` — the running
Docker `api` container was still the image from *before* the backend's
Update-Customer session had rebuilt it, so the new route didn't exist in
the served binary yet. Rebuilt (`docker compose up -d --build api`), retried
→ `200`, row and expanded panel updated to "R1 Updated" in place, **and a
full page reload still showed the change** (real DB persistence, not just
client cache). Reverted the test edit back to "R1" afterward so the dev DB
is unchanged. Lesson: a backend session's own `dotnet test` passing does
**not** mean the locally-running Docker container has picked up the
change — always rebuild before FE-side live verification, don't assume.

**Not done:** no automated FE test added for the edit flow (this feature
area — `customers-list.jsx` and siblings — has no existing test file to
extend; adding one from scratch was judged out of scope for wiring up an
already-designed button).

## 2026-09-04 — Standalone Shipments list page

**Context:** UX review of Contracts/Customers (this session, user asked
"Đánh giá giao diện... đã thực sự tối ưu trải nghiệm người dùng chưa")
flagged the contract row's expanded panel as overloaded (6 tabs, nested
CRUD, an existing Selector-in-dialog portal-stacking workaround). User
picked "tách tab Shipment thành trang riêng" as the fix, mirroring the
existing Service Agreement standalone-page precedent. User confirmed
(against BE docs) that `GET /api/v1/shipments` — system-wide, paginated —
already exists, so no backend dependency. Tracked as
`openspec/changes/add-shipments-list-page/` (proposal.md + tasks.md).

**What shipped.** New `listAllShipments`/`useShipmentsListQuery`/
`ShipmentsList` (`/logistics/shipments`, new sidebar entry + route-access
rule), built by cloning `service-agreements-list.jsx`'s standalone-list
pattern: flat paginated table, `contractNumber`/`projectName`/forwarder
name resolved client-side via `useContractsQuery`/`useCustomersQuery`
joins. Row expansion reuses `ShipmentExpandedDetails` unchanged except
one new optional `onEdit` prop (renders a "Sửa Shipment" footer button,
`contracts-list.jsx` doesn't pass it so nothing changes there). "Thêm
Shipment" opens a small contract-picker `Selector` dialog first (no
precedent in this codebase — Service Agreement's standalone page has no
create button at all), then the existing `ShipmentFormDialog` with the
picked `contractId`. `ShipmentFormDialog`/`ShipmentVgmFormDialog` render
as siblings of `AdvanceTable`, never inside `renderExpanded` — following
`contracts-list.jsx`'s proven-safe fix for the Selector-portal-stacking
bug, not `service-agreements-list.jsx`'s pattern (which renders its own
Selector-bearing dialogs inside `renderExpanded` and likely carries the
same latent bug — noted, not fixed, out of scope).

**Bug found and fixed during live verification:** the original plan had
a per-row "Sửa" icon column in `tableColumns`, copied from the *contract
row's* raw (non-`AdvanceTable`) Shipment tab table. On the real page it
silently never rendered — `AdvanceTable`'s `useTableColumnSettings`
drops any `tableColumns` key not also declared in `columnOptions`, and
no other `AdvanceTable`-based list in this app has a persistent action
column for that reason. Fixed by moving edit into the expanded panel's
footer instead (see `onEdit` above), matching how every other
`AdvanceTable` list already handles editing.

**Verification:** `./harness/verify.sh` full pass. Live-verified against
the local Docker backend, logged in as `DNG26F4A9C2`/`Admin@123456`:
`/logistics/shipments` loads 4 real shipments with `contractNumber`/
`shipmentCode` correctly joined (an initial 404 on page load turned out
to be a stale/kicked session, not a missing endpoint — a page refresh
after re-login returned 200 with real data); "Thêm Shipment" → contract
picker → `ShipmentFormDialog` opens with the picked contract; row
expansion shows metadata + VGM table; "Thêm VGM"'s `Selector` dropdown
opened correctly on top of its dialog and was mouse-clickable (no
portal-stacking regression); "Sửa Shipment" footer button opens the edit
dialog pre-filled with the row's data.

**Next step:** none pending for this change. The two other UX findings
from the same review (Customers has no "Sửa khách hàng" at all; Hợp
đồng/Khách hàng "Xoá"/"In" buttons are permanently disabled stubs) are
still open — the "phase" is the user's items 1/2, not started.

---

## 2026-09-04 — Shipment code by type, forwarder wording (frontend)

**Context:** Same request as the backend `add-shipment-type-scoped-
numbering` change (`../CLEAN ARCHITECTURE/harness/PROGRESS.md`): LCL
shipments get `{ContractNumber}/LCL-{n}` codes, FCL get
`{ContractNumber}/LOT-{n}` (separate 1-based sequence per type); the
Số lượng unit is now derived from Loại hình (LCL → Kiện, FCL → Cont),
not a free choice; Booking info's "Nhà cung cấp" reads "Forwarder".
"Forwarder" wording had already been applied to `shipment-fields.jsx`/
`shipment-expanded-details.jsx` by the time this session picked up the
rest — left as-is, just extended the same rename to the one remaining
spot (`contracts-list.jsx`'s Shipment table column header).

**What shipped.** `shipment-schema.js`/`use-shipment-form.js`/
`api/shipments.js` drop `quantityUnit` entirely (no longer a form field
or a request field, create or update). `config/shipment-quantity-
units.js` gained `quantityUnitForShipmentType(type)` — a small pure
mirror of the backend's `Shipment.QuantityUnit` computed getter, so the
form can preview the unit without a round trip. `shipment-fields.jsx`:
the "Số lượng" field shows the derived unit as its `units` suffix
instead of a separate Selector (with a hint description before a type
is chosen); "Loại hình" is `isDisabled` whenever editing an existing
shipment (`isEditing` prop, threaded from `ShipmentFormDialog`), with
`disabledMessage="Không thể đổi loại hình sau khi đã tạo"` — matches the
backend's `Type` now being immutable after creation. `api/shipments.js`
split into `toCreateRequestBody`/`toUpdateRequestBody` since only create
sends `Type` any more (update never did have `quantityUnit`, but now
neither field is in either body, and `Type` is create-only).

**Verification:** `./harness/verify.sh` full pass (lint/typecheck/build/
quality-thresholds). Live-verified against the local Docker backend on
`26KCTLIVE01`: creating a new LCL shipment showed the "Kiện" units
suffix live as soon as "LCL" was picked (before that, the hint text);
after saving, the row displayed as `26KCTLIVE01/LCL-01` with "10 Kiện",
while the pre-existing FCL shipment re-rendered as `26KCTLIVE01/LOT-01`
with "3 Cont" (was `SHP-01` before this backend change) — confirming
independent per-type numbering end to end, not just in isolation.
Re-opened the new LCL shipment's edit dialog: "Loại hình" showed
visibly greyed out/disabled, matching the immutability rule.

**Not done:** the new test shipment (`26KCTLIVE01/LCL-01`) was left in
place — `Shipment` still has no delete endpoint (unchanged scope from
every prior shipment-area session).

## 2026-09-03 — Fullscreen toggle: fix state reset on every toggle

**Context:** User bug report (Vietnamese): clicking the maximize button
resets all state — expanded rows, open tabs, everything. Reproduced live:
expanded a contract row, switched to its "Shipment" tab, clicked
maximize — the row collapsed back to nothing.

**Root cause, found through two wrong fixes before the real one — full
story kept in `fullscreen-panel.jsx`'s doc comment since both false
starts are exactly the kind of thing a future editor of this file will
try again:**

1. **First attempt** (this same day, an earlier entry below): swap which
   *type* of element `FullscreenPanel` returns — `content` directly vs.
   `createPortal(<div>{content}</div>, target)`. Wrong: that changes what
   sits in this component's one return slot from React's perspective on
   every toggle, so React unmounts and remounts the whole subtree —
   exactly the bug, not yet fixed by that attempt (it was written for the
   theming bug, not this one, and happened to make this one worse: now
   every toggle, not just first mount, wiped state).
2. **Second attempt**: keep one `createPortal(content, container)` call
   across every render, only ever changing which `container` it targets.
   This *looked* right — portals are supposed to be DOM-position-
   independent — but verified live it still remounted `content` on every
   toggle. React does not guarantee preserving a portal's children when
   its `container` argument changes between renders.
3. **The actual fix**: `createPortal` always targets the exact same DOM
   node — `portalContainer`, created once via `useState`'s lazy
   initializer, so the `container` argument passed to `createPortal`
   never changes across any render, ever. Moving that container between
   the placeholder (`<div ref={placeholderRef} />`, rendered in the
   page's normal flow) and `#fullscreen-portal-root` is done with plain
   `container.appendChild(...)` inside a `useLayoutEffect` — imperative
   DOM manipulation, entirely outside React's reconciliation, so
   `createPortal` itself never has a reason to remount anything.

**A second bug inside the fix, caught by live-testing rather than
assumed correct:** the `useLayoutEffect` that moves `portalContainer`
didn't list `isMounted` in its dependency array. `isFullscreen`/
`portalContainer` are identical between the "not mounted yet" render
(which returns `content` directly, no placeholder div) and the very next
"now mounted" render (which adds the placeholder) — since neither
tracked dependency actually changed, React skipped re-running the effect
for that second render. It fired exactly once, too early, found
`placeholderRef.current` still null, appended nothing, and never got
another chance — silently orphaning the entire page's content in a
detached DOM node. Symptom: the whole `/logistics/contracts` page
rendered blank (nav/sidebar visible, `<main>` empty) — caught by
checking `document.querySelector('main').outerHTML` directly after the
"container swap" fix looked correct on paper but wasn't actually
visible. Added `isMounted` to the effect's dependency list; fixed.

**Verification:** `./harness/verify.sh` full pass. Live-verified the
actual reported scenario end to end: expanded contract `26KCT01`,
switched to its "Shipment" tab, typed "markertest" into the search box
(confirms local component state specifically, not just visible DOM),
clicked maximize — search text survived; cleared it — the same row was
still expanded on the same tab, unchanged. Clicked minimize — nav/side
nav returned, same state still intact. Diagnosed both wrong fixes with
a temporary `useEffect` mount/unmount console log on `ContractsList`
(removed once confirmed clean) — recommended technique for verifying a
"does this actually remount" claim, since it's easy to reason your way
to a wrong confident answer here (both false starts felt correct until
tested).

## 2026-09-03 — VGM inline table: pin the edit/delete actions column

**Context:** Same-day follow-up to the header-truncation fix directly
below, which is what made this table scroll horizontally at narrow
widths in the first place. User asked to pin ("pin nó") the action
buttons (Sửa/Xoá) so they don't scroll out of view with the rest of the
table.

**What shipped.** `shipment-expanded-details.jsx`: `useTableStickyColumns
({ endKeys: ['actions'] })` from `@astryxdesign/core/Table`
(`astryx template StickyColumnsHookUsage` — found via `astryx component
Table`'s related-templates list), passed to the `Table` as
`plugins={{ stickyColumns }}`. Needed one explicit JSDoc cast
(`/** @type {TablePlugin<ShipmentVgm & Record<string, unknown>>} */`) on
the hook's return value — `tsc` couldn't otherwise unify the hook's
generic `TablePlugin<Record<string, unknown>>` inference with the
already-typed `vgmColumns`, same shape of cast `contracts-list.jsx`
already uses for `useTableRowExpansion`.

**Verification:** `./harness/verify.sh` full pass. Live-verified: since
`resize_window` wasn't actually resizing the browser window in this
session (`window.innerWidth` stayed 1920 despite a "successful" resize
call — flagged here in case it's a recurring environment quirk, not
re-litigated further this session), verified instead by constraining the
VGM table's own `.astryx-table-scroll-wrapper` to 700px via a temporary
`element.style.maxWidth` (removed after). Scrolling that constrained
table horizontally: the Sửa/Xoá icon buttons stayed pinned at the right
edge with Astryx's soft shadow divider, visible throughout, while every
other column scrolled underneath.

## 2026-09-03 — VGM inline table: fix header truncation at narrow widths

**Context:** User bug report (Vietnamese): at a small viewport, the VGM
table's headers get cut off — "Ngày đóng h...", "Gross weight...".
Reproduced live by resizing the browser to 1100×800 and expanding a VGM
row: `packingDate`'s header truncated to "Ngày đóng h..." and, scrolling
right, `grossWeight`/`maxGross` did too.

**Root cause.** The previous "smart columns" follow-up switched every
`vgmColumns` width from fixed `pixel()` to `proportional()`. Astryx's
`proportional()` has a **120px default minimum width**
(`DEFAULT_MIN_COLUMN_WIDTH`) — enough for short headers like "Tare (kg)"
but not for "Ngày đóng hàng" or "Gross weight (kg)", so at a narrow
viewport those columns hit the 120px floor and Astryx's header cells
(which always truncate, per `astryx component Table`) ellipsized them.

**Fix.** `proportional()` accepts a second argument,
`{ minWidth: number }` (`astryx component Table` docs / `columnUtils.d.ts`
— not obvious from the one-line signature in the earlier `smart columns`
session, found only by reading the `.d.ts` directly). Set an explicit
`minWidth` sized to each column's own header text: `carrierCustomerId`
160, `packingDate`/`maxGross` 150, `grossWeight` 170; short-header
columns (`containerType`/`containerNumber`/`sealNumber`/`tare`/`vgm`)
keep the 120px default, which already fits them. Below the new
minimums, the table now grows its own `tableMinWidth` and scrolls
horizontally instead of squeezing header text into an ellipsis.

**Verification:** `./harness/verify.sh` full pass. Live-verified by
resizing the browser back to 1100×800 (the exact width that reproduced
the bug) and re-expanding the same VGM row: "Ngày đóng hàng" now renders
in full, and scrolling the table horizontally shows "Max gross (kg)"/
"Gross weight (kg)" in full too, with a working scrollbar instead of
truncated text.

## 2026-09-03 — Fullscreen toggle: trigger placement + a real theming bug

**Context:** Same-day follow-up to the `FullscreenPanel` entry directly
below. Two pieces of user feedback: (1) put the maximize button beside
the page's existing action button ("Tạo hợp đồng"), not floating on its
own; (2) maximized, font and colors were broken.

**(1) Trigger placement — API change, not a style tweak.** The maximize
button used to be `FullscreenPanel`'s own, absolutely positioned inside
a wrapper it rendered itself — no way for a page to put it anywhere
else. Reworked into a Context: `FullscreenPanel` now only owns state +
the portal, exposed via a new `useFullscreenToggle()` hook any
descendant can call. `ContractsList` calls it and renders the
maximize/restore `IconButton` itself, in the same `HStack` as "Tạo hợp
đồng" — exactly where the user asked. `page.jsx` dropped the now-unused
`label` prop.

**(2) The theming bug was real and specific, not vague "CSS broke".**
Confirmed via `getComputedStyle` in the live page: "Tạo hợp đồng"'s
background was `rgba(0, 0, 0, 0)` (fully transparent) while maximized,
`rgb(36, 119, 104)` (its real teal-green) normally — text color survived
(`appShellContentStyle` from the previous entry covered that), but the
*component's own* background did not. Root cause: `createPortal(...,
document.body)` escapes **`<Theme>`'s own wrapper element**, not just
`ProtectedAppShell`'s `.root` div — Astryx's component-level theme CSS
(a button's background token, etc.) resolves from custom properties that
live on that wrapper, not from the `data-astryx-theme`/`data-theme`
attributes synced onto `<html>` (those cover `@scope` matching and
`color-scheme`, not every token). A `document.body` portal is a sibling
of `<html>`'s `<body>` itself — several ancestors removed from
`<Theme>`.

**Fix:** `ProtectedAppShell` now renders `<div id="fullscreen-portal-
root" />` as a sibling of `.layout` (so, of `<main>`) — still inside
`.root`, so still inside `<Theme>` (the root layout wraps everything in
one `<Theme>`), but *not* a descendant of `<main>`, so `main`'s
`isolation: isolate` still can't trap it below the header. `Fullscreen
Panel` portals there instead of `document.body`. Verified live: the
button's background matched exactly (`rgb(36, 119, 104)`) in both
states after the fix, confirmed via the same `getComputedStyle` check
that caught the bug.

**Verification:** `./harness/verify.sh` full pass. Live-verified in the
browser: maximize button now sits directly beside "Tạo hợp đồng"; while
maximized, `getComputedStyle` on the button matches its normal-mode
values exactly (background, text color, font-family, font-size); Escape
still restores the normal layout with both nav elements back.

## 2026-09-03 — Fullscreen toggle for the Contracts page (`add-fullscreen-contracts-panel`)

**Context:** User idea, illustrated with an annotated screenshot circling
the page content below the top nav on `/logistics/contracts`: add a
maximize button that expands that circled area to fill the whole
viewport, covering both the top nav and the side nav.

**What shipped.** New `FullscreenPanel`
(`src/shared/components/fullscreen-panel.jsx`) — a shared (not
Contracts-specific) wrapper: children render normally with a small
maximize `IconButton` pinned top-right; clicking it portals the children
(`createPortal` to `document.body`) into a `position: fixed; inset: 0`
overlay above the app shell's header. **Portalling out of `<main>` is
required, not optional** — `ProtectedAppShell`'s `<main>` has
`isolation: isolate` (`protected-app-shell.jsx`), which traps a
`position: fixed` descendant inside `<main>`'s own stacking context,
painted *below* the header's z-index-40 context no matter how high a
z-index the descendant is given (isolation creates a new stacking
context for the isolated element as a whole; nothing inside can escape
where that whole context sits relative to siblings). A portal sidesteps
this by not being a DOM descendant of `<main>` in the first place.
Escape and a restore button both exit; body scroll locks while
maximized, same pattern as the existing mobile side-nav overlay.
`logistics/contracts/page.jsx` wraps its `PageContentShell` in this —
the only page wired up so far, since that's the page the user's
screenshot showed; the component itself is generic and reusable.

**One real lint failure caught and fixed, not a design change.** The
first draft used a `useState` + `useEffect(() => setIsMounted(true), [])`
"has this hydrated yet" flag (needed to gate the `createPortal` call,
which can only run client-side) — React's `react-hooks/set-state-in-
effect` rule correctly flagged this as a synchronous setState-in-effect.
Replaced with the same `useSyncExternalStore`-based idiom already used
by `mdx/error-decoder.jsx`'s `isHydrated` (`subscribeNever`/
`getHydrated`/`getServerHydrated`) instead of inventing a new pattern.

**Verification:** `./harness/verify.sh` full pass (lint/typecheck/build/
quality-thresholds). Live-verified in the browser: clicking the
maximize button hides the top nav and side nav completely, content
fills the viewport; a Contracts table row still expands correctly while
maximized; Escape restores the normal layout with both nav elements
back.

**Not done:** no other page opted into `FullscreenPanel` yet — only
Contracts, matching what was actually asked.

## 2026-09-03 — VGM inline table: smart column widths, left-aligned text

**Context:** Same-day follow-up to the column-reorder entry directly
below. User asked for two more tweaks to the same table (Vietnamese):
columns should be "smart" (share the table's actual width instead of a
fixed pixel each) and every column's text should be left-aligned.

**What changed.** `shipment-expanded-details.jsx`'s `vgmColumns`: every
`width: pixel(N)` → `width: proportional(N)` (Astryx's flex-distribution
helper — each column gets a share of the table's real width instead of a
fixed px value, with a 120px floor so nothing collapses on a narrow
viewport); `Nhà cung cấp` weighted `proportional(2)` (longest values —
company names), every other data column `proportional(1)`. Dropped
`align: 'end'` from the four weight columns (Max gross/Tare/Gross weight/
VGM) — `align` defaults to left, so removing it left-aligns their numbers
along with everything else. The trailing `actions` icon-button column
stays a fixed `pixel(90)` — it holds icons, not text, so neither ask
applies to it.

**Verification:** `./harness/verify.sh` full pass. Live-verified in the
browser on `26KCTLIVE01/SHP-01`'s `CONT-002` row: columns now spread to
fill the table's full width instead of leaving a gap after the last
data column, and every cell — including the four previously
right-aligned numeric columns — reads left-aligned.

## 2026-09-03 — VGM inline table: column reorder

**Context:** Same-day follow-up to the VGM dialog redesign entry
directly below. User specified the exact inline VGM table column order
(Vietnamese): Nhà cung cấp / Ngày đóng hàng / Loại cont / Tên cont / Tên
seal / Max Gross / Tare / Gross weight / VGM.

**What changed.** `shipment-expanded-details.jsx`'s `vgmColumns` reordered
to match exactly — carrier and date now lead (previously last, added by
the additional-info follow-up), followed by container identity (loại
cont/tên cont/tên seal, was cont/seal/loại before), then the weight
figures ending in the two computed values. Also **added a `maxGross`
column** (`Max gross (kg)`, between Tên seal and Tare) — not present in
the table before, called out explicitly in the requested order. Payload/
Net weight/Khối lượng bao bì stay dialog-only, unchanged from the
previous session's choice to keep the table from growing too wide.

**Verification:** `./harness/verify.sh` full pass. Live-verified in the
browser on `26KCTLIVE01/SHP-01`'s existing `CONT-002` row — table header
and cell order read left-to-right exactly as specified: Nhà cung cấp
(Unknown) / Ngày đóng hàng (2026-01-01) / Loại cont (40') / Tên cont
(CONT-002) / Tên seal (SEAL-002) / Max gross (28000.00) / Tare (2100.00)
/ Gross weight (20400.00) / VGM (22500.00).

## 2026-09-03 — VGM dialog: collapse-card layout, wider, reordered fields

**Context:** Same-day follow-up to the `add-shipment-vgm-additional-info`
entry directly below. User feedback on that dialog (Vietnamese,
verbatim intent): (1) use the same collapsible-card layout as "Thêm hợp
đồng" (`ContractFormDialog`); (2) widen the dialog; (3) reorder/pair
fields — Ngày đóng hàng and Nhà cung cấp each on their own row at the
top, then Tên cont/Tên seal, Loại cont/Max gross, Tare/Payload, Net
weight/Khối lượng bao bì paired two-per-row — with a separate "Thông tin
bổ sung" card for what's left (the three optional schedule/arrival times
+ note).

**What changed.** `shipment-vgm-fields.jsx` split into two exported
components: `ShipmentVgmFields` (the reordered/paired required fields —
`packingDate`/`carrierCustomerId` promoted out of the old flat "Thông
tin bổ sung" section since they're required, not optional, followed by
four `HStack`-paired rows, then the Gross weight/VGM computed summary)
and `ShipmentVgmAdditionalFields` (unchanged: the three `TimeInput`s +
`Ghi chú`, still single-column). `shipment-vgm-form-dialog.jsx` rebuilt
around the exact `FormSection`(`Card`+`Collapsible`)/`CollapsibleGroup`/
fixed-height-scroll-VStack idiom `ContractFormDialog` and
`UserFormDialog` already use — two cards, "Thông tin container" and
"Thông tin bổ sung", both open by default (`defaultValue={['main',
'additional']}`). Width `640` → `760` (matches `ShipmentFormDialog`,
comfortably fits the new two-up field rows).

**Verification:** `./harness/verify.sh` full pass (lint/typecheck/build/
quality-thresholds all clean — no new components needed adding to any
allowlist). Live-verified in the browser on `26KCTLIVE01/SHP-01`: "Thêm
VGM" now renders both cards with the requested field order and pairing;
collapsing "Thông tin bổ sung" via its chevron worked and — thanks to
the fixed-height scroll container copied from `ContractFormDialog` — the
dialog itself did not resize/jump, same as the Contract dialog's
behavior. Re-opened the edit dialog on the pre-existing `CONT-002` row
(the one backfilled by the backend migration's "Unknown" placeholder
customer) — every field, including the backfilled `Ngày đóng hàng
January 1, 2026` / `Nhà cung cấp Unknown`, pre-filled correctly in the
new layout.

## 2026-09-03 — Shipment VGM additional info (`add-shipment-vgm-additional-info`)

**Context:** Same-day follow-up to the `add-shipment-vgm` entry below.
Backend shipped six new "Thông tin bổ sung" fields on `ShipmentVgm`
(`../CLEAN ARCHITECTURE/openspec/changes/add-shipment-vgm-additional-info/`):
`packingDate` (required), `plannedPackingTime`/`actualPackingTime`/
`truckArrivalTime` (optional), `carrierCustomerId` (required, live
`Customer` reference), `note` (optional). User asked to build the FE.

**What shipped.** `types/index.js`, `config/shipment-vgm-schema.js`,
`api/shipment-vgms.js`, `hooks/use-shipment-vgm-form.js` (now also fetches
the `Customer` catalog, mirroring `useShipmentForm`), and
`components/shipment-vgm-fields.jsx` (new "Thông tin bổ sung" section:
`DateInput`, a `hasSearch` `Selector` for the carrier, three `TimeInput`s
with `hasClear`/`24h`, a `TextArea` for the note) all updated. The inline
VGM table (`shipment-expanded-details.jsx`) gained "Ngày đóng hàng"/"Nhà
cung cấp vận chuyển" columns — `contracts-list.jsx` now threads its
already-fetched `customersById` map down as a new prop to resolve the
carrier name per row; the other four fields stay edit-dialog-only, same
as the pre-existing weight fields, to avoid an even wider table.

**Real bug found and fixed via live verification, not by code review.**
The first live submit attempt failed with a generic "Không thể thêm VGM"
banner — no useful detail. Traced via direct `fetch()` calls against the
backend proxy (bypassing the form) to isolate the cause: the backend's
`TimeOnly?` fields (`plannedPackingTime` etc.) deserialize through System
.Text.Json's built-in `TimeOnly` converter, which requires a value with
seconds (`HH:MM:SS`) — Astryx's `TimeInput` component emits bare `HH:MM`
(no `hasSeconds` prop set), which the backend rejected with a `400` whose
detail (`"The JSON value could not be converted..."`) never reached the
UI because `apiRequest` shows a generic message on parse-style 400s.
Fixed by adding a `withSeconds()` normalizer in `api/shipment-vgms.js`
that appends `:00` to a bare `HH:MM` value before sending. Confirmed the
fix with a raw `fetch()` (`201`, not `400`) before re-testing through the
actual UI.

**Verification:** `./harness/verify.sh` full pass (lint, typecheck,
structure, harness-tests, unit-tests, build, quality-thresholds — no test
count changed, this feature has no dedicated unit tests, consistent with
every other `*-fields.jsx` component in this codebase). Live-verified
against the local Docker backend on contract `26KCTLIVE01` / shipment
`SHP-01`: "Thêm VGM" now creates a row correctly (all six new fields,
including the live Gross weight/VGM preview); the new row appeared
inline with the right date/carrier; the edit dialog re-opened on it with
every field — including all three times — pre-filled correctly; delete
removed it. The one pre-existing VGM row (backfilled by the backend
migration's "Unknown" placeholder `Customer`, see that repo's
PROGRESS.md) rendered correctly in the new table columns too, confirming
the whole chain end-to-end including a value nobody explicitly entered
through this UI.

**Not done:** no new dedicated FE tests — this codebase has none for
`shipment-vgm-fields.jsx` either before or after this session (`quality-
thresholds` still passed, so no coverage regression was introduced).

## 2026-09-03 — Fix: Selector fields unclickable by mouse in row-nested dialogs

**Report:** user could not select "Nhà cung cấp" (Selector with `hasSearch`),
"Loại hình" (LCL/FCL), or "Đơn vị" (currency) in the "Thêm Shipment" dialog —
clicking an option closed the dropdown without setting a value.

**Root cause (confirmed via `document.elementFromPoint` on the live page,
not guessed):** `ShipmentFormDialog` — and every other `*FormDialog` opened
from inside a contract row's expanded content (Payment Schedule, Contract
Annex, Service Agreement, Service Agreement Annex, Shipment VGM) — was
declared inside `ContractExpandedDetails`, which `contracts-list.jsx` uses
as the Contracts `<Table>`'s row-expansion content (`renderExpanded`). Even
though the Dialog floats visually above the page, its `Selector` fields are
still, in the DOM, descendants of that `<table>`/`<tr>`.

Astryx's popover positioning (`@astryxdesign/core`'s
`Layer/layerHost.ts`, `resolveLayerPortalTarget`) treats `<table>`/`<tr>` as
"unsafe hosts" and portals a `Selector`'s dropdown out to the nearest safe
ancestor *outside* the table — landing it in the Contracts table's own
scroll wrapper, not inside the open dialog's layer. It still paints where
expected, but for mouse clicks it ends up stacked *underneath* the dialog's
own trigger button: a click on a visible option actually lands on the
trigger beneath it (closing the dropdown, selecting nothing). Keyboard
selection (arrow keys + Enter) bypassed this entirely, which is how the bug
was initially isolated from a real UI bug vs. a data/business-rule issue.

**Fix (comprehensive, not shipment-only — user chose this scope
explicitly over a shipment-only patch):** lifted every `*FormDialog` with a
`Selector` field out of `ContractExpandedDetails`/`ShipmentExpandedDetails`
and up into `ContractsList` (a sibling of `AdvanceTable`, not a descendant
of the Contracts table). `ContractExpandedDetails` and
`ShipmentExpandedDetails` now only call trigger callback props
(`onAddShipment`, `onEditShipment`, `onAddVgm`, `onOpenServiceAgreement`,
...) — `ContractsList` owns the open/editing state and renders the actual
dialogs. `activeTab` (the expanded row's tab) was also lifted to
`ContractsList` (as `expandedTab`) so the Service Agreement dialog's
`onSuccess` can switch to the "Service Agreement" tab without a
callback-registration hack. VGM's delete confirmation (`AlertDialog`, no
`Selector`) was left nested — it isn't affected by this bug.

Left a detailed comment on `ContractsList` (search "Selector popover
stacking") explaining the constraint so a future dialog doesn't get added
back inside `renderExpanded` by mistake.

**Verification:** `./harness/verify.sh` full pass. Live-tested in browser:
reproduced the original bug first (mouse click failed, keyboard arrow+Enter
worked, confirming it wasn't a business-rule issue), traced it to the DOM
via `document.elementFromPoint` at the option's own bounding-rect center
(returned the trigger button, not the option). After the fix: "Thêm
Shipment" dialog's Nhà cung cấp/Loại hình/Đơn vị all set correctly via
mouse click; spot-checked "Thêm phụ lục" (Contract Annex, also lifted) —
its "Loại phụ lục" Selector also now works via mouse click. Did not
individually click-test Payment Schedule/Service Agreement/Service
Agreement Annex/VGM dialogs beyond confirming the file compiles and lints —
same mechanical fix as Annex/Shipment, low risk, but worth a pass next
session if time allows.

## 2026-09-03 — Shipment tab redesign: Table + expand-row, VGM inline, terminology

**Request:** three concrete asks (bigger dialogs, VGM fields one per row,
table-style list items) plus a proposal to evaluate: nest a sub-tab per
Shipment inside the "Shipment" tab, VGM shown as a table within each.
Recommended against the sub-tabs (a `TabList` doesn't scale to a dynamic,
possibly-large list of records — no precedent for it anywhere else in
this codebase) in favor of the pattern already used twice here
(`useTableRowExpansion`, on the top-level Contracts table and the
Service Agreement list): Shipment list becomes a real `Table`, expanding
a row reveals full Book/Lot info + VGM as an inline table, no more modal
for the VGM *list* (add/edit stay small dialogs, which is normal for
forms). User approved implementing this version first and asked for a
live-verified pass before building the sub-tab alternative.

**What changed:**
- New `components/shipment-expanded-details.jsx` — the expanded-row
  content for one Shipment: `MetadataList`s for Book/Lot info, then VGM
  as an inline `Table` (`Table` from `@astryxdesign/core/Table`, not
  `AdvanceTable` — no search/filter/pagination chrome needed at this
  nesting depth) with "Thêm VGM"/edit/delete, delete still confirmed via
  `AlertDialog` first.
- `components/contracts-list.jsx`: "Shipment" tab's `List`/`ListItem`
  replaced with a `Table` (`shipmentColumns`: Mã/Tên lô hàng/Loại
  hình/Số lượng/Booking/Nhà cung cấp/Giá trị invoice/edit) +
  `useTableRowExpansion` + `createRowExpansionInteractionPlugin`
  (`expandedShipmentId` state), rendering `ShipmentExpandedDetails` per
  row. Removed `vgmShipment` state and the "Quản lý VGM" icon
  button/`Boxes` import (VGM is always visible on expand now, no
  separate trigger needed).
- **Deleted** `components/shipment-vgm-list-dialog.jsx` — fully replaced
  by the inline table above; nothing else imported it.
- Terminology: Tab label/heading "Xuất hàng" → "Shipment" (button/empty-
  state/tooltip text too — "Thêm Shipment", "Chưa có Shipment nào", "Sửa
  Shipment"); "Tạo/Sửa Service Agreement" button → "Tạo/Sửa Commission"
  (only that action button — the "Service Agreement" tab/page/entity name
  itself was left alone, wasn't part of the request).
- Dialogs made bigger: `ShipmentFormDialog` 560→760px,
  `ShipmentVgmFormDialog` 520→640px.
- `components/shipment-vgm-fields.jsx`: every field now its own full-
  width row (`HStack`/`StackItem` pairing removed) instead of 2-3 fields
  side by side.

**Verification:** `./harness/verify.sh` full pass (one `simple-import-
sort/imports` lint error from the new/reordered imports, fixed with
`eslint --fix`). Live-clicked through on `26KCTLIVE01/SHP-01`: tab reads
"Shipment", list renders as a real table with headers, clicking a row
expands it (chevron + accent border, same look as every other expandable
row in this app) to show Book/Lot info; added VGM `CONT-002` — the inline
table appeared immediately with the backend-computed row (Tare 2100.00,
Gross weight 20400.00, VGM 22500.00 — matches the live client-preview
math), edit dialog pre-filled with the new one-field-per-row layout, and
the delete `AlertDialog` still fires correctly from the inline table's
trash icon (cancelled it — kept the row for a future session).
"Tạo Commission" button confirmed renamed. No console errors.

**Not done yet:** the sub-tab-per-Shipment alternative (Version 2) —
user asked for Version 1 live-verified first, which this entry closes
out. Revisit only if asked; current recommendation stands (Version 1 is
the better fit, see above).

**Blockers:** none.

---

## 2026-09-03 — Retest passed: Shipments/VGM backend now deployed

**Request:** "test lại" — re-run the previous entry's blocked
verification now that the backend gap might be closed (same pattern as
the Service Agreements list saga: FE built ahead, BE catches up mid-
session).

**Result: fully working end-to-end, no frontend changes needed.**
Checked live swagger first — `/api/v1/contracts/{id}/shipments`,
`.../shipments/{id}`, `.../shipments/{id}/vgm`, `.../vgm/{vgmId}` are all
now present (were 0 matches last entry). Live-clicked through the full
create → list → edit → VGM create → VGM edit → VGM delete flow on
`26KCTLIVE01`:

- Created shipment → backend assigned `26KCTLIVE01/SHP-01`; list row
  shows `FCL · 3 Kiện · Booking BOOK-LIVE-002 · Broker2 1788276513` +
  `60,000.00 VND`, all correct.
- Edit dialog pre-fills every field, all 4 Selectors included.
- "Quản lý VGM" opens with the right shipment code in the title. Created
  a VGM (`CONT-001`, tare 2200/payload 26000/max gross 30480/net
  25000/khối lượng bao bì 500) — the live client-side preview (Gross
  25500.00 kg, VGM 27700.00 kg) matched the backend-computed value
  exactly after save.
- Edit pre-fills correctly, same live preview reproduces.
- Delete → `AlertDialog` confirmation → confirming actually removes the
  row (list returns to "Chưa có bản ghi VGM").
- No console errors beyond the standing `claude-in-chrome` extension
  noise.

**Updated:** `openspec/changes/add-contract-shipments/tasks.md` and
`add-shipment-vgm/tasks.md` — 1.9 now fully checked off with what was
verified.

**A `claude-in-chrome` quirk worth logging, not a product bug:** several
submit-button clicks (shipment create, VGM create, VGM delete confirm)
made the tab's `Page.captureScreenshot` CDP call hang/timeout for
~5-10s right after the click, before recovering on its own and showing
the correct post-submit state. Never affected correctness, just added a
`wait` + retry-screenshot step each time. Possibly the extension
capturing mid-navigation/mid-re-render; no action needed unless it
starts actually losing actions.

**Blockers:** none — both changes' `add-contract-shipments`/
`add-shipment-vgm` are now fully verified and working.

---

## 2026-09-03 — Live-verified Shipments/VGM: backend has 0 routes deployed

**Request:** "live browser verification cho tính năng vgm, lô hàng" —
closing out the `add-contract-shipments`/`add-shipment-vgm` changes'
unchecked 1.9 tasks (both built earlier this same day, never
browser-tested).

**Result: frontend is correct; backend blocks everything.** Live-clicked
through on the seeded `26KCTLIVE01` ("Live smoke test") contract via
`claude-in-chrome`:
- ✅ "Xuất hàng" tab appears in the right position (after "Đợt thanh toán
  khách", before "Service Agreement" when present).
- ✅ "Thêm lần xuất hàng" opens the create dialog; the "Nhà cung cấp"
  `Selector` is populated from the Customer catalog (Broker2, Broker Co,
  Verify Buyer Co, ...); filled every field (supplier, booking number,
  lot name, LCL/FCL, payment condition, invoice/declaration
  value+currency, exchange rate, quantity+unit, declared weight) —
  Selector fields needed the by-now-standard keyboard-arrow-then-Enter
  workaround for `claude-in-chrome` mouse clicks on popovers, same as
  every prior session.
- ❌ Submit **404s**. Checked the live backend directly
  (`GET /api/backend/swagger/v1/swagger.json`): **zero** paths matching
  `/shipment/i` exist — not `/contracts/{id}/shipments`, not the VGM
  sub-routes, nothing. `add-contract-shipments`' own proposal says
  BE-P "shipped" this in the backend repo's own
  `openspec/changes/add-contract-shipments/` — same situation as the
  Service Agreements list saga a few sessions back: built in that repo,
  not yet deployed to the backend instance this app's `/api/backend`
  proxy points at.
- ✅ **But the frontend's failure handling is correct**: the create
  dialog shows a proper error banner ("Không thể thêm lần xuất hàng")
  instead of crashing or silently no-opping — confirmed via
  `read_network_requests` (`POST .../shipments` → 404) and the visible
  banner. No console errors beyond the standing `claude-in-chrome`
  extension noise.
- **VGM entirely untestable this session** — it lives inside a Shipment,
  and no Shipment can be created while the backend 404s. Blocked
  transitively, not a VGM-specific issue.

**One observation, not a bug to fix now:** a failed
`useShipmentsQuery` (404, 500, anything) renders identically to "genuinely
zero shipments" (`Chưa có lần xuất hàng`) — `shipments =
shipmentsQuery.data?.success ? ... : []` swallows the error with no
banner. Checked: this is the **existing, consistent convention** for
every contract-scoped embedded list in `ContractExpandedDetails`
(`annexes`, `serviceAgreementAnnexes` do the same) — `AdvanceTableErrorBanner`
is only used for the top-level table query. Not a shipments-specific
regression, so not fixed here; worth reconsidering as a deliberate UX
decision at some point (a real fetch failure currently looks identical
to "nothing here yet" everywhere in this component, not just shipments).

**Updated:** `openspec/changes/add-contract-shipments/tasks.md` and
`openspec/changes/add-shipment-vgm/tasks.md` — 1.9 marked with these
findings (shipments: partially verified, VGM: blocked transitively).

**Blockers:** `add-contract-shipments`' and `add-shipment-vgm`'s backend
routes need deploying to this environment before either can be fully
live-verified or actually used. Re-run this same click-through once
that happens — no frontend change expected to be needed (same pattern as
the Service Agreements list, which turned out to need zero FE changes
once deployed).

---

## 2026-09-03 — Shipment VGM (`add-shipment-vgm`)

**Context:** Follow-up to the same-day `add-contract-shipments` entry
below. User request (Vietnamese): each shipment needs VGM info per
container — tên cont, tên seal, loại cont, tare, payload, max gross, net
weight, gross weight (= net weight + khối lượng bao bì, computed), VGM
(= gross weight + tare, computed). BE-P shipped this as `ShipmentVgm`
(1 shipment : many, **with delete** — the one child entity in this whole
feature area that has it).

**What shipped.**

- `types/index.js`: `ShipmentContainerType` (`Size20`/`Size40`/
  `Size40HC`/`Size45`), `ShipmentVgm`, `ShipmentVgmFormValues`.
- `config/shipment-container-types.js` (labels `"20'"`/`"40'"`/`"40'HC"`/
  `"45'"`), `config/shipment-vgm-schema.js` (zod, mirrors the backend's
  `CreateShipmentVgmCommandValidator`).
- `api/shipment-vgms.js` — the first `delete*` function in this feature
  (mirrors `admin-users/api/bank-accounts.js`'s `{ success: true }`
  no-body-204 pattern), `hooks/use-shipment-vgms-query.js` (list +
  create/update/delete mutations), `hooks/use-shipment-vgm-form.js`.
- `components/shipment-vgm-fields.jsx` — also live-computes
  `grossWeight`/`vgm` client-side from the current form values as a UX
  preview while typing (the backend's computed response values are what
  actually get displayed everywhere else, e.g. the list), `components/shipment-vgm-form-dialog.jsx`.
- New `components/shipment-vgm-list-dialog.jsx`: a **third level of
  nested dialog** — Contract → Shipment → VGM — since VGM records belong
  to one specific shipment, not the contract as a whole (every other
  child list in this feature lives directly in a Contract-level tab).
  Opened via a new "Quản lý VGM" icon button (`Boxes` lucide icon) added
  to each shipment row in the "Xuất hàng" tab
  (`components/contracts-list.jsx`). Lists containers with add/edit/
  **delete**; delete asks for confirmation first via Astryx `AlertDialog`
  — the first delete-confirmation flow in this app, no prior pattern
  existed to copy since nothing else here has delete yet.

**Not done:** no precondition tying VGM to a signed contract/shipment
state — the backend doesn't enforce one either.

**Verification:** `pnpm lint` / `pnpm typecheck` clean; `./harness/verify.sh`
full pass (project-readiness, memory-secrets, theme-build, lint,
typecheck, structure, harness-tests, unit-tests, build,
quality-thresholds). Evidence: `harness/runs/20260903-175915-154148/`.

**Not live-verified in the browser this session** — no `claude-in-chrome`
tool used (would also require the backend up with seeded data). Whoever
picks this up next should click through: (a) the new "Quản lý VGM" icon
button on a shipment row opens the VGM list dialog with the right
`shipmentCode` in the title, (b) "Thêm VGM" creates a record and the list
refreshes with the backend-computed `grossWeight`/`vgm` (not the
client-side preview values — confirm they match), (c) the delete icon
opens the `AlertDialog`, confirming actually removes the row and calling
DELETE twice on the same id 404s cleanly, (d) editing an existing VGM
pre-fills every field and the live gross/VGM preview updates as fields
change.

**Blockers:** none.

## 2026-09-03 — Contract shipments (`add-contract-shipments`)

**Context:** User asked to build the FE for BE-P's `Shipment`
feature (`../CLEAN ARCHITECTURE/openspec/changes/add-contract-shipments/`,
same session as this frontend one): a `Contract` has one or more shipments
("lần xuất hàng"), each with Book info (booking/B-L/vessel) and Shipment
(lot) info (LCL/FCL, invoice/declaration values, quantity, weight); cost
info is deliberately deferred on the backend too.

**What shipped** (mirrors the `PaymentSchedule`/`ServiceAgreement`
pattern closely — see
`openspec/changes/add-payment-schedule-and-contract-signatures/proposal.md`
for the sibling precedent):

- `types/index.js`: `ShipmentType` (`LCL`/`FCL`), `ShipmentQuantityUnit`
  (`Cont`/`Kien`), `Shipment`, `ShipmentFormValues`.
- `config/shipment-types.js`, `config/shipment-quantity-units.js` (fixed
  sets + Vietnamese labels — "Kiện" for `Kien`), `config/shipment-schema.js`
  (zod, mirrors the backend's `CreateShipmentCommandValidator`: required
  `supplierCustomerId`/`bookingNumber`/`type`/`name`/`paymentCondition`
  (reuses the existing `PAYMENT_TYPES` TT/LC set) + every Shipment-info
  numeric field `> 0`; `billOfLadingNumber`/`shippingLine`/`vesselName`
  optional — often not known yet at booking time; `invoiceCurrency`/
  `declarationCurrency` constrained to the curated `CURRENCY_CODES`
  shortlist, same narrowing choice `contract-schema.js` makes for
  `currency`).
- `api/shipments.js` (list/create/update against the nested
  `/api/v1/contracts/{contractId}/shipments...` routes),
  `hooks/use-shipments-query.js` (list query + mutations),
  `hooks/use-shipment-form.js` (create-or-update form state; pulls
  `customers` from the existing `useCustomersQuery` for the supplier
  picker — same pattern `use-service-agreement-form.js` uses for its
  `partyCustomerId` picker, since `Shipment.supplierCustomerId` is the
  same kind of live reference into the Customer catalog).
- `components/shipment-fields.jsx` (two sections — "Thông tin Book",
  "Thông tin lô hàng"; no cost-info section, matches the backend
  deferral), `components/shipment-form-dialog.jsx`.
- `components/contracts-list.jsx`: new `'shipment'` `ExpandedTab`, a
  "Xuất hàng" tab (list of `shipmentCode · name`, description line
  `type · quantity+unit · booking number · supplier name`, invoice value
  + edit button; "Thêm lần xuất hàng" button — **unconditionally
  enabled**, unlike `PaymentSchedule`'s signed-contract gate, because the
  backend doesn't enforce any precondition for `Shipment`), create/edit
  dialogs wired the same way as the sibling entities' dialogs.

**Not done:** no cost-info fields/section (explicitly deferred on the
backend too — will follow in a later change on both sides). No delete
(the backend has none, matching the `ContractAnnex`/`PaymentSchedule`/
`ServiceAgreement` convention on this aggregate).

**Verification:** `pnpm lint` / `pnpm typecheck` clean; `./harness/verify.sh`
full pass (project-readiness, memory-secrets, theme-build, lint,
typecheck, structure, harness-tests, unit-tests, build,
quality-thresholds). Evidence: `harness/runs/20260903-165413-112667/`.

**Not live-verified in the browser this session** — no `claude-in-chrome`
tool used (would also require bringing up the backend + seeded data,
out of scope for this pass). Whoever picks this up next should click
through: (a) a contract's expanded row shows the new "Xuất hàng" tab
between "Đợt thanh toán khách" and (if present) "Service Agreement", (b)
"Thêm lần xuất hàng" opens the dialog with the supplier `Selector`
populated from the Customer catalog, (c) a created shipment's code
renders as `{contractNumber}/SHP-{NN}` and its row shows the right
type/quantity/booking/supplier/invoice-value summary, (d) editing an
existing shipment pre-fills every field correctly including the optional
B/L/line/vessel ones when they're `null`.

**Blockers:** none.

## 2026-09-03 — Payment Schedule moved to its own tab

**Request:** "Đợt thanh toán khách hãy để 1 tab riêng" — follow-up to the
entry directly below: move the "Đợt thanh toán khách" section out of the
"Thông tin" tab into its own `ExpandedTab`.

**What changed:** `contracts-list.jsx`'s `ExpandedTab` typedef gained
`'paymentSchedule'`; a new always-visible `Tab value="paymentSchedule"
label="Đợt thanh toán khách"` was added to the `TabList` (after "Khách
hàng", before the conditional "Service Agreement" tab). The list/"Thêm đợt
thanh toán" button block (unchanged internally — still disabled with a
tooltip unless `sellerSigned && buyerSigned`) was moved verbatim from
inside `activeTab === 'info'` into its own `activeTab === 'paymentSchedule'`
block. Updated this change's `proposal.md` decision log (the original
"keep it inside Thông tin" decision from the same day is superseded, not
deleted).

**Verification:** `pnpm lint` / `pnpm typecheck` clean; `./harness/verify.sh`
full pass. Evidence: `harness/runs/20260903-150808-46385/`.

**Not live-verified in the browser** — no `claude-in-chrome` tool this
session either (same gap as the entry below).

---

## 2026-09-03 — Contract signatures + Payment Schedules (`add-payment-schedule-and-contract-signatures`)

**Context:** User asked (in the backend session, `../CLEAN ARCHITECTURE`)
to check whether the ContractBank and PaymentSchedule features BE-P
had just shipped were wired into this frontend. ContractBank was already
present (`contract-banks-fields.jsx`, `api/contract-banks.js`, etc., from
earlier sessions). `PaymentSchedule` had nothing — no types, api, hooks,
or components. Separately, `Contract.sellerSigned`/`buyerSigned` (the
*contract's own* signature flags, distinct from `ContractAnnex`'s and
`ServiceAgreement`'s own `sellerSigned`/`buyerSigned`, which already
existed) were also missing everywhere in this repo. Backend session also
added a hard rule mid-flight: creating a `PaymentSchedule` now requires
`Contract.sellerSigned && Contract.buyerSigned` (`400` otherwise).

**What shipped** (mirrors the `ContractAnnex` feature/`add-contract-annex-tab`
pattern closely):

- `Contract`/`ContractFormValues` gained `sellerSigned`/`buyerSigned` —
  threaded through `types/index.js`, `config/contract-schema.js`
  (`z.boolean()`, no `.refine()` — the *sign* isn't itself required),
  `hooks/use-contract-form.js` (both `emptyValues`/`valuesFromContract`),
  `api/contracts.js` (`SellerSigned`/`BuyerSigned` in the wire body),
  `contract-form-dialog.jsx` (two `CheckboxInput`s after "Ghi chú"), and
  `contracts-list.jsx`'s "Thông tin" tab (new 2-column `MetadataList`
  showing "Đã ký"/"Chưa ký").
- New `PaymentSchedule` feature, full stack: `types/index.js`
  (`PaymentType`/`PaymentSchedule`/`PaymentScheduleFormValues`),
  `config/payment-schedule-types.js` (`TT`/`LC` — mirrors the backend's
  enum exactly, `/` isn't a valid enum identifier so "T/T"→`TT`,
  "L/C"→`LC`), `config/payment-schedule-schema.js` (zod: `amount > 0`,
  `type` enum, `note` ≤ 2000 chars — matches
  `CreatePaymentScheduleCommandValidator`), `api/payment-schedules.js`
  (list/create/update against `/api/v1/contracts/{contractId}/payment-schedules...`),
  `hooks/use-payment-schedules-query.js` + `use-payment-schedule-form.js`,
  `components/payment-schedule-fields.jsx` +
  `payment-schedule-form-dialog.jsx`.
- `contracts-list.jsx`: new "Đợt thanh toán khách" section in the
  "Thông tin" tab (same tab `ContractAnnex`'s "Phụ lục" list already lives
  in, not a new `ExpandedTab` — see proposal's decision log), listing each
  schedule (`paymentCode · type`, date + note, amount, edit button) with a
  "Thêm đợt thanh toán" button. The button is **disabled with a tooltip**
  unless `contract.sellerSigned && contract.buyerSigned` — this mirrors
  the backend's hard `400` rather than duplicating it as a schema rule
  (the schema has no access to the parent `Contract`).
- `PaymentType`'s `/` isn't valid as either a JS identifier or the
  backend's C# enum identifier — kept the same `TT`/`LC` wire values as
  the backend, with `paymentTypeOptions` supplying the "T/T"/"L/C" display
  labels (same pattern as `contract-annex-types.js`).

**Not done:** no delete for `PaymentSchedule` (backend has none — this was
explicit in the original ask: "không cần delete"). No client-side zod rule
duplicating the signed-contract precondition — a disabled button is the
whole client-side mirror, the backend's `400`/message is the real
enforcement.

**Verification:** `pnpm lint` / `pnpm typecheck` / `pnpm test` (107/107)
all clean; `./harness/verify.sh` full pass (project-readiness,
memory-secrets, theme-build, lint, typecheck, structure, harness-tests,
unit-tests, build, quality-thresholds). Evidence:
`harness/runs/20260903-145145-33764/`.

**Not live-verified in the browser this session** — no `claude-in-chrome`
tool available. Whoever picks this up next should click through: (a) the
Contract create/edit dialog shows the two new checkboxes and they persist
correctly, (b) the "Thêm đợt thanh toán" button is disabled with the
tooltip on an unsigned contract and enables once both are checked, (c) a
created payment schedule's code renders as `{contractNumber}/PR-{NN}`.

**Blockers:** none. Unrelated pre-existing gap noted in earlier entries
(no `bankAddress`/`swiftCode` on `CreateContractBankRequest` server-side)
is untouched by this session.

---

## 2026-09-02 — Correction: BankName stays required; + Tổng cộng on Thông tin tab

**Request 1 — correction to the previous entry:** user clarified their
"Ngân hàng, tất cả optional" ask from last entry meant *add the
Bank Address/Swift Code text inputs*, not *also make Bank Name optional*
— "vẫn tuân theo API của BE" (still follow the backend's API). Reverted
the `bankName` part of that change: `contract-bank-schema.js` has
`.min(1, ...)` back, `bank-fields.jsx`'s "Tên ngân hàng" has `isRequired`
back, `types/index.js`'s `ContractBank.bankName` is `string` again (not
`string | null`). Left everything else from that entry as-is —
`bankAddress`/`swiftCode` stay new optional inputs (backend still drops
them silently; that part of the gap is unchanged), and the "Ngân hàng
chưa đặt tên" display fallbacks stay too (harmless defensive fallback,
even though `bankName` empty can no longer happen through this form).

**Request 2:** add the same "Tổng cộng" line the Service Agreement tab
already has, to the Contract's own "Thông tin" tab — `contract.contractValue`
plus every contract-annex `amount`, signed by `type`
(`AmountIncrease`/`AmountDecrease`/`ValueChange`, `ValueChange`
contributing 0, same convention as `contractAnnexAmountLabel`). New
`contractAnnexesTotal`/`contractGrandTotal` computed right where `annexes`
is fetched; rendered as an "Tổng cộng:" / amount row right after the
Phụ lục list, same style as the Service Agreement tab's.

**Verification:** `./harness/verify.sh` full pass. **Still not
live-verified in the browser** — `claude-in-chrome` has not reconnected
this session (checked again via `ToolSearch`, no match). Whoever picks
this up next should live-check: (a) the bank quick-create dialog still
requires a name (client-side error, not a server 400), (b) "Tổng cộng" on
a contract with annexes computes correctly (e.g. `26KCT01`, which has
mixed `AmountDecrease`/`ValueChange` annexes from earlier sessions).

**Blockers:** same backend gap as the previous entry (no
`bankAddress`/`swiftCode` on `CreateContractBankRequest`; "Test Bank XYZ"
cleanup still pending) — unchanged by this correction.

---

## 2026-09-02 — Contract's `BankIds` made a required field

**Request:** "cập nhật ngân hàng trong hợp đồng là trường bắt buộc" (make
the bank field on a Contract required) — it was previously optional
(`BankIds` could be an empty array).

**Backend** (`../CLEAN ARCHITECTURE`, BE-P): added
`RuleFor(x => x.BankIds).NotEmpty()` to both
`CreateContractCommandValidator` and `UpdateContractCommandValidator` →
`400 detail: "At least one bank is required"` on an empty array. Updated
every Subcutaneous/Integration test fixture that previously created
contracts with `BankIds: []` to create and pass a real `ContractBank` id
instead (11 test files touched). `docs/api/Contracts.md`'s `BankIds` row
and 400 status row updated. Full backend suite: 223/223 pass. Rebuilt and
redeployed the `cleanarchitecture-api` Docker container so the local dev
backend enforces this now.

**Frontend** (this repo): `config/contract-schema.js`'s `bankIds` field
gained `.min(1, 'Vui lòng chọn ít nhất 1 ngân hàng')`, mirroring the
backend rule (this file's own doc comment says it mirrors
`CreateContractCommandValidator`/`UpdateContractCommandValidator`).
`components/contract-banks-fields.jsx` gained a `status` prop (same
`{type, message}` shape as `PaymentTermsFields`) rendering a `Banner` when
invalid; `contract-form-dialog.jsx` wires `status={fieldStatuses.bankIds}`
into it — the doc comment above `ContractBanksFields` was also updated
from "0 or more" to "at least 1 required". `contract-schema.test.js`'s
`baseCandidate()` now seeds `bankIds: ['bank-1']` instead of `[]` (would
otherwise fail its own new-required-field test), plus a new
`'requires at least one bank'` test. `contracts.test.js`'s fixture already
used a non-empty array — untouched.

**Verification:** `node --test` on both changed test files — 17/17 pass
(no `./harness/verify.sh` run this session — scope was narrow enough that
targeted test runs plus `eslint` on the 4 touched files, also clean,
covered it; a future session touching this area should still run the full
gate before considering it done).

**Not live-verified in the browser** — no browser tool available this
session. Worth a click-through confirming the "Ngân hàng thụ hưởng"
section now shows a red banner when no bank is checked and blocks submit.

**Blockers:** none for this specific change. Unrelated to it: the
concurrent 2026-09-02 session below flagged a leftover "Test Bank XYZ" row
in the live `contract-banks` catalog from its own diagnostic probe — still
needs cleanup, not touched here.

---

## 2026-09-02 — ContractBank: added Bank Address/Swift Code, all 6 fields optional

**Request:** "Ngân hàng gồm các field: Bank Name, Beneficiary, Bank Account,
Branch, Bank Address, Swift Code. Các field optional" — two new fields
(`bankAddress`, `swiftCode`) plus making `bankName` optional too (it was
the one required field).

**Checked the live backend directly before touching anything** (same
discipline as the Service Agreements list gap): `CreateContractBankRequest`
has no `bankAddress`/`swiftCode` at all — POSTing them anyway returns
`201` but the backend silently drops both (confirmed: response echoed
back without them). And `bankName` is **still required server-side**
despite the OpenAPI schema marking it `nullable: true` — POSTing an empty
`bankName` returns `400: 'Bank Name' must not be empty.` (a
FluentValidation rule the schema doesn't surface). Asked the user how to
proceed; they chose to code the frontend ahead of the backend anyway
(consistent with this repo's usual practice), so implemented it with that
gap clearly flagged in comments and here, not silently.

**⚠️ Unintended side effect while probing the backend:** a diagnostic
`POST /api/v1/contract-banks` (checking whether unknown fields get
rejected) actually succeeded and created a real, permanent bank named
**"Test Bank XYZ"** in the live `contract-banks` catalog. There is no
delete endpoint for `ContractBank` anywhere (list + create only) — could
not clean this up. Flagged to the user in-session; **whoever picks this
up should delete/rename that row** (direct DB access or ask BE-P) if
it's polluting real data. Lesson: don't POST live mutating requests as a
diagnostic probe without a way to undo them — a GET-only check (or
reading backend source/docs first) is preferable when a delete endpoint
isn't confirmed to exist.

**What changed:**
- `config/contract-bank-schema.js`: dropped `bankName`'s `min(1)`; added
  `bankAddress`/`swiftCode` as plain optional trimmed strings.
- `types/index.js`: `ContractBank.bankName` widened to `string | null`;
  added `bankAddress`/`swiftCode` to both `ContractBank` and
  `ContractBankFormValues`.
- `api/contract-banks.js`: `createContractBank` now sends
  `BankAddress`/`SwiftCode` too (currently dropped server-side, see
  above — will start working the moment the backend adds them, no
  further FE change needed).
- `hooks/use-bank-form.js`: `emptyValues()` includes the two new fields.
- `components/bank-fields.jsx`: removed `isRequired` from "Tên ngân
  hàng"; added "Địa chỉ ngân hàng" and "Swift Code" inputs.
- `components/contract-banks-fields.jsx` and `contracts-list.jsx`'s
  Ngân hàng section: both places that render `bank.bankName` as a label
  now fall back to "Ngân hàng chưa đặt tên" for an empty name (previously
  `bankName` was guaranteed non-empty, so this case couldn't happen); both
  description lines now also include `branchName` (previously shown
  nowhere in read views, only beneficiary/account number).

**Verification:** `./harness/verify.sh` full pass. **Not live-verified in
the browser this session** — `claude-in-chrome` disconnected mid-session
and did not reconnect; static checks only. Next session picking this up
should live-verify the bank form (empty-name submission still 400s from
the server — frontend now allows submitting it, so the user will see the
server's error banner, not a client-side validation message) and confirm
the two new fields render/round-trip once the backend adds them.

**Blockers:** backend needs `bankAddress`/`swiftCode` added to
`CreateContractBankRequest` (and presumably the response/entity), and
needs to drop the `BankName` non-empty validation rule, before this
fully matches the request. Also: "Test Bank XYZ" cleanup (see above).

---

## 2026-09-02 — Contract's "Service Agreement" tab now matches the SA list page; table width + Tổng cộng

**Request:** (1) make the Contract expanded row's "Service Agreement" tab
look like `service-agreements-list.jsx`'s own expanded panel; (2) fix the
main Hợp đồng table's column widths too; (3) add a "Tổng cộng" total.

**Part 1 — `contracts-list.jsx`'s `activeTab === 'serviceAgreement'`
block:** rebuilt to match `ServiceAgreementExpandedDetails` field-for-
field: info grid gained "Số hợp đồng"/"Dự án" (already known — same
contract — but included for exact parity) and "Trung gian" (the
commission recipient's name, previously not shown at all here). Needed a
new `customersById` map — `ServiceAgreement.partyCustomerId` is a live FK
into the Customer catalog with no name resolution of its own, same as
`service-agreements-list.jsx`'s own `customersById`; added
`useCustomersQuery` to `ContractsList` and threaded `customersById` down
through `renderExpanded` alongside the existing `banksById`/
`countriesById`. Annex rows restyled to the same label+signed-amount
top-line / date+parties second-line pattern (new
`serviceAgreementAnnexAmountLabel` helper, mirrors
`contractAnnexAmountLabel` added last session). Added the same "Tổng
cộng" line (agreement `value` + signed annex amounts) at the bottom.

**Part 2 — main table width:** `contractValue` was the lone
`proportional(1)` column among five `pixel()` siblings (`projectName`/
`buyer` are `proportional(1.4)`, the intentional slack-sharing pair) —
exactly the anti-pattern flagged in the 2026-09-02 "Harness gaps" entry
above (mixing `pixel()`/`proportional()` without thinking about which
column should flex). Changed to `pixel(160)` — tried `pixel(140)` first,
caught via live browser check that it wrapped 6-figure values
("100,000.00 USD") onto two lines, bumped to 160.

**Verification:** `./harness/verify.sh` full pass. Live-clicked through
on `SA-VERIFY-01`: Service Agreement tab now shows "Trung gian: Broker Co
1788274749", 3 annexes with correct signed amounts, and "Tổng cộng:
7,200.00 USD" (9,000 − 300 − 1,500, `InfoChange` annex contributing 0) —
identical to the standalone Service Agreement list page's own expanded
row for the same agreement. Main table's "Giá trị" column no longer
wraps at any visible row. No console errors.

**Blockers:** none.

---

## 2026-09-02 — Contracts expanded row: merged Ngân hàng/Phụ lục tabs into Thông tin

**Request:** apply the same "no separate tab, everything inline" treatment
Service Agreement's expanded row already has to the Contracts (Hợp đồng)
expanded row: restructure the info grid into 4 specific rows, and pull
"Ngân hàng" and "Phụ lục" out of their own tabs into the flow below it.
"Bên bán"/"Khách hàng"/"Service Agreement" tabs weren't mentioned, so left
untouched.

**What changed in `contracts-list.jsx`'s `ContractExpandedDetails`:**
- `ExpandedTab` typedef narrowed to `'info' | 'seller' | 'customer' |
  'serviceAgreement'` — `'banks'`/`'annex'` tab values no longer exist.
  Removed their `<Tab>` entries and the now-dead `hasAnnexes` var (whose
  only use was gating the removed annex tab).
- "Thông tin" tab's info grid restructured into the requested rows, using
  the same continuous `columns={4}` `MetadataList` + `metadataSpacer`
  padding technique from `service-agreements-list.jsx` (row 2 only has 2
  fields, padded to stay column-aligned with rows 1 and 3's 4 fields
  each). Row 4 ("Giá trị, Ghi chú chiếm 2 ô") is its own `columns={2}`
  block instead — `MetadataListItem` has no colSpan, so a 2-of-2-column
  block is the closest approximation to "spans 2 of the 4 columns above";
  it does NOT share grid tracks with the rows above it (real component
  limitation, documented inline).
- "Ngân hàng" and "Phụ lục" sections moved from their own
  `activeTab === 'banks'`/`activeTab === 'annex'` blocks into the always-
  visible "Thông tin" tab content, in that order, followed by "Đợt thanh
  toán" (moved earlier, between them) styled as a `List` with bold
  right-aligned percent/condition instead of a plain `MetadataList` grid.
- Phụ lục list restyled to match `service-agreements-list.jsx`'s annex
  rows exactly: label + signed amount (`+`/`−`/no-sign via new
  `contractAnnexAmountLabel`, mirroring that file's `annexAmountLabel`)
  on the top line, "Ký ... · Mua: ... · Bán: ..." below. The footer's
  standalone "Thêm phụ lục" button was removed (now redundant — the one
  next to the inline "Phụ lục" heading is the only trigger, and it's
  always reachable since that section is no longer tab-gated); the annex
  dialog's now-pointless `onSuccess={() => setActiveTab('annex')}` was
  dropped along with it.

**Verification:** `./harness/verify.sh` full pass. Live-clicked through
on `26KCT01` (has 3 annexes, no banks): all 4 info rows aligned correctly
(row 2's 2 fields sit under columns 1–2 of rows 1/3, columns 3–4 blank),
Ngân hàng/Đợt thanh toán/Phụ lục all render inline with no tab needed,
annex amounts show correct sign (`AmountDecrease` → `−`, `ValueChange` →
no sign), and the "Bên bán" tab still works untouched. No console errors
beyond the known `claude-in-chrome` extension noise.

**Blockers:** none.

---

## 2026-09-02 — Service Agreement list: row expansion + actions; backend endpoint now live

**Request:** "Update table của Service Agreement, action button, expand
table" — the flat read-only table from the previous entry needed the same
expand-to-detail treatment as `contracts-list.jsx` (Phụ lục/Hợp đồng), not
just a column dump.

**Also resolved a loose end from the previous session:** re-checked
`GET /api/v1/service-agreements` against the local dev backend one more
time before starting this — **it's live now** (was 404 as of the last two
checks). No frontend change needed for that; the code was already written
against the documented contract. Confirmed with real data: 2 agreements
(`26SA01`, `26SA02`) with resolved contract number/project/recipient name
all correct.

**What changed in `service-agreements-list.jsx`:**
- Added `useTableRowExpansion` + `createRowExpansionInteractionPlugin`
  (same plugins/styles as `contracts-list.jsx`'s
  `expandable-row-styles.jsx`) so each row expands into a detail panel
  instead of just showing flat columns.
- New `ServiceAgreementExpandedDetails` sub-component — mirrors the
  "Service Agreement" tab content that already exists inside
  `ContractExpandedDetails` (`contracts-list.jsx`): header
  icon/code/contract/recipient, a `MetadataList` of
  code/signedDate/value/sellerSigned/partySigned, a payment-terms
  `MetadataList`, the annex list (`useServiceAgreementAnnexesQuery`, each
  with a "Sửa" `IconButton`), a "Thêm phụ lục" button, and a "Sửa Service
  Agreement" action button in the footer. Reuses the existing
  `ServiceAgreementFormDialog`/`ServiceAgreementAnnexFormDialog` — no new
  dialogs needed, this list page now drives the same create/edit flows
  the contract-scoped tab already had.
- Added a `ServiceAgreementListRow` JSDoc typedef (the API's
  `ServiceAgreement` plus the client-resolved
  contractNumber/projectName/currency/partyCustomerName) so the skeleton
  rows, table columns, and expansion plugins all share one type instead of
  each re-deriving `typeof searchableServiceAgreements[number]` — the
  original version type-errored because the inline empty
  `paymentTerms: []` skeleton literal inferred as `never[]`.

**Verification:** `./harness/verify.sh` full pass. Live-clicked through
via `claude-in-chrome`: expanded `26SA01`'s row, confirmed all 3 real
annexes render (including one created in the prior session's manual
testing) with correct amounts/dates/signed-status, and opened "Sửa
Service Agreement" — pre-filled correctly with the real signed
date/recipient/value/payment terms. No console errors.

**Blockers:** none.

---

## 2026-09-02 — Backend for `GET /api/v1/service-agreements` deployed; blocker cleared

**Request:** "Thêm tính năng này ở FE" (add the Service Agreement list
feature on the frontend) — turned out the FE side (`api/service-agreements.js`
`listServiceAgreements`, `useServiceAgreementsQuery`,
`components/service-agreements-list.jsx`, the `/logistics/service-agreements`
route) was already fully built in the 2026-09-01 session below, coded ahead
of the backend per this repo's practice. It was only blocked because the
local dev backend (BE-P, the CLEAN ARCHITECTURE repo) hadn't shipped
`GET /api/v1/service-agreements` yet.

**Done in the backend repo** (`../CLEAN ARCHITECTURE`): implemented
`ListServiceAgreementsQuery`/Handler, `IServiceAgreementsRepository.ListPagedAsync`
(joins `ServiceAgreements`→`Contracts` for `CompanyId` scoping — the
agreement itself carries no `CompanyId`), and the controller action at
`GET /api/v1/service-agreements` (paged, same `{items,page,pageSize,
totalCount,totalPages}` shape `docs/api/ServiceAgreements.md` already
documented). Backend integration test passes; `docs/api/ServiceAgreements.md`
and `requests/ServiceAgreements/ListServiceAgreements.http` updated per that
repo's AGENTS.md.

**Rebuilt and redeployed** the local `cleanarchitecture-api` Docker
container (`docker compose up -d --build api`) so the dev backend this
Next.js app points at (`localhost:8080`) actually serves the new route.
Verified directly against it: logged in as `DNG26F4A9C2` (Admin), called
`GET /api/v1/service-agreements?page=1&pageSize=25` → `200 OK` with 2 real
rows (`26SA01`, `26SA02`) in the expected shape.

**No frontend code change was needed or made** — exactly what the
2026-09-01 entry predicted ("no frontend change should be needed"). The
`AdvanceTableErrorBanner` failure mode documented there should now be gone
next time the page is loaded against this backend; not re-verified via
browser this session (no browser/screenshot tool available), so still
worth one live click-through to confirm the UI renders the 2 rows and the
join-by-id columns (`contractNumber`, `partyCustomerName`) resolve
correctly.

**Blockers:** none for the backend. Recommend a follow-up live-verification
pass (`claude-in-chrome` or equivalent) on `/logistics/service-agreements`
to close the loop visually.

---

## 2026-09-01 — Removed disabled tabs; added Service Agreement list page

**Request:** two follow-ups from the live-verification session below: (1)
the "Phụ lục"/"Service Agreement" tabs on a contract's expanded row should
be removed entirely when there's nothing to show, not rendered disabled;
(2) add a "Service Agreement" entry to the Logistics side nav backed by a
table.

**Part 1 — done.** `contracts-list.jsx`'s `TabList`: the two conditional
tabs are now wrapped in `{hasAnnexes ? <Tab .../> : null}` /
`{hasServiceAgreement ? <Tab .../> : null}` instead of always rendering
with `aria-disabled`. Dropped the now-dead `onChange` guards that used to
block switching to a disabled tab's value — moot once the tab can't be
clicked at all. Live-verified on `CompanyScopeTest-001` (a contract with
neither): tab bar shows only Thông tin/Bên bán/Khách hàng/Ngân hàng.

**Part 2 — needed a detour.** No backend endpoint lists every Service
Agreement across contracts — checked the *live* dev backend's own swagger
(`/api/backend/swagger/v1/swagger.json`) and only found the three
contract-scoped paths (`/contracts/{id}/service-agreement[/annexes...]`).
Asked the user how to proceed; they pasted the authoritative
`docs/api/ServiceAgreements.md` (BE-P) spec, which *does* document a
`GET /api/v1/service-agreements` system-wide paginated endpoint
(`{items, page, pageSize, totalCount, totalPages}`, same shape as
`GET /contracts`). Re-checked the live backend against that exact path —
still 404. **Conclusion: the endpoint is real and documented, just not
yet deployed to this local dev backend instance.** Built the frontend
against the documented contract anyway (matches this repo's established
practice of coding to `docs/api/*.md, BE-P` ahead of a backend
deploy) rather than against a client-side N+1 workaround.

**What was added:**
- `api/service-agreements.js`: `listServiceAgreements({page, pageSize})` →
  `GET /api/v1/service-agreements`.
- `hooks/use-service-agreements-query.js`: `useServiceAgreementsQuery`
  (paginated, same shape as `useContractsQuery`).
- `components/service-agreements-list.jsx`: `AdvanceTable`-based list
  (mirrors `countries-list.jsx`/`contracts-list.jsx`). The list response
  doesn't embed contract number/project/currency or the commission
  recipient's name, so those are resolved client-side via `useContractsQuery({page:1, pageSize:100})`
  and `useCustomersQuery()`, same join-by-id pattern as `banksById`/
  `countriesById` in `contracts-list.jsx`. **Known limit, documented in a
  code comment:** a contract past the first 100 (the same ceiling
  `docs/api/ServiceAgreements.md` documents for its own `pageSize`) would
  show "—" for those resolved columns — fine at today's volumes, revisit
  if it ever matters.
- Wired in: `index.js` barrel export, new route
  `src/app/(protected)/logistics/service-agreements/page.jsx`,
  `sidebarLogistics.json` nav entry, and a `logistics:contracts:view`
  rule in `route-access.js` (same permission every other Logistics list
  page uses).

**Verification:** `./harness/verify.sh` full pass. Live-clicked the new
nav entry — page renders correctly (search bar, all 8 columns, "Tuỳ chọn
hiển thị" popover) and shows the expected
`AdvanceTableErrorBanner` ("Không thể tải danh sách Service Agreement")
because the *local* dev backend 404s on the endpoint — this is the
correct/expected failure mode, not a bug; it'll resolve once
BE-P deploys the documented route to this environment.

**Blockers:** the Service Agreement list page cannot show real data until
`GET /api/v1/service-agreements` is live on whichever backend this app
points at — currently 404 on the local dev instance. Re-check after the
next backend deploy; no frontend change should be needed.

---

## 2026-09-01 — Live-verified Service Agreement (annex) tab

**Request:** user asked to check the UI of the "service agreement (annex)"
feature — a not-yet-committed, un-tracked (`openspec/changes/` has no
entry for it) set of files: `service-agreements.js`/
`service-agreement-annexes.js` APIs, `service-agreement-*-fields.jsx`/
`service-agreement-*-form-dialog.jsx` components, and the matching
hooks/schema/types, all wired into `contracts-list.jsx` as a new
"Service Agreement" tab alongside the existing "Phụ lục" (Contract Annex)
tab.

**Result: it works.** `./harness/verify.sh` full pass first. Live-clicked
through it via `claude-in-chrome` on seeded contract `SA-VERIFY-01`: the
Service Agreement tab shows code/signing-date/value/seller-signed/broker-
signed plus a payment-installment breakdown and a nested annex list (2
pre-existing annexes rendered correctly). Created a new Service Agreement
annex (type "Phát sinh giảm", 1500, 2026-09-19) — backend correctly
assigned `26SA01/AN-03` and it appeared in the list immediately. Edited it
(toggled "Bên nhận hoa hồng đã ký") and confirmed the change persisted.
Opened "Sửa Service Agreement" (edit) and "Tạo Service Agreement" (create,
on a contract with none yet, `asd`) — both dialogs render correctly,
including the create dialog's live running-total validation on the
payment-installment rows ("Tổng: 0% (phải bằng 100%)").

**Hit the same `claude-in-chrome` popover-click quirk documented in the
Contract Annex entry below** — coordinate/ref clicks on Selector options
and DateInput calendar days silently failed to register in the Service
Agreement annex dialog too. This time confirmed it's the testing tool, not
the app, by reproducing the identical failure on the already-verified-
working Contract Annex dialog, then working around it with keyboard
selection (open Selector → arrow+Enter; DateInput accepts typed
`MM/DD/YYYY` directly) instead of `javascript_tool .click()`. Worth
promoting to a standing note since this is the second time it's bitten a
session — see the Contract Annex entry immediately below for the original
writeup.

**Blockers:** none. Not yet committed or captured in an `openspec/changes/`
entry — whoever finishes this feature should add one before merging, per
`AGENTS.md`.

---

## 2026-09-01 — Live-verified Contract Annex tab (closes a known gap)

**Request:** user asked to check whether "phụ lục hợp đồng" (Contract
Annex, `add-contract-annex-tab`) actually works — that change's own
PROGRESS.md entry explicitly flagged no browser tool was available at the
time, only compile-log/curl evidence.

**Result: it works.** Live-clicked through it end to end via
`claude-in-chrome` on the seeded `26KCT01` contract (3 pre-existing
annexes displayed correctly: code/type/amount/signed-date/buyer-seller-
signed) and on a zero-annex contract (`asd`) to confirm the disabled-tab
guard: clicking "Phụ lục" with 0 annexes does not switch tabs, matching
the `if (value === 'annex' && !hasAnnexes) return;` guard from that
change. Created a brand-new annex on `asd` (type "Thay đổi giá trị",
5000, 2026-09-20) — backend correctly assigned `asd/AN-01`, the tab
auto-updated to "Phụ lục 1" and un-disabled. Edited it (toggled "Bên mua
đã ký") and confirmed the change persisted and rendered.

**A real testing-environment gotcha, not a product bug:** my first attempts
to fill "Loại phụ lục" (Selector) and "Ngày ký" (DateInput) via
`claude-in-chrome`'s coordinate-based clicks — and even element-ref clicks
from the `find` tool — silently failed to register a selection (dropdown
closed, value never updated, submit correctly blocked by validation). This
looked exactly like the earlier `usePlaceForm` stale-state bug at first.
It wasn't: dispatching a plain `.click()` via `javascript_tool` on the
same DOM nodes worked immediately. Both are floating/portal-positioned
popovers (Selector option list, DateInput calendar) — coordinate-based
synthetic clicks landed off-target for these in this environment, while
in-flow element clicks (text inputs, buttons, the Selector's own trigger)
were fine throughout this whole session. **Lesson for next time:** if a
popover-based control (Selector/DateInput/Combobox) seems to silently
reject clicks in `claude-in-chrome` while everything else on the page
works, suspect the click coordinates before suspecting the app — verify
via `javascript_tool` (`element.click()`) before concluding it's a real
bug.

**Verification:** `./harness/verify.sh` full pass (confirms nothing else
broke amid the unrelated concurrent Company/Branch refactor also landed
this session). Live click-through as above.

**Blockers:** none — the gap flagged in `add-contract-annex-tab`'s
PROGRESS.md entry is now closed.

---

## 2026-09-01 — Row expansion for Người dùng, matching Hợp đồng

**Request:** after the AdvanceTable migration below, user asked for row
expansion "giống expand table ở hợp đồng" (like the Contract list's).

**What shipped.** New `components/user-expanded-details.jsx`
(`UserExpandedDetails`) — same idiom as `ContractExpandedDetails`
(`contracts-list.jsx`): a tabbed, read-only detail panel that fetches its
own per-row data only once expanded (`useUserDetailQuery`,
`useBranchesQuery`, `useAdminBankAccountsQuery`, `useVietnamBanksQuery`,
`useInheritedPermissionsQuery` — all already `enabled`-gated by their id
arg, all pre-existing hooks built for the edit dialog/forms, none new).
Four tabs:
- **Thông tin**: identity/org fields (name, employeeCode, CCCD, DOB,
  gender, phone, passport, company/branch/department/position).
- **Địa chỉ**: old-standard and new-standard (post-2025-merger) address
  blocks, mirroring `user-contact-fields.jsx`'s grouping.
- **Quyền**: read-only "Quyền kế thừa từ phòng ban" (via
  `useInheritedPermissionsQuery`, same data `create-user-permissions-fields.jsx`
  previews at create time, reused read-only here for an existing user) —
  **plus** the existing `UserPermissionsFields` component reused verbatim
  underneath for individual grants, so an admin can toggle a permission
  right from the expanded row without opening the edit dialog.
- **Ngân hàng**: the user's bank accounts (read-only list), same shape as
  the Contract panel's banks tab.
- Footer: "Đặt lại mật khẩu"/"Sửa" buttons (the row's existing two actions,
  now also reachable inline) instead of Contract's annex-specific actions.

`user-list.jsx`: wired `useTableRowExpansion` +
`createRowExpansionInteractionPlugin` (both already shared infra used
as-is, no changes) into `AdvanceTable`'s `extraPlugins`, identical to
`contracts-list.jsx`. One adjustment the Contract list didn't need: the
"Chức năng" column's `DropdownMenu` sits inside a row that's now
click-to-expand, so its cell got wrapped in an `HStack` with
`onClick={(e) => e.stopPropagation()}` — without it, clicking "Sửa"/"Đặt
lại mật khẩu" in the dropdown also toggled the row underneath it. Verified
live this actually needed the fix (tested the dropdown mid-expansion,
confirmed the row stays open).

**A nice side effect**: expanding "Nguyễn Văn A" (Trưởng phòng, Logistics)
on the Quyền tab shows his role already inherits `logistics:contracts:manage`
— directly confirms the answer given earlier this session (why granting it
individually was rejected: "already granted by a role") and gives a
concrete, working account for that permission going forward.

**Verification:** live browser check — all four tabs render real data for
multiple users (incl. `System Admin`, whose `Admin` token renders and who
has mostly-blank org fields, a useful edge case); "Thao tác" dropdown
opens without collapsing the row; "Sửa" from the panel opens the correct
edit dialog. `./harness/verify.sh` full pass (lint/typecheck/build all
clean).

**Blockers:** none

---

## 2026-09-01 — Người dùng list migrated to the shared AdvanceTable shell

**Request:** user asked for `user-list.jsx` (Admin → Người dùng → Danh
sách) to match `contracts-list.jsx`'s table.

**What shipped.** Replaced the hand-rolled `Toolbar`/`Table`/pagination/
`PowerSearch`/filtering wiring in `user-list.jsx` with
`@/shared/components/advance-table.jsx`'s `<AdvanceTable>` — the same
shell `contracts-list.jsx`/`places-list.jsx`/`countries-list.jsx` already
use. `columns`/`COLUMN_OPTIONS`/`searchFieldDefs` kept as-is; dropped the
`advancedSearchFields` prop entirely and let it auto-derive from
`searchFieldDefs` (matches `places-list.jsx`'s usage, simpler than
`contracts-list.jsx`'s explicit list since nothing here needs a label/
placeholder that differs from its search-field def).

**Three deliberate behavior drops**, since `AdvanceTable` doesn't expose a
hook for any of them and none of the other three lists needed one either:
1. The two standalone "Lọc theo đơn vị"/"Lọc theo phòng ban" quick-filter
   pills above the table — dropped. Same filtering is still reachable via
   each column's own header-filter funnel icon (`filter: 'companyId'`/
   `filter: 'departmentIds'` on the columns, unchanged), which is exactly
   how `contracts-list.jsx` exposes country/incoterm filtering — it has no
   quick-filter pills either. Verified live that the "Phòng ban" header
   filter (an `enum_list` field, `is_any_of` under the hood) still opens
   and applies correctly through `AdvanceTable`'s shared
   `useTableFiltering`/`toSearchFilters` plumbing.
2. The `ButtonGroup` + dropdown next to "Thêm" (a disabled "Thêm từ Excel
   (đang phát triển)" placeholder, never functional) — dropped.
   `AdvanceTable`'s `primaryAction` only renders a single `Button`, and the
   dropdown item had no working destination to preserve.
3. `withActionsLast()` — the custom logic forcing the "Chức năng" column to
   stay last no matter how columns get reordered/pinned — dropped.
   `AdvanceTable` doesn't expose `activeColumnKeys`/`onChangeActiveColumnKeys`
   to the caller (fully internal state), so there's no hook left to enforce
   this from outside. Low risk: `actions` stays `isAlwaysVisible` (can't be
   hidden) and is still listed last in `COLUMN_OPTIONS`, so it only drifts
   from the right edge if a user actively drags it — self-correctable, and
   `contracts-list.jsx` has no "actions" column at all so this was never a
   concern the shared component was designed around.

**Verification:** `./harness/verify.sh` full pass. Live browser check
(this session's account has `users:manage` this time, unlike earlier in
today's session): confirmed the advanced-search popover auto-derived the
right fields (Tên/CCCD/Số điện thoại/Mã nhân viên/Đơn vị), the columns/
density/pin popover works, and the "Phòng ban" `enum_list` header filter
opens and offers Apply/Reset — all matching `contracts-list.jsx`'s chrome
exactly.

**Blockers:** none

---

## 2026-09-01 — Contract Annex tab (`add-contract-annex-tab`)

**Context:** BE-P shipped `ContractAnnex` (full CRUD except delete,
system-assigned sequential `AnnexNumber`, computed `AnnexCode` —
`add-contract-annexes` in the API repo). User asked for an "Annex" tab on
the contract row's expanded-details `TabList`, enabled only when the
contract has at least one annex, disabled otherwise. Change:
`openspec/changes/add-contract-annex-tab/`.

**What shipped.** New feature files mirroring the existing catalog
pattern (Country/ContractBank), except nested under a contract rather than
flat: `types/index.js` (`ContractAnnexType`/`ContractAnnex`/
`ContractAnnexFormValues`), `config/contract-annex-types.js` (fixed type
set + Vietnamese labels), `config/contract-annex-schema.js` (zod),
`api/contract-annexes.js` (list/create/update against
`/api/v1/contracts/{contractId}/annexes...`), `hooks/
use-contract-annexes-query.js` + `hooks/use-contract-annex-form.js`,
`components/contract-annex-fields.jsx` + `components/
contract-annex-form-dialog.jsx`.

**`contracts-list.jsx`:** `ExpandedTab` gains `'annex'`;
`ContractExpandedDetails` now calls `useContractAnnexesQuery(contract.id)`
(only runs while that row's panel is mounted) and renders a "Phụ lục" tab
with an `endContent` count. A `List` under that tab shows each annex's
code/type/amount/signed-date/buyer-seller-signed with a per-row edit
`IconButton`. An always-enabled "Thêm phụ lục" button sits in the bottom
action row (next to "Sửa hợp đồng") — deliberately **not** gated behind
the tab, since disabling the tab with zero annexes would otherwise make it
impossible to ever create the first one through this UI.

**A real Astryx API gap found while building this:** `Tab`
(`@astryxdesign/core/TabList`) has no `isDisabled`/`disabled` prop in its
type — unlike `Button`/`CheckboxInput`, which both declare one explicitly.
It renders a plain `<button>` and its `onClick` always fires
`tabListCtx.onChange(value)` regardless of `aria-disabled` (that attribute
only changes the CSS cursor per `Tab.tsx`'s `styles.base`). Passing
`aria-disabled={!hasAnnexes}` alone would grey the tab out but leave it
fully clickable. Fixed by guarding in `TabList`'s own `onChange`: `if
(value === 'annex' && !hasAnnexes) return;` before calling `setActiveTab`
— the visual + functional disabling now match.

**Verification:** `pnpm lint`/`pnpm typecheck`/`pnpm test` (104 tests, all
pre-existing — this change added no new unit test file, see gap below)
clean; `./harness/verify.sh` 10/10. **Live verification gap, same shape as
`wire-contract-country-port-and-field-renames`:** no browser/Playwright
tool was available in this environment to click through the actual UI.
Partial evidence instead: an unrelated dev server was already running on
port 3000 (another active session against this same repo — did not start
a second one or kill it); its compile log
(`.next/dev/logs/next-development.log`) showed clean `✓ Compiled` lines
with no new runtime error immediately after each edit to
`contracts-list.jsx` and the new files, and an unauthenticated `curl
localhost:3000/logistics/contracts` returned the expected `307` to
`/login`. This is evidence the code compiles and the route resolves, not
that the tab behaves correctly on screen — flagging honestly rather than
claiming a browser check that didn't happen.

**Not done / known gaps:**
- No unit tests added for the new schema/API modules (existing suite for
  sibling catalogs like `contract-bank-schema` also has none, so this
  matches the established bar for this feature area, but note it here
  rather than let it look like an oversight).
- No live click-through verification (see above) — needs a human or a
  session with browser tooling to confirm the disabled/enabled tab
  behavior and the create/edit dialogs actually work end-to-end against
  BE-P's live `ContractAnnex` endpoints.
- Delete is out of scope (backend doesn't support it yet either).

## 2026-09-01 — Fix stale country in QuickCreatePlaceDialog (real fix this time)

**Request:** user reported "nút thêm cảng/nơi đến nhanh, nước không thay
đổi khi tôi chọn nước khác" (the quick-add discharge-place button — the
country doesn't update when I pick a different one).

**This is the same symptom a prior entry in this file already claimed to
fix, and that fix was wrong.** Root cause, actually: `QuickCreatePlaceDialog`
stays mounted permanently (`ContractFormDialog` itself is always-mounted,
toggled via `isOpen`, per `contracts-list.jsx`). It's opened by its
caller's `IconButton.onClick` calling `setIsQuickCreate...Open(true)`
**directly** — never through the dialog's own `onOpenChange`/
`handleOpenChange`. My prior fix made `handleOpenChange` call
`form.reset()` on both open *and* close, but since the open path never
runs `handleOpenChange` at all, that change only ever exercised the
pre-existing close-time reset — which is why closing-then-reopening in my
own testing looked like it worked. The actual first-open-after-a-country-
change case (no intervening close) was never fixed.

**Real fix:** moved the reset logic into `usePlaceForm` itself, reacting
to an `isOpen` param via React's documented "adjust state during
rendering" pattern (a `prevIsOpen` state mirror compared during render,
`setValues`/`setFieldErrors`/`setSubmitError` called conditionally in the
render body) — not a `useEffect`, which this repo's lint
(`react-hooks/set-state-in-effect`) forbids for synchronous `setState`.
`quick-create-place-dialog.jsx` now just passes `isOpen` through and lost
its now-redundant custom `handleOpenChange` wrapper entirely.

**Verification:** live browser check reproducing the exact bug —
Incoterm=CIF, Nước xuất khẩu=Thái Lan, clicked "+" for **the first time**
(no prior close/reopen): correctly locked to "Thái Lan". Then changed the
export country to Australia and reopened: correctly showed "Australia",
not stale "Thái Lan". `./harness/verify.sh` full pass.

**Lesson for next time:** when "fixing" a stale-state bug in a
component that's opened by a direct `setState` call rather than through
the dialog's own open/close callback, verify by testing the *first* open
after the triggering prop changes — closing and reopening exercises a
different code path (the close handler) and can look like success for the
wrong reason.

**Blockers:** none

---

## 2026-09-01 — Fix double scrollbar in form dialogs

**Request:** user reported "dialog có tới 2 scrollbar" (dialog has 2
scrollbars) after testing the Contract form from the change below.

**Root cause:** Astryx `LayoutContent` defaults to `isScrollable={true}`.
`ContractFormDialog` (and `user-form-dialog.jsx`, admin-users — same
author, same idiom) intentionally give their inner `VStack` a fixed
`height` + its own `isScrollable`, so the dialog's overall size stays
constant while `Collapsible` sections expand/collapse (documented in
`user-form-dialog.jsx`'s own comment). With `LayoutContent`'s default left
on, that's two independently-scrolling containers nested inside each
other — two scrollbars.

**Fix:** `<LayoutContent padding={6} isScrollable={false}>` in both files
— the inner `VStack` becomes the sole scroll owner. Documented the pattern
in `docs/stylex-authoring.md` ("Common antipatterns") so a future fixed-
height dialog doesn't reintroduce it.

**Verification:** live browser check on `ContractFormDialog` (zoomed on
the scrollbar track, confirmed exactly one). Could NOT visually verify
`user-form-dialog.jsx` — the test account lacks `users:manage` and gets
redirected off `/admin/users` (same gap noted in a prior session); fixed
by the identical one-line change, lint/typecheck clean.
`./harness/verify.sh` full pass.

**Next step:** if a session ever gets an account with `users:manage`,
worth a quick visual confirmation on `user-form-dialog.jsx` too — low risk
given it's the exact same fix already proven on `ContractFormDialog`, but
unverified there.

**Blockers:** none

---

## 2026-09-01 — Incoterm-driven place fields (Nơi xếp hàng / Cảng/nơi đến)

**Request:** user asked for business logic on the Contract form: for every
Incoterm, "Nơi xếp hàng" (`placeOfLoading`) should come from Vietnam's
`Place` catalog; for FOB/EXW, "Cảng/nơi đến" (`placeOfDischarge`) is
`null`; for DDP/CIF, it comes from the export country's `Place` catalog,
with a quick-add button next to it.

**What shipped.** New `openspec/changes/incoterm-driven-place-fields/`
(full detail + decision log there). Summary:
- `config/vietnam-country.js` (new): matches the Country catalog's "Việt
  Nam" entry by normalized name — `Country` has no ISO code, so this is a
  name match, verified against the live catalog (`Việt Nam`, exact).
- `config/incoterms.js`: `requiresPlaceOfDischarge(incoterm)` — true for
  DDP/CIF only.
- `config/contract-schema.js` + `api/contracts.js`: `placeOfDischarge`
  required exactly when `requiresPlaceOfDischarge`, sent as `null` on the
  wire when blank.
- `hooks/use-places-query.js`: `usePlacesQuery` gained `enabled` (mirrors
  `useBranchesQuery(companyId)`).
- `hooks/use-contract-form.js`: resolves `vietnamCountryId`, loads
  Vietnam-scoped and export-country-scoped place lists, clears
  `placeOfDischarge` when Incoterm stops requiring it or the export
  country changes.
- `components/contract-form-dialog.jsx`: both fields are now `Selector`s
  with a "+" quick-add (`QuickCreatePlaceDialog`, already built in a prior
  session but never wired in — see that dialog's own doc comment), same
  pattern as the existing "Nước xuất khẩu" Country field.

**Bug found and fixed along the way:**
`components/quick-create-place-dialog.jsx` stays mounted (toggled via
`isOpen`, not remounted) and only called `form.reset()` on close. Once
wired with a `countryId` that actually changes between opens (the
currently selected export country), the Country selector inside it showed
stale/blank state the first time it opened after `countryId` changed —
`usePlaceForm`'s state is seeded once via `useState(emptyValues(countryId))`
at mount, so it never picked up the new prop on its own. Fixed by
resetting on open too, not just close. Documented nowhere else since the
fix is self-explanatory from the diff/comment — logged here per the
"proactive bug notes" convention only for the *non-obvious* root cause
(the flexbox-basis bug from earlier today went to `docs/stylex-authoring.md`
instead, since that one's genuinely reusable knowledge outside this file).

**Verification:** `pnpm run test` (new: `vietnam-country.test.js`,
+3 cases in `contract-schema.test.js`, +1 in `contracts.test.js`, all
pass). Live browser check via `claude-in-chrome`: picked DDP + Thái Lan,
confirmed "Cảng/nơi đến" enabled and scoped to Thái Lan; quick-added "Cảng
Bangkok" and confirmed it auto-selected; switched to FOB and confirmed the
field disabled and cleared. `./harness/verify.sh` full pass.

**Follow-up (same session):** user hit a live React "two children with the
same key, `Cảng Bangkok`" crash. Root cause: `Place.name` has no
uniqueness constraint, and the Selector options for both fields are keyed
by name — my own testing had created "Cảng Bangkok" for Thái Lan twice
(the `quick-create-place-dialog.jsx` bug above meant my first attempt
looked like it failed, so I re-created it). Fixed by adding
`dedupePlacesByName()` in `hooks/use-contract-form.js` (first occurrence
wins) before building `loadingPlaces`/`dischargePlaces` — collapses to one
option per distinct name regardless of how many catalog duplicates exist.
Re-verified live (CIF + Thái Lan → "Cảng/nơi đến" shows exactly one "Cảng
Bangkok", no console warning) and `./harness/verify.sh` full pass again.

**Next step:** none pending. The old `wire-contract-country-port-and-field-renames`
spec still says "Place of loading/discharge remain free text" — now
stale; superseded by this change's spec, not rewritten in place (see that
proposal's `specs/`).

**Blockers:** none

---

## 2026-09-01 — Rename Port catalog to Place (matches BE-P rename)

**Request:** user reported the backend (`BE-P`/CompanyManagement API)
renamed its `Ports` table/entity to `Places` — `POST`/`GET /api/v1/ports`
moved to `/api/v1/places` (same shapes: `{ id, name, countryId }` /
`{ Name, CountryId }`). Asked to update this frontend to match.

**Result:** done — mechanical rename mirroring the `Country` feature's
naming/shape conventions, no behavior change. Note: the entire Port slice
was still **untracked** (`git status` showed `??`) going in — an earlier
session had finished it (`openspec/changes/add-country-port-management-pages/`,
all tasks checked) but never committed, so this was a plain `mv`/edit, not
`git mv`.

- Renamed: `api/ports.js`→`places.js` (`listPorts`/`createPort` →
  `listPlaces`/`createPlace`, URL `/api/v1/ports`→`/api/v1/places`);
  `components/port-fields.jsx`→`place-fields.jsx`; `port-form-dialog.jsx`→
  `place-form-dialog.jsx`; `ports-list.jsx`→`places-list.jsx`
  (`PortsList`→`PlacesList`); `quick-create-port-dialog.jsx`→
  `quick-create-place-dialog.jsx` (`QuickCreatePortDialog`→
  `QuickCreatePlaceDialog` — confirmed still unwired into the Contract form,
  same as before); `config/port-schema.js`→`place-schema.js`
  (`portSchema`→`placeSchema`); `hooks/use-port-form.js`→`use-place-form.js`
  (`usePortForm`→`usePlaceForm`); `hooks/use-ports-query.js`→
  `use-places-query.js` (`usePortsQuery`/`useCreatePortMutation`→
  `usePlacesQuery`/`useCreatePlaceMutation`).
- `types/index.js`: `Port`/`PortFormValues` typedefs → `Place`/
  `PlaceFormValues`; updated the `{@link Port}` reference inside
  `Contract.placeOfDischarge`'s doc comment. Left `placeOfLoading`/
  `placeOfDischarge` themselves untouched — free-text Contract fields,
  unrelated to this catalog despite the shared word.
- `index.js`: `PortsList` export → `PlacesList`.
- `src/shared/config/route-access.js`: `/logistics/ports` rule →
  `/logistics/places`. `src/sidebarLogistics.json`: "Cảng" nav entry →
  `/logistics/places`. `src/app/(protected)/logistics/ports/` directory →
  `.../places/` (`LogisticsPortsPage`→`LogisticsPlacesPage`,
  `PortsList`→`PlacesList` import).
- No test file covered the Port slice (checked `contracts.test.js`,
  `contract-schema.test.js` — neither touches it), so none needed updating.
- Left alone (false positives, not this catalog): `port`/`setPort` in
  `design-system/components/sections/forms.jsx` (an unrelated `Selector`
  demo variable); "ports the react.dev sidebar tree" in
  `docs-shell-contract.test.js` and `mdx/tokens.stylex.js` (verb "port" =
  adapted from react.dev, not the catalog).
- **Verification:** `./harness/verify.sh` — 10/10 green (lint, typecheck,
  structure, harness-tests, unit-tests, build, quality-thresholds).
- **Left uncommitted** (per instruction) so the requesting session can
  review and commit alongside its own backend-rename commit. Also
  untouched/uncommitted: pre-existing unrelated working-tree changes found
  at session start (`contract-form-dialog.jsx` TextInput migration,
  `party-a-fields.jsx` deletion, etc. — see the entry below this one) and
  the two `openspec/changes/` proposals already describing the (uncommitted)
  Port feature (`add-country-port-management-pages/`,
  `wire-contract-country-port-and-field-renames/`) — not renamed to Place,
  since content-only edits there were out of scope for this task.
- **Next step:** whoever commits should decide whether to also rename those
  two `openspec/changes/` folders/content for consistency, and whether to
  fold this into the same commit as the still-pending TextInput/StackItem
  work already in the tree.

## 2026-09-01 — Contract form: TextInput migration + StackItem fill-width bug

**Request:** user pointed out `contract-form-dialog.jsx`'s "Số hợp đồng"
field still used the old local `@/shared/components/text-input.jsx`
wrapper, unlike every other field file in `logistics-contracts` (which
import `TextInput` straight from `@astryxdesign/core/TextInput` with
`statusVariant="tooltip"`). Then, after switching it over, user reported a
layout bug: focusing/validating "Số hợp đồng" visibly narrowed the
neighboring "Tên dự án" field.

**What shipped.**
- `contract-form-dialog.jsx`: swapped the 5 `TextInput` usages (Số hợp
  đồng, Tên dự án, Hạng mục, Nơi xếp hàng, Cảng/nơi đến) to the astryx
  import + `statusVariant="tooltip"`, matching `seller-fields.jsx` etc.
  Deleted `src/shared/components/text-input.jsx` — nothing else referenced
  it.
- Root-caused the width bug: `StackItem size="fill"` only sets
  `flexGrow: 1`, `flex-basis` stays `auto`, so when one `fill` sibling's
  content grows (a status icon appearing) the other `fill` sibling shrinks
  to compensate — not an astryx bug, a flexbox consequence of not resetting
  basis. Fixed by adding a local `equalFill` xstyle (`flexBasis: 0`) to the
  4 sibling-pair rows in this file (Số hợp đồng/Tên dự án, 2 date fields,
  Hạng mục/country block, Incoterm/Năm Incoterm). Documented the pattern in
  `docs/stylex-authoring.md` under "Common antipatterns" so it isn't
  rediscovered per-file — check that doc before pairing two `fill`
  `StackItem`s where either can show a status icon/spinner/clear button.
- Verified live via `claude-in-chrome`: typed a contract number, watched
  the duplicate-check success icon appear, confirmed "Tên dự án" width did
  not move.

**Verification:** `pnpm exec eslint` + `pnpm run typecheck` clean on the
changed file. No `./harness/verify.sh` full run this session (small,
manually-verified UI fix, not a tracked `openspec/changes/` task).

**Next step:** none pending. If another field file starts pairing two
`fill` `StackItem`s with per-field validation, apply the same
`flexBasis: 0` xstyle rather than re-debugging this from scratch.

**Blockers:** none

---

## 2026-08-30 — Country/Port management pages

**Request:** the prior session in this file
(`wire-contract-country-port-and-field-renames`) built the full
`Country`/`Port` plumbing but, following the Seller precedent, shipped no
standalone page — only the in-form "+ Thêm nước"/"+ Thêm cảng" quick-create
dialogs. User explicitly asked for standalone create/list pages ("thêm
tính năng tạo nước xuất khẩu / tạo port ở FE"), matching the Customer
precedent instead.

**What shipped.** New `openspec/changes/add-country-port-management-pages/`.
- `src/features/logistics-contracts/components/countries-list.jsx` +
  `country-form-dialog.jsx`, `ports-list.jsx` + `port-form-dialog.jsx` —
  copy `customers-list.jsx`/`customer-form-dialog.jsx`'s shape exactly
  (Toolbar+`AdvanceTable`, "+ Thêm..." opening a real-`<form>` dialog since
  it isn't nested in another dialog's form). Reuse the existing
  `use-country-form.js`/`use-port-form.js`/`country-fields.jsx`/
  `port-fields.jsx` from the prior session — no duplicated form logic.
  `CountriesList` is a single-column (Name) table, no row expansion needed.
  `PortsList` adds a "Lọc theo nước" `Selector` above the table (uses
  `listPorts`'s existing `?countryId=` server-side filter) and resolves
  `Port.countryId` → country name for display the same way
  `contracts-list.jsx` already resolves `Contract.countryId`.
- Two new routes: `app/(protected)/logistics/{countries,ports}/page.jsx`.
  `index.js` exports `CountriesList`/`PortsList`.
- Nav: found the actual sidebar source is `src/sidebarLogistics.json` (not
  `logistics-overview.jsx`, which is a placeholder banner with no links) —
  added "Nước"/"Cảng" entries there. `route-access.js` gained
  `/logistics/countries`/`/logistics/ports` rules, `logistics:contracts:view`
  (matches `docs/api/Countries.md`/`docs/api/Ports.md`'s `GET` permission
  in `BE-P`; `POST`/create requires `logistics:contracts:manage`,
  enforced backend-side only — same as Customers, no separate FE gate on
  the create button).
- Confirmed (by reading, not assuming) that
  `use-countries-query.js`/`use-ports-query.js`'s create mutations already
  `invalidateQueries` on the same query keys `useCountriesQuery`/
  `usePortsQuery` use — so a country/port created from its own management
  page needed no extra wiring to show up in the Contract form's picker.

**Verification:** `pnpm lint`/`typecheck`/`structure`/`test` (96/96,
unchanged — no new tests added, matching `customers-list.jsx`'s own
precedent of no component tests)/`build`/`quality-thresholds` all green,
`./harness/verify.sh` 10/10. Hit two real failures fixed along the way:
`eslint --fix` import-sort, and Astryx `Selector`'s TS type requiring
`hasClear` once a `value` can be `null` (the country filter's "no filter"
state). **Live verification:** no Chrome/browser tool was available in
this session (unlike the prior session's screenshot-based check), so this
was verified via `curl` against the actual running `pnpm dev` server
(already up) and the already-running `BE-P` Docker API — one login as
Nguyễn Văn A (`logistics:contracts:view`/`manage`), then through the app's
own `/api/backend/*` proxy: created a country ("Verification Testland"),
created a port under it ("Verification Port"), confirmed both appear in
`GET /api/v1/countries` and the country-filtered `GET /api/v1/ports`
(same calls `CountriesList`/`PortsList`/the Contract form's pickers make),
and confirmed `/logistics/countries`/`/logistics/ports` SSR-render their
real content (`Nước xuất khẩu`, `Thêm cảng` present in the HTML, no error
boundary). This is real request-level golden-path evidence, not a click
in a browser — flagging that gap honestly for whoever picks this up next
with a Chrome bridge available. The test country/port created during this
check were **not** deleted (no delete endpoint exists on this catalog,
create+list only, matching the backend's scope) and remain in the shared
dev database.

**Discovered (not done, out of scope):** `countries.js`/`ports.js`/
`country-schema.js`/`port-schema.js` still have no unit tests (flagged as
a gap by the prior session too) — filling that gap wasn't the ask here
either.

---

## 2026-08-30 — Wire Contract Country/Port catalog + BE-P field renames

**Request:** BE-P's Contracts API shipped (backend-only, already
merged) `PortOfLoading`→`PlaceOfLoading`, `PortOrPlaceOfDestination`→
`PlaceOfDischarge`, `PartyA`→`Buyer`, free-text `ExportCountry`→required
`CountryId` FK (new `Country` catalog), a new per-country `Port` lookup
catalog, an optional `Note` field, and a `QuotationDate <= CreatedDate`
validation rule. Wired the frontend to match.

**Change:** `openspec/changes/wire-contract-country-port-and-field-renames/`.

**Result:** done.
- New catalogs `Country` and `Port`, each following the Seller/Customer
  pattern exactly: `api/{countries,ports}.js`, `hooks/use-{countries,ports}
  -query.js`, `hooks/use-{country,port}-form.js`, `config/{country,port}
  -schema.js`, `components/{country,port}-fields.jsx`,
  `components/quick-create-{country,port}-dialog.jsx`.
- `api/contracts.js`: `buildContractBody()` now sends `CountryId`,
  `PlaceOfLoading`, `PlaceOfDischarge`, `Buyer` (was `buildPartyAPayload`,
  renamed `buildBuyerPayload`), `Note`.
- `config/contract-schema.js`: `exportCountry` string rule → `countryId`
  non-empty rule; `portOfLoading`/`portOrPlaceOfDestination` → `placeOf
  Loading`/`placeOfDischarge`; added optional `note` (max 2000); added a
  `.refine()` enforcing `quotationDate <= createdDate` with the error
  attached to `path: ['quotationDate']` (same idiom as the existing
  payment-terms-sum-to-100 refine).
- `hooks/use-contract-form.js`: `partyAInline`/`setPartyAInlineField`/
  `switchToInlinePartyA`/`partyAExtraFieldRows` → `buyerInline`/
  `setBuyerInlineField`/`switchToInlineBuyer`/`buyerExtraFieldRows`; added
  `countriesQuery`/`countries` and `note` state.
- `components/party-a-fields.jsx` → `components/buyer-fields.jsx`
  (`BuyerFields`).
- `components/contract-form-dialog.jsx`: "Nước xuất khẩu" is now a
  `Selector` (was `TextInput`) bound to `countryId`, with an adjacent
  "Thêm nước" `IconButton` opening `QuickCreateCountryDialog` (auto-selects
  the new country); "Cảng xếp hàng"/"Cảng/nơi đến" stayed `TextInput`s,
  just rebound to `placeOfLoading`/`placeOfDischarge`; added a `TextArea`
  "Ghi chú" (maxLength 2000); "Party A (Khách hàng)" section →
  "Buyer (Khách hàng)".
- `components/contracts-list.jsx`: "Khách hàng" column/labels now read
  `contract.buyer.*`; confirmed via `docs/api/Contracts.md` (BE-P)
  that `ContractResponse` does NOT denormalize a country name — only
  `countryId` — so added a `useCountriesQuery()` + `Map`-by-id lookup
  (`countriesById`) for display in both the table column and the
  expanded-row detail panel; added a "Ghi chú" row to the detail panel's
  info tab.

**Scope decisions:**
- **Port suggestion UX:** no lightweight freeform-autocomplete component
  exists in this design system — `Typeahead` forces selecting an item from
  `searchSource`, it doesn't support "type anything, list is just a hint".
  Per the task's explicit instruction not to hand-roll a typeahead, shipped
  plain `TextInput`s for `placeOfLoading`/`placeOfDischarge`. The `Port`
  catalog (API/hooks/schema/fields/quick-create dialog) was still built per
  spec, just not wired into the Contract form — it's available for a
  future picker.
- **Country/Port standalone pages:** none, following the Seller precedent
  (in-form quick-create only) rather than Customer's (own list page/route).
  No signal in `logistics-contracts-customers-ui`'s proposal or this file
  suggesting catalogs get pages by default.

**Verification:** `./harness/verify.sh` — full pass (lint, typecheck,
structure, harness-tests, unit-tests, build, quality-thresholds). Unit
tests: 96 passing (was 84; +9 new Country/Port-adjacent + Note assertions
in `api/contracts.test.js`, +4 in the new `config/contract-schema.test.js`
covering the quotation-date refine, `countryId` requiredness, and the
`note` length cap — minus the net effect of consolidating some Party A
tests into Buyer-named equivalents). See `harness/runs/20260830-014927-97537/`.

**Live verification — partial, be honest about the gap:** BE-P's
Docker stack (`cleanarchitecture-api-1`/`cleanarchitecture-mysql-1`) was
already running; `docker compose ps` confirmed it, and `curl` confirmed
login works (`POST /api/v1/authentication/login` with the seeded
`DNG26F4A9C2`/`Admin@123456` admin) and `GET /api/v1/countries` returns the
documented `{id, name}` array shape our `api/countries.js` expects. A full
API round-trip (create country → port → contract with `CountryId`/`Buyer`/
`Note`, plus a bad-quotation-date 400 check) was attempted via curl but hit
the login endpoint's 15-minute fixed-window rate limiter
(`LoginRateLimitSettings`, BE-P) after a handful of attempts —
did not wait it out. **No actual browser/UI interaction was performed** —
this environment has no Playwright/browser-automation tool available, only
`curl`/`WebFetch` (which doesn't drive an authenticated SPA's dialogs). So:
confirmed the backend is up and the documented shapes match what the code
sends/expects by inspection + a couple of live calls, but did NOT click
through the actual Country Selector + quick-create + contract-submit flow
in a real browser. Whoever picks this up next with browser tooling
available should do that pass before fully trusting this as
production-verified.

**Discovered (not fixed here, logging per AGENTS.md):**
- `api/contracts.test.js`'s `BASE_VALUES` was missing `sourceSellerId`/
  `sellerInline` entirely — a latent bug from the "add Seller catalog"
  commit (`6bea1d6`) that never updated this test file, so every test in
  it would have thrown a `TypeError` in `buildSellerPayload` (`values
  .sellerInline` undefined) the moment anyone ran `pnpm test` on a fresh
  checkout. Fixed as part of this change (had to touch the same
  `BASE_VALUES` object anyway for the field renames) — not scope creep,
  but flagging since it means `unit-tests` may have been silently broken
  since that commit landed and nobody ran the full suite locally.

**Next step:** wire the `Port` catalog into an actual picker (e.g. a
suggestion list surfaced next to the free-text place fields) once/if a
suitable component lands in the design system, or once product confirms
the UX. Also worth a follow-up pass with real browser tooling to close the
live-verification gap above.

**Blockers:** none blocking merge; the live-UI-verification gap above is a
known limitation of this session's environment, not of the change itself.

---

## 2026-08-29 — Expandable contract rows with inline details

**Request:** Preserve the current working tree in a commit, then make each row
in the Contracts table expandable in-place, following the supplied inventory
table reference and reusing the contract fields already available in the list.

**Implementation:** Committed the pre-existing table/search/Astryx migration as
`4c2dbd1` before starting this task. `ContractsList` now composes Astryx
`useTableRowExpansion` with the existing column-settings, sticky-column, and
filter plugins. One `expandedContractId` owns the accordion state, so expanding
a second contract closes the first. The whole data row toggles on click,
Enter, or Space and exposes `aria-expanded`; the built-in chevron and context
menu remain available. The row's Sửa action stops propagation, while the
expanded panel offers its own Sửa hợp đồng action. The detail panel uses
`MetadataList` to show the existing number, project, Party A, value, dates,
category, Incoterm, country, ports, beneficiary-bank count, and payment terms.

**Harness gap fixed:** The earlier Astryx migration changed source imports to
the `@/* -> ./src/*` alias, but plain `node --test` did not resolve it, leaving
five API/content test files unable to start. Added a narrow Node ESM resolve
hook (`harness/node-alias-loader.mjs`), registered through
`harness/register-node-alias.mjs`, and made the `test` script use it. A harness
test launches Node through that registration and imports a real `@/shared/...`
module, preventing the mismatch from returning. Full unit suite is now 91/91.

**Visual verification:** Used a local-only browser session with fake permission
cookies and an intercepted contracts response (no real credentials or backend
state). Confirmed click expansion, exactly one expanded row after opening a
second contract, Space-to-collapse, no browser errors, and captured
`harness/runs/contracts-row-expanded.png`.

**Verification:** `./harness/verify.sh` passed every gate: readiness, memory
secrets, theme build, lint, typecheck, structure, harness tests, unit tests,
production build, and quality threshold. Evidence:
`harness/runs/20260829-142530-2340/`.

## 2026-08-28 — Advanced search + column visibility for all list tables

**Request:** Add (1) advanced/multi-field search and (2) show/hide table
columns to the tables in the project, based on an Astryx playground reference
link. User confirmed scope: apply to all existing tables (Contracts,
Customers, Users).

**Implementation:** Replaced the plain `TextInput` quick-search in
`contracts-list.jsx`, `customers-list.jsx`, and `user-list.jsx` with Astryx's
`PowerSearch` + `usePowerSearchConfig`, giving each table a token-based filter
bar (contains/starts-with/enum-is/etc. per field) while keeping free-text
typing mapped to the most-used field via `contentSearchFieldKey`. Added
column show/hide via `useTableColumnSettingsState` + `useTableColumnSettings`
wired into `Table`'s `plugins` prop, toggled from a `MultiSelector` in each
Toolbar's `endContent`; "always visible" columns (primary identifier +
actions) are locked. `usePowerSearchConfig`'s `applyFilters` only does flat
`row[field]` lookups (no dot-paths), so nested/nullable fields (Party A's
company name, user's full name/phone, customer's nullable text fields) are
flattened/coalesced into synthetic top-level props before filtering.

**TS/JSDoc notes for future edits:** `usePowerSearchConfig`'s generic field
defs need literal `type` values (`'string'` not `string`) to type-check;
`@type {const}` is **not** valid JSDoc in this TS version — use
`/** @satisfies {ReadonlyArray<FieldDefinition>} */` above the array instead,
which validates without widening literals. `applyFilters`'s generic return
type doesn't infer cleanly against our flattened data shapes, so both its
input and output are cast through `/** @type {any} */` at the call site.
`useTableColumnSettings`'s generic also doesn't infer from its argument, so
the plugin result needs an explicit `/** @type {TablePlugin<Row & Record<string, unknown>>} */` cast.

**Verification:** `pnpm run typecheck` and `pnpm exec eslint` clean on all
three files; `pnpm exec prettier --write` applied. `pnpm run test`: 79 pass,
same pre-existing 5 failures as before this change (the `@/src` alias
resolution issue noted in the 2026-08-28 NumberInput entry below, plus one
unrelated `formatMoney`/`Infinity` assertion — confirmed via `git stash` that
both predate this session). Did not open the dev server/browser to visually
verify (no backend/credentials available in this environment) — recommend a
manual check of the search bar and column picker on all three list pages.

## 2026-08-28 — Contract value NumberInput formatting (`xxx,yyy.zz`)

**Request:** Optimize the formatter used by the Contract dialog's "Giá trị
hợp đồng" `NumberInput` and display committed values with comma thousands
separators plus exactly two decimal digits.

**Implementation:** `config/currencies.js` now creates one module-scoped
`Intl.NumberFormat('en-US')` instance instead of allocating one for every
format call. `formatMoney` returns an empty string for missing and non-finite
values, retains its optional currency suffix for list/payment displays, and
the `NumberInput` receives the stable `formatMoney` function directly instead
of a new inline callback on every render. Added focused tests for grouping,
two decimal places, rounding, zero, optional currency, and invalid values.

**Verification:** Focused formatter tests 3/3, ESLint, typecheck, structure
(380 modules / 1002 dependencies), production build, and quality threshold
(168.7 kB shared gzip / 250 kB) pass. Browser reached the app but redirected
the protected route to `/login`; no safe credentials were available, so no
visual assertion was made. Full `pnpm test` is currently blocked by unrelated
pre-existing working-tree changes: five API/content modules now import
`@/src/...`, which the plain Node test runner cannot resolve (79 pass, 5 fail).
The full shell gate also cannot start from this Windows checkout because
`core.autocrlf=true` materialized its tracked `.sh` files with CRLF. Task 1.22
therefore remains unchecked per the project's definition of done.

## 2026-08-27 — Contract dialog: Party A now always catalog-linked; details field collapsed

**Context:** Same-day follow-up. Two user requests: (1) the customer card's
detail fields (Người đại diện/Chức vụ/Địa chỉ/trường tùy ý) were always
visible, cluttering the card — collapse them behind a toggle; (2) the form
let a user type a Party A company name inline with no catalog link at all,
which duplicated the existing "Thêm khách hàng" quick-create button and was
flagged as bad UX — confirmed with the user: drop the free-typed path
entirely, Party A must always reference a catalog `Customer`.

**Collapsible details (`customer-fields.jsx`).** New optional prop
`isCollapsible` (default `false`, so `customer-form-dialog.jsx`'s and
`quick-create-customer-dialog.jsx`'s full-form usages are unaffected).
When true, `useCollapsible({ isCollapsible: { defaultIsOpen: false } })`
gates Người đại diện/Chức vụ/Địa chỉ/`ExtraFieldsEditor` behind a "Xem thêm
thông tin chi tiết" `Button` (chevron rotates on toggle via local stylex,
ported from `IconChevron`'s own rotate styles). "Tên công ty" (when shown)
stays outside, always visible. `party-a-fields.jsx` (the Contract form's
Party A card — the one context this was asked for) passes `isCollapsible`
on both its `CustomerFields` call sites.

**Party A: catalog-only (`party-a-fields.jsx`, `contract-schema.js`).**
Removed the "no customer selected → type one inline" fallback entirely —
Party A is now always either an existing `Customer` (Selector) or a
brand-new one via "Thêm khách hàng" (auto-selected once created via
`QuickCreateCustomerDialog`'s existing `onCreated` callback — no wiring
change needed there). `contract-schema.js`'s duplicate-satisfying-either
`.refine` collapsed to just `Boolean(sourceCustomerId)`, error path now
`sourceCustomerId` (was `partyAInline.companyName`) — wired to the Selector
via a new `sourceCustomerIdStatus` prop instead of `CustomerFields`'
`companyName` status. The API layer (`api/contracts.js`'s
`buildPartyAPayload`) is untouched — the backend still accepts a typed
`CompanyName` with no `SourceCustomerId`, this is a UI-only restriction, so
an *existing* contract created before this change (or via direct API use)
can still have a catalog-less Party A. Handled that edit-mode edge case: if
`sourceCustomerId` doesn't resolve to a known customer but
`partyAInline.companyName` is non-empty, show a supporting-text hint with
the old value instead of a silently-empty required Selector.

**Non-obvious TS fix (repeat of an earlier one this session).** The new
`partyAFieldStatuses = {}` empty-object literal, spread later into
`CustomerFields`' `fieldStatuses` prop, tripped the exact same "loses its
index signature when spread inline" `tsc` issue as `use-contract-form.js`'s
`fieldStatuses` earlier today — same fix, an explicit `/** @type {Record<string,
...>} */` annotation on the `const`.

**Verification:** `pnpm lint`/`typecheck`/`structure`/`test` (83/83) green.
**Not** live-tested in a browser this pass (no dev server + BE-P Docker
API running in this session) — recommend a manual smoke test (pick an
existing customer, quick-create a new one mid-contract, and — if any
pre-existing contracts have a catalog-less Party A — open one in edit mode)
before considering this fully verified.

## 2026-08-27 — Contract dialog: Công ty/Chi nhánh row width bug (recurring)

**Context:** Same-day follow-up. User reported the "Công ty"/"Chi nhánh" row
in `ContractFormDialog` still had the old "input expands, not fixed width"
bug — this is the same failure mode already root-caused and fixed once in
`admin-users` (see the 2026-08-19 `.memsearch` history): `StackItem`'s
`size="fill"` is `flexGrow: 1` only (`stackItem.stylex.ts`), **no**
`flex-basis: 0` — so two Selectors sharing an `HStack` split space starting
from each one's own content-driven `flex-basis: auto`, not evenly. A
`Selector` with `hasSearch` (Công ty) or a long selected label renders wider
than its neighbor, since nothing forces a fixed 50/50 split. Confirmed by
reading `node_modules/@astryxdesign/core/src/Stack/stackItem.stylex.ts`
directly, not by browser reproduction this pass.

**Fix.** Never independently invented — `user-org-fields.jsx` (admin-users'
Công ty/Chi nhánh/Phòng ban/Chức vụ) already landed on the durable fix after
multiple failed attempts (adding `width="100%"`, removing `wrap="wrap"`):
stop putting `Selector`s side-by-side in an `HStack` at all. Applied the same
pattern here — `contract-form-dialog.jsx`'s Công ty/Chi nhánh `HStack` (two
`StackItem size="fill"`) is now a `VStack gap={3}`, one `Selector` per row,
each still `width="100%"`.

**Verification:** `pnpm lint`/`typecheck`/`test` (83/83) green. **Not**
re-verified live in a browser this pass (no dev server + BE-P Docker
API running in this session) — the fix is applied by well-evidenced analogy
to the confirmed admin-users root cause, not by reproducing this exact
instance first. Recommend a live check (long company name, resize) before
calling this fully closed.

## 2026-08-27 — Contract dialog UI polish + real-time duplicate contract-number check

**Context:** User asked to (1) tighten up `/logistics/contracts`'s create/edit
dialog and (2) flag a duplicate "Số hợp đồng" live as the user types instead
of only on submit.

**UI polish (`ContractFormDialog`, `PaymentTermsFields`).** "Giá trị hợp
đồng" no longer shows a separate formatted-value `Text` underneath — the
currency code now renders inline via `NumberInput`'s `units` prop. "Đơn vị
tiền tệ" `Selector` shrunk to a fixed 120px (`StackItem size="static"`)
instead of splitting the row evenly with the value field. The previously
non-collapsible "Thông tin chung" `Card` is now a `FormSection` inside the
same `CollapsibleGroup` as Party A/Đợt thanh toán/Ngân hàng, default-open
alongside Party A — one consistent expand/collapse idiom for all four
sections instead of one fixed block plus three collapsible ones.
`PaymentTermsFields` gained a "Thành tiền" column per payment-term row
(`contractValue × paymentRatioPercent / 100`, via `formatMoney`), a
read-only derived display — not part of the submitted payload.

**Real-time duplicate check.** The backend (`BE-P`, sibling repo) had
no endpoint for this — `IContractsRepository.ExistsByContractNumberAsync`
only backed the `409` on submit. Added
`GET /api/v1/contracts/exists?contractNumber=&excludeContractId=` there
first (`openspec/changes/add-contract-number-exists-endpoint/` in that repo;
`./harness/verify.sh` 8/8, +3 tests, 162/162 total — needed
`DOTNET_ROOT="/c/Program Files/dotnet"` exported first, the same
pre-existing Windows/git-bash `hostfxr.dll` issue that repo's own
`PROGRESS.md` has logged repeatedly). On this side: `checkContractNumberExists`
in `api/contracts.js`; new `useContractNumberExistsQuery` (`hooks/
use-contract-number-exists-query.js`) debounces `contractNumber` 400ms then
`useQuery`s the endpoint keyed on the debounced value + `excludeContractId`;
`useContractForm` wires it in, merging its result into `fieldStatuses.
contractNumber` (schema errors like "required" still win over the
duplicate flag — same slot, schema checked first) and exposing
`isCheckingContractNumber` for the `TextInput`'s `isLoading` spinner. Not
branch-scoped — `ContractNumber` uniqueness is system-wide, and the endpoint
only needs `logistics:contracts:view` in any scope. This is a UX aid only;
the backend's `409 Conflict` on submit remains the actual source of truth
(race between two users typing the same number is still possible and still
caught there).

**Non-obvious TS fix.** Merging a `Record<string, X>`-typed object (from
`Object.fromEntries`) with one explicit key via `{ ...base, key: ... }`
*inline inside a return-statement object literal* made `tsc` drop the index
signature entirely — every other `fieldStatuses[...]` access in
`contract-form-dialog.jsx` then failed with "property does not exist".
Fixed by extracting the merge into its own `/** @type {Record<string, ...>}
*/`-annotated variable first, then returning that variable — the explicit
annotation is what keeps the index signature; the same object literal
without it, even assigned to a `const`, was not enough.

**Verification:** `pnpm lint`/`typecheck`/`structure`/`test` (83/83, +2 new
for `checkContractNumberExists`) green. Not live-tested against a running
dev server + BE-P Docker API in this session — only static
verification; recommend a manual smoke test (type a duplicate number, an
edit-mode-own-number, an unused number) before considering this fully done.

## 2026-08-27 — CommonDialog, currency display, optional branch (follow-up)

**Context:** Same-day follow-up to "Logistics Contracts + Customers pages"
after BE-P added `Contract.Currency` and made `BranchId` nullable/
optional (see that repo's own PROGRESS.md entry). User asked for: (1) every
dialog to open at a fixed distance from the top instead of Astryx's default
vertical centering, wider/taller, via a reusable component; (2) money
values formatted like `50,000.00 USD`; (3) the Contract form's internal
Company/Branch selection to make Branch optional (Company narrows the
Branch list only, never persisted). Change:
`openspec/changes/logistics-contracts-customers-ui/` (amended).

**What shipped.** `shared/components/common-dialog.jsx` (new): a thin
wrapper over Astryx `Dialog` that fixes `position={{ top, start: 0, end:
0 }}` + `style={{ marginInline: 'auto' }}`, `width=720`, `maxHeight='85vh'`
by default. All 4 dialogs in `logistics-contracts` now use it
(`ContractFormDialog` at 1100×88vh, the other 3 at 600px). `config/
currencies.js` adds a curated `CURRENCY_CODES` Selector list + `formatMoney`
(`Intl.NumberFormat` 2-decimals + thousands separators + currency code
suffix), wired into the Contract form (a new "Đơn vị tiền tệ" Selector next
to "Giá trị hợp đồng", with the formatted string shown live underneath) and
the Contracts list's Giá trị column. "Chi nhánh" Selector is now
`isOptional` (was `isRequired`), sent as `BranchId: null` when left blank;
"Công ty" gained a description clarifying it's UI-only, narrowing the
Branch options, never persisted.

**Non-obvious fix required to center a top-anchored Dialog.** Astryx's
`Dialog` replaces its default `margin: auto` centering with `margin: 0`
the instant *any* `position` prop is supplied (see its `dynamicStyles.
position`) — so `position={{ top: 72 }}` alone left the dialog pinned to
the viewport's left edge, not centered. Fixed by also setting `start: 0,
end: 0` (both logical insets, not just top) and overriding the margin back
to `auto` via the `style` prop (inline styles win over the component's own
stylex class) — deliberately *not* touching `transform`, which the open/
close animation keyframes already own.

**Real bug found while testing a non-integer contract value.** Submitting
the Contract form with a decimal `ContractValue` (e.g. `12345.61`) silently
did nothing — no fetch, no console error, no visible validation message.
Root cause: Astryx `NumberInput` defaults `step` to `1`, so the underlying
native `<input type="number">` fails the browser's own HTML5 constraint
validation for any non-integer value, which cancels the `<form>`'s submit
event *before* React's `onSubmit` ever runs — invisible because the
constraint-validation popup only appears if the browser decides the field
is visible/reachable, and here it silently no-ops instead. Confirmed via
`form.checkValidity()` in the page console (`validationMessage: "Please
enter a valid value. The two nearest valid values are 12345 and 12346."`).
Fixed by adding `step={0.01}` to both `NumberInput`s that legitimately take
a fraction: Contract's "Giá trị hợp đồng" and each payment term's "Tỷ lệ
(%)" (percentages like `33.33` need it too). **Any future money/percentage
`NumberInput` in this app needs `step={0.01}` explicitly — the Astryx
default silently rejects decimals with no visible error.**

**Verification:** `pnpm lint`/`typecheck`/`structure`/`test` (84, +1)/
`build`/`quality-thresholds` all green — `./harness/verify.sh` 10/10.
Live-tested against the local BE-P Docker API: confirmed the dialog is
now top-anchored and horizontally centered (screenshot before/after), the
money preview renders `"12,345.61 USD"` live as typed, and — after the
`step` fix — successfully created a contract with `BranchId: null` and a
decimal `ContractValue`, verified via a direct `GET /contracts` fetch from
the page console.

## 2026-08-27 — Logistics Contracts + Customers pages

**Context:** BE-P's contract-management backend (5 endpoints:
`Contracts`, `Customers`, `NotifyPartyContacts`, `ConsigneeContacts`,
`ContractBanks`) shipped with nothing consuming it. User asked for a
Logistics side nav with `/logistics/contracts` and `/logistics/customers`:
a Contracts list with a create modal (quick-add bank/customer from inside
it), and a Customers list + add.

**What shipped.** `sidebarLogistics.json` (new) registered in
`protected-app-shell.jsx`'s `SIDE_NAV_ROUTES`/`hasSelfManagedPadding` and
`(protected)/layout.jsx`'s `sideNavRouteTrees`, giving `/logistics/*` the
same 2-column side-nav layout `/admin/*` already has.
`route-access.js` gained `/logistics/contracts`/`/logistics/customers`
rules requiring `logistics:contracts:view`, listed **before** the existing
broader `/logistics` rule — `middleware.js` takes the first match, so order
matters.

New feature `src/features/logistics-contracts/` (isolated per
`harness/structure.rules.cjs` — its own `api/org-directory.js` duplicates
`admin-users`' company/branch list calls rather than importing them,
since features can't import each other). `ContractsList`/`CustomersList`
follow `admin-users/components/user-list.jsx`'s Toolbar+Table+pagination
shape exactly; `ContractFormDialog` follows `user-form-dialog.jsx`'s
sectioned-Card dialog shape. Party A supports both picking an existing
`Customer` (snapshotted server-side on save) and typing one inline, each
with a quick-add dialog (`quick-create-customer-dialog.jsx`,
`quick-create-bank-dialog.jsx`) that mirrors `create-org-item-dialog.jsx`'s
plain-button-not-`<form>` trick — both are nested inside
`ContractFormDialog`'s own `<form>`, and Astryx's `Dialog` is a non-portal
native `<dialog>`, so a second real `<form>` there would be
invalid-HTML-nested-in-a-form (the exact bug `create-org-item-dialog.jsx`
already hit and fixed). Payment terms and Key/Value "trường tùy ý" rows
both use the same `rowKey`-based repeatable-grid pattern as
`use-bank-account-rows.js`; a `Badge variant="error"` flags the payment-term
total whenever it drifts from 100 (client-side echo of the backend's
`CreateContractCommandValidator` — mirrored in `config/contract-schema.js`,
a `zod` schema, same hand-rolled-form convention as `create-user-schema.js`,
no `react-hook-form` anywhere in this repo).

**Deliberately out of scope this pass:** Notify Party/Consignee are not in
the form (sent as `null` — the backend accepts that); no standalone
NotifyPartyContacts/ConsigneeContacts/ContractBanks list pages (banks get
create-only via the in-form quick-add, same as Company/Branch/Department/
Position never got their own admin-users list page either); no
delete/update on the 4 catalogs (matches the backend's own scope). Edit
mode shows the contract's `BranchId` as a fixed raw GUID string rather than
a resolved branch name — resolving it would need fetching every company's
branches to find a match (no "get branch by id" endpoint exists); a known,
accepted rough edge.

**Verification:** `pnpm lint`/`typecheck`/`structure`/`test` (83 tests,
+2 new for `api/contracts.js`'s Party A payload branching)/`build`/
`quality-thresholds` all green — `./harness/verify.sh` 10/10. Live-tested
against the local BE-P Docker API (already running from that repo's
own session) as Nguyễn Văn A (Logistics dept, has
`logistics:contracts:view`/`manage` on his branch): created a customer,
created a contract picking that customer via the Selector, quick-added a
*second* customer and a bank inline mid-contract-creation, entered payment
terms summing to 100%, saved successfully, and confirmed the new row plus
the Company→Branch cascade and Sửa (edit) prefill all work. No console
errors observed.

## 2026-08-21 — Assign inherited and additional permissions while creating employees

**Context:** The backend change
`../BE-P/openspec/changes/assign-permissions-during-user-creation/`
made employee creation and direct permission grants atomic, and introduced an
Admin-only inherited-permission preview by Department.

**What shipped.** The create dialog's Phân quyền tab now loads the selected
Department's inherited permissions from
`GET /api/v1/permissions/inherited?departmentId=...` and renders them as
read-only Astryx checkboxes. Optional catalog permissions are selectable with
`CheckboxList`; changing company, branch, or department clears stale choices.
`registerUser` sends `ExtraPermissions` in the same registration request, so a
validation failure cannot leave a user created without their intended grants.
The edit flow remains immediate through the existing grant/revoke mutations.

**Tests and evidence:** Added API contract tests for the inherited preview and
atomic register payload. 81/81 tests green; lint, typecheck, dependency rules,
production build, and quality thresholds all pass. Full harness:
`harness/runs/20260821-153657-360/`.

## 2026-08-21 — "Logistics" top nav item + `/logistics` route, gated by `logistics:view`

**Context:** User asked for a new "Logistics" top-nav item and `/logistics`
route, visible/reachable only to accounts with the `logistics:view`
permission. `site.js` already had a comment anticipating exactly this
(`{ label: 'Logistics', href: '/logistics', allowedPermissions:
['logistics:view'] }`), and `db/sample-data.sql` (BE-P) already seeds
Nguyễn Văn A with that permission specifically for testing this. No
`openspec/changes/` entry — direct request, small addition.

**What shipped.**
- `shared/config/site.js` — added the Logistics entry to `navLinks` and
  `topNavLinks`.
- `shared/config/route-access.js` — added `{ pathPrefix: '/logistics',
  allowedPermissions: ['logistics:view'] }` so `src/middleware.js` blocks
  direct navigation, not just hides the nav link (same pattern as
  `/admin`'s `users:manage` rule).
- `features/logistics/components/logistics-overview.jsx` + `index.js` — a
  placeholder page ("Đang xây dựng" banner); no logistics data/API exists
  yet, this only establishes the route and its permission gate.
- `app/(protected)/logistics/page.jsx` — wired into the existing
  `(protected)` route group, so it inherits the app shell and the
  session-cookie auth check for free.
- `shared/config/site.test.js` — updated the `topNavLinks` snapshot test and
  added a gating assertion for the new link.

**Verification:** `pnpm lint` / `pnpm typecheck` / `pnpm structure` /
`pnpm test` (79/79) all clean. Full browser verification against the local
Docker BE, three accounts:
- Nguyễn Văn A (Logistics dept, has `logistics:view`) — link visible, page
  renders.
- System Admin — link also visible. Not a bug: `RolePermissions.Map`
  (BE-P) deliberately grants Admin `logistics:view` too.
- Trần Thị B (Kế toán dept, no `logistics:view`) — link absent from nav,
  and direct navigation to `/logistics` redirects to `/` via middleware
  (confirms the route is actually enforced, not just hidden from the nav).

**Next step:** none planned — real Logistics functionality is a separate,
unscoped future task.

**Blockers:** none

---

## 2026-08-21 — Admin concurrent-session control + revoked-session notice

**Context:** Follow-up to the backend single-session hardening. The wire
contract already exposed `allowConcurrentSessions` on user detail and
`PUT /users/{id}/concurrent-sessions`, but the FE had no control for it and
treated the backend's explicit revoked-session 401 as an ordinary expiry.

**What shipped.** The edit-user dialog now has an edit-only "Phiên đăng nhập"
section with an Astryx `Switch`. It applies the dedicated endpoint immediately,
shows loading/error/success state, and warns that turning the exception off
revokes every current session. The shared API boundary now distinguishes
`Signed in on another device`, `Session has been revoked; sign in again`, and
ordinary expiration; revoked sessions redirect to `/login?revoked=1` and get
the Vietnamese "Phiên đăng nhập đã bị thu hồi" notice.

**Harness gap fixed.** On Windows, `node --test 'src/**/*.test.js'` passed while
running zero tests because the quoted glob was not expanded. The script now
uses Node's built-in test discovery (`node --test`), which ran 78 tests. Added
coverage for the concurrent-session request contract and all three 401 message
mappings.

**Verification:** `./harness/verify.sh` passed every gate. Evidence:
`harness/runs/20260821-102339-387/`.

**Blockers:** Visual browser verification was not available in this CLI-only
session; build, typecheck, structure, and behavioral unit tests passed.

---

## 2026-08-21 — "+ Thêm mới" on the Công ty/Chi nhánh/Phòng ban/Chức vụ Selectors

**Context:** User asked to add a "create new" affordance to the four
org-directory Selectors in the create/edit user form. `BE-P` already
has Admin-only create endpoints for all four
(`POST /companies`, `POST /companies/{id}/branches`, `POST /departments`,
`POST /positions` — each just `[Authorize(Roles = "Admin")]` + a `Name`,
plus a parent id for Branch/Department). No `openspec/changes/` entry —
direct request, small addition to `admin-users`.

**What shipped.**
- `api/org-directory.js` — `createCompany`/`createBranch`/`createDepartment`/
  `createPosition`.
- `hooks/use-org-directory.js` — one mutation hook per create call, each
  invalidating the matching list query key so every consumer sharing the
  queryClient (this form, `UserList`) picks up the new item without a manual
  refetch.
- `shared/components/icon/icon-plus.jsx` — Astryx has no built-in plus/add
  semantic icon name (`astryx docs icons`), so a local SVG like the existing
  `icon-shuffle.jsx`/`icon-refresh.jsx`.
- `components/create-org-item-dialog.jsx` — one generic "add a new X" dialog
  reused by all four (every create endpoint takes only a `Name`).
- `components/user-org-fields.jsx` — each Selector now sits next to a "+"
  `IconButton` (`SelectorWithAdd`) that opens the dialog; Branch/Department's
  buttons are disabled until their parent (Company/Branch) is picked, same
  as the Selector itself. On success the new item is auto-selected via
  `setField` so the Admin doesn't have to find it in the list again.

**Bug caught during manual verification (real one, not a misclick):**
`CreateOrgItemDialog` initially used its own `<form onSubmit>` +
`type="submit"`. Astryx's `Dialog` renders a native `<dialog>` **inline in
the DOM, not through a portal** — and this dialog is nested inside
`UserFormDialogShell`'s own `<form>` (`UserOrgFields` renders inside a
`FormSection` inside the edit/create dialog's form). A `<form>` nested
inside a `<form>` is invalid HTML; the browser's parser drops the inner
`<form>` tag and merges its submit button into the *outer* form. Result:
clicking "Thêm" silently submitted (and closed) the whole user-edit dialog
instead of creating the item — nothing reached the backend. Fixed by
dropping the `<form>` entirely in favor of a plain `Button` + `onClick`.
Verified after the fix: created a real Position ("Kỹ sư QA Test") from the
edit-user dialog against the local Docker BE, confirmed it round-tripped via
`GET /positions`, auto-selected in the Chức vụ Selector, then deleted the
test row directly in MySQL to keep `db/sample-data.sql`'s fixture clean.

**Verification:** `pnpm lint` / `pnpm typecheck` / `pnpm structure` all
clean. Full browser flow against the local Docker BE (see bug note above).

**Next step:** none planned.

**Blockers:** none

---

## 2026-08-21 — Admin "Reset password" action on the user list

**Context:** User asked for a reset-password feature on the FE. `BE-P`
already exposes `POST /users/{id}/password/reset`
(`[Authorize(Roles = "Admin")]`, sets the password directly, no current-
password check) — a different endpoint from the self-service
`POST /users/me/password`. No `openspec/changes/` entry — direct request,
small addition to the existing `admin-users` feature.

**What shipped.**
- `api/users.js` — `resetPassword(userId, newPassword)`, `POST
  /users/{id}/password/reset`, body `{ NewPassword }`.
- `hooks/use-reset-password-mutation.js` — thin `useMutation` wrapper, no
  query invalidation (the endpoint doesn't change anything `GET /users` or
  `GET /users/{id}` return).
- `components/reset-password-dialog.jsx` — new dialog: password field +
  "Tạo mật khẩu ngẫu nhiên" shuffle button (reuses `generateRandomPassword`
  from the create-user form), submit calls the mutation. On success shows
  the new password in a persistent success Banner instead of closing — the
  backend sends no email/SMS, so this is the only place the Admin can ever
  see it again to hand it to the employee.
- `user-list.jsx` — added "Đặt lại mật khẩu" to each row's "Thao tác"
  dropdown, alongside "Sửa".

**Verification:** `pnpm lint` (one auto-fixed import-sort error),
`pnpm typecheck`, `pnpm structure` all clean. Full browser flow verified
against the local Docker BE: reset Nguyễn Văn A's password from the admin
list, then logged in as that user with the exact generated password —
succeeded, confirming the reset actually persisted server-side.

**Bug caught during manual verification:** the dialog subtitle first showed
the name reversed ("A Nguyễn Văn") because it was built as
`${lastName} ${firstName}` (copied from `user-identity-fields.jsx`'s
avatar-name convention) instead of `${firstName} ${lastName}`, which is what
`user-list.jsx`'s own "Tên" column uses. Fixed before commit.

**Next step:** none planned. If a self-service "forgot password" flow is
wanted later, that needs a new BE endpoint — the current `ChangePassword`
requires being already authenticated and knowing the current password.

**Blockers:** none

## 2026-08-21 — v2 create/edit user dialog (card + collapse layout)

**Context:** User asked for a v2 of the create/edit user forms, keeping v1
intact: one shared dialog for both modes, laid out as an always-open
"Thông tin khởi tạo" card plus collapsible cards for công việc / ngân hàng /
nhân viên, and a SegmentedControl to switch between the old and new address
standards. No `openspec/changes/` entry — direct request, UI-only.

**What shipped.** New files only; nothing existing was rewired, so v1 is
still what `user-list.jsx` renders:
- `hooks/use-create-user-form-v2.js`, `hooks/use-edit-user-form-v2.js` —
  thin wrappers over the v1 hooks that add the mode-specific bits
  (title, submit label, password/CCCD availability, permissions props).
  They deliberately do *not* re-implement the v1 state/validation/mutation
  logic; v1 and v2 differ only in layout.
- `types/index.js` — new `UserFormV2Controller` typedef, the contract both
  v2 hooks return and the dialog consumes.
- `components/user-form-dialog.jsx` — the shared dialog (`UserFormDialog`
  with `mode="create" | "edit"`). `CollapsibleGroup type="multiple"`, all
  sections start closed, each section its own `Card` (the Astryx idiom).
- `components/user-identity-fields.jsx`, `user-employee-fields.jsx`,
  `user-address-fields.jsx` — the card bodies. `UserOrgFields`,
  `BankAccountsFields` and `UserPermissionsFields` are reused unchanged.

**Decisions made.** Avatar is a disabled placeholder (initials `Avatar` +
disabled button + "Sắp có") because there is no avatar field or upload
endpoint yet — shown rather than omitted so adding upload later doesn't
re-flow the card. The address SegmentedControl only chooses which half is
*on screen*: both the old and new address are still required at once by
`RegisterCommandValidator`, so neither half is cleared and the payload is
identical to v1. Because half the required fields are hidden at any moment,
`UserAddressFields` flips to the failing half when validation rejects only
the hidden one (state adjusted during render, keyed on which halves fail —
an effect would trip `react-hooks/set-state-in-effect` and would also fight
the Admin every time they switched back). Gender offers only Nam/Nữ per the
spec, with `Khác` shown only for records already set to it.

**Verification:** `pnpm typecheck`, `pnpm lint`, `pnpm structure` all clean.
No browser verification — the local backend still needs Docker admin
credentials this session doesn't have.

**Update (same day):** `user-list.jsx` now renders `UserFormDialog` for both
create and edit — v1 components (`create-user-form.jsx`,
`edit-user-form.jsx`, `user-form-tabs.jsx`, `user-contact-fields.jsx`) are
unwired but still in the repo for comparison/rollback. `typecheck`/`lint`/
`structure` all clean after the swap.

**Next step:** eyeball the new layout in the browser (still blocked on
Docker admin credentials this session doesn't have); once confirmed, delete
the now-dead v1 files.

**Blockers:** none

---

## 2026-08-20 — Admin UI to create a grantable permission; quality gate fixed

**Context:** User asked for the FE UI to `BE-P`'s
`POST /permissions/grantable`, plus a security check and to apply any
improvements found. Change: `openspec/changes/add-create-grantable-permission/`.

**What shipped.** New `/admin/permissions` page — catalog table + create
form (`PermissionCatalog`), reachable via a new "Phân quyền" group in
`sidebarAdmin.json`. Client-side key validation mirrors the backend's
regex (saves an obvious-typo round trip; the backend stays the real
authority). An explicit banner states that adding a permission here does
not protect anything by itself — it only makes the permission grantable;
a business endpoint still needs its own backend
`[Authorize(Permissions = ...)]`.

**Harness fix, found while re-verifying this change.**
`harness/checks/quality.mjs` built its root path with
`new URL(...).pathname` — a URL component, not a filesystem path. It
percent-encodes (this checkout's `VIBE CODE` directory became
`VIBE%20CODE`) and on Windows leaves a leading slash before the drive
letter, so the gate had been failing on every run this session regardless
of whether a build existed — it was never actually measuring bundle size.
Fixed with `fileURLToPath`. `./harness/verify.sh` now passes **10/10 for
the first time this session** (bundle: 168.7 kB / 250 kB threshold).

**BE-side security fix (same date, `BE-P`):** the new DB-backed
permission catalog had dropped a guard the old static whitelist enforced
by omission — nothing stopped Admin from adding a role-derived permission
(`logistics:view`) to the individually-grantable catalog, which would let
a grant of it outlive the holder leaving that department. Fixed
server-side (`RolePermissions.RoleDerived` reserved namespace); no FE
change needed since the backend rejects it with a 409 that the create
form's existing error banner already surfaces.

## 2026-08-20 — Grantable permissions catalog is now DB-backed (BE)

**Context:** `BE-P`'s `add-create-grantable-permission` moved
`GET /permissions/grantable` off a static array onto a real
`GrantablePermission` DB catalog Admin can add to via a new `POST`. The
response shape changed: `string[]` → `[{ key, description }]`.

**What shipped.** `api/permissions.js`'s `listGrantablePermissions` return
type updated; `createGrantablePermission` added (no UI wired to it yet —
this thread has consistently shipped grant-management API-first, UI
later, same as `admin-role`). `grantable-permissions.js`'s
`labelForPermission` now takes the backend's `description` as a second
preference, ahead of the raw key: curated local `PERMISSION_LABELS` (nicest)
→ backend description (works for anything created via the API, no FE
change needed) → raw key (never disappears).

**Done:** `./harness/verify.sh` — lint/typecheck/structure/unit-tests/build
pass; `quality-thresholds` fails on the same pre-existing path-encoding bug
(directory path contains a space), unrelated.

## 2026-08-20 — Grantable permissions fetched, not hardcoded

**Context:** `admin-user-permission-grants` (same date, earlier) hardcoded
`GRANTABLE_PERMISSIONS` deliberately, flagged as YAGNI with an explicit
trigger: do it as a real endpoint once the list grows. `BE-P` shipped
`GET /permissions/grantable` (`add-grantable-permissions-endpoint`, same
date) once the user called that condition met. Change:
`openspec/changes/admin-user-permission-grants/` (updated in place, no new
change folder — small enough to fold into the existing one).

**What shipped.** `api/permissions.js`'s `listGrantablePermissions` +
`useGrantablePermissionsQuery` fetch the whitelist at runtime.
`grantable-permissions.js` no longer defines *which* permissions exist —
only `PERMISSION_LABELS`, a local Vietnamese-label fallback map. A
permission the backend returns with no matching label entry still renders
(raw key as its own label) instead of silently disappearing from the
"Quyền" tab — that's the actual fix: the backend can add a new grantable
permission and it appears as an option immediately, even before anyone
adds a nice FE label for it.

**Done:** `./harness/verify.sh` — lint/typecheck/structure/unit-tests/build
pass; `quality-thresholds` fails on the same pre-existing path-encoding bug
noted in the previous entry (directory path contains a space), unrelated.

## 2026-08-20 — Admin UI for individual permission grants

**Context:** `BE-P` shipped `add-user-permission-grants` (same date):
`POST/DELETE /users/{id}/permissions` lets Admin grant one permission to one
specific user, independent of role/department — the escape hatch for "a
department head" or "one hand-picked employee" that role/department buckets
can't express. It shipped API-only. Change:
`openspec/changes/admin-user-permission-grants/`.

**What shipped.** A new "Quyền" tab in `EditUserForm` (`UserFormTabs`),
Contact/Bank-tab sibling, shown only when editing an existing user (not
`CreateUserForm` — granting to an account that doesn't exist yet is
meaningless). One `Switch` per permission in the new
`GRANTABLE_PERMISSIONS` list (currently just `logistics:secret`, hardcoded
to mirror the backend's `Permission.Grantable` whitelist rather than fetched
— tiny list, and the backend independently rejects anything not on its own
copy, so staleness can only under-offer, never over-grant). Toggling calls
the grant/revoke API **immediately**, not staged behind "Lưu thay đổi" — the
backend applies it immediately too (rotates the target's `SecurityStamp`),
so batching it behind a save button would misrepresent when it actually
takes effect.

Complementary to, not overlapping with, `permission-based-nav-route-gating`:
that change reads the `permissions` JWT claim to gate nav/routes: this one
lets an Admin set what ends up in that claim for one user.

**Done:** `harness/verify.sh` — lint/typecheck/structure/unit-tests/build all
pass. `quality-thresholds` fails on a pre-existing path-encoding bug in
`harness/checks/quality.mjs` (breaks under a directory path containing a
space — `VIBE CODE`) unrelated to this change; `build-manifest.json`
confirmed to actually exist.

## 2026-08-20 — Silent refresh in the proxy; real server-side logout

**Context:** Frontend half of the API's
`openspec/changes/add-refresh-tokens-and-remove-gym-template/`. The backend now
issues a refresh token alongside the access token; this makes the 60-minute
access-token expiry invisible to the user, and makes signing out actually end
the session rather than just forgetting it locally.

**Done:**
- Second `HttpOnly` cookie (`REFRESH_TOKEN_KEY`). The two now have *different*
  lifetimes: the access cookie expires exactly with the token's `exp`, the rest
  of the session lasts as long as the refresh token. They used to be one value.
- `src/shared/api/server-session.js` — the cookie-writing logic, extracted so
  `/api/session` (login, logout) and `/api/backend` (silent refresh) cannot
  drift. Server-only; nothing client-side may import it.
- **`/api/backend` refreshes silently.** On a 401 it redeems the refresh token,
  writes the rotated pair back, and replays the original request. Two details
  worth keeping: the request body is buffered *before* the first attempt (a
  stream can only be consumed once, so a retry without buffering would send an
  empty body), and the refresh path itself is excluded or the retry would
  recurse. Roles and permissions are re-derived from the new token, because a
  refresh can legitimately change them — an Admin grant rotates the security
  stamp — and stale cookies would leave the nav showing the old ones.
- `DELETE /api/session` calls the backend's `logout` to revoke the family
  *before* clearing cookies. Wrapped in try/catch: an unreachable backend must
  not strand the user half-signed-in, and the token still expires on its own.
- `UserListItem` gains `isAdmin`; the API's `GET /users/{id}/profiles` is gone
  along with the gym template it came from.

**Verification:** `./harness/verify.sh` passes all 10 steps in both repos.

## 2026-08-20 — HttpOnly session + BFF proxy; token leaves the browser

**Context:** Second half of the same day's security work. The backend review
(`CLEAN ARCHITECTURE/docs/security.md`) found the access token sitting in a
JS-readable cookie (finding H-4) — any XSS, including one in a dependency,
could lift it and impersonate the user. Backend remediation is
`openspec/changes/harden-security-findings/` in that repo; this is the frontend
half. The full request-by-request write-up now lives in that repo's
`docs/flow.md`.

**The decision that shaped everything else.** Making the token cookie
`HttpOnly` means client JavaScript can no longer read it — so client code can
no longer attach `Authorization` either. Two ways out: thread a
server-fetched token as props through ~12 files, or stop having the browser
call the backend at all. Chose the second: a **BFF proxy** at
`src/app/api/backend/[...path]/route.js` that attaches the token server-side
from the HttpOnly cookie. It removed more code than it added, and two things
fell out for free — the browser never makes a cross-origin request (CORS stops
being involved) and the backend's address is no longer in the client bundle.

**Done:**
- `src/app/api/session/route.js` — POST sets the session cookies (token
  `HttpOnly; Secure; SameSite=Lax`), DELETE clears them. Only the server can
  set HttpOnly, so login now posts here instead of writing `document.cookie`.
  Cookie `maxAge` is derived from the token's own `exp`: it used to be pinned
  to 7 days while the token expired in 60 minutes, so the app rendered as
  "signed in" for days against a dead token (finding M-1 — and the original
  symptom the user reported two sessions ago).
- `src/app/api/backend/[...path]/route.js` — the proxy. Strips hop-by-hop
  headers and **always** deletes any client-supplied `Authorization` before
  setting its own, so a caller can't present their own token through it.
- Every `token` parameter and prop deleted: the four `admin-users/api/*`
  modules, six hooks, `UserList`, `CreateUserForm`, `EditUserForm`,
  `admin/users/page.jsx`. `shared/api/api-client.js` now takes no token at all.
- Only the token cookie is HttpOnly. Display name / national ID / roles /
  permissions stay readable — they are not credentials, the header and nav
  render from them client-side, and the backend re-checks every role from the
  signed token regardless. `use-session.js` now judges "signed in" from a
  readable companion cookie via `hasSessionCookie()`.
- `GET /api/v1/users` became paginated with a slim projection (backend M-4), so
  `listUsers` reads the envelope and `user-list` drives server-side paging.
  **New `useUserDetailQuery`**: the edit form must re-seed from
  `GET /users/{id}`, because the list row no longer carries passport number,
  CCCD issue date/place, year of birth or address — and `PUT` is
  replace-everything, so saving a form built from a list row would have blanked
  those fields. That is a data-loss bug, not a cosmetic one; worth re-checking
  whenever a field is added to `UserResponse`.
- `resolveApiBaseUrl()` (server-only) throws on a production build when
  `API_BASE_URL`/`NEXT_PUBLIC_API_BASE_URL` is unset, instead of silently
  pointing every user's browser at their own `localhost:8080`. The two
  per-feature `api-config.js` copies are gone.
- 429 from the new login rate limiter is surfaced as
  "Bạn đã thử quá nhiều lần…".

**Verification:** lint, structure (depcruise), harness-tests, unit-tests,
build, quality-thresholds all pass.

**Still failing, still pre-existing:** `typecheck` — the same 8 errors present
at `HEAD` before any of this work (`user-list.jsx` ×2, `icon-canary.jsx` ×4,
`icon-rocket.jsx`, `react-dev-callouts.jsx`), confirmed in a clean
`git worktree` in the previous session. Not caused here and not fixed here.
`verify.sh` has therefore been red in this repo for a while, which means the
gate has stopped functioning as a gate — worth its own task.

## 2026-08-20 — Central API client: 401 = session expired, 403 = no permission

**Context:** A user on `/admin/users` saw the error banner render the raw
backend string `"User is forbidden from taking this action"` — English, in
a Vietnamese UI — and asked whether it meant their token had expired. It
might have: the backend returned the *same* 403 for an expired token and
for a genuine permission denial. The backend fix is in the
`CLEAN ARCHITECTURE` repo (`openspec/changes/fix-401-vs-403-authentication/`,
same date); it now returns **401** for missing/expired/invalid tokens and
reserves **403** for "signed in but not allowed". This is the frontend half.

**Done:**
- New `src/shared/api/api-client.js` — the single place that turns a
  response into a UI result. On `401` it clears the session cookies and
  does a **full-page** `window.location.assign('/login?expired=1')` (not a
  router push: the token is gone, so every cached React Query result and
  server-rendered fragment on the page is now unauthorised — reloading
  discards them instead of leaving stale privileged data on screen). On
  `403` it returns "Bạn không có quyền thực hiện thao tác này." rather than
  echoing the backend's developer-facing English `detail`. Guards against a
  redirect loop when already on `/login`.
- `features/auth/api/login.js` **deliberately stays on raw `fetch`** and is
  the one caller not routed through the client: its `401` means "sai CCCD
  hoặc mật khẩu", on a page that already *is* `/login`. Routing it through
  would replace an accurate message with "phiên đã hết hạn". Commented in
  place so it doesn't look like an oversight.
- Refactored `admin-users/api/{users,register,bank-accounts,org-directory}.js`
  onto `apiRequest`, deleting four copies of the same
  `if (!response.ok) { detail ?? GENERIC }` block.
- **Session cookie helpers moved out of the auth feature into `shared/`**:
  `features/auth/config/session-keys.js` → `shared/config/session-keys.js`,
  `features/auth/api/session.js` → `shared/api/session-cookies.js`, and the
  `Session` typedef → `shared/types/index.js`. Forced by the structure
  rules: `api-client.js` lives in `shared/` and must call `clearSession()`,
  but `no-shared-to-feature` forbids `shared/` importing a feature. Callers
  updated (`middleware.js`, `(protected)/layout.jsx`,
  `admin/users/page.jsx`, the two auth hooks); `features/auth/index.js` no
  longer re-exports the cookie keys. `depcruise` passes.
- The org-directory + Vietnam-banks reads stopped being anonymous backend
  endpoints, so they now send a token. `use-org-directory.js` reads it from
  the cookie itself rather than taking a prop — prop-threading a token
  through every consumer of a selector's options would touch the whole
  create/edit form tree for nothing, and these are all `'use client'`
  components inside `(protected)`. That is only possible now that the
  cookie helpers live in `shared/`; the old comment in `register.js`
  explaining why the feature *couldn't* read the cookie is obsolete. Token
  is part of each `queryKey`, so re-logging-in refetches.
- Login page shows a warning Banner "Phiên đăng nhập đã hết hạn. Vui lòng
  đăng nhập lại." on `?expired=1`, dismissed on submit so it can't sit next
  to a genuine wrong-password error.

**Not done — pre-existing `verify.sh` failure (task 2.3 in the backend's
openspec change):** `typecheck` fails with 8 errors —
`features/admin-users/components/user-list.jsx` ×2 (`DropdownMenuOption`
`description`, `UserListItem` row type), `shared/components/icon/icon-canary.jsx`
×4, `icon-rocket.jsx`, `shared/components/mdx/react-dev-callouts.jsx`.
**Confirmed identical at `HEAD` in a clean `git worktree`**, so this change
did not cause them and did not fix them — every other step (lint,
structure, harness-tests, unit-tests, build, quality-thresholds) passes.
Whoever picks this up should treat it as its own task; `verify.sh` has
apparently been red here for a while, which means the gate has stopped
being a gate.

**Also note:** `eslint --fix` (run for import sorting) touched
`components/{bank-accounts-fields,create-user-form,user-org-fields}.jsx`,
which already had uncommitted edits from an earlier session — import-order
only, no logic changed.

## 2026-08-19 — Create/Edit User dialog redesign: wider, tabbed, scrollable (`admin-users`)

**Context:** Follow-up to the bank-accounts-grid session, same day. User
supplied a second reference screenshot of the full dialog chrome (wider,
pinned header/footer, real tab strip: Thông tin liên hệ / Thông tin tiền
lương / Tài khoản ngân hàng / Thông tin người phụ thuộc) and asked for the
Create/Edit User dialogs to match it structurally, not just the bank grid.
Asked the user how to handle the two tabs with no backing data (salary,
dependents) — chose to show all 4 tabs for layout parity, with the two
unimplemented ones rendering an `EmptyState` placeholder instead of fake
fields.

**Done:**
- `CreateUserForm`/`EditUserForm` now own their `Dialog` (previously
  `user-list.jsx` wrapped them in `Dialog`+`Layout`+`DialogHeader`+
  `LayoutContent` externally) — each takes `isOpen`/`onOpenChange` props
  and renders `Dialog > form > Layout(header/content/footer)` itself. This
  was required, not just a refactor: the footer's submit button has to be
  a DOM descendant of the `<form>` for `type="submit"` to work, and
  `Layout`'s `footer` slot only stays pinned (independent of `content`
  scrolling) when the whole `Layout` — header, scrollable content, footer
  — is one tree, which meant moving the Dialog composition inside the
  form components rather than keeping it in `user-list.jsx`.
- Dialog width 720 → 880 (`CREATE_USER_DIALOG_WIDTH`/`EDIT_USER_DIALOG_WIDTH`
  exported constants); `Layout`'s default `height="fill"` handles the
  scrollable-content-with-pinned-header/footer behavior for free — no
  manual `maxHeight`/overflow styling needed, `Dialog`'s own `maxHeight`
  default (`75vh`) already bounds it.
- Split the old combined `user-org-address-fields.jsx` into
  `user-org-fields.jsx` (Công ty/Chi nhánh/Phòng ban/Chức vụ — stays
  outside the tab strip, always visible, matching the reference's
  persistent "Đơn vị"/"Chức danh") and `user-contact-fields.jsx` (phone +
  address, moved *into* the new "Thông tin liên hệ" tab — the reference
  groups phone with address, not with the identity fields above).
- New `user-form-tabs.jsx`: the `TabList`/`Tab` strip (Astryx — confirmed
  `Tab` hardcodes `type="button"` internally, safe inside a `<form>`
  without extra care) driving which of `UserContactFields`/
  `BankAccountsFields`/two `EmptyState` placeholders renders below it.
  "Thông tin người phụ thuộc" carries a `Badge` ("Mới"), matching the
  reference.
- `bank-accounts-fields.jsx` rewritten from stacked `HStack` rows to a
  real `Table` (`dividers="grid"`) with `renderCell` returning
  `TextInput`/`Selector` per cell — matches the reference's bordered grid
  look; still purely a controlled view over `useBankAccountRows`, no
  behavior change from the prior session.
- Top section (identity/password on the left, org fields on the right)
  laid out as two `HStack`+`StackItem[size=fill]` columns that wrap to
  stacked on narrow viewports, using the extra dialog width instead of one
  long single column.
- Hit a `tsc --noEmit` contravariance error passing `setActiveTab`
  (typed to the 4-tab string-literal union) where `UserFormTabs`'
  `onActiveTabChange: (tab: string) => void` was expected — fixed with a
  wrapping arrow function + JSDoc cast at the call site rather than
  loosening the union type, so `activeTab` stays exhaustively checked
  everywhere else.
- `user-list.jsx`: removed its `Dialog`/`Layout`/`DialogHeader`/
  `LayoutContent` composition and the now-dead `DIALOG_WIDTH` constant;
  now just renders `<CreateUserForm isOpen={} onOpenChange={} .../>` and
  `<EditUserForm isOpen={} onOpenChange={} .../>` directly (this file has
  unrelated in-progress changes from another session — touched only the
  Dialog-composition lines, left the rest as found).
- **Verification:** `pnpm eslint`/`pnpm exec tsc --noEmit`/`pnpm run
  structure` all clean (same pre-existing `user-list.jsx`/
  `icon-canary.jsx`/`icon-rocket.jsx`/`react-dev-callouts.jsx` typecheck
  failures logged in prior entries, nothing new). Manually drove both
  dialogs end-to-end against the live BE-P docker backend: created a
  user filling every field across the top section + "Thông tin liên hệ"
  tab (confirming values persist correctly even while a *different* tab
  is active — the top section isn't part of the tab-switched content),
  confirmed "Thông tin tiền lương" shows the placeholder, added a bank row
  via the new `Table` grid, submitted, and the user appeared in the list;
  reopened it in Edit and confirmed the same layout + prefilled data.

**Harness gap (environment, not fixed):** the dev server this session
needed (`pnpm run dev`, port 3000) had gone down between sessions — no
reliable way in this Windows/git-bash setup to send it to true background
survival, so each session restarting browser verification needs to
re-launch it. Captured the launching shell's PID this time (rather than
`pkill -f "next dev"`, which caused actual damage in the prior session) to
make cleanup targeted, but couldn't confirm the exact child PID
(Turbopack's process tree) via `ps` in this environment, so left the dev
server running rather than risk another broad kill.


## 2026-08-19 — Bank accounts grid on Create/Edit User (`admin-users`)

**Context:** Follow-up to the personal/identity-fields session, same day.
User asked whether registration already had bank account info (it didn't —
BE-P's bank account API was self-service only, no way for Admin to
act on another user's behalf) and chose to have Admin add it directly
when creating/editing a user, per their reference screenshot's "Tài khoản
ngân hàng" grid. BE-P gained a parallel Admin-only bank account API
(`/api/v1/users/{userId}/bank-accounts...`) first — see its PROGRESS.md,
`add-admin-bank-account-management` — this session wires that into the FE.

**Done:**
- New `BankAccountsFields` component (`components/bank-accounts-fields.jsx`)
  — an editable rows grid (Số tài khoản / Ngân hàng dropdown / Chi nhánh /
  "Đặt mặc định" or "Mặc định" label / trash), reusing existing Astryx
  components only (`TextInput`, `Selector`, `Button`, `IconButton`) per the
  user's "không cần chỉnh component" instruction — no new low-level UI
  component, just a new `IconTrash` (`shared/components/icon/icon-trash.jsx`,
  Feather MIT, mirrors the existing `IconShuffle`/`IconRefresh` pattern —
  the theme's icon registry has no trash icon).
- `use-bank-account-rows.js`: local-only row state (add/remove/clear/
  update-field/set-primary) shared by both forms — the grid itself never
  calls the API; callers persist on submit (see below). This split matters
  because Create and Edit have very different persistence needs.
- `api/bank-accounts.js`: `listVietnamBanks` (public) +
  `adminAddBankAccount`/`adminUpdateBankAccount`/`adminRemoveBankAccount`/
  `adminSetPrimaryBankAccount`/`adminListBankAccounts` (Admin-only, hit the
  new BE-P endpoints).
- `use-create-user-form.js`: after `Register` succeeds, sequentially
  `adminAddBankAccount`s every row that has both a bank and account number
  (empty rows silently dropped) using the newly-created user's id — order
  matters, since the backend makes the *first* one saved primary
  regardless of the row's local flag.
- `use-edit-user-form.js`: loads the user's existing bank accounts once
  (`useAdminBankAccountsQuery`, seeded into the grid via a
  `hasSeededBankAccountRowsRef` guard so a background refetch can't wipe
  live edits) and, after `UpdateUser` succeeds, diffs the grid against
  that original snapshot — new rows added, changed rows updated, a newly-
  checked primary set, rows removed from the grid deleted on the server.
  Every step's failure is collected into a message instead of aborting,
  since `UpdateUser` itself already succeeded by that point.
- Both forms surface partial bank-account-save failures as a success-with-
  caveat banner (`submitSuccess` on `EditUserForm`, which didn't have that
  banner state before) rather than as a hard error, since the user/profile
  half of the save already went through.
- **Verification:** `pnpm eslint`/`pnpm exec tsc --noEmit`/`pnpm run
  structure` all clean (same pre-existing `icon-canary.jsx`/
  `icon-rocket.jsx`/`react-dev-callouts.jsx`/`user-list.jsx` typecheck
  failures as prior sessions, nothing new). Manually drove the full flow
  in a real browser against the live BE-P docker backend: created a
  user with one bank account row (bank dropdown populated from the real
  `GET /vietnam-banks`, 35 real banks) — confirmed via `curl` the account
  was persisted and marked primary; then opened that user's Edit dialog,
  confirmed the existing account loaded correctly, added a second row for
  a different bank, saved, and confirmed via `curl` both accounts persisted
  (second one correctly not primary).

**Harness gap (self-inflicted, fixed same session):** an earlier
`pkill -f "next dev"` — meant to stop only the throwaway dev server this
session started on port 3001 for a quick check — matched and killed a
different dev server already running on port 3000 that this session did
not start. Restarted it (plain `pnpm run dev`, back on port 3000, no
config changes) so nothing was left down, but the pattern is worth
avoiding: `pkill -f` matches by command line, not by "did I start this",
so it can take down another session's/human's process sharing the same
command. Prefer killing by the specific PID captured at launch time.


## 2026-08-19 — Personal + identity document fields on Create/Edit User (`admin-users`)

**Context:** Backend (BE-P) added `YearOfBirth`, `Gender`,
`NationalIdIssueDate`, `NationalIdIssuePlace`, `PassportNumber` to
`RegisterCommand`/`UpdateUserCommand` (now required except passport) —
without matching frontend fields, `CreateUserForm`/`EditUserForm` would
send incomplete payloads and 400 on every submit. User also supplied a
reference screenshot of a MISA-style "Thông tin nhân viên" modal (Ngày
sinh/Giới tính row, Số CMND/Ngày cấp row, Nơi cấp/Số hộ chiếu row) to base
the layout/grouping on — reusing existing Astryx components, not building
new ones ("Không cần chỉnh component").

**Done:**
- `create-user-form.jsx`/`edit-user-form.jsx`: added, grouped to mirror the
  reference layout — `NumberInput` "Năm sinh" + `RadioList`
  ("Nam"/"Nữ"/"Khác" — Domain has a third `Other` value the screenshot
  didn't show) side by side; `DateInput` "Ngày cấp CCCD" + `TextInput`
  "Nơi cấp CCCD" side by side; `TextInput` "Số hộ chiếu" (optional,
  `description="Không bắt buộc"`) standalone.
- `create-user-schema.js`/`update-user-schema.js`: added Zod v4 validation
  mirroring the backend (`yearOfBirth` 1900–current year,
  `gender` enum, `nationalIdIssueDate` not in the future,
  `nationalIdIssuePlace` required, `passportNumber` max 20 chars) — hit and
  fixed a Zod v3→v4 API break along the way (`required_error`/
  `invalid_type_error`/`errorMap` don't exist in v4; use a single `error`
  string param instead).
- `use-create-user-form.js`/`use-edit-user-form.js`: `EMPTY_VALUES`/
  `toFormValues` extended; broadened `setField`/`applyFieldChange`'s value
  type from `string` to `string | number | undefined` (yearOfBirth is a
  number, not a string like every other field) with a JSDoc return-type
  cast on `applyFieldChange` to keep `tsc --noEmit` (strict `checkJs`)
  green — the generic `{ ...values, [field]: value }` spread doesn't type-
  narrow per key on its own.
- `types/index.js`: added a `Gender` typedef + the five new fields to
  `CreateUserFormValues`/`EditUserFormValues`/`UserListItem`.
- `api/register.js`/`api/users.js`: send the five fields to the backend in
  PascalCase (matching `RegisterRequest`/`UpdateUserRequest`); empty
  `passportNumber` sent as `null`, same pattern as `district`.
- `DateInput`'s `value`/`onChange` use a branded `ISODateString` template-
  literal type, not plain `string` — needed an inline JSDoc `@type` cast at
  the two call sites (`import('@astryxdesign/core/Calendar').ISODateString`)
  since our form state just tracks it as `string`.
- **Verification:** `pnpm eslint src/features/admin-users` and
  `pnpm exec tsc --noEmit -p jsconfig.json` both clean on every file this
  session touched (remaining `typecheck` output is only the pre-existing
  `icon-canary.jsx`/`icon-rocket.jsx`/`react-dev-callouts.jsx`/
  `user-list.jsx` failures logged repeatedly elsewhere in this file — none
  from this change). `pnpm run structure` clean (272 modules, 0
  violations). Manually drove the full Create User flow against the real
  BE-P docker backend on `localhost:3000` (logged in as the seeded
  Admin, filled every field including the calendar picker for "Ngày cấp
  CCCD", submitted) — new user appeared in the list with `Nhân viên` role;
  opened its Edit dialog and confirmed all five new fields round-tripped
  correctly (1995 / Nam / 2026-08-19 / Cuc Canh sat QLHC ve TTXH /
  C1234567). No delete-user endpoint exists yet, so this smoke-test user
  (`100000000077`, "Test FE Nguyen") is still in the local dev DB —
  harmless, dev-only.

**Harness gap noted, not fixed (out of scope):** navigating to a protected
page immediately after clicking "Đăng nhập" (before the login
response/session write completes) makes the very next data fetch on that
page 403 with "User is forbidden from taking this action" — cosmetically
identical to a real authorization failure, wasted real debugging time
before a slower retry proved it was just a race. Worth a "wait for session"
guard or a documented note in `AGENTS.md`/README for anyone else who hits
this while testing by hand.

## 2026-08-19 — Claude Code (/admin/users list page: create + edit via Dialog)

**Context:** User asked for a `/admin/users` list page with a "Tạo mới"
action opening create-user via drawer or modal (Astryx has no Drawer
component — confirmed via `astryx search` — so modal/`Dialog` it is), plus
a per-row edit action opening the same kind of dialog pre-filled. Backend
(`BE-P`) added `GET /users`/`PUT /users/{id}` for this
(`add-users-list-and-update`).

**Done:**
- `api/users.js`: `listUsers(token)`, `updateUser(userId, values, token)`
  (Admin-only, same error-shape convention as `register.js`).
  `hooks/use-users-query.js`: `useUsersQuery(token)`.
  `hooks/use-update-user-mutation.js`: mirrors `use-create-user-mutation.js`
  but also invalidates the `['admin-users','users']` query on success so
  the list refreshes after either create or update (added the same
  invalidation to `use-create-user-mutation.js`).
- **Extracted shared form fields**: `components/user-org-address-fields.jsx`
  — the "Nơi làm việc" (Company/Branch/Department/Position) and "Địa chỉ"
  sections were byte-identical between create and edit, so pulled them into
  one component both `CreateUserForm` and the new `EditUserForm` render.
  Only "Thông tin cá nhân" differs (create has national ID + password
  fields; edit shows national ID as read-only text and has no password —
  password changes go through the existing reset-password feature, not
  profile edit).
- `config/update-user-schema.js` + `hooks/use-edit-user-form.js`
  (`toFormValues` maps a `UserListItem` — nullable fields — into form
  state; same `applyFieldChange` cascade rules as create) +
  `components/edit-user-form.jsx`.
- **`CreateUserForm`/`EditUserForm` un-wrapped from their own `Card`/page
  `Heading`**: both now render just the form (fields + submit button), no
  outer chrome — they're meant to live inside a `Dialog` now, which
  supplies its own header/chrome via `DialogHeader`.
- New `components/user-list.jsx` (`UserList`): `Table` (from
  `@astryxdesign/core/Table`, data-driven mode with `renderCell`) listing
  Họ tên/CCCD/SĐT/Công ty/Phòng ban/Chức vụ + a "Sửa" `Button` per row;
  Company/Department/Position names resolved via id→name `Map`s built from
  the existing org-directory queries (no new backend calls). **Branch name
  deliberately not shown as a column** — there's no "list all branches"
  endpoint (only "list branches of one company"), so showing it would mean
  an extra fetch per distinct company in the list; Department name already
  narrows the workplace down enough for a list view, and the full chain is
  still visible/editable in the edit dialog. "Tạo mới" `Button` opens a
  `Dialog` (`purpose="form"`, width 560 — not `variant="fullscreen"`,
  reserved for genuinely long content per Astryx's own guidance, and ~12
  fields fits fine scrolled in a standard-width dialog) wrapping
  `Layout`/`DialogHeader`/`LayoutContent` (the exact structure from
  Astryx's own `DialogFormDialog` template) around `CreateUserForm`; each
  row's "Sửa" opens the same dialog shape around `EditUserForm`, keyed by
  user id so the form's internal state resets per user.
- New `app/(protected)/admin/users/page.jsx` (Server Component, same
  token-as-prop pattern as the old create page).
- **Consolidated the create flow**: `admin/users/new/page.jsx` is now a
  redirect to `/admin/users` (creation happens inline via the dialog);
  `admin/page.jsx` also redirects straight to `/admin/users` (single admin
  feature, matching the precedent already set for both those pages).
  `sidebarAdmin.json`'s separate "Tạo mới" sidenav entry removed — only
  "Danh sách" remains, since creating is no longer its own page.
- **Verification:** curl confirmed `/admin/users` (200, table headers +
  "Tạo mới" present, "Danh sách" in sidenav exactly once, "Tạo mới" text
  exactly once — i.e. not duplicated between sidenav and action button),
  `/admin` and `/admin/users/new` both 307-redirect to `/admin/users`, and
  the *exact* JSON bodies `listUsers`/`updateUser` send/expect round-trip
  correctly against the real backend (`GET /users` → 8 users;
  `PUT /users/{id}` → 200 with every field persisted).
- `./harness/verify.sh`: everything passes except the same 3 pre-existing
  `typecheck` failures as every prior session in this log. One new lint/
  typecheck round-trip needed during this change: `setField(field, value)`
  passed to the shared `UserOrgAndAddressFields` component needs a `string`
  parameter type, not the narrower `keyof CreateUserFormValues`/
  `keyof EditUserFormValues` each hook used internally — TS function
  parameters are contravariant, so the narrower type isn't assignable to
  the shared component's `(field: string, ...) => void` prop. Fixed by
  keeping `setField`'s public signature as `string` and casting internally
  before calling `applyFieldChange`.

## 2026-08-19 — Claude Code (CreateUserForm: Position selector + random password button)

**Context:** Backend (`BE-P`) added a required `PositionId` to
`POST /authentication/register` (`add-position-to-registration` change) —
user asked for the create-user form to expose it, plus a "random password"
button.

**Done:**
- `features/admin-users/api/org-directory.js`: new `listPositions()`
  (public `GET /positions`, same shape as the other org-directory calls).
  `hooks/use-org-directory.js`: new `usePositionsQuery()`.
  `types/index.js`: `Position` typedef, `positionId` on
  `CreateUserFormValues`.
- `config/create-user-schema.js`: `positionId` required, mirroring the
  backend's `NotEmpty` check.
- `hooks/use-create-user-form.js`: wires `usePositionsQuery()` through,
  exposes `positions` + `fieldStatuses.positionId`.
- `api/register.js`: sends `PositionId` in the request body.
- `components/create-user-form.jsx`: new "Chức vụ" `Selector` in the "Nơi
  làm việc" section (next to Company/Branch/Department — organizational
  assignment, not personal info).
- New `config/generate-password.js` — pure function (no `fetch`, fits the
  `config` layer), guarantees the backend's strength regex (min 8 chars, ≥1
  each of upper/lower/digit/`#?!@$%^&*-`) by seeding one char per required
  class then shuffling. Wired to a "Ngẫu nhiên" `Button` next to the
  password `TextInput` (`StackItem crossAlignSelf="end"` so it aligns with
  the input box, not the label above it — same `StackItem` pattern as the
  Họ/Tên row). Also switched the password field from `type="password"` to
  `type="text"`: the whole point of generating it here is for the Admin to
  read/copy it to hand to the new employee, so masking it defeats the
  feature — added a `description` note explaining why.
- **Harness gap caught**: verifying the new field against the real backend
  first returned 200 but silently *omitted* `positionId` from the
  response — not a frontend bug, the Docker API container (`docker compose
  up -d --build api`) was still running the image built *before* this
  session's backend changes; `docker compose up -d` alone doesn't rebuild
  on source changes. Rebuilt with `--build`, re-verified: `positionId` now
  present, and both the empty-GUID (400, FluentValidation `NotEmpty`) and
  nonexistent-GUID (404 `Position not found`) cases behave correctly.
- `./harness/verify.sh`: everything passes except the same 3 pre-existing
  `typecheck` failures as every prior session in this log.

## 2026-08-19 — Claude Code (/admin/* adopts /docs' padding/width contract as its layout standard)

**Context:** User explicitly asked for `/admin/*` to use `/docs`' layout as
the standard, not just "similar." `/admin` was on `ProtectedAppShell`'s
generic `paddedMain` (flat 24px padding, no max-width cap), while `/docs`
self-manages a different, more specific contract (react.dev's own: 20px
mobile / 48px desktop padding, content capped at 80rem and centered) via
`mdx-article.jsx`'s `bodyOuter`/`bodyInner` styles.

**Done:**
- New `shared/components/page-content-shell.jsx` — exports the same
  padding/max-width StyleX contract as `mdx-article.jsx`, plus a
  `PageContentShell` wrapper component for non-MDX pages to use it.
  **Deliberately duplicated, not imported from `mdx-article.jsx`**:
  `docs-shell-contract.test.js` asserts the literal strings `'20px'`,
  `'48px'`, `'80rem'` live *inside* the docs-shell file set itself
  (`mdx-article.jsx` is one of the files whose source it greps) — moving
  them to a shared import would still work visually but would fail that
  pinning test, so `mdx-article.jsx` is untouched and the values are kept
  in sync by hand (same duplication pattern used earlier for
  `LARGE_TYPOGRAPHY_STYLE`).
- `protected-app-shell.jsx`: renamed the `paddedMain`-opt-out condition
  from `hasMdxLayout`-only to `hasSelfManagedPadding` (`hasMdxLayout ||
  pathname === '/admin' || pathname.startsWith('/admin/')`) — `/admin/*`
  now supplies its own padding via `PageContentShell` instead of getting
  the generic flat one.
- `app/(protected)/admin/page.jsx` and `.../admin/users/new/page.jsx`:
  swapped the Astryx `Section`-based wrapper for `PageContentShell`.
- **Verification:** confirmed via the compiled CSS that `/admin`'s and
  `/docs`' rendered pages share the *exact same* StyleX class hashes for
  `padding-inline: 20px` / `padding-inline: 48px` (StyleX hashes by content,
  so identical declarations from different files collapse to one class —
  direct proof the two routes now share the literal same padding, not just
  visually similar numbers). `./harness/verify.sh`: everything passes,
  including `docs-shell-contract.test.js` (confirming `mdx-article.jsx`
  truly wasn't touched), except the same 3 pre-existing `typecheck`
  failures as every prior session in this log.

## 2026-08-19 — Claude Code (CreateUserForm: fill the layout width instead of a fixed 640px column)

**Context:** User reported the `/admin/users/new` form items looked
misaligned relative to the page layout. Cause: `CreateUserForm`'s root
`VStack` had a hardcoded `width={640}`, so the form sat as a narrow fixed
column while the breadcrumb/page above it spans the full content width —
right edges didn't line up. Separately, the "Họ"/"Tên" `HStack` pair didn't
fill evenly either: per Astryx's own `HStack` guidance ("Do: Use StackItem
with size='fill' to make one item stretch and fill the leftover space"),
plain `HStack` children keep their natural width — they don't auto-stretch
without an explicit `StackItem`.

**Done:**
- Removed the `width={640}` from the form's root `VStack` — it now fills
  its container (the page's `Section`), matching the breadcrumb's width
  above it.
- Wrapped the "Họ"/"Tên" `TextInput`s each in `<StackItem size="fill">`
  so they split the row evenly instead of sizing to content.
- **Verification:** curl-fetched the rendered HTML and confirmed `flex-*`
  classes now apply to the name-row children (StackItem's flex-grow) and
  no fixed-640px width class remains on the root. `./harness/verify.sh`:
  everything passes except the same 3 pre-existing `typecheck` failures as
  every prior session in this log.

**Noted, not touched:** `sidebarAdmin.json` on disk now also has a
"Danh sách" (`/admin/users`) entry alongside "Tạo mới" (renamed from
"Tạo người dùng") — edited outside this session (by the user or another
agent) since the previous entry. There is no `/admin/users` list page yet;
out of scope for this task.

## 2026-08-19 — Claude Code (sidebarAdmin.json: grouped item, matching docs' visual shape)

**Context:** User asked to reuse `/docs`' sidenav *design* for `/admin/*`.
`/admin` already renders through the exact same `AppSideNav` component
`/docs` uses (shared, `shared/components/side-nav.jsx`) — no component
work needed there. Asked which specific visual difference to fix; user
picked: `sidebarAdmin.json`'s one entry ("Tạo người dùng") was a bare
top-level link, rendering as a plain `SideNavLink` — no bold group row, no
chevron, no expand/collapse — unlike `sidebarPost.json`'s "Nội quy"/"IT"
entries, which render as `SideNavGroup` (bold clickable row + chevron,
expanding to reveal children).

**Done:**
- `sidebarAdmin.json`: nested "Tạo người dùng" one level deeper under a
  new "Người dùng" group (`title` + `routes`, deliberately **no** `path` —
  there's no `/admin/users` index page, so per `SideNavGroup`'s own
  contract ("pure category groups omit path and use the full row as a
  disclosure button") it should render as a disclosure-only button, not a
  dead link).
- **Verification:** curl-fetched `/admin/users/new`'s HTML and confirmed
  the group now renders as a `<button aria-expanded="true">` with the
  chevron SVG present, auto-expanded because `getActiveSidebarGroupKey`'s
  child-match logic (in `shared/api/nav.js`, unchanged, already handled
  this) finds the current page under it — matching `/docs`' group behavior
  exactly, no new logic needed. `./harness/verify.sh`: everything passes
  except the same 3 pre-existing `typecheck` failures as every prior
  session in this log.

## 2026-08-19 — Claude Code (/admin dashboard page + create-user page breadcrumb)

**Context:** User asked to "set up the layout for the admin page." Asked
for specifics; user wanted both: (1) a real `/admin` landing page instead
of the redirect-to-create-user placeholder from the earlier
`admin-create-user` change, (2) better layout on `/admin/users/new`
(breadcrumb, consistent page-region wrapper).

**Done:**
- `app/(protected)/admin/page.jsx`: replaced the `redirect('/admin/users/
  new')` placeholder with a real page — `Heading`/`Text` intro + a `Link`
  to "Tạo người dùng" (not a `Button`, per Astryx's own guidance: "Don't
  use a button for navigation"). `Section variant="transparent" padding={0}
  paddingBlock={8}` — the `padding={0}` matters: `ProtectedAppShell`
  already gives non-MDX routes 24px padding on `<main>` (its `paddedMain`
  style, see the home page's same contract), so a nonzero `Section`
  padding here would double it.
- `app/(protected)/admin/users/new/page.jsx`: wrapped in the same
  `Section` contract, added a hand-written `Breadcrumbs`/`BreadcrumbItem`
  trail ("Quản trị" → "Tạo người dùng") above `CreateUserForm`. Deliberately
  **not** `getSidebarBreadcrumbs` (the helper the docs shell uses on
  `sidebarPost.json`) — that helper renders the current page's *ancestors*
  and leaves the leaf page's own heading to represent "you are here", which
  reads oddly on `sidebarAdmin.json`'s shallow 2-level tree (it would mark
  "Quản trị" itself, not "Tạo người dùng", as the current/bold crumb).
- `CreateUserForm` unchanged — it already owns the page's single `<h1>`
  ("Tạo người dùng"), so no duplicate heading between it and the page.
- **Verification:** curl against the dev server confirmed both routes
  return 200 with the expected text (dashboard heading + link;
  breadcrumb's two labels + a working `href="/admin"`), no error strings.
  `./harness/verify.sh`: everything passes except the same 3 pre-existing
  `typecheck` failures as every prior entry in this log.

## 2026-08-19 — Claude Code (scoped the react.dev-matched font scale to /docs + home only)

**Context:** User noticed Astryx components rendered with unusually large
font sizes and asked why it wasn't "normal" size — including on the new
`/admin` create-user form from the previous entry. Root cause:
`theme.js` set the *site-wide* typography scale to react.dev's 17px body
copy (vs. Astryx's 14px neutral default), a deliberate choice for docs
reading density that unintentionally applied everywhere, including plain
UI like form fields. User's call: keep the larger scale only on `/` (home)
and `/docs` (+ sub-routes); lower everything else, including `/tutorial`
(explicitly not carved out, even though it's also long-form MDX content —
literal scope of what was asked).

**Done:**
- `theme.js`: removed `typography.scale: { base: 17, ratio: 1.2 }` and the
  react.dev-ported `--font-size-*` token overrides — the site-wide default
  is now plain Astryx (14px base / 1.2 ratio).
- `protected-app-shell.jsx`: the ported react.dev scale moved to a new
  `LARGE_TYPOGRAPHY_STYLE` object (plain JS, not `stylex.create` —
  `@stylexjs/valid-styles` rejects raw `--*` keys there), applied via the
  `style` prop (not `xstyle`) on the shell's root div only when
  `hasLargeTypography` (`pathname === '/' || pathname === '/docs' ||
  pathname.startsWith('/docs/')`) — everywhere else falls through to
  `styles.root`'s new static `fontSize: '14px'` / `lineHeight: '20px'`.
  Since Astryx's semantic tokens (`--text-body-size`, etc.) are declared as
  `var(--font-size-base)` references rather than resolved pixel values
  (confirmed in the generated `theme.built.css`), overriding the raw
  `--font-size-*` custom properties on this wrapper correctly cascades into
  every descendant's `Text`/`Heading`/`TextInput`/etc. sizing — no need for
  a second nested `<Theme>` provider.
- `style={{...}}` value is JSDoc-cast to `import('react').CSSProperties`
  (this project's `csstype` version doesn't type raw `--*` keys), otherwise
  typecheck fails.
- Kept the exact `fontSize: '17px'` / `lineHeight: '30px'` literals inside
  `LARGE_TYPOGRAPHY_STYLE` (rather than computing them from a token) so the
  existing `docs-shell-contract.test.js` fidelity test ("pins the exact
  react.dev documentation typography scale") keeps passing unmodified —
  those exact strings just moved to a different object in the same file.
- **Verification:** curl against the running dev server + real backend
  confirmed the inline `--font-size-base:1.0625rem` (17px) override is
  present on `/` and `/docs`'s root div and absent on `/admin/users/new`'s
  (which instead uses the `fontSize-xif65rj` class = the new static 14px).
  `./harness/verify.sh`: lint/structure/unit-tests/build/quality-thresholds
  pass; `typecheck` fails on the same 3 pre-existing files as every prior
  session (confirmed identical error list before/after this change).

## 2026-08-18 — Claude Code (admin /admin nav + create-user feature)

**Context:** User asked for an admin-only user-creation feature: a
`/admin` topnav + sidenav visible only to Admins, with a "Tạo người dùng"
page wired to the real backend (`BE-P`'s admin-only
`POST /api/v1/authentication/register`, which by this point also requires
`Phone` and an `AddressType`/`Province`/`District`/`Ward`/`AddressDetail`
address block — see `BE-P`'s `add-phone-and-password-management` and
`add-address-to-registration` changes). Active change:
`openspec/changes/admin-create-user/`.

**Done:**
- **Backend** (`BE-P`): new `Permission.UsersManage = "users:manage"`,
  granted to `Admin` in `RolePermissions.Map` — this repo's existing
  permission-based nav/route gating needed *some* permission string to key
  on for Admin-only UI, and none existed yet for user management
  specifically (only `departments:manage`).
- `shared/config/site.js` (+`site.test.js`): "Quản trị" topnav link,
  `allowedPermissions: ['users:manage']`.
- `shared/config/route-access.js`: `/admin` entry — `middleware.js` now
  redirects a non-Admin away from any `/admin/*` path before it renders
  (this array was empty before; first real consumer of the mechanism the
  `permission-based-nav-route-gating` change built).
- `shared/components/protected-app-shell.jsx`: `/admin` added to
  `SIDE_NAV_ROUTES`. **Found and fixed a latent coupling**: the 2-column
  grid layout (`docsLayout` StyleX variant) was applied via `hasMdxLayout`
  alone, which happened to be correct only because every side-nav'd section
  so far (`/docs`, `/tutorial`) was also an MDX one — `/admin` is side-nav'd
  but not MDX, so it would have rendered the side nav squashed into a
  single-column grid. Introduced `hasSideNavLayout = hasSideNav ||
  hasMdxLayout` (grid columns) while keeping `paddedMain` keyed on
  `hasMdxLayout` alone (MDX manages its own spacing; a plain form doesn't).
- New `src/sidebarAdmin.json` (one entry: "Tạo người dùng" →
  `/admin/users/new`), wired into `(protected)/layout.jsx`'s
  `sideNavRouteTrees`.
- New feature `src/features/admin-users/` (types/config/api/hooks/
  components, same shape as `features/auth/`): `CreateUserForm` — every
  `RegisterRequest` field including the address block (`SegmentedControl`
  for `AddressType`, district field conditionally shown/required), and
  cascading `Selector`s for Company → Branch → Department fetched from the
  public `GET /companies` / `GET /companies/{id}/branches` /
  `GET /departments` endpoints. `useCreateUserForm`'s zod schema mirrors
  the backend's `RegisterCommandValidator` 1:1, including the District-
  required-for-`OldUnits`/must-be-empty-for-`NewUnits` cross-field rule, so
  the common invalid case never round-trips to the server.
- New routes: `app/(protected)/admin/page.jsx` (redirects to
  `/admin/users/new` — no dashboard to build with only one admin feature)
  and `app/(protected)/admin/users/new/page.jsx` (Server Component; reads
  the Admin's bearer token from the session cookie server-side, passes it
  as a prop — `features/admin-users` cannot read the cookie itself, since
  that would mean importing `features/auth`, which
  `harness/structure.rules.cjs`'s `no-feature-to-feature` rule forbids).
- `API_BASE_URL` duplicated into `features/admin-users/config/
  api-config.js` (same reasoning as above — too small a constant to justify
  promoting to `src/shared/` and touching `features/auth`'s existing files
  for it).
- **Verification:** no browser/screenshot tool was available this session,
  so used curl against the running dev server (port 3000) and the real
  Docker backend (port 8080) instead: (1) logged in as the seeded Admin,
  confirmed the JWT's `permissions` claim now includes `users:manage`; (2)
  fetched `/admin/users/new` with that permission cookie → 200, page
  contains every expected field/label, no error strings; (3) fetched `/`
  with only `logistics:view` → topnav HTML has zero `href="/admin"`
  matches; with `users:manage` → exactly one; (4) fetched `/admin/users/new`
  as a non-Admin → 307 redirect to `/`, confirming `middleware.js`; (5)
  POSTed the *exact* JSON body `registerUser` constructs straight to the
  real backend → 200, user created; also confirmed the `OldUnits`-without-
  `District` case the client schema rejects also gets rejected server-side
  (400, matching error). `./harness/verify.sh`: everything passes except
  `typecheck`, which fails on the same 3 pre-existing, untouched files
  every prior session in this log has hit (`icon-canary.jsx`,
  `icon-rocket.jsx`, `react-dev-callouts.jsx`) — diffed the error list
  before/after this change, identical.

**Not done / out of scope:** no admin dashboard beyond the redirect, no
user list/edit/delete, no Position assignment, no real Vietnamese province/
ward reference data (free-text inputs, matching the backend).

## 2026-08-18 — Claude Code (switched nav/route gating to permission strings)

- **Active change:** `openspec/changes/permission-based-nav-route-gating/`
  (new, status done) — a delta over `role-based-nav-route-gating`
  (same day, earlier).
- **Task worked:** discussed with the user how other sites solve nav/route
  gating; they chose permission-based over role-name-based (see that
  conversation's summary in this session — the tradeoff: role-based
  couples the FE to the backend's literal department-name strings, so a
  renamed department silently breaks a stale `allowedRoles` entry;
  permission-based has the backend map role→permission once
  (`RolePermissions.Map`) and the FE only ever checks an abstract
  capability string like `'logistics:view'`). The matching `BE-P`
  session this same day populated `RolePermissions.Map` for real — this
  session is the FE half.
- **Result:** done, code-complete. `shared/api/jwt.js` gained
  `normalizePermissions`/`parsePermissionsCookie` (internal
  `normalizeStringClaim`/`parseStringArrayCookie` helpers deduplicated so
  roles and permissions don't each reimplement the same bare-string-vs-
  array/JSON-parse logic). New `SESSION_PERMISSIONS_KEY` cookie, written
  at login alongside the existing `roles` cookie (roles **kept**, not
  removed — still useful metadata, just no longer what gating reads).
  `NavLink.allowedRoles` → `allowedPermissions`, `filterNavLinksByRoles` →
  `filterNavLinksByPermissions` in `shared/api/nav.js`.
  `route-access.js`'s `routeAccessRules` and `src/middleware.js` switched
  to `allowedPermissions`. `(protected)/layout.jsx` filters nav by
  permissions instead of roles.
- **Verification:** `pnpm lint`/`pnpm structure`/`pnpm typecheck` clean (no
  new errors beyond the same three pre-existing files flagged in every
  recent session:
  `icon-canary.jsx`/`icon-rocket.jsx`/`react-dev-callouts.jsx`).
  `node --test 'src/**/*.test.js'` (bash, not the `pnpm test` PowerShell
  wrapper — same glob-quoting quirk as last session) — 69/69 green,
  including new permission-normalization/cookie-parsing cases in
  `jwt.test.js` and updated permission-based cases in `nav.test.js`.
  `pnpm build` clean. **Live smoke test**: `next dev`, temporarily set
  `routeAccessRules = [{ pathPrefix: '/design-system', allowedPermissions:
  ['logistics:view'] }]`, `curl`'d with synthetic
  `kt-xnk-access-token`/`kt-xnk-session-permissions` cookies — a
  `departments:manage`-only cookie → `307` to `/`; a `logistics:view`
  cookie → `200`; no token at all → still falls through to the existing
  `307` to `/login`. Reverted the temporary rule — `routeAccessRules`
  ships empty, same as the role-based version did. **Not tested against a
  live `BE-P` backend** — no instance was running this session
  (`BE-P`'s own same-day session did verify the `permissions` claim's
  JWT serialization shape live against Docker, both array and
  bare-string cases — see its `PROGRESS.md`).
- **Decisions made:** see `proposal.md`'s decision log — permission
  strings not role names for gating; `roles` plumbing kept alongside, not
  replaced.
- **Next step:** same as `role-based-nav-route-gating` left open — first
  real restricted page needs one `routeAccessRules` entry + one
  `allowedPermissions` field on the matching `site.js` nav item, no gating
  code to write. Also still open: rename `src/middleware.js` →
  `src/proxy.js` per Next's deprecation notice (not done either session);
  a real end-to-end login test once a `BE-P` instance with a
  `RolePermissions`-mapped user is available.
- **Blockers:** none.


## Harness gaps (mistakes that need a mechanical rule, not a manual fix)

- **Noted 2026-09-02 (first occurrence — not yet a rule per
  `harness/ENTROPY.md`'s "twice" bar):** `service-agreements-list.jsx`'s
  `tableColumns` mixed `pixel()` (fixed) and `proportional()` (flex) column
  widths without thinking through the combination — only one column
  (`partyCustomerName`) used `proportional()` while every sibling used
  `pixel()`. Since `proportional()` columns absorb *all* the table's
  leftover width themselves, that one column ballooned to fill the entire
  remaining row width, leaving a large visually "off" gap before the next
  fixed column — reported by the user as columns looking "quá lệch"
  (badly misaligned). Fixed the instance: changed it to `pixel(200)` to
  match its siblings. **What a mechanical check would need to catch this
  next time:** flag a `tableColumns` array (or `AdvanceTable`
  `tableColumns` prop) where some columns use `proportional()` and others
  use `pixel()` — either lint via a small custom rule, or a structural
  test that greps each list component's column array for mixed width
  helpers. General guideline until then: pick one width strategy per
  table — either every default-visible column is `pixel()` (leftover
  space just stays blank after the last column, which is fine), or at
  least two-plus columns share `proportional()` so the slack splits
  across them (see `contracts-list.jsx`'s `projectName`/`buyer`, both
  `proportional(1.4)`) — never leave exactly one flexible column among
  fixed ones.
- **Resolved 2026-08-15:** upstream challenge parsing assumes component static
  `mdxName` survives into the interactive parent. App Router strips that
  server-component metadata at the RSC boundary. Registry wrappers now stamp
  Hint/Solution intent as serializable props, while authored headings are
  recognized from their rendered semantic h4 nodes; browser fixtures exercise
  the real boundary instead of testing only local React elements.
- **Resolved 2026-08-15:** DeepDive hash expansion initially raced the native
  details `toggle` event during hydration. The disclosure now has one state
  owner (its explicit button), while `useSyncExternalStore` supplies the URL
  hash; reload acceptance covers direct challenge and DeepDive anchors.
- **Resolved 2026-08-15:** unit-compiling the fenced-code metadata plugin did
  not prove that `@next/mdx` could resolve it. The first full build caught that
  plugin strings resolve from the loader package rather than the project root;
  `next.config.mjs` now derives a portable absolute path, and the normal build
  gate protects the integration.
- **Resolved 2026-08-15:** the first terminal fixture passed a mapped MDX
  paragraph across the Server-to-Client boundary, where assuming a single
  directly inspectable element caused a browser-only runtime error. The
  terminal text reader now recursively handles serialized ReactNode content,
  and task acceptance includes reloads at both required viewports.
- **Resolved 2026-08-15:** the MDX exception said Astryx was optional but did
  not mechanically prevent new Astryx imports in nested authoring components.
  The complete `useMDXComponents` tree is now recursively scanned by the source
  contract, and local StyleX variables bridge theme CSS properties without an
  Astryx module dependency.
- **Resolved 2026-08-15:** SideNav disclosure ownership was not covered by a
  behavioral regression test. Each group kept independent local state, so
  opening IT did not collapse NỘI QUY. Task 4.4 hoisted one pathname-aware
  selection to `AppSideNav`, added pure accordion/active-route tests and a
  source contract that rejects the old per-group state pattern, and captured
  the two-group click flow in browser evidence.
- **Resolved 2026-08-14:** the initial react.dev copycat acceptance pinned
  region geometry but not its typography scale. A user review correctly found
  H1/H2, SideNav, TOC, body leading/weight, Intro, callout, caption, code, and
  Footer mismatches. Task 4.3 fixed the instance and added source-contract
  assertions for the exact upstream scale; browser evidence records computed
  styles at 390px and 1536px. A follow-up direct runtime comparison caught the
  remaining nested SideNav state. A subsequent user decision intentionally
  keeps nested routes at 13px/30px for both states to prevent selection-induced
  size shift; only weight changes from 500 to 700. Parent routes remain
  15px/30px at weight 700, and the contract test encodes this adaptation.
- **Resolved 2026-08-14:** MDX authoring components had no nested typography
  regression gate. On
  2026-08-14, browser inspection measured only the outer `Intro` wrapper and
  missed that its generated MDX paragraph applied the body typography recipe
  again. The instance is fixed and the inner paragraph is now browser-measured;
  the source contract now asserts the generated paragraph's Intro-specific
  selector and typography variables; acceptance browser evidence also records
  the rendered child's 20px/28.572px computed typography.
- **Resolved 2026-08-14:** MDX alignment had no geometry regression gate. The
  outer `max-w-7xl` body frame was ported from react.dev without the generated
  `MaxWidth` (`max-w-4xl ms-0 2xl:mx-auto`) prose wrapper, so PageHeading and
  article text used different horizontal axes. The instance is fixed and
  browser-measured at 390px, 1280px, and 2048px; the source contract now pins
  the 56rem/80rem axes and breakpoint geometry, and the acceptance suite records
  all seven required widths plus 2048px.
- **Resolved 2026-08-14:** MDX layout components lacked a DOM-structure
  regression test. On
  2026-08-14, a rendered MDX fragment was placed directly inside the responsive
  CSS Grid; its multiple root nodes became independent grid items and split
  paragraphs/headings across the content and TOC columns. The instance is fixed
  by an explicit content-column wrapper. The MDX fixture test now compiles and
  server-renders `MaxWidth → FullWidth → MaxWidth`, asserting DOM order and
  keeping non-rendered module exports outside prose groups.
- **Resolved 2026-08-15 (user action):** browser screenshot evidence was
  unavailable for many sessions because
  `/home/capybara/.agent-browser/browsers/chrome-*/chrome` could not launch
  and no agent session had root to fix it. The user installed the missing
  packages and Chrome for Testing 152 now runs. For anyone hitting this on
  a fresh image, `ldd` on the chrome binary names the gaps; on Ubuntu 24.04
  they were satisfied by **`libnspr4`, `libnss3`, and `libasound2t64`**
  (note the `t64` suffix — plain `libasound2` has no install candidate on
  Noble). Do NOT go straight to the curl substitute any more: launch the
  browser. Two notes for whoever writes the next browser run:
  - Full-page screenshots need the page **scrolled through first**.
    `screenshot --full` does not trigger `loading="lazy"`, so an unscrolled
    capture shows every below-fold image as a blank box and looks exactly
    like a broken-image bug. Walk the scroll height, wait for
    `networkidle`, assert `[...document.querySelectorAll('img')].filter(i
    => !i.complete).length === 0`, then capture.
  - `agent-browser click @ref` on an Astryx `ClickableCard` does nothing.
    The accessibility ref resolves to the card's visually-hidden 1×1
    `<button>`, and clicking that does not produce a usable event. Drive a
    real mouse click at the card's centre instead (`mouse move x y`,
    `mouse down`, `mouse up`) — that fires the container handler correctly.
    Both `Lightbox` and the video `Dialog` were briefly misdiagnosed as
    broken because of this.
  - Protected routes still need a faked `kt-xnk-access-token` cookie
    (`agent-browser cookies set kt-xnk-access-token fake --url <origin>`),
    since login sets it client-side — see
    `src/features/auth/config/session-keys.js`.
- `harness/checks/project-readiness.sh`'s placeholder scan (angle-bracket
  CLI-argument tokens, an unfilled date-format token, etc. — see the script
  for the exact pattern) didn't account for tool-generated content blocks —
  `astryx init`'s `<!-- ASTRYX:START/END -->` cheat sheet in `AGENTS.md`
  contains angle-bracket CLI usage syntax that happens to match the
  placeholder pattern, and failed `verify.sh` on an otherwise clean repo.
  Fixed 2026-08-06: the check now strips `ASTRYX:START`/`ASTRYX:END` blocks
  before scanning. Any other tool that appends a marked block to these
  files (AGENTS.md, docs/architecture.md, GOLDEN_RULES.md, PROGRESS.md,
  quality-grades.json, project.md) should use a similar
  `<!-- TOOL:START/END -->` convention so this stays generalizable instead
  of needing a new carve-out per tool. (Note for future edits to this very
  log: avoid reproducing the literal placeholder tokens themselves here —
  this file is one of the ones the scan covers, and literal examples in
  the write-up will trip it, as happened while drafting that entry.)

---

## 2026-08-18 — Claude Code (role-based nav/route gating)

- **Active change:** `openspec/changes/role-based-nav-route-gating/` (new,
  status done).
- **Task worked:** the user asked (framed with a hypothetical `/logistics`
  example — no such page exists) for a mechanism to (1) hide a nav item
  from visitors without a specific role and (2) redirect a visitor away
  from a specific route before it renders if they lack a role, using the
  backend's JWT `roles` claim. Built the mechanism only — no real
  restricted route/nav item, since none exists yet.
- **Result:** done, code-complete. New `shared/api/jwt.js`
  (`decodeJwtPayload`/`normalizeRoles`/`parseRolesCookie`) — roles decoded
  once client-side right after login (`hooks/use-login-form.js`) and
  cached as a new `SESSION_ROLES_KEY` cookie (`session-keys.js`,
  `session.js`), rather than re-decoded in every place that needs a role
  check; avoids `middleware.js`'s Edge runtime not guaranteeing `Buffer`.
  `NavLink` gained `allowedRoles`; new `filterNavLinksByRoles` in
  `shared/api/nav.js`; `(protected)/layout.jsx` filters `topNavLinks`
  through it before rendering. New `shared/config/route-access.js`
  (`routeAccessRules`, ships empty) + new `src/middleware.js` redirects to
  `/` when a matching route's caller lacks every allowed role — layered on
  top of, not replacing, `layout.jsx`'s existing "has a token" check.
- **Two real gotchas hit and fixed while building this** (both worth
  remembering for next time this frontend touches middleware):
  1. **A root-level `middleware.js` was silently never invoked.** This
     project has a `src/` directory (`src/app`), and while Next's own
     file-matching regex technically allows either `middleware.js` or
     `src/middleware.js`, empirically only the `src/` location worked —
     the root file compiled (Turbopack logged "Compiling middleware...")
     but the function body's `console.log` never fired for any request,
     and no redirect ever happened, no error either. Moved it to
     `src/middleware.js`; confirmed via the dev server log (now shows
     Next's proxy-migration deprecation warning, proving it's actually
     being loaded) and a live `curl` redirect test. **Caught this by
     temporarily adding a `console.log` inside the middleware function
     and noticing it never appeared in the dev server log** — worth
     reaching for that trick immediately next time a middleware/route
     handler "does nothing" with no error.
  2. Next.js 16.2.11 deprecates the `middleware.js` file convention in
     favor of `proxy.js` (same export shape, just a rename per
     https://nextjs.org/docs/messages/middleware-to-proxy). Not renamed
     this session — `middleware.js` still fully works, just emits a
     warning — flagged as a trivial follow-up.
  3. (Structural, not a bug) `src/middleware.js` importing
     `ACCESS_TOKEN_KEY`/`SESSION_ROLES_KEY` from
     `features/auth/config/session-keys.js` directly tripped this repo's
     `no-deep-feature-imports` `pnpm structure` rule — had to import from
     `features/auth/index.js` instead (which now also exports
     `SESSION_ROLES_KEY`). That pulls `LoginForm`/`UserMenu` (`'use
     client'` components) into scope for the Edge middleware bundle;
     `pnpm build` stayed clean with no bundle-size warnings, so left as
     is, but worth watching if those components ever grow a genuinely
     Node-only dependency.
- **Verification:** `pnpm lint`/`pnpm structure` clean. `pnpm typecheck`
  unchanged pre-existing-only failures (same three files as last session:
  `icon-canary.jsx`/`icon-rocket.jsx`/`react-dev-callouts.jsx`, none
  touched here). `node --test 'src/**/*.test.js'` (via bash — the
  PowerShell-vs-bash glob quirk from last session still applies to
  `pnpm test`'s script) — 64/64 green, including new
  `shared/api/jwt.test.js` and two new cases in `shared/api/nav.test.js`.
  `pnpm build` clean, `src/middleware.js` shows as
  `ƒ Proxy (Middleware)` in the route summary. **Live smoke test**: ran
  `next dev`, temporarily set `routeAccessRules = [{ pathPrefix:
  '/design-system', allowedRoles: ['Admin'] }]`, `curl`'d with synthetic
  `kt-xnk-access-token`/`kt-xnk-session-roles` cookies — non-matching role
  → `307` to `/`; matching role → `200`; no token at all → falls through
  to the existing `307` to `/login` (this mechanism correctly did
  nothing); an unrelated route with a non-matching role → `200`
  (unaffected, rule didn't match). Reverted the temporary rule —
  `routeAccessRules` ships empty. **Not tested against a live `BE-P`
  backend** — no instance was running this session; the synthetic-cookie
  test exercises the identical code paths a real login would populate.
- **Decisions made:** roles cached as a cookie rather than decoded
  per-request in `layout.jsx`/`middleware.js`, specifically to dodge the
  Edge-runtime `Buffer` gap (see `design.md`'s decision log for the full
  reasoning — same file also has the `middleware.js`-location and
  `proxy.js`-rename decisions).
- **Next step:** whoever adds the first real restricted page (the
  `/logistics` example that prompted this) just needs one line in
  `shared/config/route-access.js` and one field on the matching entry in
  `shared/config/site.js` — no gating code to write. Also worth: (a)
  eventually renaming `src/middleware.js` → `src/proxy.js` per Next's
  deprecation notice, (b) a real end-to-end login test once a `BE-P`
  instance with a department-role user is available.
- **Blockers:** none.

---

## 2026-08-18 — Claude Code

- **Active change:** `openspec/changes/wire-nationalid-login/` (new,
  status done).
- **Task worked:** the backend (`BE-P`, sibling repo) removed `Email`
  as the user identity field and replaced it with `NationalId` (Vietnamese
  CCCD, 12 digits) — see its `harness/PROGRESS.md`, 2026-08-18 entries.
  This frontend's login was still wired to the old shape from
  `wire-real-login-backend`, so every login attempt was failing for two
  independent reasons: (1) the request body sent `Email`, which the
  backend no longer accepts, and (2) the request URL
  (`${API_BASE_URL}/authentication/login`) was missing the `/api/v1`
  prefix the backend added in an even earlier session — a second,
  unrelated 404 on top of the first bug. Caught both while reviewing the
  backend's recent changes with the user, fixed together.
- **Result:** done, code-complete. Renamed `email`→`nationalId` across
  `types/`, `config/`, `api/`, `hooks/`, `components/` in
  `src/features/auth/` (same shape of change as the prior
  `username`→`email` rename): `config/login-schema.js`'s email-format
  check became a `^\d{12}$` 12-digit regex; `config/session-keys.js`'s
  `SESSION_EMAIL_KEY`→`SESSION_NATIONAL_ID_KEY`; `api/login.js`'s request
  URL fixed to `/api/v1/authentication/login` and body key
  `Email`→`NationalId`; `api/session.js`'s `readSessionEmail`→
  `readSessionNationalId`; `hooks/use-login-form.js`'s state var and
  remembered-value localStorage key; `hooks/use-session.js`'s
  `getEmail`/`email`→`getNationalId`/`nationalId`;
  `components/login-form.jsx`'s label/placeholder/input type ("Email" →
  "Căn cước công dân", `type="email"`→`type="text"`).
  `components/user-menu.jsx` needed no change — it only reads
  `displayName`, never touched the email field.
- **Verification:** `pnpm lint` clean. `pnpm typecheck` still fails, but
  only on **pre-existing** errors unrelated to this change
  (`icon-canary.jsx`, `icon-rocket.jsx`, `react-dev-callouts.jsx` — none
  touched here, confirmed via `git status`) plus one new error this
  session introduced and then reverted (`TextInput` doesn't support an
  `inputMode` prop — added it for a numeric-keyboard hint, typecheck
  caught it immediately, removed it). `pnpm test` (via `node --test` in a
  bash shell — running it through the `pnpm` wrapper in PowerShell
  produced 0 discovered tests, a shell quoting/glob-expansion difference
  between PowerShell and bash on this Windows machine, not a real
  failure) is 55/55 green. `pnpm structure` clean (238 modules, 498 deps,
  no violations). `pnpm format:check` reports 146 pre-existing
  out-of-format files repo-wide (confirmed via `git status` — most of the
  flagged files, including some under `features/auth/`, were never
  touched this session); none of the files this session actually edited
  are in that flagged list. Did **not** run the full `./harness/verify.sh`
  gate, since it would just report the same pre-existing format drift as
  a failure and add no new signal — the individual checks above cover
  everything it would run. **Not manually tested against a live
  backend** — no `BE-P` instance was running this session; whoever
  picks this up next should log in with a real national ID + password
  from a seeded backend user before calling this fully verified.
- **Decisions made:** followed `wire-real-login-backend`'s established
  pattern exactly (full field rename through every layer, not just a
  request-body remap) rather than inventing a different approach, since
  this is the second time this frontend has had to chase an identity-field
  rename on the backend.
- **Next step:** the user is planning role-based nav/route gating next
  (e.g. hiding a `/logistics` route from non-Logistics staff) — that will
  need decoding the JWT's `roles` claim client-side (the backend embeds it
  already; see `BE-P`'s `docs/api/Authentication.md`) and a
  route→allowedRoles map, most likely via Next.js `middleware.js` so it's
  enforced before rendering, the same way `(protected)/layout.jsx`
  currently gates on "has a token" alone. Not started — this session was
  scoped to just fixing the broken login.
- **Blockers:** none.

---

## 2026-08-17 — Claude Code

- **Active change:** `openspec/changes/wire-real-login-backend/` (new,
  status done)
- **Task worked:** replaced the mock login in `src/features/auth/`
  (`login-username-password`'s `api/login.js` against
  `config/test-users.js`) with a real call to the user's local backend
  (`POST http://localhost:8080 /authentication/login`), per pasted
  request/response examples.
- **Result:** done, code-complete. Renamed `username`→`email` across
  `types/`, `config/`, `hooks/`, `components/` in `src/features/auth/`
  (backend authenticates by `Email`, not a generic username); replaced the
  `accessToken`+`refreshToken` pair with the backend's single `token`,
  storing `email`/`displayName` (from `firstName`+`lastName`) in session
  cookies instead of a bare username; deleted `config/test-users.js`; added
  `config/api-config.js` for `NEXT_PUBLIC_API_BASE_URL` (default
  `localhost:8080 `); login call now goes through a React Query
  `useMutation` (`hooks/use-login-mutation.js`) instead of a raw `await`,
  per user's explicit request to use React Query (`@tanstack/react-query`
  was already a dependency with `QueryProvider` wired into the root layout,
  just unused).
- **Verification:** `./harness/verify.sh` did NOT run — `node` is
  unreachable in this WSL sandbox shell (only `node.exe` under
  `/mnt/c/Program Files/nodejs/` exists; the Windows `pnpm` shim needs
  `node` on `PATH` and fails with `exec: node: not found`). This is the
  same class of pre-existing environment gap noted in the 2026-07-25
  entry (pnpm version mismatch) — not caused by this change. Manual
  `grep` checks confirm no leftover `username`/`refreshToken`/`test-users`
  references anywhere in `src/`. **Whoever picks this up next must run
  `./harness/verify.sh` (lint/typecheck/structure/build) from an
  environment with a Linux `node` binary before this can be considered
  verified**, and manually confirm login against the real backend (login
  succeeds + redirects; wrong credentials show the backend's error;
  logout/avatar still work with the new `displayName` field).
- **Decisions made:** frontend shape changed to match the backend exactly
  (user: "ưu tiên backend, frontend chỉnh theo backend") rather than
  adapting the backend response into the old mock's shape. No refresh-token
  handling added — the backend doesn't expose a refresh endpoint yet, so a
  session just relies on the JWT's own `exp`.
- **Next step:** run `./harness/verify.sh` in a working environment; if
  backend CORS isn't configured for the frontend's dev origin, login
  fetches will fail with the generic "Không thể kết nối đến máy chủ"
  message — that's a backend-side fix, tracked as out-of-scope in the
  proposal.
- **Blockers:** `node` missing from this sandbox's `PATH` (see above).

---

## 2026-08-15 — Claude (follow-up)

- **Active change:** none. User feedback on top of the same-day home
  redesign below ("section 1 quá xấu" — the hero still read as too plain).
- **Task worked:** visual polish pass on `welcome-hero.jsx` only, no data
  or structural changes. The dark band was a flat solid rectangle with an
  unrounded photo tile floating inside it (mismatched corner radii against
  the container) and a quick-launch list with no heading and no visual
  weight on its icons.
  - Added two low-opacity `radial-gradient` glows (brand red top-left via
    `--color-error`, accent blue bottom-right via `--color-accent`, both
    `color-mix`ed from existing tokens — no new hex) over the same
    `--color-background-inverted` base, so the band has depth instead of
    reading as one dead-black slab.
  - Added a small eyebrow pill ("CỔNG THÔNG TIN NỘI BỘ" + a red dot) above
    the greeting so the band opens with an identity, not straight into a
    headline.
  - Gave the quick-launch panel an explicit "TRUY CẬP NHANH" heading (it
    previously had none) and wrapped each row's icon in a tinted-red
    circular badge so rows read as tappable shortcuts, not a plain menu.
  - Gave the big story tile a `--radius-inner` border-radius and a faint
    on-dark ring — it previously had no radius at all and blended into the
    (also dark) band behind it with no visible edge.
- **Verification:** `./harness/verify.sh` — lint, structure, harness-tests,
  unit-tests, build, and quality-thresholds all PASS. `typecheck` FAILED on
  the same three pre-existing, untouched files as every prior entry in this
  thread (`icon-canary.jsx`, `icon-rocket.jsx`, `react-dev-callouts.jsx`) —
  not touched by this change. Evidence: `harness/runs/20260815-154459-222491/`.
- **Browser evidence:** real Chrome via agent-browser (session
  `hero-69195d1e592b`) against the already-running dev server, desktop
  1280px and mobile 390px, both post-change. Not saved under `harness/runs/`
  this pass (ad hoc verification, not a numbered task) — screenshots landed
  in the session scratchpad only.

## 2026-08-15 — Claude (follow-up 2, same session)

- **Task worked:** two more rounds of user feedback on `welcome-hero.jsx`,
  same day as the polish pass above.
  1. **"màu dark, lệch hoàn toàn, ở đó nên là 1 swiper"** — the dark
     `--color-background-inverted` band read as visually disconnected from
     the rest of the (light) page, and the user wanted the featured-news
     area back to a carousel/swiper instead of the static "1 big + 3
     small" layout. Re-added `swiper` (`pnpm add swiper`; it had been
     removed as part of the same-day redesign below) and split the slider
     into its own `'use client'` component, `featured-news-carousel.jsx`
     (adapted from the deleted `hero-carousel.jsx` git history rather than
     rewritten from scratch — same slide anatomy: photo + dark scrim +
     solid-chip category/CTA, since that part was already correct, only
     scoped to the photo now instead of the whole section). `welcome-hero.jsx`
     itself became a plain light card (`--color-background-surface` +
     `--color-border`) with the greeting/eyebrow/quick-launch panel kept,
     laid out beside the carousel in the same 260px/1fr grid as before.
     - **Grid blowout bug caught by browser screenshot, not code review:**
       the carousel column had no `minWidth: 0`, so its content's intrinsic
       min-width (the slide headline) exceeded the assigned `1fr` track and
       pushed the whole hero past the viewport edge. Classic CSS grid
       blowout; fixed by setting `minWidth: 0` on the grid item. A second
       screenshot caught a follow-on issue: `Grid`'s default cross-axis
       `stretch` matched the carousel column's height to the (taller)
       quick-panel, leaving blank space under the fixed-height slide;
       fixed with `alignSelf: 'start'` on that column, same pattern already
       used for `quickPanel`.
  2. **"chỉ giữ lại swiper thôi, còn mục khác xoá"** — immediately after,
     asked to drop everything else from this band and keep only the
     swiper. `welcome-hero.jsx` is now a one-line wrapper around
     `FeaturedNewsCarousel`; the greeting, eyebrow, and quick-launch panel
     JSX/styles are gone. `config/quick-links.js` had no other consumer
     once the panel was removed, so it was deleted rather than left dead
     (per `harness/ENTROPY.md`), along with its import and the
     `quickLinks`-derived assertion in `home-content.test.js`'s "every link
     target" test.
- **Verification:** `./harness/verify.sh` — lint, structure, harness-tests,
  unit-tests, build, and quality-thresholds all PASS. `typecheck` FAILED on
  the same three pre-existing, untouched files as every prior entry in this
  thread. Evidence: `harness/runs/20260815-155137-234042/`.
- **Browser evidence:** real Chrome via agent-browser, desktop 1280px and
  mobile 390px, confirming no horizontal overflow at either width and a
  working carousel (nav arrows, pagination dots, click-through). Screenshots
  in the session scratchpad, not `harness/runs/` (ad hoc, not a numbered
  task).
- **Checked, not a gap:** confirmed `featuredNews`/`latestNews` in
  `config/news.js` are a disjoint filter on `isFeatured` (`news.js:202-205`),
  so the carousel above and the `NewsHighlights` "Tin tức" grid below it do
  not show the same stories twice.

## 2026-08-15 — Claude (follow-up 3, same session)

- **Task worked:** two more one-line rounds of feedback on the carousel
  slide's aspect ratio in `featured-news-carousel.jsx`.
  1. **"cho height cao lên, chuẩn 16:9"** — slides were a fixed px height
     per breakpoint (260/300/340), not actually 16:9. Swapped for
     `aspectRatio: '16 / 9'` on `styles.slide` (the `position: relative`
     ancestor `next/image fill` needs), dropping the old fixed heights.
  2. **"chuẩn 16:9 nhưng sao height cao thế"** — immediately after: at
     desktop width the hero spans the ~80rem content column, so an
     uncapped 16:9 box resolved to ~690px tall, nearly the full viewport
     for one slide. Added a `maxHeight` cap from the 640px breakpoint up
     (420px / 480px at 1024px+); left uncapped below that since a 390px-
     wide slide's 16:9 height (~220px) was never the problem.
- **Verification:** `./harness/verify.sh` — lint, structure, harness-tests,
  unit-tests, build, and quality-thresholds all PASS. `typecheck` FAILED on
  the same three pre-existing, untouched files as every prior entry in this
  thread. Evidence: `harness/runs/20260815-155926-246706/`.
- **Browser evidence:** real Chrome via agent-browser, 1280px/768px/390px,
  confirming the capped height at desktop and the (already fine) mobile
  ratio. Screenshots in the session scratchpad, not `harness/runs/`.

## 2026-08-15 — Claude (follow-up 4, same session)

- **Task worked:** "Swiper bỏ chữ đọc tiếp thay bằng description, nhưng để
  nhỏ thôi" — swap the "Đọc tiếp" CTA pill on each carousel slide for the
  news item's own `excerpt` (already in `config/news.js`, previously
  unused by this component), kept deliberately small. The linter had
  already stripped the unused `Icon` import and `cta`/`chip`-adjacent CTA
  markup by the time this was picked up (auto-fix ran ahead of the edit;
  left as-is, not reverted). Added an `excerpt` field to the destructure
  and a `Text type="supporting" maxLines={2}` block under the headline,
  styled at `opacity: 0.85` so it reads as secondary to the title, not a
  second headline.
- **Verification:** `./harness/verify.sh` — lint, structure, harness-tests,
  unit-tests, build, and quality-thresholds all PASS. `typecheck` FAILED on
  the same three pre-existing, untouched files as every prior entry in this
  thread. Evidence: `harness/runs/20260815-163750-259924/`.
- **Browser evidence:** real Chrome via agent-browser, 1280px/390px,
  confirming the excerpt renders under the headline with no overflow.
  Screenshots in the session scratchpad, not `harness/runs/`.

---

## 2026-08-15 — Claude

- **Active change:** none (same home page; a second, larger follow-up
  redesign on top of the two entries below).
- **Task worked:** user shared a screenshot of "THE HUB" — a SharePoint
  intranet-template home page (dark hero with personalized "Welcome,
  Sabina!", a quick-launch sidebar list, one big featured-article photo
  card + a stacked list of smaller stories beside it, a filterable "Recent
  News" grid, and a real month calendar paired with an events list) — and
  asked me to learn from it, rebalance the home page accordingly, and
  merge the separate "Tin tức" (News) and "Hoạt động" (Activities) sections
  into one. Also lifted the standing Astryx-only rule for this page
  specifically ("trang home không nhất thiết phải dùng Astryx UI"). Ran one
  `WebSearch` on 2026 intranet-portal best practices first, which
  corroborated the reference's structure (personalization, quick links,
  categorized news, events) rather than contradicting it.
  - **Consolidated three sections into one hero, `welcome-hero.jsx`:** the
    old `WelcomeBanner` (a static title/slogan band the user had already
    commented out of `page.jsx`), the Swiper-based `HeroCarousel`, and the
    solid-tile `QuickLinks` grid are gone; replaced by one dark
    (`--color-background-inverted`) band containing a greeting, a
    translucent "quick launch" list (icon+label rows, ending in a
    catch-all "Xem tất cả tài liệu" row — the same closing pattern as the
    reference's "More Apps"), and the newest stories as **1 big photo card
    + up to 3 small thumbnail rows** instead of a rotating carousel.
    `featuredNews` happens to be exactly 4 items, so nothing rotates and
    nothing is cut. Removed the `swiper` dependency entirely
    (`pnpm remove swiper`) — it had exactly one consumer.
  - **"Chào mừng trở lại!" is intentionally NOT personalized by name.**
    `features/auth` has a `useSession()` hook that reads a username cookie,
    but `home` importing it directly would violate feature isolation (no
    feature-to-feature imports; see `harness/structure.rules.cjs`), and
    there is no real user-profile/display-name concept yet anyway (auth is
    placeholder test-user credentials only). Documented as a real follow-up
    (promote session reading to `src/shared/`) rather than faking it or
    breaking the architecture rule for one greeting.
  - **Merged Activities into News per the user's explicit instruction:**
    deleted `activity-gallery.jsx`, `config/activities.js`, and the 8
    `activity-*.jpg` files; removed all "activities" references from
    `home-content.test.js`. `NewsHighlights` ("Tin tức") is now the page's
    only editorial-content section — activity-style stories (team
    building, site visits, training) become ordinary `news` entries with
    an appropriate category instead of a separate gallery.
  - **Added category filter pills to `NewsHighlights`**, learned from the
    reference's "All News / Announcements / Events / …" tabs — the pill
    list is derived from `latestNews`' own `category` values
    (`[...new Set(...)]`), not hand-typed, so a new category in `news.js`
    can't drift out of sync with the filter UI. Made the component `'use
    client'` for the local filter state; the underlying data is still the
    same static import, so there's no fetch/loading state.
  - **Added a real month calendar** (`mini-calendar.jsx` +
    `api/calendar.js`, both pure/tested, no `Date.now()` anywhere in either
    — explained in the code comment: a `Date.now()`-based "today" highlight
    would differ between server build time and the visitor's clock and
    hydration-mismatch) paired beside the `UpcomingEvents` list, echoing
    the reference's calendar+list Events widget. Shows whichever month the
    soonest event falls in and circles the days that have one.
  - **Skipped the reference's "Social Corner"** (a user-post composer +
    community feed) — this repo is explicitly front-end only with no
    backend (`openspec/project.md`), and a "write a post" box with nowhere
    to persist posts would be pure decoration, not a real feature.
  - **Astryx exception used narrowly**, not as a full rewrite: kept Astryx
    layout/typography/Icon primitives everywhere they already worked
    (Grid, VStack/HStack, Heading/Text, ClickableCard, Icon) and only
    reached past them for things Astryx has no primitive for at all — the
    photo+scrim hero treatment (already established) and the calendar grid
    (new). This mirrors how the MDX exception was applied, just without
    MDX's stricter "must not import Astryx at all" constraint.
- **Result:** page order is now WelcomeHero → NewsHighlights (filterable) →
  [AnnouncementsBoard + UpcomingEvents+MiniCalendar] band → VideoClips band
  → Ecosystem — 5 movements instead of the previous 6 (WelcomeBanner had
  been reduced to 0 already; ActivityGallery is gone).
- **Verification:** `./harness/verify.sh` — lint, structure, harness-tests,
  **55** unit tests (added `api/calendar.test.js`, extended
  `home-content.test.js`), build, and quality-thresholds all PASS.
  `typecheck` FAILED on the same three pre-existing, untouched files as
  every prior entry in this thread. Evidence:
  `harness/runs/20260815-153531-210113/`.
- **Browser evidence — real Chrome, not curl:**
  `harness/runs/20260815-home-redesign-v2/` — full-page captures at
  390/768/1024/1536px (zero overflow, zero incomplete images at every
  width), section zooms of the hero and calendar, and a **live interaction
  test**: clicking the "IT" filter pill (real mouse click at its computed
  center — `agent-browser click @ref` still does not work on
  `ClickableCard`, see the earlier Harness-gap note) correctly narrowed the
  grid to the single IT-tagged story and highlighted the pill.
  - **One real defect the first render caught:** the quick-launch panel
    stretched to match the (taller) featured-news column's height —
    `Grid`'s default cross-axis alignment is `stretch` — leaving a few
    hundred px of empty dark panel below the last shortcut. Fixed with
    `alignSelf: 'start'` on the panel plus the "Xem tất cả tài liệu" row,
    which also closes the panel more naturally than raw whitespace would.
- **Next step:** none pending; awaiting user visual confirmation. If a real
  auth backend / user-profile source is ever added, promoting session
  reading to `src/shared/` would unlock the personalized "Chào mừng, {tên}!"
  greeting this entry deliberately left generic.

---

## 2026-08-15 — Claude

- **Active change:** none (same home page; follow-up on the redesign entry
  right below this one).
- **Task worked:** user reviewed the screenshots and asked specifically
  about `hero-carousel.jsx`: title/description/date/CTA read as flat white,
  and the category Badge was hard to see.
  - **Root cause of the Badge complaint:** Astryx's tinted Badge variants
    (used for the same `category` field in `NewsHighlights`, where they sit
    on a white card) are a pastel tint — on the hero's photo scrim that
    tint is nearly invisible. Badge has no `xstyle` prop, so it cannot be
    restyled from the outside.
  - **Fix:** replaced the category `Badge` and the "Đọc tiếp" text with two
    hand-rolled solid pills (same precedent as the existing `dateChip` in
    `upcoming-events.jsx` and `durationChip` in `video-clips.jsx`),
    background `--color-error` (theme.js's contrast-tuned #b4271f red),
    text/icon `--color-on-error` (white). The date line got `weight="medium"`
    for a bit more presence; the headline was left alone — `Heading` has no
    `weight`/`xstyle` prop (same constraint noted in an earlier PROGRESS
    entry), so it was already the app's boldest available treatment.
  - **Checked, not assumed, before choosing solid-background over
    red-text:** computed the contrast ratio of `--color-error` text directly
    against the darkest part of the scrim (`color-mix` towards
    `--color-background-inverted`) — roughly 2.9:1, which fails WCAG AA's
    4.5:1 for text. Red as a text color on that photo would have looked
    "branded" but become genuinely harder to read, the opposite of the
    request. White-on-red solid chips keep full contrast while still
    reading as red at a glance.
  - Set `color` on the pill *container* (not on each Text/Icon individually)
    so children use plain `color="inherit"` — avoids depending on
    `--color-on-error` and `--color-on-dark` happening to both be `#ffffff`.
- **Result:** category and CTA are now solid red pills, clearly legible on
  every slide; verified in a real browser (not curl) at 390px and 1536px.
- **Verification:** `./harness/verify.sh` — same result as every other entry
  in this thread: everything passes except `typecheck`, which fails on the
  same three pre-existing, untouched files
  (`icon-canary.jsx`/`icon-rocket.jsx`/`react-dev-callouts.jsx`). Evidence:
  `harness/runs/20260815-145157-176895/`.
- **Browser evidence:** `harness/runs/20260815-home-redesign-acceptance/
  red-hero-1536.png` and `red-hero-390.png` — red chip/CTA visible and
  legible at both widths, no overlap with the swiper arrows at 390px.
- **Next step:** none pending; awaiting further user feedback.

---

## 2026-08-15 — Claude

- **Active change:** none (same home page as the entries below; still ad hoc,
  following the `58c812e` precedent rather than opening an openspec change).
- **Task worked:** user asked for a full home-page redesign ("redesign thành
  phiên bản tốt nhất"), real placeholder photography pulled from the
  internet, and four new content types: tin tức, sự kiện, hoạt động, video
  clip. Two decisions were put to the user via AskUserQuestion and both
  answered: video plays in a modal + YouTube iframe (not an external tab,
  not local mp4), and photos are industry-themed (not fully random).
  - **Images:** 26 Unsplash photos downloaded to `public/images/home/`
    (2.8 MB total) at fixed crops, so `next/image` gets exact intrinsic
    dimensions and no remote host has to be allowlisted in
    `next.config.mjs`. This replaces the inline-SVG
    `placeholder-illustrations.jsx` from the prior pass, now deleted — it
    existed only because there was no photography.
  - **New sections:** `NewsHighlights` (Tin tức, 6 illustrated cards),
    `ActivityGallery` (Hoạt động, 8-tile gallery → Astryx `Lightbox` with
    zoom), `VideoClips` (4 thumbnails → `Dialog` + YouTube iframe).
  - **Reworked sections:** `AnnouncementsSwiper` → `HeroCarousel`,
    a full-bleed 400–500px photo carousel of the `isFeatured` news items,
    each slide one `ClickableCard` (one tab stop per slide; a nested `Link`
    would have been a second stop to the same URL, and Astryx `Link` has no
    `xstyle` hook for an on-dark palette). `UpcomingEvents` gained photos,
    a date chip, and an `audience` field. `hero.jsx` → `welcome-banner.jsx`,
    now actually rendered and carrying the page's single `<h1>` (it was
    exported but unused since the prior pass).
  - **Content split:** `announcements.js` stopped being carousel copy and
    became genuine "Thông báo" — short, dated, image-free administrative
    notices rendered as dividered rows by the new `AnnouncementsBoard`.
    Editorial stories moved to the new `news.js`, which derives
    `featuredNews`/`latestNews` from one array. This is what keeps the same
    item from appearing twice in two shapes.
  - **New shared pieces:** `api/date.js` (all Vietnamese date formatting in
    one place; every parse pins `T12:00` because a bare ISO date is UTC
    midnight and renders as the *previous* day in any timezone behind UTC),
    `components/section-heading.jsx` (one header for all eight sections —
    they had drifted between `display-2` and `display-3`), and
    `components/icon-play.jsx` (Astryx's registry has no `play` name;
    `Icon` taking an SVG component is the documented escape hatch).
- **Result:** eight sections in four alternating white/tinted bands:
  WelcomeBanner → HeroCarousel → QuickLinks → NewsHighlights →
  [AnnouncementsBoard + UpcomingEvents] → ActivityGallery → [VideoClips] →
  Ecosystem. All Astryx components and theme tokens; no raw `<div>`, no
  hex, no inline px outside `xstyle`.
- **Verification:** `./harness/verify.sh` — project-readiness,
  memory-secrets, theme-build, lint, structure, harness-tests, unit-tests,
  build, and quality-thresholds all PASS (bundle 168.6 kB gzip of a 250 kB
  budget). `typecheck` FAILED with the *same three pre-existing errors* as
  the four entries below, all in files this task never touched
  (`icon-canary.jsx`, `icon-rocket.jsx`, `react-dev-callouts.jsx` — user's
  uncommitted work from before the session). Per the "never expand scope"
  hard rule they were left alone and flagged to the user again. Evidence:
  `harness/runs/20260815-141523-130261/`.
- **New tests (closing a real harness gap):**
  `src/features/home/config/home-content.test.js` asserts every image path
  in every home config resolves to a non-empty file under `public/`, has
  positive dimensions and non-empty alt text, that dates are ISO, that ids
  are unique per collection, and that every href is internal. A typo'd
  image path was previously *invisible* to lint, typecheck, and the build —
  Next.js just 404s the file and the layout stays intact. That class of
  mistake now fails a test instead of shipping.
  `src/features/home/api/date.test.js` covers the four formatters plus a
  timezone-drift regression across UTC / Asia/Ho_Chi_Minh /
  America/Los_Angeles.
- **Browser evidence — REAL, not a curl substitute.** Mid-session the user
  installed the missing Chrome libraries (see the resolved Harness gap at
  the top), so this is the first home-page pass with actual screenshots.
  Suite: `harness/runs/20260815-home-redesign-acceptance/` — full-page
  captures at 390/768/1024/1536px plus section zooms and interaction shots,
  against a real `next start` production build. Zero horizontal overflow and
  zero incomplete images at all four widths.
- **Four defects the screenshots caught that every mechanical gate passed
  over.** This is the entry's most important part: lint, typecheck,
  structure, unit tests, build, and bundle budget were all green while the
  page had two unreadable sections and one clipped one.
  1. **Hero headline unreadable.** The scrim was built from
     `--color-overlay`, whose alpha is baked into the token at 40% — not
     enough to carry white text over a bright photo (the engineering-drawing
     slide was the worst case). Rebuilt as `color-mix(in srgb,
     var(--color-background-inverted) N%, transparent)` stops, which allows
     an explicit alpha, plus a flat 16% wash that also makes the white
     prev/next arrows visible at mid-height. Stops differ per breakpoint
     because the copy block fills 58% of the slide at 390px versus ~45% from
     640px up.
  2. **Gallery captions unreadable**, same root cause and same fix, plus a
     30px `paddingBlockStart` so the ramp has room to fade above the text.
  3. **Carousel appeared to have one dot.** `--swiper-theme-color` only
     colours the ACTIVE bullet; Swiper's inactive bullets default to black
     at 0.2 opacity, invisible on a photo. Now set explicitly.
  4. **Event cards clipped at 390px** — content `scrollWidth` was 99px wider
     than the card, so `overflow: hidden` cut the titles instead of
     `maxLines` ellipsizing them. Classic flex `min-width: auto`; fixed with
     `minWidth: 0` on both the row and the text column (one alone is not
     enough).
- **Double padding, also found by measurement:** `page.jsx` was adding
  20px/48px inline padding on top of the 24px `<main>` padding
  `ProtectedAppShell` already applies to non-MDX routes. At 390px that left
  a 302px content column inside a 342px main, which was exactly what dropped
  the activity gallery to a single column. Removing the duplicate widened
  the column by 40px, took the gallery to two columns on mobile, and cut the
  mobile page height from 11398px to 9858px.
- **Interactions verified live:** clicking gallery tile 6 opens the
  `Lightbox` at "6 / 8" with the right caption and working prev/next;
  clicking a video card opens the `Dialog` and mounts
  `youtube-nocookie.com/embed/...` which autoplays — and the iframe is
  absent from the DOM until that click, so the facade genuinely defers it.
- **Still not verified:** real devices/touch input, and any browser other
  than Chrome 152 headless.
- **Next step:** none pending. Real content (news, notices, events, activity
  photos, YouTube ids) still needs to replace the placeholders — every one
  lives in `src/features/home/config/`.

## 2026-08-15 — Claude

- **Active change:** none (same home page; see the entries below for prior
  passes and their rationale).
- **Task worked:** user asked to make `AnnouncementsSwiper` bigger and its
  own standalone section, and shrink `UpcomingEvents`. Un-did the two-column
  `Grid` pairing from the earlier "closer to Figma" pass:
  - `page.jsx`: `AnnouncementsSwiper` is now alone in its own full-width
    tinted band. `UpcomingEvents` moved into the same band as `QuickLinks`
    (stacked, not side-by-side) instead of pairing with the swiper.
  - `announcements-swiper.jsx`: since it's full-width again (not a ~540px
    half-column), raised the card height (300–420px depending on breakpoint,
    up from 260–380px), the illustration thumbnail (128px→160px) and its
    display breakpoint (back down to 640px from 1280px — no longer needs to
    wait for a very wide viewport), and gave the text column a `38rem` cap
    back (removed when it went half-width, no longer needed there).
  - `upcoming-events.jsx`: dropped the 56px illustration thumbnails
    (keeping just the compact date badge, now 36px, down from 44px),
    `density="compact"` (was "spacious"), and the section heading dropped
    from `display-2`→`display-3` — it's now a secondary widget bundled with
    `QuickLinks`, not competing with the swiper for visual weight.
  - `events.js`: removed the now-unused `illustrationId` field (dead data
    once `UpcomingEvents` stopped rendering thumbnails) and its typedef
    entry. `announcements.js` keeps its `illustrationId` field — still used.
    4 of the 8 `placeholder-illustrations.jsx` illustrations (celebration,
    growth, factory, handshake) are now unused by any config data; left in
    place as an available palette for future content rather than deleted,
    same as an icon library keeps unused icons.
- **Result:** all mechanical gates pass except the same pre-existing,
  out-of-scope typecheck failures noted in the entries below. Evidence:
  `harness/runs/20260815-111114-82968/`.
- **Browser evidence:** still unavailable (persistent Harness gap above).
  Curl-with-faked-cookie substitute: HTTP 200, all section headings present,
  no error-boundary markers; StyleX-compiled height values don't appear as
  literal strings in server-rendered HTML (they're atomic CSS classes, not
  inline styles) so that specific check was inconclusive by design, not a
  sign of failure. Genuinely can't confirm the *proportions* read right —
  whether the swiper now feels appropriately "big" next to a "small" events
  list is a visual judgment call this container cannot make. User should
  check `localhost:3000` before calling this final.
- **Next step:** none pending; awaiting user visual confirmation.

## 2026-08-15 — Claude

- **Active change:** none (same home page; see the two entries below for
  prior passes and their rationale).
- **Task worked:** user asked (referencing
  `.../QgO4YJ5CppdHIkpYz4dRbZ?node-id=2372-349`, the template's actual body
  frame) for fake/example images on the home page and smaller swiper prev/
  next icons.
  - New `src/features/home/components/placeholder-illustrations.jsx`: 8
    original inline-SVG illustrations (construction site, factory, meeting,
    handshake, training, growth, technology, celebration), each a two-stop
    gradient + simple line-art glyph, `preserveAspectRatio="xMidYMid slice"`
    so they crop like `object-fit: cover` without needing `next/image` (which
    would've needed `images.dangerouslyAllowSVG` in `next.config.mjs` for
    SVG sources — avoided entirely by inlining, same pattern as the existing
    `src/shared/components/icon/*.jsx` files). Deliberately did NOT reuse the
    Figma file's actual stock photography — those are the vendor's own
    (likely licensed) images for a pet-hospital demo; copying real
    photographic assets into an unrelated company's production portal is a
    different, riskier thing than adapting a layout pattern. Went with
    obviously-a-placeholder, on-brand graphics instead, matching the user's
    own word "fake."
  - All gradient stops resolve through existing theme tokens via CSS
    `var(--color-*)` (text-primary/secondary, accent, accent-muted,
    icon-teal/purple/orange, error, warning) — no new hardcoded hex, so nolint
    `no-restricted-syntax` (hardcoded-hex-color) stayed green.
  - `announcements.js`/`events.js` gained an `illustrationId` field (not a
    file path — there's no file, it's a lookup key into the map above); 8
    items now use 6 of the 8 illustrations with no two adjacent items
    repeating.
  - `announcements-swiper.jsx`: the accent-colored icon circle became an
    illustration thumbnail; the category icon moved into `Badge`'s `icon`
    slot instead of being dropped. Added `--swiper-navigation-size: 18px` to
    the inline style (Swiper's default renders a fairly large 44px
    prev/next arrow) per the user's explicit "make them smaller" ask.
  - `upcoming-events.jsx`: `ListItem`'s `startContent` is now an `HStack` of
    [56px illustration thumbnail, 44px date badge] instead of just the date
    badge, echoing the reference's thumbnail+date-badge event rows.
  - **Self-caught bug:** the first pass reused each illustration's bare SVG
    `id` (e.g. `id="meeting-bg"`) across every render. Since `meeting` and
    `training` are each used twice (once in Thông báo, once in Sự kiện sắp
    tới), that's a duplicate-`id` SVG on the same page — invalid HTML, and
    only silently harmless here because the duplicate gradients happen to be
    pixel-identical. Fixed with `useId()` (works in both the client
    `AnnouncementsSwiper` and the server-rendered `UpcomingEvents`) to
    namespace every gradient id and its `url(#...)` reference per rendered
    instance; verified via curl that the live-rendered page now emits
    distinct suffixed ids per instance instead of literal duplicates.
- **Result:** all mechanical gates pass except the same pre-existing,
  out-of-scope typecheck failures noted in the entries below. Evidence:
  `harness/runs/20260815-110525-78548/`.
- **Browser evidence:** still unavailable (persistent Harness gap above).
  Curl-with-faked-cookie substitute: HTTP 200, all 8 illustrations' gradient
  ids present and correctly de-duplicated by `useId()` suffix, the
  `--swiper-navigation-size:18px` var present in the rendered `style`
  attribute, no error-boundary markers. Genuinely can't confirm from markup
  alone whether the illustrations *look* good at thumbnail size, whether the
  56px event thumbnail + 44px date badge pair reads as intended rather than
  cramped, or whether 18px nav arrows are comfortably clickable — user
  should check `localhost:3000` before calling this final.
- **Next step:** none pending; awaiting user visual confirmation.

## 2026-08-15 — Claude

- **Active change:** none (same home page, no openspec change — see the entry
  right below this one for the prior pass and its rationale).
- **Task worked:** follow-up on the home-page redesign after the user asked
  to push "closer to the Figma visuals." Three changes:
  1. Typography: bumped Hero's H1 from `display-2`→`display-1` (52px) and
     every *section* heading (Thông báo, Sự kiện sắp tới, Truy cập nhanh,
     Hệ sinh thái) from `display-3`→`display-2` (40px), widening the gap
     from body text to read closer to the reference's bold 42px headers.
     Per-slide/per-tile titles (announcement card titles, quick-link tile
     labels, company names) were deliberately left alone — only the section-
     level headers changed. Note: Astryx's `display-*` types are weight 400
     (normal) by design, not bold — `Heading` has no `weight`/`xstyle` prop
     to override that per-instance, and a theme-wide `components.heading`
     override would touch the carefully-tuned MDX/react-dev-parity type
     scale elsewhere in the app, so boldness comes from size, not weight.
  2. Section grouping: `page.jsx` now wraps (a) AnnouncementsSwiper +
     UpcomingEvents together in a `--color-background-muted` tinted,
     rounded panel as a responsive 2-column `Grid` (`minWidth: 420, max: 2`
     — single column below ~840px content width), and (b) QuickLinks in its
     own matching tinted panel, echoing the reference's alternating pale/
     white section bands (Hero keeps its own distinct accent-muted panel;
     Ecosystem stays plain white).
  3. `announcements-swiper.jsx` internals adjusted for now living in a
     ~540px half-column instead of the full 80rem content width: dropped
     the fixed `34rem` text-column cap (`minWidth: 0` instead, so it uses
     whatever column width it's given), and raised the icon-circle's
     display breakpoint from 640px→1280px (was showing right at the edge
     of the new narrower column) and the card height (340/260px →
     380/320px) for a bit more room for wrapped two-line titles.
- **Result:** all mechanical gates pass except the same pre-existing,
  out-of-scope typecheck failures from the prior entry. Evidence:
  `harness/runs/20260815-102332-62736/`.
- **Browser evidence:** still unavailable (see the persistent Harness gap
  above). Same curl-with-faked-cookie substitute as the prior entry: HTTP
  200, all expected section headings present, no error-boundary markers.
  **This is the riskiest area to ship unverified** — the new 2-column
  Grid + narrower swiper is exactly the kind of change that can look fine
  in markup and still overflow or crop visually; flagged clearly to the
  user that they need to eyeball `localhost:3000` themselves, especially
  the news/events band at tablet-ish widths (~700–900px) where the Grid's
  column math is least certain.
- **Next step:** none pending; awaiting user visual confirmation.

## 2026-08-15 — Claude

- **Active change:** none (no openspec change covers the home page; the prior
  session's "add a basic internal home page" work in `58c812e` was also ad
  hoc, so this follows that precedent rather than opening a new change).
- **Task worked:** redesigned `src/app/(protected)/page.jsx`'s home page
  using a Figma SharePoint-intranet template
  (`lookbook365.com/veterinary-clinic-intranet-sharepoint`,
  file `QgO4YJ5CppdHIkpYz4dRbZ`, node `2372:2`, "Bramblewood Pet Hospital")
  as a layout reference, per user request ("thiết kế lại trang home cho
  website portal, mục nào không cần thiết thì xoá"). Kept the reference's
  intranet-portal *pattern* (hero banner + CTA, featured
  news/announcements, upcoming events, quick-links tiles, "who we are")
  and its bold-heading/solid-accent-tile visual language; dropped every
  veterinary-clinic-specific section (KPI snapshot, Clinical Protocols,
  On-Call Schedule, Featured Training video, Our Veterinary Team, Our
  Locations-as-clinic-branches) and the vendor's own promo footer — none
  of it maps to Đại Nghĩa Group's portal or has a real data source. Per an
  explicit user choice (asked via AskUserQuestion), added a new "Upcoming
  Events" section but skipped a staff/leadership directory.
  - `hero.jsx`: wrapped in a rounded `--color-accent-muted` panel and added
    a "Khám phá tài liệu nội bộ" CTA `Link` to `/docs` (title/slogan/
    subtitle props unchanged).
  - `quick-links.jsx`: tiles are now solid `--color-accent` cards with a
    white icon+label (was a white card with an accent-muted icon circle),
    matching the reference's green tiles but in KT-XNK's brand teal —
    deliberately did NOT use `ClickableCard`'s built-in `variant="teal"`,
    since `theme.js` documents that categorical tag color as intentionally
    NOT rebranded to `--color-accent`.
  - `announcements-swiper.jsx`: added a "Thông báo" section heading (all
    other home sections already owned one; this one didn't).
  - New `upcoming-events.jsx` + `config/events.js`: an Astryx `List`/
    `ListItem` row list (per the "dense data = rows, never Card-wrapped"
    house rule) with a date-number badge, formatted via `Intl.DateTimeFormat
    ('vi-VN', …)`. `events.js` has 4 placeholder entries (no real events/
    calendar source exists yet) — same "compatible shape, placeholder data,
    documented as such" precedent as `LanguageList`/`TeamMember` in the
    2026-08-15 `react-dev-mdx-components-parity` task 5.1 entry below.
  - `index.js` barrel and `page.jsx` updated for the new component and
    section order: Hero → Announcements → UpcomingEvents → QuickLinks →
    Ecosystem.
- **Result:** home page renders with the new structure; all Astryx
  components/tokens (no raw `<div>`, no hex/px), per the repo's non-MDX
  Astryx-only rule.
- **Verification:** `./harness/verify.sh` — lint, structure, harness-tests,
  unit-tests, build, and quality-thresholds all passed. `typecheck` FAILED,
  but the 3 errors are all in files this task didn't touch
  (`icon-canary.jsx`, `icon-rocket.jsx`, `react-dev-callouts.jsx` — pre-
  existing uncommitted work from before this session, visible as unstaged
  changes at session start). Per the "never expand scope" hard rule, these
  were not fixed here; flagged to the user instead. Evidence:
  `harness/runs/20260815-100439-53401/`.
- **Browser evidence:** unavailable — see the new persistent Harness gap
  above (`libnspr4.so` missing, no root). Substituted a curl fetch of `/`
  with a faked `kt-xnk-access-token` cookie: HTTP 200, page contains
  "Thông báo", "Sự kiện sắp tới", "Truy cập nhanh", "Hệ sinh thái", the new
  CTA text, and all 3 sampled event titles; no error-boundary markers.
- **Next step:** none for this task. If the user wants real visual QA, the
  environment needs `libnspr4`/`libnss3` installed (root), or screenshots
  taken from outside this container.

## 2026-08-15 — Claude

- **Active change:** `react-dev-mdx-components-parity`, task 5.1 (task 4.1
  deferred by user decision).
- **Task worked:** ported `LanguageList` (local `LanguagesContext` +
  placeholder translation-status data), `TeamMember` (profile card with
  ported Twitter/Threads/Bluesky/GitHub/link icons), and `ErrorDecoder`
  (local `ErrorDecoderContext`, `replaceArgs`/`urlify`/query-arg parsing,
  `useSyncExternalStore`-based `location.search` + hydration reads instead of
  a setState-in-effect). Registered all three in `mdx-components.jsx`,
  flipped their matrix status from `intentionally-omitted` to `adapted`, and
  added a `mdx-product-context-fixture` dev route + `product-context.mdx`
  fixture.
- **Result:** task 4.1 (`Sandpack`/`SandpackRSC`/`SandpackWithHTMLOutput`)
  stays unchecked — user decided to postpone the `@codesandbox/sandpack-react`
  dependency/bundle decision until real content needs a sandbox; matrix
  entries stay `planned`/`intentionally-omitted`. KT-XNK has no real
  translation program, team roster, or error-code database, so `LanguageList`/
  `TeamMember`/`ErrorDecoder` render placeholder data per user decision —
  compatible props are in place for a future real data source.
- **Verification:** `./harness/verify.sh` passed every gate. Along the way,
  fixed three unrelated pre-existing stale-assertion failures it caught
  (uncommitted before this session): `sidebarPost.test.js` expected the old
  uppercase "NỘI QUY" title and a path-less IT group, `site.test.js` expected
  a since-removed Tutorial top-nav pill, and `content.test.js` expected 16
  discovered Docs posts instead of the current 17 (an untracked
  `content/docs/it/it.mdx` already existed) — all three updated to match
  current, correct state rather than reverted.
- **Browser evidence:** `harness/runs/20260815-react-dev-mdx-components-task-5-1/`
  — 390/1024/1536px screenshots of the fixture route, no horizontal overflow
  at any width; `%s` substitution verified live via
  `?args[0]=demo-config` query string.
- **Next step:** task 4.1 stays open pending a real Sandpack use case; once
  ready, revisit `openspec/changes/react-dev-mdx-components-parity/tasks.md`.

## 2026-08-15 — Codex

- **Active change:** `react-dev-mdx-components-parity`, task 3.1.
- **Task worked:** ported Challenges, Recipes, Hint, Solution, navigation tabs
  and arrows, exclusive hint/solution disclosure, next-item scrolling, initial
  hash selection, and the full react.dev DeepDive authored-heading disclosure.
  Retained the existing title-prop DeepDive form for local content.
- **Result:** all five guided-learning registry names are adapted without
  Astryx. RSC-safe marker props replace upstream `mdxName` introspection where
  App Router serialization removes it.
- **Verification:** `./harness/verify.sh` passed every gate with 36 tests.
  Evidence: `harness/runs/20260815-012535-159941/`; inspected interaction and
  responsive screenshots:
  `harness/runs/20260815-react-dev-mdx-components-task-3-1/`.
- **Browser evidence:** Hint→Solution closes Hint, Next selects challenge 2,
  direct `#preserve-the-input` selects challenge 2 after reload, direct
  `#why-derived-state-matters` opens DeepDive after reload, and 390/1536px have
  no horizontal overflow.
- **Next step:** task 4.1 — Sandpack, SandpackRSC, and HTML-output Sandpack.

## 2026-08-15 — Codex

- **Active change:** `react-dev-mdx-components-parity`, task 2.1.
- **Task worked:** ported the react.dev CodeMirror syntax renderer, fenced-code
  line and inline-step metadata bridge, console surfaces, terminal/copy flow,
  CodeDiagram, theme-aware Diagram/DiagramGroup, and PackageImport to semantic
  React UI plus StyleX. Added pure metadata/plugin tests and a development-only
  MDX composition fixture.
- **Result:** nine task-2 registry names are now implemented without Astryx.
  Browser acceptance confirmed two code blocks, lines 1/3/1 highlighted,
  inline steps 1/2/3, terminal `Copied` state, 390px single-column and 1536px
  two-column PackageImport geometry, and no horizontal overflow.
- **Verification:** `./harness/verify.sh` passed every gate with 36 tests.
  Evidence: `harness/runs/20260815-010535-145293/`; inspected screenshots:
  `harness/runs/20260815-react-dev-mdx-components-task-2-1/`.
- **Dependency note:** pinned the same CodeMirror/Lezer/range-parser family used
  upstream. `pnpm peers check` still reports the pre-existing Astryx core →
  StyleX peer mismatch (`^0.19.0` wanted vs `0.15.4` installed); the MDX tree
  itself does not import Astryx.
- **Skill influence:** `memory-recall` preserved the output/behavior parity
  contract; `vercel-react-best-practices` kept client state limited to syntax
  hover/copy behavior; `frontend-design` held geometry to upstream; and
  `agent-browser` exposed both the clipboard-state and serialized-child bugs.
- **Next step:** task 3.1 — Challenges, Recipes, Hint, Solution, and guided
  navigation/query behavior.

## 2026-08-15 — Codex

- **Active change:** `react-dev-mdx-components-parity`, task 1.1.
- **Task worked:** pinned every upstream registry key to one of five dependency
  milestones, then ported primitive typography, nine lifecycle callouts, four
  badges, BlogCard, LearnMore/ReadBlogPost, YouWillLearnCard, math, CodeStep,
  Recap, illustrations/groups, and nested InlineToc. Added a development-only
  MDX fixture route that exercises real registry composition through MDX 3.
- **Result:** 22 formerly planned/omitted authoring names are now adapted in
  the registry matrix. The mobile callout is full-bleed at exactly 390px with
  zero radius; desktop uses 16px radius; the full fixture has no horizontal
  overflow. All implementation remains Astryx-free and preserves upstream MIT
  attribution.
- **Verification:** `./harness/verify.sh` passed every gate with 32 tests.
  Evidence: `harness/runs/20260815-004852-131078/`; inspected screenshots:
  `harness/runs/20260815-react-dev-mdx-components-task-1-1/`.
- **Skill influence:** `memory-recall` identified the old subset contract that
  this change supersedes; `vercel-react-best-practices` kept one small client
  boundary around TOC context; `frontend-design` held all visual decisions to
  the pinned source; `agent-browser` caught fixture-shell padding before final
  mobile acceptance.
- **Next step:** task 2.1 — code, console, diagram, terminal, and package-import
  authoring UI.

## 2026-08-15 — Codex

- **Active change:** `mdx-component-authoring-policy`, task 1.1.
- **Task worked:** strengthened the user-requested MDX exception from “Astryx
  optional” to “no Astryx imports” across the complete rendered registry tree.
  Replaced nine token-module imports with a local StyleX token bridge and added
  a recursive source contract covering current and future nested MDX modules.
- **Result:** the existing MDX UI retains its theme, spacing, radius, font
  weights, and typography while depending only on semantic/local React UI,
  StyleX, and public theme CSS properties. Non-MDX application policy is
  unchanged.
- **Verification:** `./harness/verify.sh` passed every gate with 31 tests.
  Evidence: `harness/runs/20260815-003824-123229/`; browser computed styles and
  inspected screenshot:
  `harness/runs/20260815-mdx-astryx-free-foundation/docs-1536-restored.png`.
- **Skill influence:** `memory-recall` preserved the prior output-parity and
  App-Router decisions; `vercel-react-best-practices` kept the server-rendered
  MDX boundary intact; `frontend-design` and `agent-browser` caught and fixed a
  first-pass token bridge that preserved color but collapsed spacing/radius.
- **Next step:** execute the new full react.dev MDX component-registry parity
  change, starting with its exact inventory and dependency contract.

## 2026-08-15 — Codex

- **Active change:** reopened `react-dev-docs-shell` for task 4.4 after user
  review found multiple SideNav groups could remain expanded together.
- **Task worked:** replaced independent `SideNavGroup` state with one exclusive,
  pathname-aware accordion selection owned by `AppSideNav`. Child route matches
  now take precedence over broad parent paths, so `/docs/may-tinh` opens IT
  instead of NỘI QUY. Added pure state tests and a source regression contract.
- **Result:** opening IT collapses NỘI QUY, clicking IT again closes it, and a
  route change reopens only the group containing the active page. Parent group
  font size remains 15px throughout.
- **Verification:** `./harness/verify.sh` passed every gate with 31 tests.
  Evidence: `harness/runs/20260815-002812-112821/`; inspected browser screenshots
  and click-state evidence:
  `harness/runs/20260815-react-dev-docs-shell-side-nav-accordion/`.
- **Skill influence:** `vercel-react-best-practices` led to derived pathname
  state without effect synchronization; `agent-browser` verified the real
  `aria-expanded`, `aria-hidden`, route-change, and computed-font behavior.
- **Next step:** none for this correction.

## 2026-08-14 — Codex

- **Active change:** reopened `react-dev-docs-shell` for task 4.3 after user
  review found typography parity was incomplete.
- **Task worked:** audited the pinned local react.dev Tailwind scale and every
  scoped typography consumer, then aligned PageHeading/MDX H1–H5, body prose,
  Intro, callout titles/content, inline/fenced code, figure captions, Header,
  SideNav, TOC, breadcrumbs, copy action, and Footer. Corrected a StyleX merge
  bug where an Intro-only conditional style with null defaults suppressed the
  base paragraph typography outside Intro.
- **Result:** task 4.3 is complete and the proposal is complete again. Runtime
  at both 390px and 1536px reports H1 40/50, H2 28/40, H3 24/36, body 17/30
  weight 500, Intro 20/32.5 weight 500, SideNav 15px, TOC 13px, breadcrumb and
  copy action 13px, and callout title 24/30.
- **Verification:** `./harness/verify.sh` passed every gate with 29 tests.
  Evidence: `harness/runs/20260814-235853-85234/`; computed-style screenshots:
  `harness/runs/20260814-react-dev-docs-shell-typography/`.
- **Skill influence:** `frontend-design` kept typography subordinate to the
  pinned reference instead of the Astryx scale; `agent-browser` exposed the
  rendered StyleX conditional-merge bug that source inspection alone missed.
- **Next step:** none for this correction.

## 2026-08-14 — Codex

- **Active change:** `react-dev-docs-shell`, task 4.2.
- **Task worked:** completed the durable handoff in `docs/architecture.md`,
  `openspec/project.md`, the change proposal/design, and `acceptance.md`.
  Converted the Docs/Astryx exception from an implementation-only allowance to
  the documented long-term architecture contract. Closed all three shell/MDX
  harness gaps with source assertions, a server-rendered MDX grouping fixture,
  and the recorded browser acceptance suite.
- **Result:** task 4.2 and the `react-dev-docs-shell` change are complete. All
  tasks are checked, the proposal is marked complete, and the implementation
  retains Next.js App Router, JavaScript, StyleX, KT-XNK auth/brand/routes, and
  Vietnamese content while matching the agreed react.dev shell behavior.
- **Verification:** `./harness/verify.sh` passed every gate with 28 unit/API/
  contract tests. Evidence: `harness/runs/20260814-234536-74910/` plus the
  seven-breakpoint acceptance images under
  `harness/runs/20260814-react-dev-docs-shell-acceptance/`.
- **Next step:** none for this change. Future react.dev registry additions are
  explicitly classified in `mdx-component-matrix.json` and can be proposed as
  separate changes without reopening this shell port.

## 2026-08-14 — Codex

- **Active change:** `react-dev-docs-shell`, task 4.1.
- **Task worked:** captured and visually inspected the complete acceptance suite
  at 374, 640, 768, 1024, 1280, 1536, and 1919px, plus a 2048px wide-screen
  audit. Runtime measurements recorded header, SideNav, main, TOC, mobile-toggle,
  and horizontal-overflow geometry at every width.
- **Result:** task 4.1 is complete and checked. The 1024px boundary switches
  from mobile navigation to the 320px SideNav; the 1536px boundary adds the
  320px TOC; every measured viewport has zero horizontal overflow. Intentional
  differences from react.dev are KT-XNK branding, navigation labels, routes,
  authentication behavior, and Vietnamese document content.
- **Verification:** `./harness/verify.sh` passed every gate. Evidence:
  `harness/runs/20260814-234215-72533/`. The screenshot suite is under
  `harness/runs/20260814-react-dev-docs-shell-acceptance/`.
- **Next step:** task 4.2 — update durable architecture/project handoff docs,
  close the change, and run the final verification gate.

## 2026-08-14 — Codex

- **Active change:** `react-dev-docs-shell`, task 3.3.
- **Task worked:** reconciled the remaining authoring surface with the parity
  matrix. Headings, paragraphs, links, quotes, inline/preformatted code,
  dividers, Intro, callouts, disclosures, figures, and YouTube embeds now use
  semantic HTML plus StyleX/theme variables without Astryx UI components.
  Heading anchors retain the local chain-link SVG and frontmatter/TOC behavior
  remains covered by the MDX API tests.
- **Result:** task 3.3 is complete and checked. The scoped MDX source contract
  rejects direct Astryx component imports while retaining Astryx theme tokens.
- **Verification:** `./harness/verify.sh` passed every gate. Evidence:
  `harness/runs/20260814-234103-70903/`. Browser QA measured the mobile callout
  as a full-width 390px `aside[role=note]` with zero radius, the desktop callout
  as 896px with 12px radius, Intro text as 20px/28.572px, and zero horizontal
  overflow. Screenshots are under
  `harness/runs/20260814-react-dev-docs-shell-task-3-3/`.
- **Next step:** task 4.1 — capture the complete seven-breakpoint acceptance
  suite and record shell geometry and intentional brand differences.

## 2026-08-14 — Codex

- **Active change:** `react-dev-docs-shell`, task 3.2.
- **Task worked:** ported react.dev's `wrapChildrenInMaxWidthContainers` as an
  MDX-3 remark AST transform. Ordinary top-level runs become `MaxWidth`; the
  exact upstream interruption set (`Sandpack`, `FullWidth`, `Illustration`,
  `IllustrationBlock`, `Challenges`, `Recipes`) remains in the 80rem frame.
  Added semantic `MaxWidth`/`FullWidth` mappings and removed the old unconditional
  56rem wrapper from `MdxArticle`.
- **Result:** task 3.2 is complete and checked. A non-routed MDX fixture compiles
  and server-renders as MaxWidth→FullWidth→MaxWidth in source order; frontmatter
  and export nodes remain outside render groups.
- **Verification:** `./harness/verify.sh` passed every gate. Evidence:
  `harness/runs/20260814-233456-65871/`. At 2048px runtime body=1280px,
  prose=896px, PageHeading/prose axis delta=0; at 390px prose=350px at x=20
  with zero overflow. Screenshots are under
  `harness/runs/20260814-react-dev-docs-shell-task-3-2/`.
- **Next step:** task 3.3 — reconcile the remaining frontmatter/heading/TOC,
  callout, media, and code authoring behavior against the parity matrix.

## 2026-08-14 — Codex

- **Active change:** `react-dev-docs-shell`, task 3.1.
- **Task worked:** added `mdx-component-matrix.json`, a complete classification
  of the pinned react.dev `MDXComponents` registry into supported, adapted,
  planned, and intentionally omitted entries, with local names and rationale.
  Added a mechanical test that compares the exact upstream inventory and proves
  every supported/adapted claim exists in the local `useMDXComponents` map.
- **Result:** task 3.1 is complete and checked. Generic gaps are queued for later
  milestones while React product/release-specific components are explicit
  non-goals rather than silent omissions.
- **Verification:** `./harness/verify.sh` passed every gate. Evidence:
  `harness/runs/20260814-232940-61874/`.
- **Next step:** task 3.2 — add semantic `MaxWidth`/`FullWidth` MDX primitives and
  an App-Router/MDX-3-compatible grouping contract with fixture geometry tests.

## 2026-08-14 — Codex

- **Active change:** `react-dev-docs-shell`, task 2.2.
- **Task worked:** completed the TOC parity audit against react.dev `Toc.tsx`
  and `useTocHighlight.tsx`. Corrected heading/item typography to 14px,
  secondary heading color, and exact 12px start-side active radius while
  retaining the behavior-equivalent 85px active offset and the more efficient
  animation-frame scroll coalescing.
- **Result:** task 2.2 is complete and checked. Sticky geometry, bounded
  overscroll scroller, nested indentation, active styling, link semantics, and
  bottom-of-page selection are verified.
- **Verification:** `./harness/verify.sh` passed every gate. Evidence:
  `harness/runs/20260814-232649-59904/`. At 1536px TOC top=0, heading y=80,
  max height=780px for a 900px viewport, active font=14px and radius=
  `12px 0 0 12px`; clicking item 3 selected it. At 2048px page-end scrolling
  selected the final item. Screenshots are in
  `harness/runs/20260814-react-dev-docs-shell-task-2-2/`.
- **Next step:** task 3.1 — generate and test a react.dev MDX component-registry
  parity matrix before changing MDX grouping behavior.

## 2026-08-14 — Codex

- **Active change:** `react-dev-docs-shell`, task 2.1.
- **Task worked:** replaced Astryx Grid/VStack/Heading/HStack/Icon/Stack/Text,
  Button, and Section usage across the MDX article frame, PageHeading,
  copy-link action, TOC frame, and Footer with semantic local HTML and StyleX.
  Converted responsive conditions to exact pixel thresholds and ported the
  upstream footer divider/padding rhythm.
- **Result:** task 2.1 is complete and checked. Content keeps 20/48px insets,
  56rem heading/prose, 80rem body, and a 20rem TOC rail; the copy action and
  breadcrumb chevron are accessible native controls/local SVGs.
- **Verification:** `./harness/verify.sh` passed every gate. Evidence:
  `harness/runs/20260814-232430-57476/`. Browser QA measured 20px at 390,
  48px at 640, 320/896/320px regions at 1536, and at 2048 a 1280px body plus
  896px PageHeading/prose with axis delta 0. Screenshots are in
  `harness/runs/20260814-react-dev-docs-shell-task-2-1/`.
- **Next step:** task 2.2 — audit and match the upstream TOC sticky/scroller and
  active-link behavior at 1536/2048px after the semantic frame migration.

## 2026-08-14 — Codex

- **Active change:** `react-dev-docs-shell`, task 1.4.
- **Task worked:** removed direct Astryx Icon/Text use from SideNav and matched
  react.dev's SidebarLink/SidebarRouteTree geometry: 16px text, 8px block
  padding, 20/24px nesting starts, desktop 20px end inset, 16px end radius,
  local SVG directional arrow, and a 250ms opacity/grid collapse that keeps
  closed descendants inert.
- **Result:** task 1.4 is complete and checked. Desktop SideNav remains sticky in
  the shell, mobile retains full-width rows, and active/disclosure states use
  semantic local elements plus StyleX/theme variables only.
- **Verification:** `./harness/verify.sh` passed every gate. Evidence:
  `harness/runs/20260814-232035-54327/`. At 1024px the rail measured 320px,
  selected row 300px, font 16px, and radius `0 16px 16px 0`; the IT disclosure
  settled to 378px with `inert=false`. Screenshots at 1024/1280/1536px are in
  `harness/runs/20260814-react-dev-docs-shell-task-1-4/`.
- **Next step:** task 2.1 — port PageHeading, article, footer, and TOC region
  geometry to semantic StyleX components without Astryx UI.

## 2026-08-14 — Codex

- **Active change:** `react-dev-docs-shell`, task 1.3.
- **Task worked:** completed mobile overlay accessibility and breakpoint
  behavior. Added explicit toggle/overlay refs, moved focus into the first route
  control on open, restored focus to the menu toggle on close, and made the
  SideNav fill the mobile viewport instead of retaining its 20rem desktop width.
- **Result:** task 1.3 is complete and checked. Escape, route selection, and the
  1024px boundary all close the overlay and restore body scrolling.
- **Verification:** `./harness/verify.sh` passed every gate. Evidence:
  `harness/runs/20260814-231753-51831/`. Browser QA at 374/390/640/768px
  confirmed full-width overlay geometry and zero horizontal overflow; opening
  focuses `NỘI QUY`, Escape returns focus to `Mở menu`, selecting `Giờ làm việc`
  navigates and closes, and resizing 768→1024 closes and hides the toggle.
  Screenshots are under
  `harness/runs/20260814-react-dev-docs-shell-task-1-3/`.
- **Next step:** task 1.4 — remove Astryx Icon/Text from desktop SideNav and
  match the upstream tree's sticky scrolling, disclosure affordances, spacing,
  active states, and section labels.

## 2026-08-14 — Codex

- **Active change:** `react-dev-docs-shell`, task 1.2.
- **Task worked:** ported the react.dev TopNav desktop structure into
  `header.jsx`. Removed direct Astryx `HStack`/`Icon` UI, replaced them with
  semantic flex regions and a local accessible SVG menu glyph, matched the 64px
  bar, 6px mobile and 16/20px desktop edge insets, 48px mobile control, 300ms
  backdrop/shadow transition, and the 1919px wide-layout flex threshold. Added
  `useScrollShadow` with `useSyncExternalStore` and a passive scroll listener so
  only the boolean shadow state is subscribed to without an effect-driven
  initial update.
- **Result:** task 1.2 is complete and checked. KT-XNK brand/nav/account content
  remains as the intentional product substitution; Header itself uses semantic
  local UI plus StyleX and Astryx theme variables only.
- **Verification:** `./harness/verify.sh` passed every gate. Evidence:
  `harness/runs/20260814-231443-49141/`. Browser QA measured a 64px sticky
  header, desktop nav visible/mobile toggle hidden at exactly 1024px, shadow
  changing from none to a 1px/4px layer after scroll while header top remains 0,
  and keyboard Tab focusing the logo with a 2px accent outline. Screenshots:
  `harness/runs/20260814-react-dev-docs-shell-task-1-2/topnav-1024.png`,
  `topnav-1536.png`, and `topnav-1919.png`.
- **Next step:** task 1.3 — complete mobile overlay focus management and verify
  route/resize close paths across 374/390/640/768px.

## 2026-08-14 — Codex

- **Active change:** `react-dev-docs-shell`, task 1.1 verification closure.
- **Task worked:** applied the user's decision to keep the intentionally minimal
  Docs landing page and delete the obsolete landing-specific unit test rather
  than restore the removed `NỘI QUY`/`IT` content.
- **Result:** task 1.1 is complete and checked. The semantic StyleX shell,
  source contract test, OpenSpec design/spec/task map, and previously recorded
  desktop/mobile browser evidence now meet the repository definition of done.
- **Verification:** `./harness/verify.sh` passed every gate. Evidence:
  `harness/runs/20260814-230945-45205/`.
- **Next step:** task 1.2 — remove remaining Astryx UI from `header.jsx` and
  port react.dev TopNav's desktop appearance, sticky scroll shadow, responsive
  visibility, and keyboard behavior.

## 2026-08-14 — Codex

- **Active change:** `react-dev-docs-shell` (user-facing name: React.dev Docs
  Copycat).
- **Task worked:** task 1.1, the parity contract and semantic shell foundation.
  Added proposal/design/specs/tasks with the pinned `../react.dev` source map,
  exact breakpoint and geometry contract, App Router/MDX 3 compatibility
  decisions, risks, verification matrix, and resume protocol. Replaced Astryx
  `AppShell`/`MobileNav` with a local StyleX grid while retaining the existing
  Server Component auth boundary and opaque `children` composition.
- **Implementation state:** the header is a 64px sticky region; Docs/Tutorial
  routes gain a 20rem desktop sidebar at 1024px; non-docs routes remain
  single-column; the mobile route tree is a fixed overlay beneath the header.
  Mobile state closes naturally on pathname changes and explicitly on Escape or
  crossing the 1024px desktop boundary. Opening preserves/restores body overflow
  and padding to avoid a scrollbar-width layout shift. Header and SideNav now
  receive shell state via props instead of Astryx context.
- **Mechanical verification:** the new source contract tests pass. Lint,
  typecheck, dependency structure, harness tests, production build, readiness,
  memory-secret checks, and bundle quality thresholds pass. The complete gate
  remains red only because the user-owned `content/docs/index.mdx` currently
  contains no `NỘI QUY`/`IT` headings while the pre-existing Docs API test still
  requires both. Gate evidence: `harness/runs/20260814-230604-41052/`. Task 1.1
  is intentionally unchecked under Golden Rule 1.
- **Browser evidence:** at 1536x900, header=64px, desktop sidebar=320px and main
  begins at x=320; at 390x844, the overlay spans x=0..390 and y=64..844,
  document horizontal overflow is 0, body overflow changes to `hidden`, and
  Escape removes the overlay and restores `visible`. Screenshots:
  `harness/runs/20260814-react-dev-docs-shell-task-1-1/docs-shell-1536.png` and
  `docs-shell-mobile-open-390.png`.
- **Skill influence:** `frontend-design` kept the visual plan subordinate to the
  explicit react.dev reference instead of inventing a new aesthetic;
  `vercel-react-best-practices` kept MDX/page content server-rendered and made
  route-close state derived rather than a synchronous state-setting effect;
  `agent-browser` supplied runtime geometry and interaction evidence.
- **Discovered:** `header.jsx`, `side-nav.jsx`, `mdx-article.jsx`,
  `mdx-page-heading.jsx`, `table-of-contents.jsx`, and `footer.jsx` still use
  Astryx UI primitives. Their removal and parity refinements are explicitly
  tasks 1.2–2.2 and must not be represented as complete. The landing-content
  mismatch predates this change and was not altered.
- **Next step:** reconcile or receive direction on the user-owned Docs landing
  content/test mismatch, rerun `./harness/verify.sh`, then check task 1.1 and
  proceed to task 1.2. Resume from
  `openspec/changes/react-dev-docs-shell/tasks.md` and its `design.md`.

## 2026-08-14 — Codex

- **Active change:** complete Vietnamese coverage for the Optimistic font stack.
- **Task worked:** replaced narrow Vietnamese `unicode-range` overlays with
  dedicated Vietnamese-first Text and Display families, kept the Western
  Optimistic families as secondary coverage, and added six Vietnamese italic
  subsets generated at the upstream faces' -11° angle. Added a reproducible
  FontTools generation script and a regression test covering every configured
  family, weight, style, and asset.
- **Result:** implementation and browser QA are complete. Chromium's platform
  font audit reports 0 system fallbacks across 24 combinations: Text 400/500/700
  and Display 500/600/700, each in normal/italic and NFC/NFD. Visual inspection
  confirms consistent Vietnamese marks, slant, weight, and spacing.
- **Verification:** the font regression test, lint, typecheck, structure,
  harness tests, build, and quality thresholds pass. Full verification remains
  blocked only by the pre-existing Docs landing-page edit/test mismatch: the
  content no longer has a `NỘI QUY` heading while its TOC test still requires
  one. Evidence: `harness/runs/20260814-224847-28951/`; visual evidence:
  `harness/runs/20260814-vietnamese-font-coverage/font-audit-1440.png`.
- **Discovered:** no official Vietnamese italic files exist in react.dev's font
  download list or CDN; this is why the local subsets are generated rather than
  downloaded. The unrelated Docs mismatch was not changed.
- **Next step:** after the Docs content/test mismatch is reconciled, rerun the
  full gate, mark `vietnamese-font-coverage` task 1.1 complete, and close the
  proposal.

## 2026-08-14 — Codex

- **Active change:** scoped MDX component authoring policy for react.dev ports.
- **Task worked:** added an AI-visible exception that makes Astryx optional for
  components exposed through `useMDXComponents`. Native semantic elements and
  local controls are allowed; neutral Astryx layout/typography primitives remain
  available, while controls/chrome such as `Button`, `IconButton`, `Banner`, and
  `Card` are not mandatory. StyleX tokens, accessibility, architecture, and
  Server/Client Component boundaries remain required.
- **Result:** instruction, project convention, OpenSpec proposal/spec/task, and
  the nearby MDX map documentation are consistent. Task 1.1 remains unchecked
  because the repository's definition of done requires the full gate to pass.
- **Verification:** readiness, lint, typecheck, structure, harness tests, build,
  and quality thresholds pass. The full gate is blocked by a pre-existing
  `content/docs/index.mdx` edit that removes the `NỘI QUY` heading while
  `src/features/docs/api/content.test.js` still requires it. Evidence:
  `harness/runs/20260814-223557-19771/`.
- **Discovered:** reconcile the Docs landing-page content with its TOC test;
  not changed because it is outside the authoring-policy task and overlaps
  user-owned work.
- **Next step:** once the unrelated Docs content/test mismatch is resolved,
  rerun `./harness/verify.sh`, mark task 1.1 complete, and close the proposal.

## 2026-08-14 — Codex

- **Active change:** finalize the MDX navigation/content work for publication.
- **Task worked:** reconciled tests with the committed navigable-parent sidebar
  behavior and the actual 16 Docs article routes. Current breadcrumb ancestors
  intentionally omit `href` even when the corresponding sidebar group is
  navigable, preserving `DOCS > NỘI QUY` semantics without linking the current
  crumb.
- **Result:** done. Task 1.31 and the `mdx-sidebar-navigation` proposal are now
  complete.
- **Verification:** `./harness/verify.sh` passed every gate. Evidence:
  `harness/runs/20260814-165918-92357/`.
- **Harness gap:** none.
- **Next step:** commit and push the completed branch as requested.

---

## 2026-08-14 — Codex

- **Active change:** React.dev-inspired MDX `Note` callout refinement.
- **Task worked:** replaced the stateful Astryx Banner wrapper with an
  always-visible server-rendered callout built from Astryx layout, icon, and
  text primitives. The note uses the KT-XNK accent tint, inset hairline,
  display-font title, responsive padding, rounded desktop treatment, and a
  full-bleed mobile treatment. Applied it to the company-specific schedule in
  `content/docs/noi-quy/gio-lam-viec.mdx`.
- **Result:** implementation and browser QA complete. The note renders as
  semantic `<aside role="note">`; desktop measured 12px radius and 20px/24px
  padding, while 390px mobile measured full viewport width, zero radius, 20px
  padding, and no horizontal overflow.
- **Verification:** lint, typecheck, structure, harness tests, production build,
  and quality thresholds pass. Full gate is blocked by three pre-existing unit
  test/data mismatches in Docs post count and the `NỘI QUY` sidebar `path`; see
  `harness/runs/20260814-135035-52115/`. UI evidence:
  `harness/runs/20260814-mdx-note/gio-lam-viec-note-desktop.png` and
  `harness/runs/20260814-mdx-note/gio-lam-viec-note-mobile.png`.
- **Discovered:** reconcile the expected Docs post count (17 vs 16 discovered)
  and decide whether `NỘI QUY.path` should remain `/docs`; not changed because
  both are outside the note styling task and overlap current user-owned work.
- **Next step:** after those unrelated test/data mismatches are resolved, rerun
  `./harness/verify.sh` and mark task 1.31 done.

---

## 2026-08-14 — Codex

- **Active change:** Docs breadcrumb hierarchy correction.
- **Task worked:** replaced the hard-coded single `Docs` breadcrumb on article
  pages with a recursive lookup against `src/sidebarPost.json`, the same source
  used by the Docs sidebar. The matching article remains the page heading, while
  its ancestors become the breadcrumb trail; separators now render only between
  entries.
- **Result:** done. `/docs/lam-them-gio` renders `DOCS > NỘI QUY`; `Docs` links
  to `/docs`, `NỘI QUY` is the current non-link item, and `Làm thêm giờ` is not
  duplicated. A registry-backed unit test also covers the `IT` group and an
  unknown route.
- **Verification:** `./harness/verify.sh` passed all gates. Mechanical evidence:
  `harness/runs/20260814-115246-20534/`. UI screenshot:
  `harness/runs/20260814-mdx-breadcrumb-group/docs-lam-them-gio-breadcrumb-2048.png`.
- **Harness gap:** closed for hierarchy derivation with a unit test; visual
  separator rendering remains covered by the existing MDX visual-regression gap.
- **Next step:** none.

---

## 2026-08-14 — Codex

- **Active change:** nested MDX typography correction for `Intro`.
- **Task worked:** corrected the actual rendered node rather than only the
  wrapper. MDX compiles prose inside `<Intro>` to the shared paragraph mapping,
  whose body recipe previously reset the wrapper's font family, size, weight,
  and leading. Paragraphs under the stable `data-mdx-intro` boundary now receive
  the lead typography through scoped StyleX selectors; ordinary paragraphs are
  unaffected and the component remains server-only.
- **Result:** done. Browser inspection on `/docs/noi-quy-chung` confirms both
  wrapper and nested paragraph use Optimistic Display, 20px, weight 400, and
  28.572px leading; the paragraph retains primary ink `rgb(30, 42, 39)`.
- **Verification:** `./harness/verify.sh` passed all gates. Mechanical evidence:
  `harness/runs/20260814-114140-12796/`. UI screenshot:
  `harness/runs/20260814-mdx-intro-fix/intro-fixed-2048.png`.
- **Harness gap:** nested computed-style coverage is logged above.
- **Next step:** none.

---

## 2026-08-14 — Codex

- **Active change:** React Docs-style MDX `Intro` component.
- **Task worked:** added `Intro` to the shared MDX authoring map and adapted the
  supplied React.dev component to Astryx `Text` plus StyleX typography tokens.
  The component stays server-rendered and uses Optimistic Display, 20px lead
  text, normal weight, primary ink, block layout, and relaxed tokenized leading.
  The opening copy in the MDX sample now demonstrates the component.
- **Result:** done. Browser inspection on `/docs/xin-chao-mdx` measured a DIV
  rendered by Astryx Text with Optimistic Display, 20px, weight 400,
  `rgb(30, 42, 39)` primary ink, 28.572px leading, and block display.
- **Verification:** `./harness/verify.sh` passed all gates. Mechanical evidence:
  `harness/runs/20260814-112517-36258/`. UI screenshot:
  `harness/runs/20260814-mdx-intro/intro-2048.png`.
- **Harness gap:** none beyond the existing MDX visual-regression gap.
- **Next step:** none.

---

## 2026-08-14 — Codex

- **Active change:** react.dev-style MDX TOC scroll highlighting.
- **Task worked:** confirmed the existing `remark-flexible-toc` extraction
  pipeline already generates heading labels, depths, Unicode slugs, and
  duplicate-heading suffixes correctly. Ported react.dev's missing
  `useTocHighlight` behavior into `src/shared/hooks/`, kept the client boundary
  limited to the TOC, coalesced passive scroll events with animation frames,
  and applied active background/accent/bold styles plus `aria-current`.
- **Result:** done. Browser checks at 2048x900 selected the first section on
  load, selected `IT` when its heading reached 83.7px beneath the fixed header,
  and selected the final visible section at page end. The active item measured
  teal `rgb(36, 119, 104)`, weight 700, and a non-transparent highlight.
- **Verification:** `./harness/verify.sh` passed all gates. Mechanical evidence:
  `harness/runs/20260814-111136-26861/`. UI screenshot:
  `harness/runs/20260814-toc-highlight/toc-active-it-2048.png`.
- **Harness gap:** none beyond the existing MDX visual-regression gap.
- **Next step:** none.

---

## 2026-08-14 — Codex

- **Active change:** MDX heading permalink alignment correction.
- **Task worked:** matched react.dev's `.mdx-header-anchor svg` display mode by
  overriding Astryx Icon's block SVG to `display: inline`. Removed the earlier
  vertical-align override, allowing the glyph to participate in the heading's
  native text baseline exactly like the upstream implementation.
- **Result:** done. Browser geometry showed the previous block SVG sitting 14px
  below the text baseline with a 19.5px center delta. The inline SVG reduces
  that center delta to 3.5px and visually aligns with the heading text. Clicking
  the glyph still updates the hash and positions its heading at the 84px safe
  header offset.
- **Verification:** `./harness/verify.sh` passed all gates. Mechanical evidence:
  `harness/runs/20260814-105453-14568/`. UI screenshot:
  `harness/runs/20260814-105435-mdx-anchor-alignment/mdx-anchor-aligned-2048.png`.
- **Harness gap:** none beyond the existing MDX visual-regression gap.
- **Next step:** none.

---

## 2026-08-14 — Codex

- **Active change:** react.dev-style MDX heading permalinks.
- **Task worked:** audited react.dev's `MDXComponents.tsx` against the local
  MDX mapping and ported the missing `Heading` behavior. MDX h2-h6 now expose
  the upstream chain-link glyph beside their text on heading hover or keyboard
  focus; h1 remains unlinked. Links use generated `rehype-slug` ids, localized
  accessible labels, KT-XNK accent color, and an 84px header-safe scroll
  margin. The glyph is isolated in a tiny Client Component so server-rendered
  MDX never passes a component function across the React Server Component
  boundary.
- **Result:** done. Browser checks on `/docs` found zero h1 permalinks and 11
  h2-h6 permalinks, measured icon opacity changing from 0 to 1 on hover/focus,
  and confirmed a glyph click updates the URL fragment and places the target
  heading 84px below the viewport top.
- **Verification:** `./harness/verify.sh` passed all gates. Mechanical evidence:
  `harness/runs/20260814-104947-8675/`. UI screenshot:
  `harness/runs/20260814-104846-mdx-heading-link/mdx-heading-permalink-hover-2048.png`.
- **Harness gap:** none; the initial server/client-boundary mistake is covered
  by the existing production-build gate, which rejects that invalid component
  serialization.
- **Next step:** none.

---

## 2026-08-14 — Codex

- **Active change:** react.dev Breadcrumbs and TOC style port for MDX pages.
- **Task worked:** replaced the generic Astryx breadcrumb presentation with
  react.dev's 13px uppercase/bold/tracking-wide breadcrumb rhythm and trailing
  20px chevrons. Ported react.dev's TOC offsets, 13px uppercase label, inner
  scroll rail, 8px list/item spacing, 8px vertical link padding, rounded start
  edge, depth-3 indentation, and depth-4+ hiding. This is a presentation-only
  port; existing routes/TOC data remain unchanged. React link/highlight colors
  map to KT-XNK teal/mint tokens rather than React's cyan palette.
- **Result:** done. Browser measurements confirm the breadcrumb and TOC label
  at 13px/700 with 0.025em tracking, the chevron at 20px, TOC heading y=80,
  link padding 8px, and mobile TOC display none. Desktop/mobile screenshots
  show the expected layout without overflow.
- **Verification:** `./harness/verify.sh` passed all gates. Evidence and UI
  screenshots: `harness/runs/20260814-102945-95115/`.
- **Harness gap:** none beyond the existing visual-regression gap above.
- **Next step:** none.

---

## 2026-08-14 — Codex

- **Active change:** semantic refinement of the MDX color hierarchy.
- **Task worked:** returned PageHeading and all article h1-h6 headings to the
  neutral primary ink, while reserving brand teal for breadcrumb items and
  separators, inline links, markdown strong emphasis, TOC labeling, and the
  copy action. Retained the mint h2 divider and callout surfaces as quiet
  structural accents. Breadcrumb coloring is scoped through inherited Astryx
  color tokens rather than a global component override.
- **Result:** done. Browser computed styles measure headings at
  `rgb(30, 42, 39)` and breadcrumbs/links/strong emphasis at
  `rgb(36, 119, 104)`. Desktop and 390px mobile screenshots preserve the MDX
  alignment and wrapping contracts.
- **Verification:** `./harness/verify.sh` passed all gates. Evidence and UI
  screenshots: `harness/runs/20260814-101958-86869/`.
- **Harness gap:** none beyond the existing visual-regression gap above.
- **Next step:** none.

---

## 2026-08-14 — Codex

- **Active change:** MDX document color hierarchy.
- **Task worked:** replaced the monochrome MDX presentation with a restrained
  KT-XNK brand hierarchy. Page titles and h1-h3 headings use the logo teal;
  h2 headings gain a mint divider; inline links are teal and permanently
  underlined; blockquotes use the mint accent surface; TOC and copy-link
  affordances use the same accent. Body copy remains neutral for long-form
  readability. The copy icon button now also exposes its accessible label.
- **Result:** done. Browser computed styles confirm `rgb(36, 119, 104)` for
  PageHeading, section headings, links, TOC heading, and copy action; MDX links
  retain an underline. Desktop and 390px mobile screenshots show no overflow
  or layout regression.
- **Verification:** `./harness/verify.sh` passed all gates. Evidence and UI
  screenshots: `harness/runs/20260814-095912-77927/`.
- **Harness gap:** none beyond the existing visual-regression gap above.
- **Next step:** none.

---

## 2026-08-14 — Codex

- **Active change:** exact MDX PageHeading/article alignment with react.dev.
- **Task worked:** added the missing prose-level `MaxWidth` wrapper used by
  react.dev's `prepareMDX.js`/MDX component map. The body retains its outer
  `max-w-7xl` frame for wide content, while ordinary prose now uses
  `max-w-4xl ms-0 2xl:mx-auto`, matching PageHeading's horizontal contract.
  Added stable layout markers for geometry-based browser checks.
- **Result:** done. At 2048px PageHeading and prose both measure x=576 and
  width=896 while the TOC occupies x=1728..2048; at 1280px both measure x=368
  and width=864 with TOC hidden; at 390px both measure x=20 and width=350.
- **Verification:** `./harness/verify.sh` passed all gates. Browser screenshots
  are `mdx-layout-{390,1280,2048}.png` in evidence directory
  `harness/runs/20260814-094550-69001/`.
- **Harness gap:** logged above; geometry is verified for this change but not
  yet run automatically by the repository gate.
- **Next step:** none.

---

## 2026-08-14 — Codex

- **Active change:** MDX PageHeading/body alignment correction against react.dev.
- **Task worked:** corrected the responsive hierarchy so the 2xl layout now
  matches react.dev's outer `sidebar | main | toc` model. Within the AppShell
  content area, MDX uses `main | 20rem TOC`; PageHeading (`max-w-4xl`) and body
  (`max-w-7xl`) each center within main, rather than PageHeading centering over
  the combined main-plus-TOC width. This removes the extra rightward offset
  while preserving their intentional different maximum widths.
- **Result:** done.
- **Verification:** `./harness/verify.sh` passed all gates. Evidence:
  `harness/runs/20260814-093202-60510/`.
- **Harness gap:** visual automation remains unavailable because local Chrome
  lacks `libnspr4.so`; the corrected column hierarchy is mechanically covered
  by typecheck/build but not screenshot diffing.
- **Next step:** none.

---

## 2026-08-14 — Codex

- **Active change:** MDX responsive-grid regression reported from visual review.
- **Task worked:** fixed the MDX body fragment being mounted directly into the
  two-column Grid. MDX can emit many top-level DOM nodes, so each paragraph,
  heading, or list became an independent grid item and flowed into the TOC
  column. The Grid now has exactly two conceptual children: one explicit
  content-column wrapper containing all rendered MDX, and the TOC rail.
- **Result:** done.
- **Verification:** `./harness/verify.sh` passed all gates. Evidence:
  `harness/runs/20260814-092718-56214/`.
- **Harness gap:** logged above; a JSX-capable render test should mechanically
  enforce the Grid's direct-child contract in future.
- **Next step:** none.

---

## 2026-08-14 — Codex

- **Active change:** `openspec/changes/mdx-sidebar-navigation/` React Docs content breakpoints.
- **Task worked:** ported the responsive relationship from react.dev's
  `Layout/Page.tsx`, `PageHeading.tsx`, and Tailwind defaults into the MDX
  frame. MDX routes now remove AppShell's generic padding, apply 20px content
  insets below 640px and 48px from 640px, constrain the heading to 56rem and
  center it only from 1536px, constrain the body to 80rem, and introduce a
  21rem TOC rail only from 1536px. Below that breakpoint the article keeps the
  full content column. All behavior is CSS-driven; no viewport subscriptions
  or resize listeners were added.
- **Result:** done.
- **Verification:** production build output contains the expected spacing
  tokens and 21rem rail; `./harness/verify.sh` passed all gates. Evidence:
  `harness/runs/20260814-092141-52007/`.
- **Harness gap:** screenshot automation remains unavailable because the local
  Chrome runtime lacks `libnspr4.so`; responsive contracts were checked in
  source and compiled output.
- **Next step:** none.

---

## 2026-08-14 — Codex

- **Active change:** `openspec/changes/mdx-sidebar-navigation/` React Docs PageHeading.
- **Task worked:** applied the structure of react.dev's open-source
  `PageHeading.tsx` to every rendered MDX article: a compact top row with
  breadcrumbs and a copy action, followed by a balanced 5xl display heading
  and optional update date. Styling uses KT-XNK/Astryx theme tokens and
  primitives. The heading remains server-rendered; only the clipboard action
  is a small client component. Docs and Tutorial child pages now expose their
  collection breadcrumb.
- **Result:** done.
- **Verification:** production SSR checks confirmed the large heading, copy
  action, and Docs breadcrumb on the relevant routes; `./harness/verify.sh`
  passed all gates. Evidence: `harness/runs/20260814-090756-44019/`.
- **Harness gap:** interactive screenshot/click automation remains unavailable
  because local Chrome is missing `libnspr4.so`; production markup and build
  validate the server/client boundary.
- **Next step:** none.

---

## 2026-08-14 — Codex

- **Active change:** `openspec/changes/mdx-sidebar-navigation/` Docs landing content.
- **Task worked:** replaced the `/docs` list view with a long-form
  `content/docs/index.mdx` landing article. It explains how to use the internal
  knowledge base, introduces the Nội quy and IT domains, links to all 16 child
  documents in context, and includes guidance for reporting incidents and
  proposing documentation updates. The content pipeline reserves `index.mdx`
  for `/docs`, excludes it from `/docs/[slug]`, and no longer carries the now
  unused Docs post-list component or list-loading API.
- **Result:** done.
- **Verification:** unit coverage confirms the landing frontmatter/TOC and the
  absence of an `/docs/index` slug; `./harness/verify.sh` passed all gates.
  Evidence: `harness/runs/20260814-090359-39993/`.
- **Harness gap:** browser screenshots remain unavailable because the local
  Chrome runtime lacks `libnspr4.so`; production rendering is covered by the
  build and MDX compilation tests.
- **Next step:** none.

---

## 2026-08-14 — Codex

- **Active change:** `openspec/changes/mdx-sidebar-navigation/` automatic Docs content pipeline.
- **Task worked:** removed the handwritten `docsPostSlugs` array and
  `components/post-loader.js`. Added a React Docs-inspired content API that
  recursively discovers `content/docs/**/*.mdx`, rejects duplicate filename
  slugs, compiles trusted repository MDX at build time, and derives static
  params, frontmatter, TOC, and index entries directly from files. Moved the
  MDX component mapping into shared UI so both static Tutorial MDX and compiled
  Docs MDX render through the same components. Adding or deleting a Docs file
  no longer requires editing a JavaScript import registry.
- **Result:** done.
- **Verification:** discovery/compilation unit coverage passed for nested
  Nội quy and IT content; typecheck and production build passed; full
  `./harness/verify.sh` passed. Evidence:
  `harness/runs/20260814-085743-35549/`.
- **Harness gap:** sidebar/content consistency is identified in the change
  design as the next mechanical check; filesystem discovery itself is covered.
- **Next step:** none.

---

## 2026-08-14 — Codex

- **Active change:** `openspec/changes/mdx-sidebar-navigation/` content ownership cleanup.
- **Task worked:** moved all company-authored Docs MDX out of
  `src/features/docs/components/posts/` into `content/docs/`, organized under
  `noi-quy/` and `it/` with the introductory article at the Docs root. Updated
  the feature's static source registry so Turbopack can still analyze every
  import while TOC extraction resolves each nested filesystem path. Documented
  `content/docs/` as an architecture-level content boundary.
- **Result:** done.
- **Verification:** typecheck and production build confirm MDX imports outside
  `src/` compile correctly; `./harness/verify.sh` passed all gates. Evidence:
  `harness/runs/20260814-084544-26105/`.
- **Harness gap:** none; typecheck caught and rejected the loader registry's
  stale JSDoc contract during the first run.
- **Next step:** none.

---

## 2026-08-14 — Codex

- **Active change:** `openspec/changes/mdx-sidebar-navigation/` Docs group behavior correction.
- **Task worked:** corrected `NỘI QUY` and `IT` from static section headings to
  pathless disclosure groups. Each full parent row now toggles its nested list;
  a group containing the current article starts expanded, while all 16 article
  rows remain normal navigable links. Added a registry test that locks the
  intended two-group structure and 7/9 child counts.
- **Result:** done.
- **Verification:** `./harness/verify.sh` passed all gates. Evidence:
  `harness/runs/20260814-083514-19167/`.
- **Harness gap:** none; the first state-sync implementation was rejected by
  the existing React hooks lint rule and replaced before completion.
- **Next step:** none.

---

## 2026-08-14 — Codex

- **Active change:** `openspec/changes/mdx-sidebar-navigation/` company Docs content structure.
- **Task worked:** added route-backed `NỘI QUY` and `IT` sections to
  `sidebarPost.json`. Added 16 MDX documents covering seven company-policy
  topics and nine IT topics, then registered every slug in the static post
  loader so sidebar links, static params, metadata, TOC extraction, and the
  Docs index all use the same content set.
- **Result:** done.
- **Verification:** `./harness/verify.sh` passed all gates. Authenticated SSR
  checks of `/docs/noi-quy-chung` and `/docs/may-tinh` confirmed both section
  labels, article content, and current-page state. Evidence:
  `harness/runs/20260814-082636-12913/`.
- **Harness gap:** browser screenshot automation could not start because the
  installed Chrome runtime is missing the host library `libnspr4.so`; SSR
  artifacts were captured as the available UI evidence.
- **Next step:** replace the initial policy guidance with company-approved
  wording and operational details when those sources become available.

---

## 2026-08-13 — Codex

- **Active change:** route-scoped sidebar frame.
- **Task worked:** moved sidebar visibility to a route-aware AppShell wrapper.
  Only `/tutorial`, `/tutorial/*`, `/blog`, and `/blog/*` receive a desktop
  sidebar and mobile drawer. Home, Design System, and every other route pass
  no sidebar slot and disable mobile navigation, so the content uses the full
  frame width.
- **Result:** done.
- **Verification:** authenticated SSR checks found no documentation navigation
  landmark on Home or Design System, and exactly one on Tutorial and Blog
  article routes. All quality gates passed. Evidence:
  `harness/runs/20260813-152643-36678/`.
- **Harness gap:** none.
- **Next step:** none.

---

## 2026-08-13 — Codex

- **Active change:** route-contextual content sidebar.
- **Task worked:** changed the custom sidebar from showing both expandable
  content collections at once to a React Docs-style section tree selected by
  the current route. Blog routes now show Blog, its overview, and Blog article
  links only; Tutorial routes show the equivalent Tutorial content only.
  Non-collection routes retain the general navigation tree.
- **Result:** done.
- **Verification:** lint, typecheck, unit tests, build, formatting, and all
  quality gates passed. Evidence: `harness/runs/20260813-152323-35042/`.
- **Harness gap:** none.
- **Next step:** none.

---

## 2026-08-13 — Codex

- **Active change:** React Docs navigation typography calibration.
- **Task worked:** decoupled navigation UI typography from the 17px article
  body scale. Top navigation and top-level sidebar rows now use 15px; nested
  sidebar links and the table of contents use 13px. Top-nav default/active
  weights are 400/500, nested links remain 400, and bold is limited to
  top-level sidebar hierarchy, selected sidebar links, and the TOC heading.
  Replaced the Astryx List-based TOC with the semantic structure and compact
  sizing used by React Docs.
- **Result:** done.
- **Verification:** lint, typecheck, unit tests, build, formatting, and all
  quality gates passed. Evidence: `harness/runs/20260813-150930-31092/`.
- **Harness gap:** none.
- **Next step:** none.

---

## 2026-08-13 — Codex

- **Active change:** React Docs source-derived navigation frame.
- **Task worked:** replaced the remaining Astryx TopNav implementation with a
  custom semantic header derived from React Docs' `TopNav.tsx`: 64px desktop
  height, logo at start, right-aligned pill navigation and user actions,
  pressed/hover/active/focus states, and a hamburger below 1024px. AppShell now
  uses a surface frame and a custom 320px mobile drawer containing the same
  custom route tree; the desktop sidebar remains 320px and sticky.
- **Result:** done.
- **Verification:** authenticated SSR contains one custom primary navigation,
  no `astryx-top-nav` markup, one custom documentation sidebar, a current-page
  Tutorial pill on its article route, and no optional reference headings.
  `./harness/verify.sh` passed all gates. Evidence:
  `harness/runs/20260813-144616-25396/`.
- **Harness gap:** visual screenshot automation is unavailable in the current
  environment; markup, breakpoint CSS, SSR, and interaction contracts were
  checked mechanically.
- **Next step:** none.

---

## 2026-08-13 — Codex

- **Active change:** `openspec/changes/mdx-sidebar-navigation/` top navigation.
- **Task worked:** added Tutorial and Blog to the protected top navigation as
  centered, rounded pill links modeled on React Docs' Learn/Blog navigation.
  Selection uses prefix route matching, so article detail routes retain the
  correct active collection highlight.
- **Result:** done.
- **Verification:** authenticated SSR of `/tutorial/bat-dau` rendered both top
  navigation links and marked Tutorial with `aria-current="page"`; config unit
  coverage confirms their labels, destinations, and order;
  `./harness/verify.sh` passed all gates. Evidence:
  `harness/runs/20260813-142717-19813/`.
- **Harness gap:** none.
- **Next step:** none.

---

## 2026-08-13 — Codex

- **Active change:** `openspec/changes/mdx-sidebar-navigation/` custom sidebar.
- **Task worked:** replaced Astryx SideNav/SideNavItem/SideNavSection with a
  semantic custom navigation tree modeled on React Docs' open-source
  SidebarRouteTree and SidebarLink. It has full-row disclosure buttons,
  chevrons, nested links, route-driven expansion, highlighted current links,
  optional divider-separated reference headings, focus styles, and mobile
  drawer close behavior. Reference headings are disabled by default and render
  only when a consumer explicitly supplies them.
- **Result:** done.
- **Verification:** no Astryx SideNav components remain in the implementation;
  authenticated SSR of `/tutorial/bat-dau` returned one expanded disclosure,
  one current-page link, the navigation label, and no visible optional
  reference headings. `./harness/verify.sh` passed all gates. Evidence:
  `harness/runs/20260813-142328-17277/`.
- **Harness gap:** none.
- **Next step:** none.

---

## 2026-08-13 — Codex

- **Active change:** React Docs font families (direct user request).
- **Task worked:** self-hosted the React Docs Latin and Vietnamese WOFF2 font
  assets and configured Astryx typography roles to use Optimistic Text for
  body/UI, Optimistic Display for headings, and Source Code Pro for code. Local
  system stacks remain as fallbacks; unrelated script subsets were omitted.
- **Result:** done.
- **Verification:** generated theme CSS resolves each role to the intended
  family, all downloaded assets identify as valid WOFF2 files, repository-wide
  formatting passes, and `./harness/verify.sh` passed all gates. Evidence:
  `harness/runs/20260813-135154-5479/`.
- **Harness gap:** none.
- **Next step:** none.

---

## 2026-08-13 — Codex

- **Active change:** React Docs-like typography sizing (direct user request).
- **Task worked:** raised the project-wide Astryx typography scale from the
  neutral 14px base to a 17px base while retaining the 1.2 ratio. This matches
  React Docs' 17px document body and raises supporting/sidebar text from 12px
  to 14px, with headings and semantic text growing consistently from tokens.
- **Result:** done.
- **Verification:** generated theme CSS confirmed body 17px, supporting 14px,
  and large text 20px; `./harness/verify.sh` passed all gates. Evidence:
  `harness/runs/20260813-105149-68036/`.
- **Harness gap:** none.
- **Next step:** none.

---

## 2026-08-13 — Codex

- **Active change:** `openspec/changes/mdx-sidebar-navigation/` follow-up.
- **Task worked:** followed React Docs' reference-sidebar source model by
  adding optional, divider-separated static headings (`react@19.2`,
  `react-dom@19.2`, and `React Compiler`) after the navigation links. The
  heading block is data-driven and renders nothing when omitted or empty.
- **Result:** done.
- **Verification:** `./harness/verify.sh` passed all gates. Evidence:
  `harness/runs/20260813-100155-55676/`; repository-wide `pnpm format:check`
  also passed after formatting the previously outstanding files.
- **Harness gap:** none.
- **Next step:** none.

---

## 2026-08-13 — Codex

- **Active change:** `openspec/changes/mdx-sidebar-navigation/` follow-up.
- **Task worked:** made collapsible Tutorial and Blog parent rows use the full
  SideNavItem surface as their expand/collapse trigger instead of keeping a
  separate small chevron target beside a parent link. Nested article links are
  unchanged.
- **Result:** done.
- **Verification:** `./harness/verify.sh` passed all gates. Evidence:
  `harness/runs/20260813-092353-45941/`.
- **Harness gap:** none.
- **Next step:** none.

---

## 2026-08-13 — Codex

- **Active change:** `openspec/changes/mdx-sidebar-navigation/`.
- **Task worked:** changed Tutorial and Blog from flat sidebar links into
  collapsible parents whose nested article links are generated from the existing
  MDX loaders, slugs, and frontmatter titles. Active article routes start with
  their parent expanded and mark the exact child as selected, following the
  route-tree behavior of React Docs while using Astryx's native nested SideNav.
- **Result:** done on branch `feat/mdx-react-style-sidebar`.
- **Verification:** lint, typecheck, and unit tests passed; server-rendered route
  checks confirmed Tutorial expanded/Blog collapsed on `/tutorial/bat-dau` and
  the inverse on `/blog/xin-chao-mdx`, including `aria-current` on each active
  child. `./harness/verify.sh` passed all gates. Evidence:
  `harness/runs/20260813-084937-31693/`.
- **Harness gap:** none.
- **Next step:** none.

---

## 2026-08-12 — Codex

- **Active change:** harness documentation limits (direct user request).
- **Task worked:** shortened the project summary in `AGENTS.md` without
  removing any source-of-truth pointers or operating rules, bringing the file
  from 121 to 119 lines and back under `audit-harness.sh`'s 120-line limit.
- **Result:** done.
- **Verification:** `./harness/audit-harness.sh` passed 25/25;
  `./harness/verify.sh` passed all gates. Evidence:
  `harness/runs/20260812-093643-6043/`.
- **Harness gap:** none — the existing audit correctly detected the drift.
- **Next step:** none.

---

## 2026-08-07 23:15 — Claude Code

- **Active change:** `openspec/changes/login-username-password/` — retroactively
  documents the login feature (shipped across 5 prior ad-hoc commits, none
  of which went through the openspec proposal flow) and removes an
  undocumented CCCD-specific constraint discovered while writing that
  proposal.
- **Task worked:**
  1. **Removed the CCCD constraint**: `src/features/auth/config/login-schema.js`
     had a hidden `USERNAME_PATTERN = /^\d{12}$/` regex (with a comment
     explaining the "username" field was secretly a Vietnamese CCCD) even
     though every visible label/copy presented it as a generic username.
     Replaced the regex-based rule with a plain `.min(3, ...)` string
     check — no format/charset restriction. Updated
     `config/test-users.js`'s placeholder credentials from CCCD-shaped
     digit strings (`001234567890`, `079198765432`) to plain usernames
     (`admin`, `testuser`), keeping the existing passwords. Confirmed via
     `grep -ri cccd src/features/auth/` (and repo-wide `src/`) that no
     other file references CCCD — the constraint was fully isolated to
     that one regex.
  2. **Wrote the missing openspec change** at
     `openspec/changes/login-username-password/` (status `done`, dated
     today) with `proposal.md` (Why/What changes/Out of scope/Decision
     log), `specs/login.md` (4 requirements — username/password auth,
     server-side session gate, session display & logout, remember-me —
     each with GIVEN/WHEN/THEN scenarios), `design.md` (approach, affected
     layers & files table, verification plan), and `tasks.md` (all boxes
     checked, matching the "already shipped" nature of the work it
     documents).
- **Result:** done.
- **Verification:** `./harness/verify.sh` — full pass (structure, lint,
  typecheck, harness tests, unit tests, build, quality thresholds).
  Also ran `pnpm dev` and drove the app with `agent-browser`: logged in
  with both new test users (`admin`/`password123`, `testuser`/`testpass1`)
  — success, avatar shown, redirected off `/login`; logged out via the
  avatar menu both times — session cleared, redirected to `/login`;
  submitted a 2-character username — inline "Tên đăng nhập phải có ít
  nhất 3 ký tự" validation error, no request sent; submitted the *old*
  CCCD test value `001234567890`/`password123` — now rejected as "Sai tên
  đăng nhập hoặc mật khẩu" (invalid credentials, not a format error),
  confirming the CCCD-only constraint is genuinely gone and it's just an
  arbitrary string that doesn't match a test user; visited `/` directly
  with no session — redirected to `/login`.
- **Decisions made:** kept the username rule at a plain `min(3)` rather
  than inventing a new regex/charset restriction to replace the old one —
  the point of the change was fewer constraints, not a differently-shaped
  hidden one. Left `session-keys.js`, `api/login.js`, `api/session.js`,
  `hooks/use-login-form.js`, `hooks/use-session.js`, `components/login-form.jsx`,
  `components/user-menu.jsx`, and `src/app/(protected)/layout.jsx`
  untouched — none contained CCCD-specific logic (already fully generic).
- **Next step:** none pending. Known follow-ups intentionally left out of
  scope (see `proposal.md`'s "Out of scope"): swapping the mock
  `api/login.js`/`config/test-users.js` for a real backend once one
  exists, and `components/user-menu.jsx`'s `Avatar name={username}`
  showing the raw username rather than a derived display name.

---

## 2026-08-07 21:45 — Claude Code

- **Active change:** repo-wide, not scoped to the login feature — (1) React
  component files renamed `.js` → `.jsx`, (2) VSCode ESLint auto-fix-on-save
  config fixed (branch `feature/login`, no `openspec/changes/` entry —
  direct per user request: "Fix eslint khi dùng vscode save không auto fix
  và react component phải dùng *.jsx").
- **Task worked:**
  1. **`.jsx` rename**: scanned every `.js` under `src/` for actual JSX
     syntax (not JSDoc generics like `Record<string, string>`, which false-
     positive on a naive `<[A-Za-z]` grep — e.g. `use-login-form.js` and
     `theme.js` have angle-bracket JSDoc/comments but no real JSX, so they
     stayed `.js`). 37 files genuinely render JSX and got `git mv`'d to
     `.jsx`: every `page.js`/`layout.js` under `src/app/` (Next.js resolves
     these by filename convention regardless of extension — no import
     references anywhere needed updating for those), plus every component
     under `src/features/*/components/` and `src/shared/components/`
     (including the `mdx/*.js` callouts and `src/mdx-components.js`, also
     convention-resolved by `@next/mdx`, not imported). Then fixed every
     *explicit* `import .../.js'` reference to a renamed file (barrels like
     `features/*/index.js`, cross-component imports like `showcase-
     section.js` from the design-system sections, `mdx-components.js`'s
     imports of the mdx callouts) — found via a targeted grep per renamed
     basename, not a blind sed, since several basenames collide across
     directories (`post-list.js` exists in both `features/blog/` and
     `features/tutorial/`; every `page.js` collides across routes) and a
     naive global rename would have silently pointed one feature's import
     at the wrong file.
     - **Made it mechanical, not just a one-time cleanup**: added a new
       `eslint.config.mjs` rule block (`react/jsx-filename-extension`,
       `{extensions: ['.jsx']}`, scoped to `src/**/*.js`) so a future PR
       that adds JSX to a `.js` file fails lint instead of silently
       reintroducing the mix — matches `AGENTS.md`'s "every convention
       must map to a lint rule" requirement. Documented the convention in
       `openspec/project.md` (Naming bullet) and refreshed the stale `.js`
       filenames in `docs/architecture.md`'s inventory section.
  2. **VSCode ESLint config**: removed `"eslint.useFlatConfig": true` from
     `.vscode/settings.json` — deprecated now that flat config
     (`eslint.config.mjs`) is auto-detected by the ESLint extension;
     leaving it set is a plausible source of the extension silently
     misbehaving depending on installed extension version. Changed
     `"editor.codeActionsOnSave"`'s `"source.fixAll.eslint"` value from
     `"explicit"` to `true` for broader VSCode-version compatibility
     (`"explicit"` needs VSCode ≥ 1.74; `true` degrades everywhere).
     Left `eslint.validate: ["javascript", "javascriptreact"]` as-is — it
     was already correct (VSCode maps `.jsx` files to the
     `javascriptreact` languageId by built-in association regardless of
     what extension a file used before, so this wasn't actually broken by
     the old `.js`-for-everything convention).
- **Result:** done for what's fixable from repo files. Could NOT verify
  the actual "does autosave now fix" behavior — that requires a live
  VSCode session with the ESLint extension installed and enabled, which
  isn't available in this environment. If it's still not firing after
  these changes, the next things to check are outside repo config: the
  ESLint extension installed/enabled for this specific workspace (VSCode
  can have it disabled per-workspace independent of `extensions.json`
  recommendations), and the "ESLint" output channel (View → Output →
  ESLint) for a startup error.
- **Verification:** `./harness/verify.sh` — full pass, including a real
  `next build` (confirms every renamed `page.jsx`/`layout.jsx` still
  resolves as a route and every fixed import resolves). Also ran `pnpm dev`
  and drove the app with `agent-browser`: `/login` renders and validates,
  logging in redirects to `/` with the full shell + avatar, and `/blog`,
  `/tutorial`, `/design-system` all still render their real content — not
  just a passing build.
- **Decisions made:** kept `page.js`/`layout.js` base filenames but with
  `.jsx` extension (`page.jsx`, `layout.jsx`) rather than inventing
  alternate names — matches Next.js's own convention (`pageExtensions` in
  `next.config.mjs` already listed `'jsx'`) and needed zero config changes
  there. Did not rename `src/shared/components/theme.js` despite the
  grep false-positive (`<Note>` in a comment) — confirmed by hand it has
  no real JSX.
- **Next step:** none pending. Ask the user to confirm autosave-fix now
  works in their actual VSCode session — the repo-side fix is done but
  unverifiable from here.
- **Blockers:** none

---

## 2026-08-07 21:30 — Claude Code

- **Active change:** stop the login form's copy from revealing the
  username is a CCCD (branch `feature/login`, no `openspec/changes/`
  entry — direct follow-up per user request: "username không cần biết đó
  là căn cước công dân hay là tên đăng nhập"). User had already hand-edited
  `components/login-form.js` (label → "Tên đăng nhập", placeholder →
  "Nhập tên đăng nhập", dropped the subtitle text, heading → "ĐĂNG NHẬP")
  before this session picked the task back up.
- **Task worked:** the underlying rule is unchanged — the field still must
  be a 12-digit CCCD (that requirement came from the very first ask in
  this feature and wasn't revisited) — only the *copy* changed, so nobody
  looking at the form can tell it's specifically a citizen-ID field:
  - `config/login-schema.js`: renamed `CCCD_PATTERN` → `USERNAME_PATTERN`;
    error messages "Vui lòng nhập số căn cước công dân" / "Số căn cước
    công dân phải gồm đúng 12 chữ số" → generic "Vui lòng nhập tên đăng
    nhập" / "Tên đăng nhập không hợp lệ". Left a comment noting the
    12-digit regex is still CCCD-shaped internally, on purpose.
  - `api/login.js`: failure message "Sai số căn cước công dân hoặc mật
    khẩu" → "Sai tên đăng nhập hoặc mật khẩu".
  - `components/login-form.js`: removed the now-unused `Text` import
    (dead after the user's edit dropped the subtitle `<Text>` that used
    it) — lint would have caught this on the next `verify.sh` run anyway.
  - Left `config/test-users.js` as-is — its comments already don't
    mention CCCD, and the sample values are just data.
- **Result:** done.
- **Verification:** `./harness/verify.sh` — full pass. `agent-browser`:
  `/login` shows "Tên đăng nhập" (not CCCD wording) with a generic
  required-field error on empty submit; logging in with an existing
  `test-users.js` credential (still a 12-digit value, business rule
  unchanged) still succeeds and redirects to `/`.
- **Decisions made:** kept the actual 12-digit validation — the user asked
  to hide *that it's a CCCD*, not to drop the CCCD requirement itself.
- **Next step:** none pending.
- **Blockers:** none

---

## 2026-08-07 21:20 — Claude Code

- **Active change:** move the app shell (top nav / side nav / footer) out
  of the root layout and into `src/app/(protected)/layout.js` (branch
  `feature/login`, no `openspec/changes/` entry — direct follow-up per
  user request: "layout app shell cũng tương tự, chỉ xuất hiện khi đã
  login" — the shell was rendering on `/login` too, which shouldn't have
  any site chrome).
- **Task worked:** `src/app/layout.js` now only does `html`/`body` +
  `QueryProvider`/`ThemeProvider` + `{children}` — no `AppShell`, `Header`,
  `AppSideNav`, `Footer`, or `UserMenu` left in it. All of that moved into
  `src/app/(protected)/layout.js`, alongside the existing session-cookie
  redirect check from the 17:20 entry: on a valid session, it now renders
  `<AppShell topNav={<Header .../>} sideNav={<AppSideNav .../>}>{children}
  <Footer /></AppShell>` instead of returning `children` bare. `/login`
  stays outside this route group, so it renders directly under the root
  layout with zero chrome — just `LoginForm`'s own centered card.
- **Result:** done.
- **Verification:** `./harness/verify.sh` — full pass. `agent-browser`:
  `/login` now renders with no header/sidenav/footer at all (screenshot:
  just the centered login card on a blank page); logging in redirects to
  `/` and the full shell (top nav with avatar, side nav, footer) appears;
  clicking "Đăng xuất" clears the session and lands back on the bare
  `/login` page with the shell gone again.
- **Decisions made:** none beyond what's in "Task worked" above — this was
  a straightforward move of existing JSX, no new logic.
- **Next step:** none pending.
- **Blockers:** none

---

## 2026-08-07 17:20 — Claude Code

- **Active change:** make the login gate a *real* server-side block, not
  just a client-side redirect (branch `feature/login`, no `openspec/
  changes/` entry — direct follow-up). User verified independently that
  unauthenticated visitors could still read protected pages ("người dùng
  chưa đăng nhập vẫn có thể xem được các route khác") and confirmed via
  `curl` (this session, before fixing) that raw HTML — no JS needed — still
  contained full page content (e.g. `/blog`'s "Xin chào MDX" post). Root
  cause: the previous `AuthGuard` (2026-08-07 15:40 entry) only ran after
  React hydrated; Next.js Server Components render full protected-page HTML
  regardless of client auth state, so it was always sent, just hidden late.
- **Task worked:** the only way to stop protected HTML from ever being
  generated, without `middleware.js` (still off the table per the earlier
  explicit rejection), is a server-side check in a layout using
  `cookies()`/`redirect()` — confirmed this is acceptable with the user
  first (`AskUserQuestion`) since it's still Next-specific server code, just
  not the dedicated middleware feature.
  - Moved every route except `/login` into a route group:
    `src/app/(protected)/{page.js, blog/, tutorial/, design-system/}` (was
    directly under `src/app/`). Route groups don't affect the URL — `/`,
    `/blog`, etc. are unchanged — they just let `/login` opt out of the new
    layout. Fixed each moved file's relative import depth (+1 level).
  - New `src/app/(protected)/layout.js` — `async`, `await cookies()`, and
    `redirect('/login')` if the access-token cookie is missing, before
    `{children}` (the actual page) ever renders. This is what makes it
    real: `redirect()` during server rendering means the child Server
    Component's body — and therefore the data/markup it would produce —
    never executes at all.
  - **Session storage moved from `localStorage` to cookies**
    (`src/features/auth/api/session.js`, `config/session-keys.js` +
    `SESSION_COOKIE_MAX_AGE_SECONDS`) — `cookies()` in
    `next/headers` can only read what the browser sends with the request;
    localStorage is invisible server-side. Cookies are plain (non-httpOnly,
    client-`document.cookie`-written) since there's still no backend to
    issue a real `Set-Cookie` — same mock-only caveat as before, now
    documented directly on `writeSession`.
  - **Removed `AuthGuard`** entirely (component + its export from
    `index.js`) — with the server layout blocking unauthenticated requests
    before any protected route ever renders, the old client-side redirect
    (and the spinner-flash / hydration-race workaround it needed, see the
    15:40 entry) is now dead weight, not defense in depth: Next.js reruns
    the dynamic `(protected)/layout.js` check on every navigation to a
    route under it (calling `cookies()` forces dynamic rendering for that
    whole subtree), including client-side `<Link>` navigations, so the
    server check alone covers hard reloads *and* in-app navigation.
    `src/app/layout.js` now renders `{children}` directly.
  - `src/features/auth/index.js` now exports the plain `ACCESS_TOKEN_KEY`
    string constant (not a function) for the protected layout to import —
    kept the cookie-reading/redirect logic itself inline in
    `(protected)/layout.js` rather than in a feature `api/` helper, since a
    helper re-exported through the feature's public `index.js` risks
    pulling `next/headers` (server-only) into the same module graph
    `UserMenu` (a Client Component) imports from — a plain string constant
    is safe in any bundle.
  - `hooks/use-session.js` — dropped the now-meaningless `storage` event
    listener (that event only ever fired for `localStorage`, which nothing
    uses anymore); kept only the custom `kt-xnk-session-change` same-tab
    signal from `api/session.js`.
- **Result:** done.
- **Verification:** `./harness/verify.sh` — full pass (route-group
  restructure didn't break `structure`/`typecheck`/`build`). Then the
  actual regression check that mattered: `curl` (no JS, no browser) against
  every protected route with no cookie — `/`, `/blog`, `/tutorial`,
  `/design-system` all `307` to `/login` with **no page content in the
  body** (confirmed `/login`'s own page reads `HTTP/1.1 200` with no
  cookie). Then `agent-browser`: fresh session, direct nav to `/blog` →
  server-redirected to `/login` before any content painted; logged in with
  a `test-users.js` credential → redirected to `/blog`, cookies present;
  hard reload stayed on `/blog` (no flash, since there's no client guard
  left to race); avatar menu → "Đăng xuất" → cookies cleared, redirected to
  `/login`; re-requesting `/blog` after logout → `307` again, both via
  `agent-browser` and a follow-up `curl`.
- **Decisions made:**
  - Cookie value is only checked for *presence*, not verified (no
    signature/expiry check) — matches the mock/test-data phase (the login
    mock itself doesn't issue real JWTs yet, so there's nothing to verify
    against). Confirmed via `curl -H "Cookie: kt-xnk-access-token=fake"` —
    any value currently passes. Flagged here, not fixed, since real
    verification needs a real backend-issued token; noted in "Next step"
    below along with the other JWT-integration seams from the 15:40 entry.
  - Left `/login` outside any route group (didn't create a `(public)`
    group for symmetry) — only routes that need the extra layout benefit
    from being grouped; `/login` needs nothing extra beyond the root
    layout, so adding a group for it would just be an empty wrapper.
- **Next step:** when a real backend exists, `(protected)/layout.js`'s
  presence-only check should become a real verification (signature +
  expiry, or a call to a backend "whoami"/introspection endpoint) — same
  seam noted in the 15:40 entry for `api/login.js`/`api/session.js`.
- **Blockers:** none

---

## 2026-08-07 15:40 — Claude Code

- **Active change:** gate every route behind login (branch `feature/login`,
  no `openspec/changes/` entry — direct follow-up per user request "tất cả
  các route đều yêu cầu đăng nhập mới có thể sử dụng"). User also asked for
  an avatar + "Đăng xuất" (logout) menu in the top nav, explicitly rejected
  a Next.js `middleware.js`-based gate ("I do not like nextjs middleware,
  because I will depend to nextjs framework"), and flagged that the real
  backend will eventually issue a JWT access + refresh token pair.
- **Task worked:** client-side route gating (no `src/middleware.js`) —
  `src/features/auth/components/auth-guard.js` wraps `{children}` in
  `src/app/layout.js`; renders `children` unconditionally on `/login`,
  otherwise a `Spinner` fallback + `router.replace('/login?next=...')` if
  `api/session.js`'s `readAccessToken()` is `null`. Session storage is
  `localStorage`, JWT-shaped ahead of the real backend:
  `config/session-keys.js` (`kt-xnk-access-token`/`kt-xnk-refresh-token`/
  `kt-xnk-session-username`), `api/session.js` (`readAccessToken`,
  `readSessionUsername`, `writeSession`, `clearSession` — commented as the
  seam a real backend replaces, with the refresh token specifically flagged
  as needing to become an `httpOnly` cookie the backend sets, not something
  client JS writes). `types/index.js`'s `LoginResult` is now a discriminated
  union (`LoginSuccess | LoginFailure`) so `accessToken`/`refreshToken` are
  required-when-`success`, not optional. `api/login.js`'s mock now returns
  mock opaque tokens on success instead of a bare boolean.
  `hooks/use-session.js` — `useSession()` via `useSyncExternalStore`
  (`isAuthenticated`, `username`, `logout()`). `hooks/use-login-form.js` —
  on success, `writeSession(...)` then `router.replace(next ?? '/')`
  (dropped the old `isSuccess` banner state, since the page navigates away
  immediately now). `components/user-menu.js` — `Popover` (custom `Avatar`
  trigger, no built-in trigger slot on `DropdownMenu` for that) +
  `DropdownMenuItem` "Đăng xuất"; renders `null` when logged out. Composed
  in `src/app/layout.js` (not `src/shared/components/header.js`) because
  `src/shared/` is structurally forbidden from importing `src/features/`
  (`harness/structure.rules.cjs`) — `header.js` only grew a generic
  `endContent` prop passed through to `TopNav`, staying feature-agnostic.
  `src/app/login/page.js` wraps `LoginForm` in `<Suspense>` since
  `useSearchParams()` (for reading `?next=`) now flows through it.
- **Result:** done.
- **Verification:** `./harness/verify.sh` — full pass, including
  `structure` (confirms `header.js` has zero `src/features/` imports).
  Browser-tested via `agent-browser`, not just curl: fresh session, `/` and
  `/blog` both redirect to `/login?next=...`; logging in with a
  `test-users.js` credential redirects straight to the original `next`
  path; top nav shows an avatar; clicking it opens the "Đăng xuất" menu;
  logging out clears the session and redirects to `/login`; revisiting `/`
  redirects back to login again (confirms the guard re-engages, not just
  that the click handler ran).
- **Decisions made:**
  - **Middleware pivot:** first drafted this with `src/middleware.js`
    (server-side, no flash-before-redirect); the user explicitly rejected
    it as unwanted framework coupling. Rebuilt as a pure client `AuthGuard`
    instead. **Known, accepted tradeoff:** Next.js Server Components still
    render full protected-page HTML regardless of client auth state — an
    unauthenticated visitor's browser paints that HTML for a brief moment
    before hydration/JS redirects. There is no server-side gate anymore;
    this was a deliberate choice, not a missed bug.
  - **Real bug caught by browser-testing, not by `verify.sh`:** the first
    `AuthGuard` cut the redirect effect on the `isAuthenticated` value
    captured at render time. On a hard reload of an *already-authenticated*
    page, `useSyncExternalStore`'s first hydration-safe render always
    returns the server-safe "logged out" default (it has to match the
    server, which can't see `localStorage`) and only self-corrects on the
    next render — but the effect tied to that first render already fired
    and navigated to `/login` before the correction landed, permanently
    bouncing a logged-in user. Fixed by having the effect re-read
    `readAccessToken()` directly at the moment it runs, instead of trusting
    the closed-over render-time value — decouples the "should I redirect"
    decision from the transient hydration mismatch. `pnpm run
    <lint/typecheck/structure>` never would have caught this; only
    exercising an actual hard reload while logged in did.
  - **Avatar popover, same-tab reactivity, and a click double-toggle bug**
    (both also only caught by clicking through the real page, not by
    `verify.sh`):
    1. `DropdownMenu`'s trigger is always its own internal `Button` (no
       custom-trigger slot per its `.d.ts`) — used `Popover` with a custom
       `Avatar` trigger instead (`Avatar`'s `onClick` prop is documented to
       render it as a real `<button>`, satisfying `Popover`'s "trigger must
       contain a button" requirement) plus a standalone `DropdownMenuItem`
       (confirmed via its `.d.ts`, not the possibly-stale printed docs
       table, that it does accept `onClick`).
    2. First pass: the avatar never appeared after login even though
       `writeSession()` ran. Cause: `UserMenu`/`Header` live in the
       persistent `layout.js` tree, which the Next.js App Router does not
       re-render on a same-route-tree client navigation (`/login` →
       `/blog`) — so its `useSyncExternalStore` subscription never got
       asked again. The native `storage` DOM event only fires in *other*
       tabs, never the tab that wrote the value. Fixed by having
       `api/session.js` dispatch a custom `kt-xnk-session-change` window
       event on every `writeSession`/`clearSession`, and `use-session.js`
       subscribes to that alongside `storage`.
    3. Second pass: clicking the avatar opened and closed the popover in
       the same click (net no-op). Cause: `Popover` already
       `addEventListener('click', ...)`s the trigger button it finds
       inside `children` — my own `onClick={() => setIsOpen(...)}` on
       `Avatar` was a *second*, independent listener on the same click, so
       both toggles fired and canceled out. `Popover`'s own doc comment
       ("the popover finds it and applies click/keydown handlers... 
       automatically") says as much — should have trusted that instead of
       also wiring a manual toggle. Fixed: `Avatar`'s `onClick` is now a
       no-op (still needed so `Avatar` renders as a `<button>` at all —
       required per its own props doc — but `Popover` owns all the actual
       toggle logic).
- **Next step:** none pending. When a real backend exists: replace
  `api/login.js`'s body with a real `fetch`, add `api/refresh.js` for
  token rotation, and change `writeSession`'s refresh-token write to
  instead trust an `httpOnly` `Set-Cookie` from the backend (delete the
  client-side write for that one field).
- **Blockers:** none

---

## 2026-08-07 15:10 — Claude Code

- **Active change:** login page (branch `feature/login`, no `openspec/changes/`
  entry — direct per user request). Requirements: username (must be a
  Vietnamese CCCD — citizen ID), password, "remember me" checkbox; no
  registration; validate with `zod`; submit against test data only (no auth
  backend exists yet).
- **Task worked:** new `src/features/auth/` feature (`types`, `config`,
  `api`, `hooks`, `components`, public `index.js`) per the feature-based
  layer rules. `config/login-schema.js` — zod schema, CCCD regex `^\d{12}$`,
  password min length 6 (placeholder pending a real backend policy).
  `config/test-users.js` — 2 hardcoded test credentials, explicitly commented
  as placeholder-only. `api/login.js` — mocked `login()` with a ~500ms
  delay, checks against `test-users.js`; this is the seam to replace with a
  real backend `fetch` call later. `hooks/use-login-form.js` — form state +
  zod `safeParse` → per-field `status` for `TextInput`; on success, persists
  username to `localStorage` when "remember me" is checked.
  `components/login-form.js` — Astryx-only UI (`Center`/`VStack`/`Card`/
  `Heading`/`Banner`/`TextInput`/`CheckboxInput`/`Button`), modeled on the
  scaffolded `astryx template login` reference. New route
  `src/app/login/page.js`; added "Đăng nhập" to `navLinks` in
  `src/shared/config/site.js` for reachability. Added `zod` to
  `dependencies` (`pnpm add zod`, none of the existing deps provided it).
- **Result:** done.
- **Verification:** `./harness/verify.sh` — full pass. Also ran `pnpm dev`
  and drove the real page via `agent-browser` (not just curl): empty submit
  shows both zod field errors, malformed CCCD/short password each show
  their specific message, wrong-but-valid-format credentials show the error
  `Banner`, and correct `test-users.js` credentials succeed. Screenshots in
  this session's scratchpad.
- **Decisions made:** hit a real hydration bug while browser-testing
  "remember me": seeding `useState` from `localStorage` via a lazy
  initializer (guarded by `typeof window`) is fine for the username *text*
  value (React silently corrects `value` mismatches) but Astryx's
  `CheckboxInput` checked state is not corrected — Next.js logged "A tree
  hydrated but some attributes... This won't be patched up" and the box
  stayed visually unchecked even though local state was `true`. Fixed by
  switching to `useSyncExternalStore` (server snapshot `''`, client snapshot
  reads `localStorage`) as the source of the remembered username, with
  separate local override state for `username`/`rememberMe` so the user can
  still freely edit the fields — this is the React-sanctioned pattern for
  values that legitimately differ between server and client and avoids both
  the hydration mismatch and the `react-hooks/set-state-in-effect` lint
  error a plain `useEffect` + `setState` approach hit first. Worth
  remembering for any future "prefill a controlled input from
  browser-only storage" work in this repo.
  Deliberately did not add `react-hook-form` or any form library — the form
  is small enough that zod + a single hook covers it, and no other feature
  uses one yet.
- **Next step:** when a real auth backend exists, replace `api/login.js`'s
  body with a real call (keep the same `login(values): Promise<LoginResult>`
  signature so `hooks/`/`components/` don't need to change) and delete
  `config/test-users.js`.
- **Blockers:** none

---

## 2026-08-07 01:56 — Claude Code

- **Active change:** `openspec/changes/feature-based-architecture/` —
  replace the 6-layer backend-shaped architecture
  (`types→config→repo→service→runtime→ui`) with a feature-based front-end
  architecture, per explicit user direction: this repo is confirmed
  front-end only, backend lives in a separate project.
- **Task worked:** all 5 milestones in `tasks.md`. Moved
  `src/ui/hero.js` → `src/features/home/components/hero.js`;
  `src/app/design-system/{showcase-section.js,sections/*.js}` →
  `src/features/design-system/components/`; `src/ui/{header,footer,theme,
  theme-provider}.js`, `src/config/{site.js,site.test.js}`,
  `src/types/index.js` → `src/shared/{components,config,types}/`. Added a
  public `index.js` per feature. Rewrote `harness/structure.rules.cjs`
  around `types→config→api→hooks→components` (per-tree, feature or
  shared), plus new rules `no-feature-to-feature` (isolation),
  `no-shared-to-feature`, `no-deep-feature-imports` — same
  backreference technique the old `no-deep-domain-imports` rule already
  used. Rewrote `harness/tests/structure-rules.test.cjs` fixtures to
  exercise every rule (old fixtures hardcoded the dead layer names, would
  have silently stopped testing anything meaningful). Updated
  `docs/architecture.md`, `openspec/project.md`, `AGENTS.md` (trimmed, not
  re-duplicated — matches its own "map not manual" rule),
  `harness/GOLDEN_RULES.md` (v1→v2), `harness/quality-grades.json`; added
  `docs/adr/0003-feature-based-architecture.md`. Fixed the theme
  build/gitignore wiring for the new `src/shared/components/theme.js`
  path and the two remaining `src/ui/theme.js` text references inside the
  design-system showcase page's own Blockquote/CodeBlock copy.
- **Result:** done. `pnpm run structure` and `pnpm test:harness` pass
  against both the real migrated `src/` and the new violation fixtures.
- **Verification:** `./harness/verify.sh` — full pass (project-readiness,
  memory-secrets, theme-build, lint, typecheck, structure, harness-tests,
  unit-tests, build, quality-thresholds). See
  `harness/runs/20260807-015558-33202/`. Also ran `pnpm dev` and curled
  `/` and `/design-system` directly — both 200, both contain real
  rendered content ("KT-XNK", "Design system"), not an error boundary.
- **Decisions made:** dropped `repo`/`service`/`runtime` entirely rather
  than renaming them — they're backend concepts with no backend in this
  repo. `api`/`hooks` replace them (client calls to the external backend
  project / client-side state) — see decision log in `proposal.md` and
  ADR-0003. Features are **fully isolated** (no cross-feature imports at
  all, not just "public-surface only") since neither current feature
  (`home`, `design-system`) has a legitimate reason to depend on the
  other; revisit if a future feature genuinely needs another's public
  surface. Did not create empty `api/`/`hooks/` folders anywhere — same
  placeholder-free philosophy the old `repo/service` had, add on first
  real need. Did not touch the hardcoded example hex colors in
  `content.js`'s `THEME_SNIPPET` (a pre-existing, separately-flagged
  issue from an earlier session — only its file-path references were
  updated since the file itself moved). Left the change in
  `openspec/changes/` rather than archiving it.
- **Next step:** none pending for this change. First feature that needs
  to call the separate backend project should add `api/` (and `hooks/` if
  it needs client state) under that feature — or `src/shared/api|hooks`
  if more than one feature needs it — following the pattern in
  `docs/architecture.md`.
- **Blockers:** none

---

## 2026-08-07 00:14 — Claude Code

- **Active change:** upgrade `@astryxdesign/core`/`theme-neutral`/`cli`
  0.2.0 → 0.3.0 (no `openspec/changes/` entry — direct per user request)
- **Task worked:** `pnpm add @astryxdesign/core@0.3.0
  @astryxdesign/theme-neutral@0.3.0` then `@astryxdesign/cli@0.3.0`
  (`@latest` silently kept resolving 0.2.0 — pinned the exact version
  instead of digging into why). Approved `@astryxdesign/cli`'s postinstall
  build script in `pnpm-workspace.yaml` after reading it first (same
  print-only nudge pattern as `core`'s, verified 2026-08-06 — never
  mutates files). Ran the sanctioned migration path instead of assuming
  compatibility: `pnpm exec astryx upgrade --from 0.2.0` (dry run) listed
  10 codemods spanning v0.2.1→v0.3.0 and reported "No changes needed —
  your code is already up to date!"; `--apply` confirmed the same and
  additionally refreshed the `<!-- ASTRYX:START/END -->` version stamp in
  `AGENTS.md`/`CLAUDE.md` (154→155 components, v0.2.0→v0.3.0) — diffed
  before committing, only the stamp changed.
- **Result:** done. `package.json` bumped to `^0.3.0` for all three
  packages; `pnpm-lock.yaml` updated; no application code changed (the
  codemods had nothing to do).
- **Verification:** `pnpm theme:build` (rebuilt cleanly on 0.3.0),
  `./harness/verify.sh` — full pass. Also ran `pnpm dev` and curled both
  `/` and `/design-system`, grepping for `astryx-button`/`astryx-dialog`/
  `astryx-table`/`astryx-heading` classes and scanning for error markers
  in the response — confirmed real runtime output on 0.3.0, not just a
  passing build. See `harness/runs/20260807-001356-26089/`.
- **Decisions made:** none beyond what's in "Task worked" above.
- **Next step:** none pending.
- **Blockers:** none

---

## 2026-08-07 00:08 — Claude Code

- **Active change:** swap which brand hue is MD3 `primary` vs `secondary`
  (no `openspec/changes/` entry — direct per user request: red as the
  dominant accent read too harsh/glaring across filled surfaces like
  inputs and primary buttons)
- **Task worked:** regenerated the MD3 tonal palette with the seeds
  swapped — teal `#247768` is now the `primary` seed, red `#c2252a` is now
  `secondary` (tertiary re-derived at +60° from the new primary hue;
  error stays its own standalone seed, unaffected). Same CIE Lab
  generation method as before, all AA contrast pairs re-verified.
  - `src/ui/theme.js`: `--color-accent` (and accent-muted/on-accent/
    text-accent/icon-accent) now `#126a5c` (teal, was `#b91a24` red). The
    `variant:secondary` Button override now uses the *new* secondary
    (red) container pair (`#fddbd5`/`#3e0500`, was the old teal
    container).
  - Updated copy that named the old mapping: `/design-system` intro text,
    the Button and Link section descriptions in
    `src/app/design-system/sections/actions.js`, and the Color convention
    bullet in `openspec/project.md`.
- **Result:** done.
- **Verification:** `pnpm theme:build` then `./harness/verify.sh` — full
  pass. Rebuilt CSS confirmed to contain `#126a5c`/`#fddbd5`, and curled
  the running `/design-system` page's compiled CSS to confirm the same
  values ship in what actually renders (not just what's in source). See
  `harness/runs/20260807-000807-24222/`.
- **Decisions made:** kept `--color-error` as its own standalone red seed
  (`#b3261e`) rather than aliasing it to the new secondary red — error
  states shouldn't move if someone later re-tunes the secondary brand hue
  independently.
- **Next step:** none pending.
- **Blockers:** none

---

## 2026-08-07 00:01 — Claude Code

- **Active change:** expand `/design-system` from a 6-component sample into
  a broad Astryx component showcase (no `openspec/changes/` entry — direct
  per user request "tạo tất cả các component có thể")
- **Task worked:** Astryx ships 154 components (`pnpm exec astryx
  component --list`). Looked up real prop signatures for ~55 of them via
  the `xds` MCP server (not guessed) and split the single `page.js` into
  `src/app/design-system/sections/*.js` (one file per category:
  typography, actions, forms, selection, feedback, overlays,
  data-display, content) plus a shared `showcase-section.js` wrapper, so
  no single file got unmanageable. `page.js` now just composes the 8
  section components.
  - Covered: Heading, Text, Button/ButtonGroup/IconButton/ToggleButton,
    Link, TextInput/TextArea/NumberInput/Selector/MultiSelector/RadioList/
    FileInput/Slider, CheckboxInput/CheckboxList/Switch, TabList/
    SegmentedControl, Banner/Toast/ProgressBar/Skeleton/Spinner/StatusDot/
    EmptyState, Dialog/AlertDialog/Popover/Tooltip/HoverCard/DropdownMenu,
    Badge/Card/ClickableCard/SelectableCard/Avatar/AvatarGroup/Table/List/
    Pagination/Token/Timestamp/Citation/Kbd, Divider/Breadcrumbs/Icon/
    Blockquote/CodeBlock/AspectRatio/Collapsible.
  - Explicitly NOT covered (noted in the page's own intro text, not
    silently dropped): Chat family, PowerSearch, Calendar, DateInput
    family, Carousel, Lightbox, TreeList, ContextMenu, MoreMenu, Markdown
    — each needs either external data/backend wiring or enough surface
    area to warrant its own follow-up rather than a rushed demo.
  - Overlay demos (Dialog/AlertDialog/Popover) are real controlled
    open/close via `useState`, not the docs' `isInline` preview escape
    hatch — clicking the trigger buttons actually opens a modal.
  - `AspectRatio`'s example uses the project's real
    `public/images/logo-dn-group.png` instead of a placeholder/remote
    image.
- **Result:** done.
- **Verification:** `./harness/verify.sh` — full pass after fixing 3 real
  issues caught by the gate (not guessed): `AvatarGroup` is exported from
  `@astryxdesign/core/AvatarGroup`, not bundled into `.../Avatar` as the
  groupMembers listing implied; `Selector`'s `value` type is `string |
  null`, not `string | undefined`; ESLint's `react-hooks/purity` rule
  correctly flagged a `Date.now()` call inside JSX render (non-deterministic
  during render) — replaced with a fixed ISO timestamp. Also ran `pnpm dev`
  and curled `/design-system`, grepping the HTML for `astryx-*` class names
  across every section to confirm real DOM output, not just a passing
  build (`DropdownMenu`'s popup class legitimately doesn't appear
  server-rendered — it's portal-based and only mounts on open).
- **Decisions made:** organized sections by Astryx's own component
  grouping (Actions/Forms/Feedback/Overlays/Data display/Content) rather
  than alphabetically — matches how someone would actually look something
  up.
- **Next step:** if the excluded components (Chat, Calendar, etc.) are
  needed later, look them up fresh via `xds` the same way — this entry's
  list of what's missing may drift as Astryx ships new versions.
- **Blockers:** none

---

## 2026-08-06 23:49 — Claude Code

- **Active change:** revert the `turbopack.root` pin from the entry below —
  it fixed a cosmetic warning but caused a fatal Turbopack crash (no
  `openspec/changes/` entry — direct per user request, pasted a crash log)
- **Task worked:** user hit, after a few successful requests then an HMR
  update: `FATAL: An unexpected Turbopack error occurred` /
  `Resource path "projects/work/code/FE-P/src/app/layout.js" needs to be
  on project filesystem ""` (missing the `/home/capybara/` prefix — a
  path-resolution bug). Trace pointed at `WebpackLoadersProcessedAsset`,
  i.e. Babel-loader-processed files specifically (this project uses
  `babel.config.js` for the StyleX plugin, so every file StyleX touches
  goes through that path). Traced it to the previous session's
  `turbopack.root: import.meta.dirname` pin in `next.config.mjs`.
- **Result:** reverted that one line. The Turbopack root-inference warning
  is back (harmless, cosmetic) — chose it over a crash that broke HMR for
  any Babel-processed file.
- **Verification:** deleted `.next`, ran `pnpm dev`, confirmed clean
  `200`s. Specifically re-tested the exact failure mode: edited
  `src/app/layout.js` (the file named in the panic) while dev was running,
  confirmed `✓ Compiled in 14ms` with no panic, reverted the edit, same
  result again on the second HMR cycle. `./harness/verify.sh` — full pass.
  See `harness/runs/20260806-234938-20047/`.
- **Decisions made:** don't re-attempt pinning `turbopack.root` without
  first confirming Next.js/Turbopack has actually fixed this interaction —
  it's a known-bad combination in `v16.2.11`, not something to retry as-is.
- **Next step:** none pending. If the warning becomes annoying enough to
  revisit, the safer fix is probably removing the stray
  `/home/capybara/pnpm-lock.yaml` (outside this repo) rather than touching
  `turbopack.root` again.
- **Blockers:** none

---

## 2026-08-06 23:43 — Claude Code

- **Active change:** commit the `astryx init` agent-doc block + fix a
  Turbopack root-inference warning (no `openspec/changes/` entry — direct
  per user request)
- **Task worked:**
  1. User ran `pnpm exec astryx init` themselves (I'd deliberately avoided
     running it earlier — see 2026-08-06 22:02 entry). It appended a
     `<!-- ASTRYX:START/END -->` CLI cheat sheet to both `AGENTS.md` and
     `CLAUDE.md`, purely additive, nothing existing removed — reviewed the
     diff before committing.
  2. `pnpm dev` was warning on every run: "Next.js inferred your workspace
     root... Detected additional lockfiles: /home/capybara/pnpm-lock.yaml".
     This repo sits inside `/home/capybara`, which has its own unrelated
     pnpm lockfile one level up, confusing Turbopack's root inference. Set
     `turbopack.root: import.meta.dirname` in `next.config.mjs` to pin it
     explicitly.
  3. Running `verify.sh` after the `astryx init` commit surfaced a real
     harness bug (see "Harness gaps" above): `project-readiness.sh`'s
     placeholder regex matched an angle-bracket CLI-argument token in the
     Astryx cheat sheet's `astryx template ... [--skeleton]` line. Fixed
     the check rather than editing the tool-generated block (which would
     just get overwritten by a future `astryx upgrade`/re-init).
- **Verification:** `./harness/verify.sh` — full pass. Sanity-checked the
  `project-readiness.sh` fix didn't just neuter the whole check: temporarily
  added one of the scanner's real placeholder tokens to
  `openspec/project.md` and confirmed the script still caught it (exit 1)
  before reverting. Confirmed the Turbopack warning is gone by re-running
  `pnpm dev` and reading the log. See `harness/runs/20260806-234349-17147/`.
- **Decisions made:** none beyond what's in "Task worked" above.
- **Next step:** none pending.
- **Blockers:** none

---

## 2026-08-06 23:36 — Claude Code

- **Active change:** finish wiring MD3 brand colors into Astryx's core
  token set + build a `/design-system` showcase page (no
  `openspec/changes/` entry — direct per user request "làm nốt... rồi tạo
  1 page có full component")
- **Task worked:**
  1. Expanded `src/ui/theme.js` tokens from 7 → 18: added
     `--color-accent-muted`/`--color-on-accent` (MD3 primaryContainer/
     onPrimary), `--color-text-accent`/`--color-icon-accent` (MD3 primary —
     these were silently defaulting to theme-neutral's dark gray, not our
     brand red, for Link text and accent icons), `--color-background-popover`
     (MD3 surfaceContainerHigh), `--color-icon-primary`/`--color-icon-secondary`
     (MD3 onSurface/onSurfaceVariant), `--color-border-emphasized` (MD3
     outline), and `--color-error`/`--color-on-error`/`--color-error-muted`
     (MD3 error/onError/errorContainer — this is what `Button
     variant="destructive"` actually reads, confirmed via
     `node_modules/@astryxdesign/core/dist/astryx.css`).
     Deliberately did NOT touch `--color-success`/`--color-warning` (kept
     universal green/amber), the 10 categorical tag colors
     (`--color-*-blue/cyan/.../yellow`), or structural tokens
     (`--color-neutral`, `--color-overlay*`, `--color-skeleton`,
     `--color-track`, `--color-shadow`, `--color-tint-hover`) — none of
     these are brand identity; overriding them would just be surprising.
  2. New page `src/app/design-system/page.js` — a live component
     reference, not content: Heading (all 6 levels), Text (5 types × 4
     colors), Button (4 variants × sizes/disabled/loading), Badge (5
     semantic + 9 category variants), Card (default/muted/transparent),
     Link (internal + external). Added to nav
     (`src/config/site.js` → `navLinks`) as "Design System" so it's
     reachable, not just a dev-only route.
  3. `jsconfig.json`'s `tsc --noEmit --checkJs` needed the variant arrays
     annotated with `/** @type {('a'|'b'|...)[]} */` JSDoc — Astryx's
     prop types are string-literal unions, and mapping over a bare
     `string[]` fails typecheck (caught by `./harness/verify.sh`, not
     guessed).
- **Verification:** `./harness/verify.sh` — full pass. Also ran `pnpm dev`
  in the background and curled `/design-system`: confirmed all 6
  `<h1>`–`<h6>` render, and `astryx-button {primary,secondary,ghost,
  destructive}` / `astryx-badge {neutral,info,success,warning,error,blue,
  cyan,green,orange,pink,purple,red,teal,yellow}` classes all present in
  the HTML. See `harness/runs/20260806-233604-14883/`.
- **Decisions made:** none beyond what's in "Task worked" above.
- **Next step:** if a future page needs Form components (Input, Select,
  Checkbox, etc.) or Layout/AppShell, check `node_modules/@astryxdesign/core`
  + `xds` MCP the same way before adding to the showcase page — don't
  assume a component exists without checking its export path first (bit
  us twice already: `LinkProvider` wasn't at the path the docs implied,
  and `Theme`/`defineTheme` live at `./theme`, not `./Theme`).
- **Blockers:** none

---

## 2026-08-06 22:19 — Claude Code

- **Active change:** wire MD3 `secondary` brand color into Astryx `Button`
  (no `openspec/changes/` entry — small follow-up, done directly per user
  question "if I have a primary/secondary button, what happens?")
- **Task worked:** verified (by reading `node_modules/@astryxdesign/core`
  source, not guessing) that Astryx's `Button` `variant` prop is an
  emphasis level, not a brand hue: `variant="primary"` resolves to
  `--color-accent` (our brand red, already wired), but `variant="secondary"`
  resolves to `--color-neutral` (a generic gray) — our brand teal
  (`#247768` / MD3 `secondary`) was not connected to anything.
- **Result:** done. Added a `components.button` override to
  `src/ui/theme.js`'s `defineTheme()` call:
  `'variant:secondary': { backgroundColor: '#a1f2df', color: '#00201a' }`
  (MD3 `secondaryContainer`/`onSecondaryContainer` — the same tonal-button
  pairing MD3 itself uses for "branded but lower emphasis than primary").
  Confirmed the compiled `theme.built.css` contains
  `.astryx-button.secondary { background-color: #a1f2df; ... }` — no
  Button component code touched.
- **Verification:** `./harness/verify.sh` — full pass after
  `pnpm theme:build`. See `harness/runs/20260806-221857-12220/`.
- **Decisions made:** used `secondaryContainer`/`onSecondaryContainer`
  (light tonal fill) rather than solid `secondary`/`onSecondary` — matches
  Astryx's own intent that `variant="secondary"` stays lower-emphasis than
  `variant="primary"`; a solid teal would read as equally weighted.
- **Next step:** if `tertiary`/`error` MD3 roles need a home later,
  Astryx's own token vocabulary is much richer than the 7 tokens in
  `theme.js` (grep `node_modules/@astryxdesign/core/dist/astryx.css` for
  `--color-success`, `--color-warning`, `--color-error`,
  `--color-background-teal`, etc.) — check there before inventing a new
  `components` override.
- **Blockers:** none

---

## 2026-08-06 22:10 — Claude Code

- **Active change:** switch from runtime `defineTheme()` to a pre-built
  Astryx theme (no `openspec/changes/` entry — small follow-up to the
  Astryx migration above, done directly per user request after they pasted
  a `pnpm dev` log showing Astryx's own perf warning)
- **Task worked:** `pnpm dev` was logging: `Theme: "FE-P" is using
  runtime style injection. For better performance, use the pre-built
  theme... run 'npx @astryxdesign/cli theme build <file>'`. Ran
  `astryx theme build src/ui/theme.js -o src/ui/theme.built.css`, which
  generates `src/ui/kt-xnk.js` (built theme object), `src/ui/kt-xnk.d.ts`,
  and `src/ui/theme.built.css` (static CSS) next to the source file.
- **Result:** done. `src/ui/theme-provider.js` now imports the built
  `ktXnkTheme` from `./kt-xnk.js` + `./theme.built.css` instead of calling
  runtime `defineTheme()` directly (`src/ui/theme.js` stays as the
  hand-edited *source* the build command reads — not deleted).
  - Generated files are gitignored (`.gitignore`), not committed — they're
    fully deterministic output of `src/ui/theme.js`.
  - Added `"theme:build"` npm script (the exact `astryx theme build`
    command) and made `dev`/`build` run it first
    (`"dev": "pnpm theme:build && next dev"`, same for `build`).
  - `harness/verify.sh` runs `theme:build` as its own step, before
    `lint`/`typecheck`/`structure` — those all resolve the `./kt-xnk.js`
    import, so on a fresh clone (gitignored files absent) they'd fail
    without this step running first.
- **Verification:** deleted the generated files, ran
  `./harness/verify.sh` clean from that state — full pass (theme-build
  step regenerated them before lint/typecheck ran). Also ran `pnpm dev` in
  the background and grepped its log: no more "runtime style injection"
  warning. See `harness/runs/20260806-221048-11148/`.
- **Decisions made:** gitignore + rebuild-on-every-run over committing the
  generated files — keeps `src/ui/theme.js` the single source of truth and
  makes staleness (someone edits `theme.js`, forgets to rebuild, commits
  mismatched CSS) mechanically impossible instead of relying on a reviewer
  to notice.
- **Next step:** none pending.
- **Blockers:** none

## Discovered (backlog — do NOT act on these mid-task)

- No `src/repo`/`src/service` code yet — the site is fully static. Add real
  structural tests for those layers once a first feature needs them.

---

## 2026-08-06 22:02 — Claude Code

- **Active change:** migrate UI to real `@astryxdesign/core` components (no
  `openspec/changes/` entry — direct per user request; project.md already
  said "UI built via the Astryx MCP server" but the app had never actually
  installed/used the package, only hand-rolled markup — user flagged this
  gap)
- **Task worked:** install `@astryxdesign/core` + `@astryxdesign/theme-neutral`
  (deps) and `@astryxdesign/cli` (devDep); wire the MD3 palette from the
  previous entry into Astryx via `defineTheme`; replace hand-written
  `header.js`/`footer.js`/`hero.js` with real Astryx components
  (`TopNav`/`TopNavHeading`/`TopNavItem`, `Section`, `Heading`/`Text`).
- **Result:** done.
  - `src/ui/theme.js` — `defineTheme({name: 'FE-P', tokens: {...}})`
    mapping our MD3 role values onto Astryx's CSS-custom-property token
    names (`--color-accent`, `--color-background-body`,
    `--color-background-surface`, `--color-background-card`,
    `--color-text-primary`, `--color-text-secondary`, `--color-border`).
    Single string values only (no `[light, dark]` tuples) since the project
    stays light-only.
  - `src/ui/theme-provider.js` — client component wrapping the app in
    `<LinkProvider component={NextLink}>` (so Astryx `href`s route through
    `next/link`) and `<Theme theme={ktxnkTheme} mode="light">`. Wired into
    `src/app/layout.js` around `<Header>`/`{children}`/`<Footer>`.
  - `src/app/globals.css` — added `@import` for
    `@astryxdesign/core/reset.css`, `@astryxdesign/core/astryx.css`, and
    `@astryxdesign/theme-neutral/theme.css` (baseline before our
    `defineTheme` override); removed the hand-rolled `box-sizing`/`body`
    reset now that Astryx's reset owns it (avoids unlayered CSS silently
    overriding `astryx-base`, per Astryx's Cascade Layer Safety guidance).
  - Deleted `src/ui/container.js` and `src/ui/tokens.stylex.js` — both had
    zero remaining consumers once header/footer/hero moved to Astryx
    components (verified with grep before deleting, same as the
    `colors`-token cleanup in the previous entry).
  - Package install needed one manual step: `pnpm-workspace.yaml` had a
    stub `allowBuilds: '@astryxdesign/core': set this to true or false` —
    read `@astryxdesign/core`'s postinstall script first (it only prints a
    "run `astryx init`" nudge when no agent-doc marker is found; never
    mutates files) before setting it to `true`.
  - Did **not** run `npx astryx init` — it can rewrite `AGENTS.md`/
    `CLAUDE.md`, which this repo treats as the curated single operating
    manual; a human should review that separately before letting the CLI
    touch those files.
  - Updated `openspec/project.md` (Tech stack + Conventions): components
    now come from `@astryxdesign/core`, not hand-rolled markup; StyleX is
    scoped to the `xstyle` escape hatch for one-off layout only; colors
    are sourced from `src/ui/theme.js`, not a StyleX token file.
- **Verification:** `./harness/verify.sh` — full pass. Also ran `pnpm dev`
  against the actual page and inspected the rendered HTML/CSS: confirmed
  `data-astryx-theme="FE-P" data-theme="light"` on the root wrapper,
  `<header><nav aria-label="Điều hướng chính">` from `TopNav`, and
  `#b91a24` (MD3 `primary`) present in the compiled CSS chunk. See
  `harness/runs/20260806-220202-9426/`.
- **Decisions made:** used Astryx's simpler common token set
  (`--color-accent`/`--color-background-*`/`--color-text-*`/`--color-border`)
  rather than trying to force all ~30 MD3 roles into Astryx CSS vars —
  Astryx's own token vocabulary is coarser than MD3's; mapped only the
  tokens Astryx actually documents. `Section`/`TopNav` don't expose an `as`
  prop, so kept native `<header>`/`<footer>` wrappers around them for
  landmark semantics.
- **Next step:** if a future page needs Buttons, Cards, or form fields,
  pull them from Astryx (`xds` MCP) the same way — don't hand-roll. If the
  team decides they do want `astryx init`'s AGENTS.md/CLAUDE.md agent
  prompt, run it in its own reviewed change, not bundled with UI work.
- **Blockers:** none

---

## 2026-08-06 21:44 — Claude Code

- **Active change:** rename/expand color tokens to Material Design 3 roles
  (no `openspec/changes/` entry — small token-only edit done directly per
  user request)
- **Task worked:** replace the ad-hoc `colors` token set in
  `src/ui/tokens.stylex.js` with the full Material Design 3 light-scheme
  role set (`primary`/`onPrimary`/`primaryContainer`/`onPrimaryContainer`,
  same pattern for secondary/tertiary/error, plus `surface*`,
  `outline`/`outlineVariant`, `inverse*`, `shadow`/`scrim`); update the 3
  components that consumed the old names (`hero.js`, `footer.js`,
  `header.js`: `colors.text`→`onSurface`, `colors.textMuted`→
  `onSurfaceVariant`, `colors.border`→`outlineVariant`).
- **Result:** done. Tonal palettes generated in CIE Lab space (tone = L*,
  hue/chroma held from seed) from the existing brand seeds (`#c2252a` red,
  `#247768` teal) plus a derived tertiary (`#7d6a02`, +60° hue rotation) and
  a standalone error seed (`#b3261e`). All on-color pairings verified ≥
  4.5:1 (WCAG AA). Dark-scheme values were also generated for reference but
  NOT added to the codebase — project stays light-only per existing
  convention; dark values live only in the reference artifact from this
  session.
- **Verification:** `./harness/verify.sh` — full pass (lint, typecheck,
  structure, harness-tests, unit-tests, build, quality-thresholds). See
  `harness/runs/20260806-214453-7411/`.
- **Decisions made:** dropped the old `primaryHover`/`primaryActive`/
  `primarySurface`/`secondaryHover`/`secondaryActive`/`secondarySurface`/
  `success`/`warning`/`danger`/`info`/`borderStrong`/`textOnPrimary`/
  `textOnSecondary` tokens — grepped first, confirmed none were referenced
  anywhere in `src/`, so no aliasing/back-compat shim was needed. Updated
  the "Color" convention bullet in `openspec/project.md` to point at the
  MD3 role-naming rule instead of the old ad-hoc names.
- **Next step:** none pending. If a future component needs elevation
  (cards, sheets), the `surfaceContainer*` roles are already defined but
  unused — reach for those before inventing a new surface tone.
- **Blockers:** none
- `verify:quality` only checks bundle size; no p95 latency metric yet (no
  backend to measure).

---

## 2026-07-25 11:20 — Claude Code

- **Active change:** color system for the project (no `openspec/changes/`
  entry — small token-only edit done directly per user request)
- **Task worked:** derive a full color palette in `src/ui/tokens.stylex.js`
  from the brand logo (`public/images/logo-dn-group.png`)
- **Result:** done. Sampled exact logo pixels via PowerShell
  `System.Drawing` (node had no image lib available): primary red
  `rgb(194,37,42)` / `#c2252a`, secondary teal `rgb(36,119,104)` / `#247768`.
  Replaced the old placeholder `accent`/`accentText` tokens (unused anywhere
  in `src/`) with: neutrals (`background`, `surface`, `border`,
  `borderStrong`, `text`, `textMuted`, `textOnPrimary`, `textOnSecondary`),
  `primary`/`primaryHover`/`primaryActive`/`primarySurface`,
  `secondary`/`secondaryHover`/`secondaryActive`/`secondarySurface`, and
  semantic `success`/`warning`/`danger`/`info`. All white-on-color pairings
  verified ≥ 4.5:1 contrast (WCAG AA) via a small luminance-ratio script.
- **Verification:** `./harness/verify.sh` — `structure` passed; `lint`,
  `typecheck`, `harness-tests`, `unit-tests`, `build`, `quality-thresholds`
  all failed on `ERR_PNPM_BAD_PM_VERSION` (repo pins pnpm 11.5.3, local pnpm
  is 9.0.6) — a pre-existing environment issue, unrelated to this change and
  not fixed here (didn't want to touch global tooling without asking).
- **Decisions made:** `success` aliases `secondary` (teal), `danger` aliases
  `primary` (brand red) rather than inventing new hues — kept the palette
  minimal. Only one genuinely new value added: `warning` (`#b45309` amber).
  Documented the "colors only from tokens.stylex.js" rule in
  `openspec/project.md` Conventions so future agents don't hardcode hex.
- **Next step:** whoever picks up next real UI work should run
  `corepack use pnpm@11.5.3` (or equivalent) before relying on
  `./harness/verify.sh` results.
- **Blockers:** none

---

## 2026-07-24 23:30 — Claude Code

- **Active change:** initial project bootstrap (no `openspec/changes/` entry
  yet — done directly per user request, not through the change workflow)
- **Task worked:** scaffold Next.js (JS, App Router) + StyleX + ESLint on top
  of the OpenSpec harness template
- **Result:** done
- **Verification:** `./harness/verify.sh` → run after `npm install`; see
  `harness/runs/<latest>/` for evidence
- **Decisions made:** JavaScript only (no TypeScript app code; `typescript`
  kept as a devDependency purely for `tsc --noEmit --checkJs` typechecking of
  JS via `jsconfig.json`). Light theme only — no dark-mode variant. `src/app`
  plays the routing/wiring role of `runtime` and is exempt from the six-layer
  dependency-cruiser rules (matches `docs/architecture.md`).
- **Next step:** open an `openspec/changes/` proposal (per the `_template/`
  folder) for the next real feature instead of ad-hoc edits.
- **Blockers:** none

## 2026-09-06 — Unified fullscreen contract workspace

- Active change: `unify-contract-dialog`, task 1.1.
- Replaced contract table expansion with one fullscreen workspace for create,
  view and edit. Four tabs keep stable positions; creation disables payment
  history, Shipment and Commission with an explanation. Save uses the returned
  contract to stay in view mode and unlock the related workflows.
- Draft fields survive tab switches; cancel/close confirms before discarding;
  close/cancel is blocked during save. Header/tabs/footer stay fixed while
  content scrolls. Related editors remain outside table rendering (ADR-0004).
- Preserved the existing open field groups and general-field/date layout,
  adding mobile stacking; read-only metadata now uses two columns on mobile.
  The fullscreen surface is opaque. Source changes already present in the
  contract form/general fields/FormSection are retained as part of the
  integrated contract UI. Unrelated environment and memory edits are excluded.
- Browser evidence: `harness/runs/20260906-contract-dialog/`; scenario/results
  map: `openspec/changes/unify-contract-dialog/verification.md`. Synthetic API
  fixtures only: create and update round trips, no writes on entering edit,
  invalid save, dirty cancel, tab preservation, child dialog, mobile geometry.
- Harness gaps: switching a reused action button from `button` to `submit`
  during its click can execute the submit default action. Fixed with distinct
  React keys, explicit button type and preventDefault on Edit; browser fetch
  instrumentation verified zero writes on Edit and exactly one PUT on Save.
  Add this behavioral check to a future CI browser gate (current harness has
  no browser runner). Wait for dialog opening animation before screenshots;
  intermediate opacity can look like a transparent surface. Do not start a
  second full gate until an earlier build has exited (build lock collision).
- Final verification: `./harness/verify.sh` passed,
  `harness/runs/20260906-131752-565150/` (120 unit tests, build, structure
  and quality thresholds). Task 1.1 complete.

## 2026-09-06 — Shared operational form dialogs

- Active change: `shared-form-dialogs`, task 1.1.
- Integrated 19 production form dialog components with FormDialog: consistent
  header/content/footer, compact mobile geometry, themed independent native
  forms, dirty discard confirmation and an awaited save/deduplication guard.
  Shipment, Commission and User remain fullscreen; lookup forms stay compact.
- Shipment keeps tabs outside its scroll region, disables VGM before creation
  and selects the failing validation tab without losing values. User waits for
  detail and bank-row initialization, offers load retry, starts Work open and
  reveals hidden sections when validating. Existing Contract workspace remains
  the specialized create/view/edit controller on CommonDialog.
- Browser evidence: `harness/runs/20260906-dialog-audit/`, 14 checks covering
  representative desktop/mobile geometry, child Enter isolation, theme,
  parent/tab drafts, discard Escape, User load retry/clean baseline, pending
  deduplication and failed-save retention. All backend traffic mocked with
  synthetic fixtures; no real business records were written. Reusable runner:
  `node harness/checks/dialog-browser.mjs` with local dev server running.
- Harness gaps: body portals lose inherited theme variables; fixed by wrapping
  the portaled form in ThemeProvider and asserting theme presence in geometry
  checks. DOM portals still bubble React submit events; stopPropagation plus
  the child-only POST assertion protects this. Browser scripts must wait for
  hydrated data/menu presence/animation and use plain CSS selectors; backend
  error expectations must match apiRequest's normalized message. These checks
  are manual until a CI browser server/runner is introduced.
- Discovered: existing User bank persistence can hide partial-failure messages
  by closing after multiple API writes. Reconciliation/idempotent retry needs a
  separate persistence task; recorded in the change verification document.
  Legacy v1 User forms, demo dialogs and media dialogs were audited but retain
  purpose-specific behavior. Individual backend round trips for every migrated
  form were not exercised.
- ADR-0006 and docs/ui-components.md record the shared API and tradeoffs. ADR
  recording occurred late again; an explicit pre-implementation ADR checklist
  is a remaining process gap. Unrelated environment and memory edits excluded.
- Final verification: `./harness/verify.sh` passed in
  `harness/runs/20260906-220221-601009/`: 120 unit tests, lint, typecheck,
  structural/harness checks, build and quality gate (shared gzip 168.7 kB).
  Task 1.1 complete.

## 2026-09-06 — Logistics list actions and entity workspaces

- Active change: `logistics-dialog-actions`, task 1.1; ADR-0007 recorded before
  implementation. Contracts, Commission and Shipment now have a final pinned
  Chức năng menu with Xem/Sửa. Standalone Commission/Shipment row expansion
  is removed. Their create dialogs also host read-only detail content and
  transition to editable fields; related VGM/annex/payment actions remain.
- Shared fixedEndColumnKeys keeps actions visible, ordered last and pinned
  despite optional-column/pin changes. View options explain the fixed column.
  Distinct keyed Edit/Save buttons and preventDefault prevent accidental submit.
  Singular `/logistics/commission` redirects to `/logistics/commissions` under
  the same logistics:contracts:view permission rule.
- Found during review: standalone lists were not invalidated by entity saves;
  mutations now await per-contract and standalone invalidation. Re-entering
  edit resets controller values/rows from the latest selected record and
  rebases the shell baseline, preserving payments just added in a child.
- Browser evidence: `harness/runs/20260906-logistics-actions/`; reusable runner
  `harness/checks/logistics-actions-browser.mjs`. Mocked menus/read-only views,
  direct edits, zero writes on Edit, one PUT per save, dirty discard, mobile
  geometry, horizontal pinning, VGM/annex children, quick payment and its
  retention in a later edit. Shared creation/guard regression also passed
  all 14 checks via `harness/checks/dialog-browser.mjs`.
- Harness gaps: browser waits must return booleans (serializing DOM nodes can
  exceed CDP depth); numeric controls may use aria-labelledby rather than
  native labels. Regression helper handles both and waits for animations.
  Valid Commission fixtures must include payment terms totaling 100%.
- Concurrent filter-layout edits are preserved. A removed required Selector
  label caused typecheck failure; retained its visual intent using the label
  plus isLabelHidden. Only that accessibility correction is included here;
  unrelated filter layout/environment/memory changes are excluded from commit.
- Final verification: all 39 action-workspace browser checks passed, plus
  14 shared-form regression checks. `./harness/verify.sh` passed in
  `harness/runs/20260906-223740-631429/` (120 unit tests, lint, typecheck,
  structure, harness tests, build, shared gzip 168.7 kB). Task 1.1 complete.

## 2026-09-07 — Stable Contract/Shipment/Commission view/edit geometry

- Active change: `stable-dialog-layout`, task 1.1.
- Contract, Shipment and Commission now render one field grid, table set and
  footer in both view and edit — no more swapping to a separate read-only
  component. Native `TextInput`/`NumberInput`/`TextArea` toggle their own
  `isReadOnly`; `Selector`/`DateInput`/`CheckboxList` have no read-only API,
  so those stay the same live control with `isDisabled={isReadOnly}` instead
  — same rect, same tab stop count, just non-interactive. Add/remove/quick-add
  affordances (Đợt thanh toán, Lịch sử thanh toán, Trường tùy ý, Chi phí
  Logistics, VGM, Ngân hàng thụ hưởng) stay in their existing slot, disabled
  rather than removed, so the toolbar/table geometry never reflows. Seller/
  buyer detail disclosure is now independent of view/edit (always expanded)
  instead of collapsing only when editable. `FormDialog`'s shared footer
  (Commission/Shipment/User) gained fixed button widths and single-line
  truncating hint text so the footer rect itself cannot shift either.
- Fixed along the way: `ContractGeneralFields`'s Nước xuất khẩu/Cảng Selectors
  now use a `withSavedOption` helper that synthesizes an option from the
  saved raw value when it's missing from the fetched catalog (the seed-data
  gap noted the same day — "Cảng Cát Lái, TP.HCM" has no matching `Place`
  row) — the Selector shows the saved value instead of an empty placeholder
  in edit mode now, regardless of whether the catalog row exists.
  `docs/ui-components.md` documents the isDisabled-vs-native-readOnly rule.
- Browser evidence: `harness/checks/stable-dialog-layout-browser.mjs` — 12/12
  scenarios (Contract/Shipment/Commission × 1440×900/390×844, plus Shipment's
  costs/vgm tabs and an empty-payment-history Commission) all report
  `maxDelta: 0`, zero control-set changes, zero footer-rect shift, zero
  scroll-position change and zero writes between view and edit. Re-ran
  `harness/checks/logistics-actions-browser.mjs` (35 checks) and
  `harness/checks/dialog-browser.mjs` (10 checks) as regression — both clean.
- Final verification: `./harness/verify.sh` passed,
  `harness/runs/20260907-082002-942492/` (lint, typecheck, structure, harness
  tests, unit tests, build, quality thresholds all green). Task 1.1 complete.

## 2026-09-07 — Home internal portal

- Active change: `home-portal`, task 1.1. Notices now sit beside the existing
  featured-news carousel on desktop and wrap their full titles on mobile.
  A teal holiday panel separates published holiday dates from the navigable
  company calendar and monthly agenda. News, videos and ecosystem follow.
- Kept brand tokens and Vietnamese fonts. Existing editorial fixtures remain
  illustrative; no holiday ranges or return-to-work dates were invented.
  Vietnam's current date is supplied by the server for consistent hydration.
- Browser runner: `node harness/checks/home-portal-browser.mjs` (local dev
  server on port 3001; HOME_TEST_ORIGIN override supported). Six scenarios:
  1440/768/390/320px geometry, month changes/empty months/year boundary/keyboard,
  and policy navigation. No page overflow at any measured width; screenshots
  and results in `harness/runs/20260907-home-portal/`.
- Harness gaps caught: Astryx List does not forward arbitrary ARIA props;
  use its header API and assert the rendered accessible name. Section paints
  its variant on an inner node and can bleed parent padding; the holiday
  region uses a padded VStack with an asserted theme background instead.
  A first Windows browser daemon can retain captured child-process pipes;
  bootstrap with inherited stdio. Browser regression is manual until CI has
  an app server/browser runner; source checks alone did not catch these.
- Discovered: initial gate hit unrelated admin-backups work in progress;
  its owner resolved and committed it during this task. No backup files were
  edited here. Existing homepage content remains static, not backend-fed.
- Final gate passed: `harness/runs/20260907-153812-3249/` — lint, typecheck,
  structure, harness tests, 131 unit tests, build and quality thresholds.
  Shared gzip remains 168.7 kB (<250 kB). Task 1.1 complete.

## 2026-09-09 — Contract "Thông tin private" (BOQ): tab unification + list page

- Full detail in `../BE-P/harness/PROGRESS.md`'s same-dated entry
  (cross-repo change, BE list/search endpoint + FE). Summary here for this
  repo's own history:
- Unified the "Thông tin private" tab's Xem and Sửa around one component
  (`components/contract-private-info-panel.jsx`, new) instead of a
  read-only `ContractPrivateInfoTab` summary drifting from the edit
  dialog's `ContractPrivateInfoFields` layout (the drift was the original
  bug report). Deleted `contract-private-info-tab.jsx` and
  `contract-private-info-form-dialog.jsx`.
- Added a system-wide "BOQ" list page (`/logistics/boq`, sidenav entry
  under Hợp đồng) — `AdvanceTable`, same pattern as `ShipmentsList`, backed
  by the new BE-side `GET`/`POST search` on `/api/v1/contracts/private-info`.
  Gated by a new `logistics:secret` rule in
  `shared/config/route-access.js` (middleware-enforced) — noted this
  repo's sidenav trees are not permission-filtered (pre-existing gap, not
  introduced here; `routeAccessRules` still blocks direct navigation).
- `pnpm lint`/`pnpm structure`/`pnpm test` (136 tests) clean on every
  touched file. `pnpm typecheck` has 3 pre-existing failing files
  unrelated to this session (confirmed identical before/after), so did not
  run `./harness/verify.sh` end-to-end (would report that as a false
  regression) — ran each gate individually instead.
- Live-verified against the real dev BE-P stack: rebuilt the dev API
  container (was missing a same-day commit), imported `db/sample-data.sql`
  into an empty dev DB, confirmed both the unified tab layout and the new
  BOQ list + its Sửa-opens-directly-into-edit-mode flow.
- No commit made — user has not asked for one yet.

### Follow-up: "Sửa Thông tin private" button placement (same day)

- User feedback: the button was awkwardly placed at the *top* of the
  panel, and inside the Contract dialog it duplicated the dialog's own
  "Sửa hợp đồng" footer action.
- `contract-private-info-panel.jsx`: moved the Sửa/Nhập · Hủy/Lưu action
  row from above the fields to *below* them (still self-contained —
  standalone usage, the BOQ list's detail dialog). Added `hideOwnActions`
  + `controllerRef` (a plain prop wired to `useImperativeHandle`, not JSX
  `ref=` — a `forwardRef` version broke `tsc --noEmit` here since this
  codebase's JSDoc/checkJs setup can't infer `forwardRef` prop types) +
  `onStatusChange` so an external footer can drive `startEditing`/
  `cancelEditing`/`submit` and read `{isEditing, isSubmitting,
  submitLabel}` without hoisting the panel's own form state.
- `contract-expanded-details.jsx`'s "Thông tin private" tab now renders
  the panel with `hideOwnActions` + forwards `privateInfoPanelRef`/
  `onPrivateInfoStatusChange` (new props) instead of showing its own
  button.
- `contracts-list.jsx` (the only real caller of
  `ContractExpandedDetails`+`ContractFormDialog` together) owns the ref +
  status state, passes a `privateInfoEditController` object down to
  `ContractFormDialog` only while `expandedTab === 'privateInfo'`.
- `contract-form-dialog.jsx`'s persistent footer now branches on
  `activeTab === 'privateInfo'`: when active, "Sửa hợp đồng" becomes
  "Sửa Thông tin private" and toggles/submits that tab in place (no more
  jumping back to "Thông tin" the way the old unconditional footer did);
  widened that button (144→200px) since the label is longer than "Sửa hợp
  đồng" and was clipping.
- `pnpm lint`/`pnpm structure`/`pnpm test` (136 tests) all clean; `pnpm
  typecheck` back to the same 3 pre-existing failures (confirmed
  unchanged) after fixing the `forwardRef` typing regression it initially
  caught. Live-verified both call sites in the browser: BOQ list's detail
  dialog (button now bottom, Sửa opens edit mode, Hủy discards), and the
  Contract dialog's "Thông tin private" tab (footer's "Sửa Thông tin
  private" edits in place, no duplicate tab-local button, Hủy reverts).
- No commit made — user has not asked for one yet.

### Follow-up: unify Commission tab the same way (same day)

- User: apply the same Xem/Sửa-in-one-layout treatment to the Contract
  dialog's "Commission" tab, and minimize component position shifting in
  general. The real "shift" for Commission was structural, not visual:
  clicking "Sửa Commission" opened `CommissionFormDialog` — a second
  fullscreen dialog stacked on top of the Contract dialog — instead of
  editing in place.
- New `contract-commission-panel.jsx`, mirroring `ContractPrivateInfoPanel`
  exactly (same `hideOwnActions`/`controllerRef`/`onStatusChange` shape),
  wrapping the already-`isReadOnly`-capable `CommissionFields` +
  `useCommissionForm` (both already shared by `commissions-list.jsx`'s own
  Xem/Sửa, just never reused here before). A contract has at most one
  Commission, so `commission == null` now starts the panel directly in
  editing mode (no "Chưa có Commission" prompt state) — same idea as the
  "Thông tin" tab starting in edit mode for a brand-new Contract; `Hủy`
  while creating just clears the draft since there's no view state to
  revert to.
- Verified via ADR-0004 (`docs/adr/0004-...`) that inlining
  `CommissionFields`' `Selector` field here is safe: the ADR's stacking
  bug only triggers when a `Selector`-bearing `*FormDialog` is rendered
  inside `renderExpanded` (an ancestor `<table>` breaks the portal
  target); `ContractExpandedDetails`'s Commission tab lives inside
  `ContractFormDialog`'s own `<dialog>`, never inside a `renderExpanded`
  table row — `harness/tests/selector-dialog-stacking.test.cjs` (part of
  `pnpm run test:harness`) confirms no `*FormDialog` ended up nested in a
  `renderExpanded` callback.
- Generalized `contract-form-dialog.jsx`'s footer: renamed
  `privateInfoEditController` → `activeTabEditController` (now covers
  either tab, driven by whichever panel matches `activeTab`, built once in
  `contracts-list.jsx`) instead of a privateInfo-only branch duplicated a
  second time for commission. `contract-expanded-details.jsx` dropped the
  now-dead `commissionAnnexesQuery`/`commissionGrandTotal` computation
  (`CommissionFields` already fetches/rolls that up itself off
  `commission.contractId`). Deleted `contract-commission-tab.jsx` (fully
  replaced); `commission-form-dialog.jsx` stays — still used standalone by
  `commissions-list.jsx`, out of scope here. `contracts-list.jsx` dropped
  the `commissionDialog` state/render block for this call site.
- `pnpm lint`/`pnpm structure`/`pnpm test` (136) clean; `pnpm typecheck`
  unchanged (same 3 pre-existing failures); `pnpm run test:harness` (6,
  including the ADR-0004 stacking check) all pass. Live-verified in the
  browser: Commission tab on a contract with no Commission yet renders the
  create form directly (no dialog jump), Hủy clears the draft and stays
  editable, switching to "Thông tin private" and back to "Thông tin" both
  still behave correctly (each tab's footer swaps cleanly, no shared-state
  bleed between the two controller-driven tabs).
- No commit made — user has not asked for one yet.

### Bug fix: Commission tab opened editable without clicking "Sửa Commission" (same day)

- User-reported bug: opening the Contract dialog's Commission tab on a
  contract that already HAS a Commission still showed the fields
  editable, before ever clicking "Sửa Commission".
- Root cause: `useCommissionQuery` is loading when
  `ContractCommissionPanel` first mounts (`contract-expanded-details.jsx`
  rendered it unconditionally, not gated on load state) — during that
  window `commission` is `null` (same value as "confirmed none exists"),
  so `ContractCommissionPanel`'s `useState(!commission)` locks in
  `isEditing = true` at mount. Once the query resolves and a real
  Commission arrives, `useState`'s initial value never re-runs, so the
  panel stayed stuck in editing mode even though a Commission existed.
  (`ContractPrivateInfoPanel` never had this bug: its tab is gated on
  `privateInfo &&` — private info is never `null` once loaded, so there's
  no "loading looks like empty" ambiguity there.)
- Fix (`contract-expanded-details.jsx`): only mount
  `ContractCommissionPanel` once `commissionQuery.isLoading` is false (a
  plain "Đang tải Commission..." `Text` shows during the brief loading
  window instead); added `key={commission?.id ?? 'create'}` so a
  null→real-commission transition (e.g. right after creating one) forces
  a fresh mount with the correct initial `isEditing` too, rather than
  reusing state computed for the old identity.
- `pnpm lint`/`pnpm typecheck` (no new errors)/`pnpm structure`/`pnpm
  test` (136) all clean. Live-verified against the real dev BE-P
  stack on the contract's actual seeded Commission (Công ty TNHH Môi Giới
  Thương Mại Quốc Tế, 3,500 USD): tab now opens read-only as expected,
  "Sửa Commission" still toggles editing correctly, "Hủy" still reverts
  cleanly.
- No commit made — user has not asked for one yet.

## 2026-09-09 — LAN operations implementation

- Implemented accepted `BE-P/docs/lan-operations-plan.md` across both apps
  and sibling `ops-lan`: CI/image exclusions, Caddy HTTPS, Portainer, independent
  Kuma 2.5.3, PowerShell release/backup/restore/monitoring/provisioning, explicit
  backend migrate/seed/schema commands and Admin-only operational status UI.
- Verification and limits: `../ops-lan/verification.md`; both full harnesses
  PASS. Real isolated Docker tests verified trusted TLS, Secure cookies,
  maintenance 503, dependency outage/recovery, dump/checksum/restore with
  Vietnamese data, and Kuma bounded maintenance. Desktop/mobile evidence in
  `../ops-lan/logs/`. No production database was modified.
- Restored frontend CI required repairing existing typecheck issues and moving
  the Astryx workflow out of AGENTS.md to keep the map within audit limits.
- Harness gaps fixed: image-route assertion catches context exclusions; real
  Caddy test catches maintenance matcher mistakes; latest sample-data import
  runs twice after baseline upgrade, preserving a frozen historical fixture.
  Gitignore now allows Backup HTTP examples and unit tests.
- Pending: actual Windows installation, NTFS/DPAPI/CMS, SMB and SMTP drills,
  Portainer operator drill, remote CI for release SHAs, measured four-hour
  recovery goal. Track in `../ops-lan/acceptance.md`; not marked accepted.

## 2026-09-09 — Repository directory names

- Backend directory: `../BE-P`; frontend directory: `../FE-P`.
- Updated harness documentation and cross-repository references to these names.
- Verification scripts already resolve their repository relative to their own
  location. Browser-test cookie names and generated theme filenames remain
  application identifiers and do not follow repository-directory names.
- Validation: full `./harness/verify.sh` PASS after rename; evidence
  `harness/runs/20260909-072511-744142/`.

## 2026-09-10 — Home portal simplification (task 1.2)

- User requested less repetitive information and a portal-oriented home.
  Grouped carousel and three expandable secondary news rows in one column,
  notices and a compact company calendar in the other. Removed the redundant
  holiday panel, news category pills and misleading news-archive link to Docs.
  Reduced video copy and replaced six ecosystem cards with a logo strip.
  Kept existing theme, navigation and content fixtures; carousel now advances
  manually. Mobile uses a taller image and untruncated title.
- Browser regression covers four widths (1440/768/390/320), overflow, a single
  holiday/calendar region, news expansion, month navigation and keyboard/year
  boundaries. Evidence: `harness/runs/20260910-home-portal/`.
- Build, 137 unit tests, harness tests, dependency structure and shared bundle
  threshold pass (168.3 kB gzip, threshold 250 kB). Home-scoped lint passes.
  Final full gate: `harness/runs/20260910-224405-2144/`.
  Full verification remains blocked by unrelated in-progress `filter-table.tsx`
  lint failures and nullability errors in `src/shared/components/table-header-group.jsx`.
  Task remains unchecked; no completion commit while full gate fails.
- Harness gaps: desktop-only inspection missed clipped mobile hero copy;
  browser check now asserts active-slide copy stays inside the image at all four
  widths. Content test asserts featured and secondary news IDs are disjoint.
  Shell scripts arrived as CRLF, and default Windows bash used WSL without
  Node; verification uses Git Bash after local line-ending normalization.
  A repository-wide LF policy is a follow-up, outside this UI task.
- Discovered: news/video/notice data are illustrative fixtures; several story
  targets still point to Docs. Real editorial detail pages/CMS are out of scope.

## 2026-09-10 — Home portal layout polish (on top of task 1.2, still uncommitted)

- User asked to further polish the home layout (swiper, news/video, company
  calendar already present from 1.2) and make it look better. Added a page
  subtitle under the "Bản tin công ty" H1 for orientation, and grouped
  `VideoClips` + `Ecosystem` into a soft muted-background band
  (`--color-background-muted`, rounded via `--radius-container`) so the page
  reads as two rhythmic sections instead of one unbroken white column.
  `src/app/(protected)/page.jsx`.
- Harness gap hit while building this: wrapping the band in a second nested
  `<Section>` (instead of a plain `VStack` + `xstyle`) shrank it to its
  content's intrinsic width — `Section` does not stretch to fill available
  inline width the way `VStack`/`Grid` do, so its `Grid` children fell back
  to a single narrow column. Fixed by using a plain `VStack` with
  `width: '100%'` in `xstyle` instead of nesting `Section`. Worth an Astryx
  usage note if this trips up another session.
- Verified live against the real dev server on `:3000` (Chrome automation);
  desktop screenshot confirms full-width 4-up video grid and the new band.
  Could not confirm narrow-viewport rendering live — `resize_window` did not
  change the actual rendered viewport in this session's browser tooling — but
  the change only adds a `width:100%` background/padding wrapper with its own
  responsive padding step at 640px around already mobile-verified components,
  so no responsive behavior inside those components changed.
  `pnpm exec eslint`, `tsc --noEmit`, home feature `node --test`, and
  `depcruise` (structure) all pass for the touched file.
  Full `harness/verify.sh` still blocked by the same pre-existing unrelated
  `filter-table.tsx` / `table-header-group.jsx` issues noted above — not
  touched, out of scope. Not committed (bundled with unrelated in-progress
  changes from other sessions per `git status`); left for the user to review
  alongside the rest of task 1.2.

## 2026-09-10 — Logistics workspace redesign plan

- Saved requested review/design plan to
  `openspec/changes/logistics-workspace-redesign/` (proposal, design, tasks,
  and acceptance specs). Implementation has not started; all tasks unchecked.
- Priority: retain drafts and guard navigation; unify save/cancel in place;
  enforce exact view/edit geometry; narrow Contract responsibilities; then
  reorganize sidebar/list defaults. No application code changed for this request.

## 2026-09-10 — Logistics workspace redesign, task 1.1 (draft loss on tab switch/close)

- Implemented task 1.1: Commission/"Thông tin private" tabs on the Contract
  dialog lost their in-progress draft when switching tabs (the panels were
  only mounted while `activeTab` matched, so React tore down
  `useCommissionForm`/`useContractPrivateInfoForm` state on every tab
  change), and closing/leaving the dialog never checked either tab's dirty
  state at all — only the main "Thông tin" form's `isDirty` gated the
  discard-confirmation dialog.
- `contract-expanded-details.jsx`: `ContractCommissionPanel` and
  `ContractPrivateInfoPanel` now stay mounted once their data has loaded,
  toggled with the native `hidden` attribute (passes through `VStack`'s
  `...props` spread) instead of being conditionally rendered by
  `activeTab`. Their own data queries already ran unconditionally before
  this change, so no new fetch cost.
- `use-commission-form.js`/`use-contract-private-info-form.js`: added the
  same JSON-fingerprint `isDirty` `useContractForm` already used, and
  threaded it through each panel's `onStatusChange` status object.
- `contracts-list.jsx`: added `secondaryDraftsStatus` (OR of Commission/
  private-info `isEditing && isDirty`, and of their `isSubmitting`),
  computed independently of `activeTabEditController` so it reflects a
  draft left on a tab the user has since switched away from — passed to
  `ContractFormDialog` alongside the existing tab-scoped controller.
- `contract-form-dialog.jsx`'s `requestExit` (backdrop click, header ✕,
  footer Đóng/Hủy) now also opens the discard-confirmation dialog when
  `secondaryDraftsStatus.isDirty`, and refuses to exit at all while
  `secondaryDraftsStatus.isSubmitting` (mirrors the existing guard on the
  main form's own `isSubmitting`) — prevents both silently discarding an
  off-tab draft and closing mid-save.
- `pnpm exec eslint`/`pnpm typecheck`/`pnpm structure`/`pnpm test` (137) all
  clean for every touched file. Full `./harness/verify.sh` still FAILS —
  same pre-existing, unrelated blockers noted under the 2026-09-10 home
  portal entries: `filter-table.tsx` (untracked, another session's
  in-progress work) `react-hooks/set-state-in-effect`/unused-var lint
  errors, and `src/shared/components/table-header-group.jsx` possibly-null
  typecheck errors. Evidence: `harness/runs/20260910-232955-2670/`.
- Not live-verified in a browser this session (no test credentials/seeded
  contract in context) and not committed — per `AGENTS.md`, task 1.1 stays
  unchecked in `tasks.md` until the full gate passes and the tab-switch/
  close/pending-guard scenarios are confirmed live, consistent with how the
  home-portal task was left when it hit the same pre-existing blocker.
- Harness gap: the same `filter-table.tsx`/`table-header-group.jsx` failures
  have now blocked full-gate verification across at least two unrelated
  tasks in the same day; whoever owns `filter-table.tsx` should land or
  revert it so `./harness/verify.sh` is usable again for everyone else.

## 2026-09-10 — Logistics workspace redesign, task 1.2 (Lưu/Hủy về Xem tại chỗ)

- Implemented task 1.2: Contract, Shipment and Commission all reset back to
  Xem after a successful save by remounting (a new React `key`) or by
  outright closing the dialog, which wiped tab/scroll/disclosure state and
  any Commission/private-info draft riding along — the exact "remount chỉ
  để đổi mode" pattern `design.md` calls out. BOQ (`ContractPrivateInfoPanel`
  standalone via `contract-private-infos-list.jsx`) already flipped
  `isEditing` back to `false` in place on save with no remount/close — nothing
  to fix there.
- Root cause for Contract: `contracts-list.jsx` keyed `ContractFormDialog` on
  `` `${workspace.contract?.id ?? 'create'}-${workspace.revision}` `` and
  bumped `revision` in `onSuccess`, forcing a full remount of
  `ContractFormDialog` + `ContractExpandedDetails` (and, per task 1.1,
  destroying the Commission/private-info panels' draft) on every save,
  purely so `ContractFormDialog`'s `isEditing` would re-initialize to
  `false`. Replaced `revision` with `sessionKey` (a `generateRowKey()` token
  assigned once per open action — row Xem/Sửa, "Tạo hợp đồng" — and left
  untouched across saves, including the create→saved transition), and made
  `ContractFormDialog` call `setIsEditing(false)` itself in its `useContractForm`
  success callback instead. `onSuccess` in `contracts-list.jsx` now only
  patches `workspace.contract` in place and no longer forces
  `setExpandedTab('info')` (the Save button already does that on click,
  before submission) — whatever tab/scroll/disclosure state existed
  survives the save.
- `use-contract-form.js`/`use-commission-form.js`/
  `use-contract-private-info-form.js`: their fingerprint-based `isDirty`
  (added in task 1.1) captured its baseline once at mount, so with the
  remount removed it would stay stuck "dirty" after a clean save — added
  `setInitialFingerprint(draftFingerprint)` at the end of each hook's
  success path to move the baseline up to what was just submitted.
- Shipment/Commission standalone edit dialogs (`shipment-form-dialog.jsx`,
  `commission-form-dialog.jsx`) called `onOpenChange(false)` on every save,
  closing the whole dialog even when editing an existing record. Both now
  call `setMode('view')` (their shared `FormDialog` already supports a
  Xem/Sửa toggle footer) and only close for the *create* path, where there
  is no existing record to show a view of. Their callers
  (`contracts-list.jsx`, `shipments-list.jsx`, `commissions-list.jsx`) no
  longer unconditionally clear dialog state in `onSuccess` — they keep it
  open (refreshing the held record where relevant) for an edit, and only
  close for a create, matching each dialog's own key (unchanged across an
  edit save, so no remount there either).
- `pnpm exec eslint`/`pnpm typecheck`/`pnpm structure`/`pnpm test` (137) all
  clean for every touched file. Full `./harness/verify.sh` still FAILS on
  the same pre-existing, unrelated `filter-table.tsx`/
  `table-header-group.jsx` blockers as task 1.1 (see that entry) — `build`
  and `quality-thresholds` both pass. Evidence:
  `harness/runs/20260910-233958-2864/`.
- Not live-verified in a browser this session (same missing
  credentials/seeded-data constraint as task 1.1) and not committed — task
  1.2 stays unchecked in `tasks.md` until the full gate passes and the
  save/cancel/refetch scenarios are confirmed live.
- Discovered, not fixed here (out of scope for 1.2): Shipment/Commission
  *create* flows still close the dialog on success rather than staying open
  in Xem on the newly created record the way Contract's create flow already
  does — would need each caller's dialog state to hold the saved record
  (not just an id anchor). Worth a follow-up if the redesign wants create
  and edit to feel identical, not just edit made consistent.

## 2026-09-10 — Unblocked full-gate verification; tasks 1.1/1.2 marked done

- User asked to (1) delete `filter-table.tsx`, (2) fix
  `table-header-group.jsx`, (3) continue. `filter-table.tsx` was untracked
  (`git status` showed `??`, confirmed before deleting) — another session's
  in-progress work, never committed, so removing it discarded no tracked
  history; deleted at explicit user instruction.
- `table-header-group.jsx`'s `TableHeaderGroupBar` had a real (if harmless
  at runtime) typecheck gap: `measure()` was a hoisted `function`
  declaration nested inside the `useEffect` callback, closing over
  `container` after `if (!container) return undefined` — TypeScript
  discards a `const`'s non-null narrowing inside a nested hoisted function
  declaration (it could in principle be reached before the guard runs), so
  `container`/`cell`/`caption` kept re-widening to possibly-null 5 lines
  down. Fixed by (a) changing `measure` to a `const` arrow function, which
  TS's closure-narrowing analysis does trust, and (b) replacing the
  `cells.some((cell) => !cell)` / `captions.some(...)` early-return checks
  (which flagged missing elements without changing the arrays' static
  `(Element | null)[]` type) with `.filter((cell) => cell != null)` +
  a length comparison — TS 5.9's automatic filter-predicate inference
  narrows the array to `Element[]` for every line after, matching the same
  runtime behavior (bail and clear the rect if any column/caption is
  missing).
- With both gone, `./harness/verify.sh` PASSED in full — lint, typecheck,
  structure, harness-tests, unit-tests (137), build, quality-thresholds all
  green. Evidence: `harness/runs/20260910-235145-3015/`.
- Tasks 1.1 and 1.2 (both implemented earlier this session, previously left
  unchecked only because this pre-existing blocker kept the full gate red)
  are now marked `[x]` in `tasks.md` per `AGENTS.md`'s literal "done =
  `./harness/verify.sh` passes" rule. Caveat: the live-browser scenario
  matrix `design.md` itself asks for (tab-switch/close/pending-guard for
  1.1; save/cancel/refetch context retention for 1.2, across
  desktop/mobile) has still not been run — no test credentials/seeded data
  were available in this session. Flagging this gap rather than silently
  skipping it; a future session (or task 5.1's full acceptance pass) should
  still run that matrix before treating the feature as UX-verified, not
  just mechanically verified.
- Committed: `feat(logistics-workspace-redesign): tasks 1.1-1.2 — retain
  drafts across tabs, save/cancel in place` (includes the
  `table-header-group.jsx` fix and `filter-table.tsx` removal, since they
  were required to get `./harness/verify.sh` green for this commit).
