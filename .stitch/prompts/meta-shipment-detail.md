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

Updated 2026-09-24 for the latest UI changes:
- Chi phí: cost groups are now the fixed LOG-01 … LOG-08 catalog, shown as
  "LOG-0x · Name" and sorted by code; there is no "add cost group" action any
  more. Each cost line has a new "Cost Nature" field (Standard / Abnormal), and
  the total line adds "Trong đó Abnormal: …".
- Money: the app formats numbers en-US (`formatMoney` → "412,500.00",
  `formatVndAmount` → "85,200,000 đ" with no forced decimals), not Vietnamese
  dot-thousands. Dates stay dd/mm/yyyy.
- Status pills use the Meta list tones (`metaToneForShipmentStatus`):
  Đang đóng hàng / Khai HQ = amber, Hạ bãi chờ xuất / Trucking đến site =
  indigo, Shipping / Đã giao đến cảng = cobalt, Đã hoàn thành = emerald,
  Đã book = neutral. Amber tokens: wash #fffbeb, border #fde68a, text #b45309.
- Record codes (shipment, contract) render as semibold cobalt links.

Differences from the dialog:
- Tab names: the dialog uses "Thông tin" / "VGM" / "Chi phí Logistics"; this
  page uses "Tổng quan" / "VGM" / "Chi phí", and "Chi phí Logistics" becomes
  the card title in the Chi phí tab.
- The dialog uses one form for both view and edit. This page shows read-only
  label-above-value items with a "Chỉnh sửa" button, and the Chi phí table
  shows text values instead of inputs (Cost Nature as a pill: Standard
  neutral, Abnormal amber — a presentation choice, the dialog uses a select).
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
- Accent cobalt #0064e0 (hover #1876f2), text #1c1e21 / #65676b, subtle text #8a8d91,
  inner dividers #e4e6eb, error #ba1a1a.
- Pill tones (fully rounded, 1px border, 12px semibold):
  cobalt (bg #e8f1ff, border rgba(0,100,224,0.2), text #0064e0),
  indigo (bg #eef2ff, border #c7d2fe, text #4f46e5),
  amber (bg #fffbeb, border #fde68a, text #b45309),
  emerald (bg #ecfdf5, border #a7f3d0, text #047857),
  neutral (bg #f1f3f6, border #dee3e9, text #65676b).
- Inter-like geometric sans, body 14px, tabular numbers everywhere. 4px spacing grid,
  24px page gutters, 16px card gaps.
- Number format is en-US: foreign-currency amounts "412,500.00 USD", weights "98,450.00 kg",
  VND amounts without decimals "85,200,000 đ". Dates dd/mm/yyyy.

PAGE SHELL (same on every tab)
1. Breadcrumb: "← Hợp đồng 26KCT34" (semibold cobalt link) › "26KCT34/LOT-01" (bold ink).
2. Header card: first row — shipment code "26KCT34/LOT-01" (24px bold) + copy icon button +
   cobalt pill "FCL" + indigo status pill "Hạ bãi chờ xuất". Second row, muted:
   "Lô thép cuộn đợt 1 • Dự án Nhà máy thép Dung Quất • Incoterm CIF 2020".
   Right side: secondary button "Chỉnh sửa" (pencil icon) and ghost "…" more menu.
3. Tab bar under the header: "Tổng quan" | "VGM" (count "4") | "Chi phí" (count "9").
   Active tab = cobalt text + 2px cobalt underline, its count on a filled cobalt pill with white
   text; inactive tabs #444950 with neutral count pills. Hairline under the bar.
```

## Tab 1 — Tổng quan

```text
[paste PAGE SHELL] Active tab: "Tổng quan".

CONTENT: two stacked cards, each with a card title row (short 4px cobalt bar + 16px bold title)
and a read-only label-above-value grid (label 12px muted, value 14px #1c1e21, "—" in subtle
grey when empty, hairline under each item).

Card "Thông tin Book" — 3-column grid:
Forwarder "Công ty TNHH Đại Phát Logistics" · Số booking "KMTCVN01154082" · Số B/L "KMTCHPH0456789" ·
Line tàu "KMTC" · Tên tàu "KMTC JAKARTA // 2604S" · ETD "02/10/2026" · ETA "12/10/2026" ·
Cảng/nơi xếp hàng "Hải Phòng (VNHPH)" · Cảng/nơi đến "Laem Chabang (THLCH)".
Sub-group divider "Hải quan & C/O":
Mã C/O "VN-TH 26/01/0452" · Ngày khai C/O "28/09/2026" · Ngày có C/O "30/09/2026" ·
Số tờ khai "305123456780" · Ngày khai "29/09/2026" · Bị kiểm hoá: amber pill "Có"
(or neutral pill "Không").

Card "Thông tin lô hàng" — 3-column grid:
Tên lô hàng "Thép cuộn cán nóng – đợt 1" · Loại hình: cobalt pill "FCL" ·
Điều kiện thanh toán "L/C" · Tình trạng: indigo pill "Hạ bãi chờ xuất" · Số lượng "4 Cont" ·
Khối lượng tờ khai "98,450.00 kg".
Highlighted value strip (bg #ebf3fe, radius 8px, 3 figures, label 12px muted uppercase,
value bold 18px tabular cobalt):
"GIÁ TRỊ INVOICE 412,500.00 USD" · "GIÁ TRỊ TỜ KHAI 412,500.00 USD" · "TỶ GIÁ TỜ KHAI 25,380 đ".
```

## Tab 2 — VGM

```text
[paste PAGE SHELL] Active tab: "VGM".

CONTENT: one full-width card.
- Card header: title "VGM" (16px bold) with neutral count pill "4"; right side primary small
  button "+ Thêm VGM".
- Edge-to-edge dense table (no card-wrapped rows), header bg #faf8ff, muted 12px headers,
  row height 48px, row hover #f8faff, right-aligned tabular numbers for kg columns:
  Số thứ tự | Nhà vận chuyển | Ngày đóng hàng | Loại cont | Tên cont | Tên seal |
  Max gross (kg) | Tare (kg) | G.W (kg) | VGM (kg) | actions (ghost pencil + ghost trash).
  4 sample rows, e.g. "1 · Vận tải Hưng Thịnh · 25/09/2026 · 40'HC · KMTU7412356 · SL0098213 ·
  32,500.00 · 3,900.00 · 24,612.50 · 28,512.50". Loại cont values from 20' / 40' / 40'HC / 45'.
- Footer total row (bold, top hairline, bg #ebf3fe): "Tổng cộng" under Nhà vận chuyển, then
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
  STT | Nhóm chi phí (320px) | Tên khoản chi phí | Số tiền (right-aligned) | Cost Nature (150px) |
  Ghi chú | Nhà cung cấp | Số hoá đơn | actions (ghost trash).
- Rows grouped by the FIXED logistics cost groups, ordered by code. Each GROUP HEADER row:
  bg #f2f3fe, "LOG-0x · Group name" semibold muted, a tiny ghost "+" icon button next to it
  (tooltip "Thêm dòng vào nhóm này"), and the group subtotal in the Số tiền column, bold tabular.
  Show 4 groups with 2–3 item rows each, for example:
  - "LOG-02 · Origin Inland Transportation & Depot" — subtotal "14,500,000 đ":
    "Trucking nhà máy – cảng HP · 12,000,000 đ · Standard · Vận tải Hưng Thịnh · HĐ 0001498",
    "Nâng hạ depot · 2,500,000 đ · Standard".
  - "LOG-03 · Origin Port & Export Charges" — subtotal "9,350,000 đ":
    "THC xuất · 4,200,000 đ · Standard · Cảng Hải Phòng · HĐ 0001523",
    "Phí seal & VGM · 650,000 đ · Standard", "Lưu container quá hạn · 4,500,000 đ · Abnormal".
  - "LOG-04 · International Freight & Insurance" — subtotal "85,200,000 đ":
    "O/F HPH – LCH 4×40'HC · 82,000,000 đ · Standard · KMTC",
    "Bảo hiểm hàng hoá · 3,200,000 đ · Standard".
  - "LOG-05 · Destination Port Charges" — subtotal "6,800,000 đ":
    "D/O · 1,300,000 đ · Standard", "Demurrage 3 ngày · 5,500,000 đ · Abnormal".
  Item rows: name in ink, amount right-aligned tabular (no decimals, "đ" suffix),
  Cost Nature as a small pill — "Standard" neutral, "Abnormal" amber — empty optional cells "—".
- Summary bar under the table (bg #ebf3fe, radius 8px, right-aligned, one line):
  muted "Trong đó Abnormal: 10,000,000 đ" (amber #b45309 amount) then
  bold 18px "Tổng chi phí: 115,850,000 đ".
- Legend/help variant: hovering the Cost Nature header shows a tooltip —
  "Standard: Chi phí thông thường (O/F, THC, D/O…)" / "Abnormal: Phát sinh bất thường
  (demurrage, detention, lưu kho…)".
```
