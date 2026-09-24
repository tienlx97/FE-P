# Stitch prompt — Chi tiết Shipment (Meta theme)

Prompts for Google Stitch that design the Shipment detail page, with three
tabs (Tổng quan / VGM / Chi phí), in the Meta design system. Built from the
current shipment dialog
(`src/features/logistics-contracts/components/shipment-form-dialog.jsx`,
`shipment-fields.jsx`, `shipment-booking-fields.jsx`,
`shipment-lot-fields.jsx`, `shipment-vgm-section.jsx`,
`shipment-vgm-fields.jsx`, `shipment-cost-lines-fields.jsx`) and the
`config/shipment-*.js` option lists. The page shell (breadcrumb, header card,
tab bar) follows the Meta contract detail page
(`src/shared/components/custom/meta/contract-header-card.jsx`, `tab-nav.jsx`).

Differences from the dialog:
- Tab names: the dialog uses "Thông tin" / "VGM" / "Chi phí Logistics"; this
  page uses "Tổng quan" / "VGM" / "Chi phí", and "Chi phí Logistics" becomes
  the card title in the Chi phí tab.
- The dialog uses one form for both view and edit. This page shows read-only
  label-above-value items with a "Chỉnh sửa" button, and the Chi phí table
  shows text values instead of inputs.
- The header, breadcrumb, tab count pills and the invoice / tờ khai / tỷ giá
  value strip come from the Meta contract detail page, not the dialog.
- Sample data is illustrative. The VGM formulas match the code:
  G.W = Net weight + Khối lượng bao bì, VGM = G.W + Tare.

Stitch generates one screen per prompt: paste the shared shell at the top of
each tab prompt. Pass the Meta design system
(`assets/0e1589aef5b0498b82ff40927567eb2d`) explicitly — the project's default
theme is the old Maritime one (see `meta-shipments-list.md`).

## Shared shell (paste at the top of every tab prompt)

```text
Design a desktop DETAIL PAGE for one Shipment in a B2B import–export contract management web app
(Vietnamese UI), 1440px wide. Read-only view of a saved shipment. Clean, flat, minimalist-modern
enterprise style — Meta/Facebook business-tool feel ("Meta theme").

THEME
- Page bg #faf8ff, cards #ffffff with 1px hairline #dee3e9, radius 12px, no heavy shadows.
- Accent cobalt #0064e0 (hover #1876f2), text #1c1e21 / #65676b, inner dividers #e4e6eb,
  success #1f883d (pill bg #e8f5e9), error #ba1a1a. Inter-like geometric sans, body 14px,
  tabular numbers everywhere. 4px spacing grid, 24px page gutters, 16px card gaps.
- Numbers in Vietnamese format (dot thousands, comma decimals), dates dd/mm/yyyy.

PAGE SHELL (same on every tab)
1. Breadcrumb: "← Hợp đồng 26KCT34" link (muted) › "26KCT34/LOT-01" (bold).
2. Header card: first row — shipment code "26KCT34/LOT-01" (24px bold) + copy icon button + pill
   "FCL" (cobalt tint #e8f1ff) + status pill "Hạ bãi chờ xuất" (cobalt). Second row, muted:
   "Lô thép cuộn đợt 1 • Dự án Nhà máy thép Dung Quất • Incoterm CIF 2020".
   Right side: secondary button "Chỉnh sửa" (pencil icon) and ghost "…" more menu.
3. Tab bar under the header: "Tổng quan" | "VGM" (count pill "4") | "Chi phí" (count pill "7").
   Active tab = cobalt text + 2px cobalt underline; inactive #444950. Hairline under the bar.
```

## Tab 1 — Tổng quan

```text
[paste PAGE SHELL] Active tab: "Tổng quan".

CONTENT: two stacked cards, each with a card title row (short 4px cobalt bar + 16px bold title)
and a read-only label-above-value grid (label 12px muted, value 14px #1c1e21, "—" when empty,
hairline under each item).

Card "Thông tin Book" — 3-column grid:
Forwarder "Công ty TNHH Đại Phát Logistics" · Số booking "KMTCVN01154082" · Số B/L "KMTCHPH0456789" ·
Line tàu "KMTC" · Tên tàu "KMTC JAKARTA // 2604S" · ETD "02/10/2026" · ETA "12/10/2026" ·
Cảng/nơi xếp hàng "Hải Phòng (VNHPH)" · Cảng/nơi đến "Laem Chabang (THLCH)".
Sub-group divider "Hải quan & C/O":
Mã C/O "VN-TH 26/01/0452" · Ngày khai C/O "28/09/2026" · Ngày có C/O "30/09/2026" ·
Số tờ khai "305123456780" · Ngày khai "29/09/2026" · Bị kiểm hoá: red-tinted pill "Có"
(or neutral "Không").

Card "Thông tin lô hàng" — 3-column grid:
Tên lô hàng "Thép cuộn cán nóng – đợt 1" · Loại hình "FCL" · Điều kiện thanh toán "L/C" ·
Tình trạng: status pill "Hạ bãi chờ xuất" · Số lượng "4 Cont" · Khối lượng tờ khai "98.450,00 kg".
Highlighted value strip (bg #f0f5ff, radius 8px, 3 figures, bold 18px tabular):
"Giá trị invoice 412.500,00 USD" · "Giá trị tờ khai 412.500,00 USD" · "Tỷ giá tờ khai 25.380 đ".
```

## Tab 2 — VGM

```text
[paste PAGE SHELL] Active tab: "VGM".

CONTENT: one full-width card.
- Card header: title "VGM" (16px bold) with count pill "4"; right side primary small button
  "+ Thêm VGM".
- Edge-to-edge dense table (no card-wrapped rows), header bg #faf8ff, muted 12px headers,
  row height 48px, row hover #f8faff, right-aligned tabular numbers for kg columns:
  Số thứ tự | Nhà vận chuyển | Ngày đóng hàng | Loại cont | Tên cont | Tên seal |
  Max gross (kg) | Tare (kg) | G.W (kg) | VGM (kg) | actions (ghost pencil + ghost trash).
  4 sample rows, e.g. "1 · Vận tải Hưng Thịnh · 25/09/2026 · 40'HC · KMTU7412356 · SL0098213 ·
  32.500,00 · 3.900,00 · 24.612,50 · 28.512,50". Loại cont values from 20' / 40' / 40'HC / 45'.
- Footer total row (bold, top hairline, bg #f0f5ff): "Tổng cộng" under Nhà vận chuyển, then
  totals for Max gross, Tare, G.W, VGM.
- Empty-state variant: muted "Chưa có bản ghi VGM" centered with the "+ Thêm VGM" button.
- Delete-confirm variant: small dialog "Xoá VGM KMTU7412356?" / "Hành động này không thể hoàn tác."
  with "Huỷ" and red "Xoá".
```

## Tab 3 — Chi phí

```text
[paste PAGE SHELL] Active tab: "Chi phí".

CONTENT: one full-width card "Chi phí Logistics".
- Card header: title + right side secondary small button "+ Thêm chi phí".
- Dense grouped table, edge-to-edge, hairline grid. Columns:
  STT | Nhóm chi phí | Tên khoản chi phí | Số tiền (right-aligned, "đ" suffix) | Ghi chú |
  Nhà cung cấp | Số hoá đơn | actions (ghost trash).
- Rows grouped by cost category. Each GROUP HEADER row: bg #f2f3fe, category name semibold muted
  ("Phí cảng", "Vận chuyển nội địa", "Chứng từ"), a tiny ghost "+" icon button next to it
  ("Thêm dòng vào nhóm này"), and the group subtotal in the Số tiền column, bold
  (e.g. "8.450.000 đ"). Under each header 2–3 item rows, e.g. "Phí THC · 4.200.000 đ ·
  Cảng Hải Phòng · HĐ 0001523", "Phí D/O · 850.000 đ", "Trucking HP – nhà máy · 12.000.000 đ ·
  Vận tải Hưng Thịnh". Empty optional cells show "—".
- Summary bar under the table (bg #f0f5ff, radius 8px, right-aligned):
  "Tổng chi phí: 36.780.000 đ" (18px bold, tabular).
```
