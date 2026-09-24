# Commission detail page

## Why
The contract's "Hoa hồng" tab had grown into the whole commission workspace
(KPIs, broker, bank, installments, payment history, annexes). Users want the
tab to stay a quick glance and the details on their own page.

## Scope and behavior
- New page `/logistics/contract/[id]/commission` (one commission per
  contract): breadcrumb back to the contract's Hoa hồng tab, a header card
  (code, broker, signing state, "Chỉnh sửa" → the Meta commission drawer,
  "+ Thao tác": Thêm lần chi / Thêm phụ lục / Mở hợp đồng) and three tabs
  kept in `?tab=`:
  - Tổng quan — KPI cards (Hoa hồng quyết toán / Đã chi trả / Còn phải chi),
    broker and beneficiary bank.
  - Tiến độ thanh toán — "Đợt chi hoa hồng" and "Lịch sử thanh toán".
  - Phụ lục — the inline-editable commission annex list.
- The contract's "Hoa hồng" tab shows only the KPI cards and the broker, with
  "Xem chi tiết hoa hồng"; without a commission it keeps the empty state.
- The commission list's "Xem" opens the new page.

## Backend dependency
None — same endpoints as the tab.

## Verification
Browser check on 26KCT14 (tab, three detail tabs, drawer) and the harness.
