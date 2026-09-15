# Tasks

- [x] 1. Collapse each cost row to one line (name + suggestions + category
  inline), drop the redundant "Chứng từ & ghi chú" summary column in favor
  of a compact details-toggle icon, tune column widths so Amount stays
  visible without horizontal scroll on a phone-width dialog; verify full
  harness; manual browser check at 1440px and 390px, edit and view mode.

Evidence: `harness/runs/20260915-ux-audit/` (browser screenshots, before/
after), `harness/runs/20260915-142512-2039/` (full verification passed).

- [x] 2. Follow-up same day (user: "Redesign Tab chi phí logistics. Giao
  diện hiện tại quá xấu" — task 1's density fix wasn't a visual-polish
  pass): category `Selector` → `variant="ghost"`; details-toggle `IconButton`
  → always `variant="ghost"` with the icon's own `color` (accent vs
  secondary) carrying the "has data" signal instead of a filled red button;
  `STT` header shortened to `#`; category group-header rows tinted
  (`--color-background-muted`) across every column so they read as one
  continuous band instead of blending into data rows; verify full harness;
  manual browser check.

Evidence: `harness/runs/20260915-ux-audit/polish-*.png`,
`harness/runs/20260915-143612-1748/` (full verification passed).

- [x] 3. Second same-day follow-up (user: "Giao diện tab chi phí logisitics
  vẫn quá xấu, hãy làm kiểu table" — still didn't read as a real table):
  switched the ledger's `dividers` from `"rows"` to `"grid"`. Found and
  fixed the actual root cause in `tanstack-data-table.jsx` along the way —
  its body/footer `TableCell`s never overrode Astryx's default vertical
  divider color, which (same root cause as the header-border bug fixed
  2026-09-15 earlier) is nearly invisible against a white row background;
  `dividers="grid"` alone rendered zero visible vertical lines. Added a
  `cellDivider` style (mirrors the existing `headerCell` override) applied
  only when `dividers` is `"grid"`/`"columns"`, so every other consumer
  (mostly `"rows"`) is unaffected; verify full harness; manual browser
  check on this tab and a spot-check of `contracts-list.jsx` (an existing
  `dividers="grid"` consumer) to confirm no regression.

Evidence: `harness/runs/20260915-ux-audit/grid2-*.png`,
`harness/runs/20260915-ux-audit/contracts-list-grid-check.png`,
`harness/runs/20260915-144654-662/` (full verification passed).

- [x] 4. Third same-day follow-up (user: "Dùng cách tiếp cận khác đi" — use
  a different approach — after three rounds of polish on the `Table`-based
  ledger still didn't land): rebuilt the whole tab on `List`/`ListItem`
  instead of `TanStackDataTable`/`Table`, per the user's own pick when
  offered concrete alternatives. One `<List>` per cost category (section
  header = category name + subtotal + "add" button, replacing the previous
  synthetic group-header table rows). Each cost line is a plain, read-only
  `ListItem` (name, amount, a short supplier/invoice/note summary) until
  clicked; clicking swaps it in place for `ShipmentCostLineEditor`, a fully
  labeled form (name+suggestions, category, amount, supplier, invoice,
  note, delete) — never nested inside the `ListItem` itself (Astryx's own
  `ListItem` docs warn against nesting interactive controls in an
  already-interactive item, and its slot API has no room for a full form
  anyway), so `splitByExpanded()` renders each category's rows as
  alternating `<List>` runs and standalone editor blocks instead. A newly
  added row auto-opens into its editor (diffed by `rowKey`) instead of
  appearing as an easy-to-miss blank row. Net effect: at most a few rows
  ever show input controls at once, instead of every row simultaneously —
  which is what actually produced "wall of boxes" in tasks 2–3, not
  anything density- or color-related. Verified full harness; manual browser
  check (desktop 1440px, mobile 390px — zero horizontal overflow now,
  simpler than the table version's width-budgeting since text rows reflow
  naturally instead of needing per-column pixel tuning — edit mode, view
  mode, add-row auto-expand, delete).

Evidence: `harness/runs/20260915-ux-audit/listitem-*.png`,
`harness/runs/20260915-150311-167/` (full verification passed).

- [x] 5. User reverted this change (same day): "Hãy revert lại UI của Chi
  phí Logistics: quay lại 4 5 phiên bản trước (phiên bản có số thứ tự)"
  (revert the Chi phí Logistics UI back ~4-5 versions, to the version that
  had the STT column) — explicitly scoped to "chỉ UI của chi phí logistics"
  (only the Chi phí Logistics UI). Committed tasks 1–4's end state first
  (`505f9dc`) so the `List`/`ListItem` work stays recoverable in history,
  then restored `shipment-cost-lines-fields.jsx` byte-for-byte to its
  state from before this change started (Codex's `TanStackDataTable`
  ledger with the STT column, two-line name/category cells, and the
  "Chứng từ & ghi chú" details column — see
  `redesign-shipment-logistics-costs`/`logistics-cost-lines-ux`, both still
  uncommitted from earlier the same day). `tanstack-data-table.jsx`'s
  divider-color fix (task 3) was left as-is, not reverted — it's a shared
  component fix benefiting ~12 other list screens, outside "chỉ UI của chi
  phí logistics". Verified with lint/typecheck (clean) and a browser
  screenshot confirming the restored tab matches the pre-change version.
  **This whole change (tasks 1–4) is effectively undone in the working
  tree as of this task** — kept in this file and in git history
  (`505f9dc`) as a record of what was tried and why it didn't land, per
  `AGENTS.md`'s "every agent mistake/dead-end is a harness gap or a record
  worth keeping" spirit. A future redesign of this tab should read this
  file first before re-attempting any of tasks 1–4's approaches.

- [x] 6. Immediate follow-up (same day): "Back lại phiên cũ hơn, Phiên bản
  vẫn còn dùng table" (go back to an even older version — the one that
  still uses table). Task 5's restored version turned out to still carry
  today's uncommitted `logistics-cost-lines-ux`/`redesign-shipment-
  logistics-costs` work (STT column, suggestion `DropdownMenu`, the
  polished ledger header copy) — not actually an old, settled state. Went
  one step further back to the last **git-committed** version of this
  file, `e0a2351` (2026-09-14, "add a cost row directly into its group, no
  reposition") — restored via `git checkout e0a2351 --
  shipment-cost-lines-fields.jsx` (byte-exact from git history, not a
  reconstruction from memory this time) rather than another manual
  rewrite. That version: plain `Table` (not `TanStackDataTable`), grouped
  by category, 6 columns (Nhóm chi phí, Tên khoản chi phí, Số tiền, Ghi
  chú, Nhà cung cấp, Số hoá đơn), no STT, no suggestion menu — genuinely
  predates every uncommitted redesign from today. Verified clean under
  lint/typecheck and confirmed with a browser screenshot that it renders
  correctly against current supporting files (hooks/types have moved on
  since 2026-09-14; nothing broke).

Evidence: `harness/runs/20260915-ux-audit/debug-older-state.png`,
`harness/runs/20260915-152920-579/` (full verification passed).
