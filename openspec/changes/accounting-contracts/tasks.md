# Tasks

- [x] 1.1 Kế toán area (nav, sidebar, route rules) + Nguồn and Khách hàng pages (list, create / edit / delete).
- [x] 1.2 Contract list (server paged, derived values, overdue) + create / edit dialog with duplicate checks.
- [x] 1.3 Contract detail: value summary, Phụ lục / Hoá đơn / Đợt thanh toán tabs with their dialogs.

- [x] 1.4 Prefer accounting form drawers, match Logistics financial grouped headers (GIÁ TRỊ / THANH TOÁN / HOÁ ĐƠN), comma-group VND display, and create development test data with browser evidence.

- [x] 1.5 Persist table tabs in URL; redesign payment/invoice drawers, default one payment per stage and project-based invoice numbering; adapt Logistics detail overview for Accounting.

- [x] 1.6 Align accounting drawer chrome/sections and detail-tab KPI/table treatment with Logistics, keeping accounting workflow and data intact.

- [x] 1.7 Show payment stages in overview and one stage per table row; wide editable payment tables with rich-text notes; settlement label and grouped code/due-date financial columns.

- [x] 1.8 Share MÃ headers, preserve scrollable accounting table widths, restore plain textarea notes and redesign payment drawers with compact rows and a selected-occurrence detail panel.

- [x] 1.9 Access: Kế toán area opens for the BE-P "Kế toán HCM" department (and Admin); the shared customer detail only loads Logistics / Kế toán contract lists the user may see, and counts whichever loaded.

- [x] 1.10 Contract drawer: "Thêm khách hàng" button beside Khách hàng opens the shared quick-create customer drawer (composed in `src/app/(protected)/accounting/layout.jsx`) and selects the new customer.
- [x] 1.11 Contract drawer customer selector is searchable; appendix drawer takes Giá trị trước thuế and previews Giá trị sau thuế (contract tax rate), appendix table shows both (BE-P task 1.10).
- [x] 1.12 Invoice number typed by the user; invoices and payments take value before tax and their own tax rate (contract's by default) with an after-tax preview; payments take the actual paid amount; tables and Excel export show them (BE-P task 1.11).
- [x] 1.13 Percent payments choose "Tính trên" (giá trị trước thuế / sau thuế) with a matching preview; payment table shows the percent and its basis (BE-P task 1.12).
- [x] 1.14 Typed values: payment value before tax (percent) / after tax, invoice and appendix value after tax can be typed over the computed one (placeholder shows it, "Tự tính lại" clears it) (BE-P task 1.13).
- [x] 1.15 Contract value after tax typeable in the contract drawer; tables and overview mark typed values ("Đã sửa tay") (BE-P task 1.14).
- [x] 1.16 Typed values are edited in place: click a value (dashed underline; typed ones accent + pencil) for a popover with the computed value, Lưu / Hủy / Tự tính lại; a new invoice starts with an empty value before tax.
- [x] 1.17 Drawers (hoá đơn, đợt thanh toán, phụ lục, hợp đồng) edit computed values the same click-to-edit way ("Áp dụng" sets the form field); Enter in the editor never submits the drawer.
- [x] 1.18 Đợt thanh toán tab: "Bảng tổng hợp" view — one table of đợt / lần like the Excel export (running còn lại, totals in the footer) with row actions (thêm lần, sửa, xoá).
