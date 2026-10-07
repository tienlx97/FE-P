# Proposal: Costs paid on behalf by a supplier ("chi hộ")

**Status:** done
**Created:** 2026-10-07

## Why

User (2026-10-07): some logistics fees (lifting the empty container,
dropping the laden one…) are collected by the port but paid by a supplier
on our behalf ("CHI HỘ"); we pay the supplier back later. "Tôi muốn quản lý
thêm việc này, để biết nhà cung cấp đó đã CHI HỘ bao nhiêu." Plan accepted
as proposed ("làm như bạn đề xuất"): reimbursement per line (bulk-markable),
the invoice fields hold the collector's invoice, a line is fully paid on
behalf or not. Backend: BE-P `shipment-cost-paid-on-behalf` (658e2cf,
160da3b).

## What changes

- Cost line drawer: "NCC chi hộ" switch; on → "Đơn vị thu" field, provider
  required, invoice labelled as the collector's. Picking a recommended fee
  with `defaultPaidOnBehalf` turns it on. The fields round-trip through
  every shipment save (shipment editor, cost drawer, delete).
- Shipment cost table: "Chi hộ" token on those lines; totals split into
  service vs paid on behalf (shipment total unchanged).
- Supplier detail: "Chi hộ" tab — Tổng chi hộ / Đã hoàn trả / Còn phải trả,
  lines across shipments filtered by period and status, select lines →
  "Đánh dấu đã hoàn trả" (date + reference) or clear, Excel export.
- Supplier list: "Chi hộ chưa hoàn" column from `on-behalf-totals`.

## Out of scope

- Payment vouchers grouping lines; partial on-behalf amounts.
