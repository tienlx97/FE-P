# Proposal: Quản lý hợp đồng — phòng Kế toán

**Status:** done
**Created:** 2026-10-09

## Why

User (2026-10-09): the Accounting department needs contract management
independent of Logistics — contract value before / after tax, appendices,
invoices issued, payment instalments split into sub-instalments, what is
paid / unpaid and how many days a contract is overdue. Backend: BE-P change
`accounting-contracts` (tasks 1.1–1.6, API under `/api/v1/accounting/*`,
permissions `accounting:contracts:view` / `accounting:contracts:manage`,
granted to the "Kế toán" department and Admin).

## What changes

- New top-level area "Kế toán" (`/accounting`), own sidebar, route rules.
- Catalog pages: Nguồn (sources) and Khách hàng (accounting customers),
  each with create / edit / delete.
- Contract list (server paged) with every derived value and overdue days;
  create / edit drawer with duplicate checks (contract number, project code
  — also against Logistics contract numbers).
- Contract detail: value summary, tabs Phụ lục / Hoá đơn / Đợt thanh toán
  (instalments with sub-instalments 2.1, 2.2…, Planned / Paid status).
- New feature `src/features/accounting-contracts/` — no import from the
  Logistics features.

## Out of scope

- Exporting, attachments, multiple currencies (VND only).

## Follow-up — 2026-10-09 (task 1.4)

- Use end-side drawers for all accounting edit/create forms, retaining validation, save locking, and discard confirmation. Short delete confirmations remain AlertDialog.
- Match Logistics financial table: grouped GIÁ TRỊ (before tax, tax, after tax, settlement), THANH TOÁN (paid, unpaid), HOÁ ĐƠN (issued, remaining); tabular numbers, minimum money column widths, pinned identifiers/actions, and page totals.
- Accounting VND displays comma grouping and decimal points, e.g. `123,456.78`, including summaries, tables, previews and existing formatted inputs.
- Seed development-only TEST records through the authenticated API: unpaid, partially paid/invoiced, fully paid/invoiced, overdue and signed increase/decrease appendices.
