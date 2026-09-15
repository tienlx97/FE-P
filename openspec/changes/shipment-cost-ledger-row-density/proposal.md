# Shipment cost ledger: one line per row, no hidden amount on mobile

> **Status: reverted 2026-09-15 (same day), twice.** The user asked to
> revert this tab's UI after tasks 1–4 below (task 5), then asked to go
> back further still (task 6). `shipment-cost-lines-fields.jsx` is now the
> last **git-committed** version, `e0a2351` (2026-09-14) — plain `Table`,
> grouped by category, no STT, no suggestion menu. It no longer matches
> anything in this proposal — see task 6 in `tasks.md` for what's actually
> live. Kept as a record of what was tried; tasks 1–4's `List`/`ListItem`
> end state is still recoverable at commit `505f9dc`.

## Why
User report (Vietnamese, 2026-09-15): "Chi phí Logisitcs" tab UI/UX chưa tối
ưu trải nghiệm người dùng — the previous ledger (`redesign-shipment-logistics-
costs`) still had two concrete problems, confirmed with mocked browser
evidence against realistic data (7 rows across 3 categories):
1. Every row stacked a full-width Name field over a full-width category
   `Selector`, doubling row height even though rows are already grouped
   under a category header. 7 rows already needed scrolling inside a
   900px-tall dialog, with the sticky footer visually cutting into the last
   row instead of a clear scroll boundary.
2. On a 390px-wide dialog (phone), the ledger's rendered width was 836px —
   the Amount and "Chứng từ & ghi chú" columns sat entirely off-screen with
   no scrollbar or scroll hint, so the single most important number on the
   tab (the line's cost) was invisible without an undiscoverable horizontal
   swipe.

## Design
Combine Name, the suggestion menu, and category into one wrapping row
(`HStack wrap="wrap"`) instead of two stacked full-width fields — one line
per cost line on desktop, wrapping onto a second line only where the column
is genuinely too narrow. Drop the separate "Chứng từ & ghi chú" summary
column: it repeated a "Chưa có nhà cung cấp" filler line on every empty row
and duplicated the expansion chevron `TanStackDataTable` already renders.
Replace it with a single compact `IconButton` (paperclip) in the actions
cell that toggles the same expanded panel and visually fills in (`variant:
"secondary"`) when the row already has a supplier, invoice number, or note —
carrying the same "has extra info" signal in a fraction of the width. That
freed width is what lets Amount stay fully visible and legible on a
phone-width dialog without horizontal scrolling; only the compact actions
cell (paperclip + delete) may still need a small scroll on the narrowest
phones, which is an acceptable trade-off since the row stays reachable via
the always-visible leading chevron.

## Follow-up: visual polish (same day)
The density fix (above) fit more rows on screen but left every row as a
line of identically-boxed controls, and the details-toggle icon used a
filled `secondary` (red) `IconButton` that read as a per-row warning next
to the actual delete button — flagged separately ("Giao diện hiện tại quá
xấu"). Addressed without touching row height/column widths again:
- Category `Selector` → `variant="ghost"` (Astryx's own documented pattern
  for a selector beside ghost buttons) — still a single click to reassign,
  no longer visually competing with `Name` or the group header that already
  states the category once per group.
- Details-toggle `IconButton` → always `variant="ghost"`; `hasDetails` now
  only tints the `Paperclip` icon itself (`color="accent"` vs `"secondary"`)
  instead of filling the whole button red.
- `STT` header shortened to `#` (also fixed a header-clipping regression at
  the tightened column width from the first pass).
- Category group-header rows get a `--color-background-muted` tint across
  every column (same token the shared table's own totals-row footer uses)
  so the row reads as one continuous section divider instead of just bold
  text blending into the data rows above and below it.

## Follow-up 2: actual table grid (same day)
User came back a third time: "vẫn quá xấu, hãy làm kiểu table" (still ugly,
make it table-style). The ledger switched `dividers` from `"rows"` to
`"grid"`, but that alone changed nothing visible — investigation found the
real bug one layer down, in the shared `tanstack-data-table.jsx`: its body
and footer `TableCell`s never override Astryx's default vertical-divider
color, and that default (`--color-border`, `rgb(231,236,235)`) is close
enough in luminance to a white row background to be effectively invisible —
confirmed both by computed style (the border rule *was* present) and by a
cropped screenshot of the rendered table showing zero visible vertical
lines. This is the same class of bug already fixed once for header cells
(`fix-boq-commission-header-ux`, 2026-09-15) — that fix only ever touched
`TableHeaderCell`, not the body. Added the equivalent override
(`--color-border-emphasized`) to body/footer cells, applied only when
`dividers` is `"grid"` or `"columns"` so every other list using the default
`"rows"` dividers (the majority) renders byte-for-byte unchanged. Spot-
checked `contracts-list.jsx` (an existing `dividers="grid"` consumer)
after the fix to confirm it also now shows real grid lines with no other
regression, since this touches a shared component used across ~12 list
screens.

## Follow-up 3: List/Item rewrite, supersedes the Table approach (same day)
Three rounds of polish on the `Table`-based ledger (density, styling, grid
lines) still didn't land — user: "Dùng cách tiếp cận khác đi" (use a
different approach). Asked the user to choose between concrete
alternatives rather than guess a fourth time; they picked switching to
Astryx's `List`/`ListItem` — the pattern `docs/astryx-workflow.md` already
names as the sanctioned one for dense data ("Dense data = rows (Table,
List/Item) edge-to-edge"), just not the one tried yet.
Rebuilt the tab: one `<List>` per cost category (section header = name +
subtotal + "add", replacing the synthetic group-header table rows). Each
cost line renders as a plain `ListItem` — name, amount, a short
supplier/invoice/note summary — until clicked. This is the actual fix for
"wall of boxes": every earlier pass still showed input controls on *every*
row *simultaneously*; clicking a `ListItem` now swaps it for
`ShipmentCostLineEditor`, a fully labeled form, so normally at most one or
two rows show any input at all. `ListItem`'s own docs warn against nesting
interactive controls inside an already-interactive item (and its
label/description/start/endContent slots have no room for a full form
regardless), so the editor is never rendered *inside* a `ListItem` — a new
`splitByExpanded()` helper renders each category's rows as alternating
`<List>` runs (pure `ListItem` children, valid `<ul>`/`<li>` structure) and
standalone `ShipmentCostLineEditor` blocks in between. A newly added row
auto-opens into its editor (rows diffed by `rowKey` in a `useEffect`) so it
never appears as an easy-to-miss blank row the user has to go find.
This also incidentally solved the mobile-overflow problem the Table
approach needed three rounds of column-width tuning for: text-based list
rows reflow naturally at any width, with no columns to budget pixels for.

## Accepted decisions
- Category stays a live, per-row `Selector` (not moved into the expandable
  panel) — it's what determines which group a row belongs to, so it needs
  to stay a single click away, not two.
- The old "Chi tiết" text button's dynamic label ("Chi tiết · Có ghi chú")
  is replaced by the paperclip icon's `variant` (filled vs ghost) — same
  glanceable signal, no text column required.
- Column widths (`STT` 36px, Amount 140px, Actions 64px, Name/Category
  `minWidth` 150px) were tuned empirically against a real mocked render at
  390px and 1440px, not guessed — see verification evidence.

## Scope and behavior
`shipment-cost-lines-fields.jsx` only (plus the task-3 shared-component
border fix in `tanstack-data-table.jsx`, superseded for this tab by task 4
but still live for `tanstack-data-table.jsx`'s other ~12 consumers). As of
task 4 this tab no longer imports `Table`/`TanStackDataTable` at all — it's
`List`/`ListItem` end to end. No API, type, or parent-dialog changes; the
`rows`/`onAddRow`/`onRemoveRow`/`onUpdateRowField` contract with
`shipment-fields.jsx`/`use-shipment-cost-line-rows.js` is unchanged.

## Out of scope
- Any change to `use-shipment-cost-line-rows.js` (the auto-expand-on-add
  behavior diffs `rows` locally in this component instead).
- Re-litigating `redesign-shipment-logistics-costs`'s other decisions
  (category grouping, STT numbering, suggestion `DropdownMenu`, draft/save
  behavior) — all preserved unchanged.

## Verification
`pnpm lint`/`typecheck`/`structure`/`test`/`build`/`verify:quality` all
green after every task. Manual browser check (mocked `agent-browser`
session, real dev server, 6-7 cost lines across 3 categories + 1
uncategorized) after task 4: desktop (1440px) shows all rows with clear
category sections and subtotals; mobile (390px) has zero horizontal
overflow (`document.body.scrollWidth === document.body.clientWidth`) in
both collapsed and open-editor states; clicking a row opens a fully
labeled edit form in place and "Xong"/clicking again collapses it; adding
a row auto-opens its editor under the right category section; deleting a
row works with no console errors; view mode still shows every field
read-only with delete unavailable. Screenshots in
`harness/runs/20260915-ux-audit/listitem-*.png`.
