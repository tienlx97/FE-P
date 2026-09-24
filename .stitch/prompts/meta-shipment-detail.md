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
- Chi phí tab re-checked line by line against `shipment-cost-lines-fields.jsx`:
  "Thêm chi phí" + totals share one toolbar above the table (not a summary
  bar below it), column widths match the code, STT runs across groups, group
  header rows only fill the group and Số tiền cells, "Chưa phân loại" sorts
  last, empty text "Chưa có khoản chi phí nào", and an edit-mode variant lists
  each cell's real input and placeholder.

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

## Nhóm chi phí LOG-01 → LOG-08

Fixed catalog (business decision 2026-09-24, BE-kt-xnk
`add-shipment-cost-log-groups`). Sources: `ShipmentCostCategory.Groups` and
`docs/api/ShipmentCostCategories.md` (BE-kt-xnk), `db/sample-data.sql` cost
item templates (BE-kt-xnk), `config/shipments-table.js` (list column
headers), `docs/shipment-journey-incoterms.md` (journey milestones).

- 8 groups only: no create or delete through the API. `Code` never changes;
  `Name` (max 200) and `Note` (max 500) are editable via
  `PUT /api/v1/shipment-cost-categories/{id}`. The seeded `Note` is empty for
  all 8, so the select shows no second line until someone adds one.
- Stable ids `4c4f4700-0000-0000-0000-00000000000N` (N = the LOG number).
- `GET` returns all 8, sorted by `code`. The UI labels them "LOG-0x · Name".

| Code | Tên nhóm (Name) | Header cột trên danh sách | Mốc hành trình | Khoản chi phí mẫu (templates) |
|---|---|---|---|---|
| LOG-01 | Packing & Export Preparation | Packing & Exp. Prep | 01 Hàng sẵn sàng | Kit đóng hàng |
| LOG-02 | Origin Inland Transportation & Depot | Inland Trans. (Origin) | 02 Vận chuyển ra cảng | Phí kéo container, Vận chuyển nội địa, Phí lưu kho, Nâng cont rỗng, Detention đầu xuất*, Sửa chữa container đầu xuất* |
| LOG-03 | Origin Port & Export Charges | Origin Port Charges | 03 Cảng xuất, 04 Xếp hàng lên tàu | Phí THC, THC xuất, Hạ cont tại cảng, Phí hạ cont sớm, Seal, Phí chứng từ, Chứng từ, Telex, CSHT, Phí CO form D, Dịch vụ C/O, Khai C/O, Dịch vụ hải quan, Khai hải quan, Điện L/C, B/L amendment*, Demurrage tại cảng xuất* |
| LOG-04 | International Freight & Insurance | Int'l Freight & Ins. | 04 Xếp hàng lên tàu, 05 Hải trình biển | O/F, Vận chuyển quốc tế, Bảo hiểm |
| LOG-05 | Destination Port Charges | Dest. Port Charges | 06 Cảng đích, 10 Trả cont rỗng (DEM/DET) | D/O, Phí D/O, Storage cảng đích do chứng từ trễ* |
| LOG-06 | Destination Inland Transportation | Dest. Inland Trans. | 08 Vận chuyển nội địa | — (no template yet) |
| LOG-07 | Import Customs & Clearance | Import Custom Clearance | 07 Thông quan nhập khẩu | — (no template yet) |
| LOG-08 | Import Duty & Tax | Import Duty & Tax | — | Duty DDP |

\* Usually entered as **Abnormal** (incident cost). Everything else defaults
to **Standard**. "Sửa chữa container đầu xuất" is LOG-02 or LOG-03 depending
on where it happened; the template suggests LOG-02.

Classification examples from the user: O/F → LOG-04 Standard; THC xuất →
LOG-03 Standard; demurrage tại cảng xuất → LOG-03 Abnormal; D/O → LOG-05
Standard; Duty DDP → LOG-08 Standard.

Old free-form groups were migrated by name prefix: O/F, Insurance → LOG-04;
Port…, Customs… → LOG-03; Trucking…, Warehouse… → LOG-02; Duty… → LOG-08;
anything else → LOG-03 (to be reclassified by hand).

On the Meta shipment list ("Giá trị & Chi phí" view) each group is its own
column; LOG-04 (usually the largest) is semibold ink, the others muted, and
the per-group totals row is bold amber.

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
   "Lô thép cuộn đợt 1 • Dự án Nhà máy thép Dung Quất • Incoterm DDP 2020".
   Right side: secondary button "Chỉnh sửa" (pencil icon) and ghost "…" more menu.
3. Tab bar under the header: "Tổng quan" | "VGM" (count "4") | "Chi phí" (count "15").
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

CONTENT: one full-width card, title "Chi phí Logistics" (16px bold, short 4px cobalt bar).
All amounts are VND only — there is no currency selector anywhere in this tab.

1. TOOLBAR (one row directly above the table, no background):
   - Left: secondary small button "Thêm chi phí" (text only, no icon).
   - Right, same row, gap 12px: muted "Trong đó Abnormal: 13,000,000 đ", then semibold ink
     "Tổng chi phí: 172,650,000 đ". The Abnormal text only appears when the Abnormal total > 0;
     both totals are hidden when there are no cost lines.

2. TABLE — compact density, full grid lines (hairline #e4e6eb on every cell), edge-to-edge in the
   card, header row bg #faf8ff with muted 12px semibold headers. Columns and widths:
   STT (48px, centered) | Nhóm chi phí (320px) | Tên khoản chi phí (flexible, min 180px) |
   Số tiền (160px, right-aligned) | Cost Nature (150px) | Ghi chú (300px) |
   Nhà cung cấp (300px) | Số hoá đơn (180px) | actions (48px, no header: ghost trash icon,
   tooltip "Xoá").
   Total table width exceeds the card at 1440px → the table scrolls horizontally inside the card.

3. GROUPING — rows are grouped under the FIXED logistics cost groups, ordered by code
   (LOG-01 → LOG-08); only groups that have lines are shown. Each GROUP HEADER row (bg #f2f3fe):
   - Nhóm chi phí cell: "LOG-0x · Group name" semibold muted + tiny ghost "+" icon button
     (tooltip "Thêm dòng vào nhóm này").
   - Số tiền cell: group subtotal, semibold tabular.
   - Every other cell of the header row is empty (no STT, no Cost Nature, no trash).
   STT numbers only real cost lines and runs continuously 1, 2, 3 … across all groups
   (it does NOT restart per group).
   The 8 fixed groups (use the exact English names) and typical line items in each:
   - LOG-01 Packing & Export Preparation — Kit đóng hàng.
   - LOG-02 Origin Inland Transportation & Depot — Phí kéo container, Vận chuyển nội địa,
     Phí lưu kho, Nâng cont rỗng; Abnormal: Detention đầu xuất, Sửa chữa container đầu xuất.
   - LOG-03 Origin Port & Export Charges — THC xuất, Hạ cont tại cảng, Seal, Phí chứng từ,
     Telex, CSHT, Khai C/O, Khai hải quan, Điện L/C; Abnormal: Demurrage tại cảng xuất,
     B/L amendment.
   - LOG-04 International Freight & Insurance — O/F, Vận chuyển quốc tế, Bảo hiểm.
   - LOG-05 Destination Port Charges — D/O; Abnormal: Storage cảng đích do chứng từ trễ.
   - LOG-06 Destination Inland Transportation — trucking from the destination port to site.
   - LOG-07 Import Customs & Clearance — import customs clearance at destination.
   - LOG-08 Import Duty & Tax — Duty DDP.

4. SAMPLE DATA — all 8 groups, 15 lines (DDP shipment, so the seller pays every leg).
   Line format: STT "Tên khoản chi phí" · Số tiền · Cost Nature · Ghi chú · Nhà cung cấp · Số hoá đơn
   - "LOG-01 · Packing & Export Preparation" — subtotal "1,800,000 đ":
     1 "Kit đóng hàng" · 1,800,000 đ · Standard · — · — · —
   - "LOG-02 · Origin Inland Transportation & Depot" — subtotal "17,500,000 đ":
     2 "Phí kéo container" · 12,000,000 đ · Standard · — · Vận tải Hưng Thịnh · 0001498
     3 "Nâng cont rỗng" · 2,500,000 đ · Standard · — · — · —
     4 "Detention đầu xuất" · 3,000,000 đ · Abnormal · "Trả cont rỗng trễ 2 ngày" · Vận tải Hưng Thịnh · —
   - "LOG-03 · Origin Port & Export Charges" — subtotal "10,850,000 đ":
     5 "THC xuất" · 4,200,000 đ · Standard · — · Cảng Hải Phòng · 0001523
     6 "Seal" · 650,000 đ · Standard · — · — · —
     7 "Khai hải quan" · 1,500,000 đ · Standard · — · Đại Phát Logistics · 0001530
     8 "Demurrage tại cảng xuất" · 4,500,000 đ · Abnormal · "Tàu trễ 3 ngày" · Cảng Hải Phòng · —
   - "LOG-04 · International Freight & Insurance" — subtotal "85,200,000 đ":
     9 "O/F" · 82,000,000 đ · Standard · "HPH – LCH, 4×40'HC" · KMTC · —
     10 "Bảo hiểm" · 3,200,000 đ · Standard · — · Bảo Việt · 0000872
   - "LOG-05 · Destination Port Charges" — subtotal "6,800,000 đ":
     11 "D/O" · 1,300,000 đ · Standard · — · — · —
     12 "Storage cảng đích do chứng từ trễ" · 5,500,000 đ · Abnormal · "B/L gốc về trễ 4 ngày" · — · —
   - "LOG-06 · Destination Inland Transportation" — subtotal "9,600,000 đ":
     13 "Trucking cảng Laem Chabang – công trình" · 9,600,000 đ · Standard · — · — · —
   - "LOG-07 · Import Customs & Clearance" — subtotal "2,400,000 đ":
     14 "Thông quan nhập khẩu" · 2,400,000 đ · Standard · — · — · —
   - "LOG-08 · Import Duty & Tax" — subtotal "38,500,000 đ":
     15 "Duty DDP" · 38,500,000 đ · Standard · — · — · —
   Cell styling (read-only view): name in ink; amount tabular, no decimals, "đ" suffix;
   Cost Nature as a small pill — "Standard" neutral, "Abnormal" amber; empty optional cells
   show "—" in subtle grey #8a8d91; Ghi chú truncated to one line.

5. STATES (as variants)
   - Uncategorized: a line with no group yet sits under a LAST group header "Chưa phân loại"
     (after LOG-08), with its own "+" and subtotal.
   - Empty: no table, no totals — just the "Thêm chi phí" button and muted text
     "Chưa có khoản chi phí nào".
   - Edit mode (after "Chỉnh sửa"): the same grid with inline inputs in each cell —
     Nhóm chi phí = searchable select, placeholder "Chọn nhóm LOG", each option "LOG-0x · Name"
     with the group's note as a muted second line when one is set (all notes are empty by default); Tên khoản chi phí = text input, placeholder
     "Ví dụ: O/F, THC xuất, D/O"; Số tiền = small number input with "đ" suffix;
     Cost Nature = select with two options, each with a description line:
     "Standard — Chi phí thông thường (O/F, THC, D/O…)",
     "Abnormal — Phát sinh bất thường (demurrage, detention, lưu kho…)";
     Ghi chú = one-row textarea, placeholder "Ghi chú (không bắt buộc)";
     Nhà cung cấp = searchable clearable select, placeholder "Chưa xác định";
     Số hoá đơn = text input, placeholder "Không bắt buộc".
```
