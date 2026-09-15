# Shipment cost table: restore the STT column

## Why
Follow-up to reverting `shipment-cost-ledger-row-density` twice (see that
change's `tasks.md`, tasks 5–6): the user asked to go back to the last
git-committed version of the Chi phí Logistics tab (`e0a2351`,
2026-09-14), which predates the STT (số thứ tự) column — that was added
later the same UI-iteration day as an uncommitted `logistics-cost-lines-ux`
task, and got reverted away along with everything else. User then asked
for it back specifically: "commit code, sau đó thêm cột số thứ tự" (commit
the code, then add the STT column).

## Design
Re-add a leading `STT` column to the plain `Table` in
`shipment-cost-lines-fields.jsx` — numbers cost-line rows 1, 2, 3, ...
continuously across category groups (group-header rows stay blank), same
computation `groupedTableRows` already orders rows by for display. No
other change to this table (still the `e0a2351` baseline: plain `Table`,
category grouping, no suggestion menu).

## Scope and behavior
`shipment-cost-lines-fields.jsx` only: one new `stt` column definition
plus the `sttByRowKey` Map it reads from. No API/type changes.

## Verification
`pnpm lint`/`typecheck`/`structure`/`test`/`build`/`verify:quality` all
green. Manual browser check (mocked `agent-browser` session, 3 cost lines
across 2 categories): STT numbers 1, 2, 3 continuously down the table,
blank on the two category group-header rows, right next to "Nhóm chi phí"
as the leading column. Screenshot:
`harness/runs/20260915-ux-audit/stt-added.png`.
