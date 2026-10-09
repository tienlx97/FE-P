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

## Follow-up — Payment and invoice UX (task 1.5)

- Contract list opens from `?tab=basic|financial` and writes the selected preset to the URL while preserving other query parameters.
- Payment model: a contract has numbered payment stages; each stage has one or more actual/planned payment occurrences. The create-stage drawer starts with exactly one planned occurrence (100% of after-tax value); additional occurrences are optional. No draft is persisted before Save. UI calls sub-instalments "lần thanh toán", uses a running total and collapsible occurrence sections, and opens the first invalid occurrence on validation. The last occurrence cannot be removed.
- Invoice creation suggests `<projectCode>/HĐ-<sequence>` (e.g. `26KCT10/HĐ-01`), advancing after the highest existing matching suffix. Legacy/edited invoice numbers stay intact. This is a front-end suggestion, editable before save. Drawer sections: invoice facts, remaining-to-invoice/value, notes.
- Accounting detail reuses Logistics' shared header, tabs, overview summary, payment progress and occurrence carousel. Information beneath uses three accounting-specific columns: customer/source, project/value, receivables/documents. Tab selection follows the URL and summary links open the relevant accounting tab.

## Follow-up — Logistics presentation consistency (task 1.6)

- All accounting drawers use the shared Logistics icon/title/context header, tinted canvas and grouped form sections. Appendix signatures and customer contact details have separate sections.
- Payment, invoice and appendix detail tabs show separate metric cards using the shared overview metrics component. Accounting fields, actions and payment/invoice rules remain the source of their content.
- Catalog and appendix drawers mount a fresh form session when opened, following the payment/invoice drawer pattern and avoiding effect-based draft resets.
