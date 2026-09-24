# Stitch prompt — Danh sách Shipment (Meta theme)

Prompt for Google Stitch that designs the `/logistics/shipments` list screen
in the Meta design system. Built from the current screen
(`src/features/logistics-contracts/components/shipments-list.jsx`,
`config/shipments-table.js`): default and optional columns, filters, the 8
shipment statuses, FCL/LCL types, totals row, pagination and row actions.
Sample values follow the real data formats (`26KCT34/LOT-01`,
`26KCT33/LCL-01`, "2 Cont", "1 Kiện", booking `KMTCVN01154082`). Counts and
money totals are illustrative.

## How it was run (2026-09-23)

| | |
|---|---|
| Stitch project | `6957224641630765183` ("Contract Management System") |
| Design system | `assets/0e1589aef5b0498b82ff40927567eb2d` — "Optimistic VF Commerce & Hardware" (Meta, cobalt `#0064E0`) |
| Device | `DESKTOP` |
| Result screen | `ce5214397385405abf508c9511d035d7` — "Danh sách Shipment (Meta FB Theme)" |
| Saved output | `.stitch/designs/meta-shipments-list.png`, `.stitch/designs/meta-shipments-list.html` |

Pass the design system explicitly: the project's default theme is the old
Maritime one, so leaving it out generates a Maritime screen.

## Prompt

```text
Design a desktop web app screen (1440px wide) for an import/export logistics ERP: the "Shipment" list page. All UI copy is Vietnamese — use the exact strings below. Style: the "Meta" design system — "Optimistic VF Commerce & Hardware": clean, flat, airy, hairline borders, pill-shaped controls, cobalt accent. No gradients, no heavy shadows.

DESIGN TOKENS
- Font: Inter (400/500/600/700), tabular numbers for all figures.
- Colors: accent / primary buttons #0064E0 (hover #1876F2, pressed #004DB0); text #1C1E21; secondary text #65676B; subtle text #8A8D91; hairline border #DEE3E9; page background #FAF8FF; cards/table #FFFFFF; muted bands (filter bar, table header) #FAF8FF; blue wash #E7F0FF (border #DBEAFE); totals row #F0F5FF; group header band #F4F7FC; row hover #F8FAFF.
- Status tones: emerald text #047857 on #ECFDF5 (border #A7F3D0); blue #0064E0 on #E7F0FF; amber #B45309 on #FFFBEB (border #FDE68A); indigo #4338CA on #EEF2FF; neutral #1C1E21 on #F1F3F6; muted #8A8D91 on #F2F3FE.
- Shape: buttons, tabs, badges, search = fully rounded pills; the main workspace card = 16px radius; inputs 8px. Flat: 1px #DEE3E9 borders; only a faint 0 1px 2px rgba(0,0,0,.05) on the workspace card.
- Type sizes: page title 24px bold; table header 12px bold uppercase, letter-spacing 0.05em, #65676B; table body 14px; pills 12px bold.

APP SHELL
- Top bar (64px, white, bottom hairline): left logo "DAI NGHIA GROUP"; right nav pills "Tin tức", "Tài liệu", "Logistics" (active: soft green pill), "Quản trị", a settings icon and an avatar "AC".
- Left sidebar (200px, white): section label "NGHIỆP VỤ" (11px uppercase, muted) with items "Hợp đồng", "Shipment" (active: pale pill background, bold), "Commission", "BOQ"; section "ĐỐI TÁC": "Khách hàng", "Nhà cung cấp"; section "DANH MỤC": "Quốc gia", "Cảng / Nơi".

PAGE HEADER (content area, 24px padding)
- Breadcrumb: "Logistics / Shipment".
- Row: title "Danh sách Shipment" + a small blue-wash count pill with a dot "128 lô hàng". Right side: outlined pill button "Xuất Excel" (download icon, chevron), primary cobalt pill button "+ Thêm Shipment".

WORKSPACE CARD (white, 16px radius, hairline border) containing:
1) Status tab row (pill tabs with count badges; selected tab = solid cobalt pill with white text and translucent-white count): "Tất cả 128" (selected), "Đã book 6", "Đang đóng hàng 4", "Hạ bãi chờ xuất 3", "Shipping 9", "Đã giao đến cảng 5", "Khai HQ 2", "Trucking đến site 1", "Đã hoàn thành 98". Right end of this row: label "CHẾ ĐỘ BẢNG:" + segmented control "Cơ bản" / "Giá trị & Chi phí" (second selected).
2) Filter bar (muted band #FAF8FF): wide pill search input with search icon, placeholder "Tìm mã, tên lô hàng, số hợp đồng, booking…", a funnel icon button at its end ("Bộ lọc nâng cao"); then compact pill dropdowns "Loại hình: Tất cả" (FCL / LCL), "Forwarder: Tất cả", "Ngày khai HQ: Tất cả"; a ghost "Đặt lại" button with reset icon; "Tuỳ chọn hiển thị" dropdown; a refresh icon button.
3) Data table (full width, sticky header, horizontal scroll, row height 52px, hairline row dividers, sticky right action column). Grouped header band (#F4F7FC) above money columns: "GIÁ TRỊ" spanning the value columns, "CHI PHÍ" over logistics cost.
   Columns (left→right):
   - "NGÀY KHAI HQ" (dd/mm/yyyy, secondary text)
   - "MÃ" (cobalt bold link, e.g. 26KCT34/LOT-01)
   - "SỐ HỢP ĐỒNG" (cobalt link, e.g. 26KCT34) with a second line in secondary text = project name
   - "LOẠI HÌNH" (small pill: FCL = blue wash, LCL = indigo wash)
   - "SỐ LƯỢNG" (e.g. "2 Cont", "1 Kiện")
   - "TÌNH TRẠNG" (status pill with a leading dot; tones: Đã book = blue, Đang đóng hàng = amber, Hạ bãi chờ xuất = indigo, Shipping = blue, Đã giao đến cảng = indigo, Khai HQ = amber, Trucking đến site = blue, Đã hoàn thành = emerald)
   - "BOOKING" (tabular, e.g. KMTCVN01154082; "—" when empty)
   - "FORWARDER" (e.g. XPO GLOBAL, SUPER CARGO SERVICE CO., LTD, QUỐC TẾ CHÍ THÀNH)
   - "GIÁ TRỊ TỜ KHAI" (right-aligned, e.g. 163,090.00 USD)
   - "GIÁ TRỊ TỜ KHAI (VNĐ)" (right-aligned, e.g. 4,151,941,000 đ)
   - "CHI PHÍ LOGISTICS" (right-aligned, e.g. 38,500,000 đ)
   - "VGM" (right-aligned count, e.g. 2, or a muted "0" chip)
   - "THAO TÁC" (sticky right; icon buttons: eye "Xem", pencil "Sửa", trash "Xoá" in muted gray, cobalt on hover)
   First body row: a totals row with #F0F5FF background, bold cobalt label "Σ TỔNG CỘNG (128 LÔ HÀNG)" spanning the leading columns, bold totals under the money columns (e.g. 4,897,685.64 USD / 108,131,176,875.83 đ / 1,250,400,000 đ) and total VGM.
   Show 10 realistic rows mixing FCL/LCL and different statuses, e.g.:
   26KCT34/LOT-01 · 26KCT34 · WH(77.4x65.7) · FCL · 2 Cont · Đã hoàn thành · KMTCVN01154082 · XPO GLOBAL
   26KCT33/LCL-01 · 26KCT33 · STEEL STRUCTURE · LCL · 1 Kiện · Khai HQ · BKBKK2607336 · SUPER CARGO SERVICE CO., LTD
   26KCT39/LOT-02 · 26KCT39 · CARIBOO GOLD - PO#1125 · FCL · 3 Cont · Shipping · MAEU240918771 · QUỐC TẾ CHÍ THÀNH
4) Footer bar (inside the card, top hairline): left "Hiển thị 1–25 trong tổng số 128 lô hàng" (numbers in small neutral chips); right: page-size pill dropdown "25 dòng / trang", pagination with chevrons and page pills (current page = solid cobalt circle).

STATES / DETAILS
- Row hover #F8FAFF; selected sort column header shows a small cobalt arrow.
- Money and dates use tabular figures; long project names truncate with ellipsis.
- Keep generous whitespace, 24px page padding, 12px gaps between toolbar controls.
```

## Differences from the current screen (added for the Meta design)

The live `/logistics/shipments` page does not have these yet; they bring it in
line with the Meta contract list. Drop the matching lines to mirror today's
screen exactly:

- Status pill tabs with counts (today: a "Lọc theo tình trạng" selector).
- "Cơ bản / Giá trị & Chi phí" table-mode switch.
- Quick filters "Loại hình", "Forwarder", "Ngày khai HQ".
- Project name as a second line under "Số hợp đồng".

## Issues in the generated screen

- Forwarder, the three money columns and VGM are in the HTML but sit in the
  horizontal scroll, so they are missing from the screenshot (and the totals
  row shows no figures there).
- The status tab row overflows; "Đã hoàn thành" is cut off.
- Stitch added things not in the prompt: a "Logistics v4.2" pill, a bell
  icon, an "EDI Hải quan VN" card in the sidebar, a "đồng bộ thời gian thực"
  note under the card, a "128 records" pill in the totals row, and a doubled
  "+ + Thêm Shipment" label.

### Suggested follow-up edit prompt

```text
Keep the design system and layout. Fixes:
1) Make all table columns fit or visibly scroll: show FORWARDER, GIÁ TRỊ TỜ KHAI, GIÁ TRỊ TỜ KHAI (VNĐ), CHI PHÍ LOGISTICS and VGM in view (tighten the date/code/type columns, truncate forwarder names), and fill the Σ TỔNG CỘNG row with the money totals under those columns.
2) Let the status tab row wrap to a second line (or scroll horizontally with a fade) so "Đã hoàn thành 98" is fully visible.
3) Remove: the "Logistics v4.2" pill, the bell icon, the "EDI Hải quan VN" sidebar card, the bottom sync note, and the "128 records" pill in the totals row.
4) Primary button: a plus icon followed by the text "Thêm Shipment" (no extra "+" character in the text).
```
