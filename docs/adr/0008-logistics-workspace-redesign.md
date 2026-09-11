# ADR-0008: Logistics workspace — narrowed Contract, shared entity editors, operational-first tables

Date: 2026-09-11
Status: accepted

## Context

The Logistics workspace grew organically (ADR-0006/0007) into a state with
several concrete problems, captured in
`openspec/changes/logistics-workspace-redesign/proposal.md`:

- Commission/BOQ drafts inside the Contract dialog were lost on tab change or
  close — no shared dirty/pending guard, each editor reinvented persistence.
- Xem→Sửa transitions shifted layout (fields, footer, scroll) instead of
  staying put, and some tabs' geometry was never actually verified (an empty
  VGM tab "passed" a 0-controls comparison vacuously).
- Contract's dialog combined profile fields, annexes, payment schedule, and
  every related Shipment/Commission/BOQ's full editor into one surface —
  hard to scope actions to "this Contract" vs. "this child record."
  Shipment/Commission/BOQ each had their own separate editor when opened from
  a Contract vs. from their own list, and opening one from Contract stacked a
  second fullscreen `<dialog>` on top instead of reusing one.
- The sidebar's two-level "Hợp đồng"/"Cấu hình" grouping buried Shipment/
  Commission/customers/countries/places under group clicks; `/logistics`
  itself was a placeholder with no real entrypoint logic.
- Contracts' default table columns mixed operational fields (mã, khách hàng,
  trạng thái) with a four-column financial settlement group, with no way to
  see just one or the other; several lists' code/number cell was plain text
  with no way to open Xem except the "Chức năng" menu.

## Decision

**Draft/lifecycle guard** — `shared/components/form-dialog.jsx`'s dirty-
fingerprint baseline/`isDirty`/confirm-discard mechanism is the one save/
cancel lifecycle every operational editor uses (Shipment, Commission; Contract
and BOQ's bespoke `CommonDialog` shells implement the identical rule
directly). Editing an existing record never remounts the dialog to flip
in/out of edit mode — `mode`/`isEditing` is local state, the record itself
stays the same React subtree. `FormDialog` gained `onCancelEdit`: supplied
only when an existing record is being edited (never for create), "Hủy" or
Escape with no unsaved changes calls it to drop back to Xem in place instead
of closing the whole dialog — the gap this ADR's harness work (below) found:
Shipment/Commission had no such path and always fully closed on Hủy, unlike
Contract's own `finish('cancel')`, which already reset the draft and flipped
`isEditing` false without closing.

**One editor per entity, hidden not stacked** — Shipment, Commission and BOQ
each have exactly one editor component, opened identically from their own
standalone list and from Contract's "Liên quan" tab. Astryx's `Dialog` never
unmounts `children` when `isOpen` flips to `false` (only the native `<dialog>`
element hides) — so `ContractFormDialog`'s `isOpen` toggling to `false` while
a child editor is open is a safe "pause, don't lose state," not a new
mechanism. This avoids the second-fullscreen-dialog stacking bug without
introducing any save-context bridging: each editor still owns its own
mutation. Short "quick-add" child dialogs (annex/payment/VGM line) still
stack on top of their parent editor deliberately — those are compact, not
full workspaces, and ADR-0004's Selector-portal-stacking rule already governs
where they may be declared.

**Contract narrowed to four tabs** — Hồ sơ (profile fields), Phụ lục
(annexes), Thanh toán (payment schedule), Liên quan (Shipment/Commission/BOQ
summary cards + entrypoints into their shared editors above). Related
records not yet possible to create until the Contract itself has an id
(`aria-disabled` on those tabs pre-save) — no "phantom" child relations
against an unsaved parent.

**Read-only via event interception, not `isDisabled`** — Astryx's
`Selector`/`DateInput`/`CheckboxList` expose no native read-only mode, only
`isDisabled` (dims the control, drops it from the tab order — wrong for
Xem). `shared/components/read-only-lock.jsx`'s `ReadOnlyLock` wraps them in a
`display:contents` span with capture-phase click/keydown/paste/cut
interception instead: full opacity, value announced and selectable, still
Tab-reachable, just inert to input. Deliberately omits ARIA (a
`display:contents` wrapper is dropped from the accessibility tree in every
engine regardless) but carries a plain `data-readonly-lock` marker so
tooling can still recognize it.

**Sidebar and `/logistics` respect permission boundaries exactly** —
`sidebarLogistics.json` flattens into "NGHIỆP VỤ"/"DANH MỤC" section-header
groups, each route carrying its own `allowedPermissions`;
`shared/api/nav.js`'s `filterSidebarRoutesByPermissions` (the tree-shaped
counterpart of the existing `filterNavLinksByPermissions`) also drops a
section header once every item beneath it is filtered out. `/logistics`
itself redirects to Hợp đồng only for a visitor who actually has
`logistics:contracts:view`, offers a BOQ-only shortcut for a
`logistics:secret`-only visitor, and otherwise shows a plain landing banner
— it never redirects into a route `routeAccessRules`/`proxy.js` would then
reject, which would otherwise bounce the visitor straight back to `/`. Old
hub pages (`/logistics/contracts-overview`, `/logistics/config`) stay
resolvable directly for existing bookmarks; nothing in the sidebar links to
them anymore.

**Operational-first tables, financial detail as an opt-in view** — Contracts'
default columns are code/đối tác/dự án/trạng thái/incoterm/ngày ký; the
four-column settlement group (giá trị hợp đồng/quyết toán/đã thanh toán/chưa
thanh toán) moved to a `Tài chính` preset. `AdvanceTable` gained an optional
`viewPresets` prop rendered as a `SegmentedControl` next to "Tuỳ chọn hiển
thị" — deliberately loose (swaps the active column set, doesn't track or
enforce which preset is "current"), so the existing column picker keeps
working exactly as before once a preset is picked. A record's own code/
number cell now opens Xem directly (a ghost `Button`, calling the same
`open<Entity>(row, mode)` helper `RecordActionsMenu`'s "Xem" uses), matching
"Mã bản ghi mở Xem" — groundwork an earlier session had already sketched
(commented out) for Contracts; extended consistently to Shipment, Commission
and BOQ's lists too.

## Consequences

- `FormDialog` consumers that only ever create (never view an existing
  record) are unaffected — `onCancelEdit` stays unset, Hủy still closes, no
  behavior change. A future `FormDialog` consumer that adds a Xem/Sửa toggle
  must remember to wire `onCancelEdit` itself; nothing enforces it structurally
  beyond this ADR and `harness/checks/stable-dialog-layout-browser.mjs`'s
  reverse-transition check.
- `ReadOnlyLock`'s event-interception approach means a future Astryx release
  that adds native read-only support to `Selector`/`DateInput`/
  `CheckboxList` should replace it there — re-evaluate against that
  changelog before assuming the wrapper is still necessary (same posture as
  ADR-0004's closing note about `resolveLayerPortalTarget`).
- `viewPresets` only exists on Contracts today; Shipment/Commission were
  deliberately left with their single already-narrow default rather than
  inventing a financial view with nothing but one column to swap.
- `stable-dialog-layout-browser.mjs` (task 2.2/5.1) is the enforcement
  surface for the geometry/draft/readonly/keyboard guarantees above — see
  its own extensive comments for the Windows `agent-browser` tooling bugs
  (unreliable `wait --fn`, unquoted `cmd.exe` argv) this session found and
  worked around to get it running at all, and for the mock-shape/scroll-vs-
  reflow gaps fixed once it did.

## Enforcement

`harness/checks/stable-dialog-layout-browser.mjs`, run manually against a
local `pnpm dev` (not part of the automated `./harness/verify.sh` gate — it
needs a running dev server and `agent-browser`): Xem↔Sửa geometry (0px
tolerance, 2px in practice) across Shipment/Commission/Contract/costs/VGM/
empty-Commission at 1440/768/390/320px; the reverse Hủy transition; client
validation and network-abort error scenarios (draft survives, dialog stays
open, no real reflow); and keyboard/focus/readonly (`ReadOnlyLock` fields
stay Tab-reachable and reject input; Escape on a dirty edit routes through
the same discard-confirm as "Hủy"). `harness/checks/logistics-actions-browser.mjs`
covers the shared-editor menu/read-only/child-operation behavior.
`harness/tests/selector-dialog-stacking.test.cjs` (ADR-0004) still applies
to every `*FormDialog` referenced here. Sidebar/permission filtering has
unit coverage in `src/shared/api/nav.test.js`
(`filterSidebarRoutesByPermissions`) plus live verification against the
real local backend each task recorded in `harness/PROGRESS.md`'s 2026-09-11
entries for this change.
