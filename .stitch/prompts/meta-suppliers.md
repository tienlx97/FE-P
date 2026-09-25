# Stitch prompt — Nhà cung cấp: danh sách, chi tiết, thêm mới (Meta theme)

Prompts for Google Stitch that design the supplier catalog screens in the
Meta design system: the list, the detail page and the create drawer.

Built from:
- list — `components/suppliers-list.jsx`, `config/suppliers-table.js`
  (columns, search / filter fields, page sizes 10/25/50/100, expanded row
  with Xoá / In / Sửa nhà cung cấp);
- fields — `components/party-form-fields.jsx` (general block + 6 tabs:
  Thông tin liên hệ, Điều khoản thanh toán, Tài khoản ngân hàng, Địa chỉ
  khác, Ghi chú, Thông tin bổ sung) and `types/index.js` (`PartyProfile`);
- where a supplier is used — Forwarder / Đại lý hải quan / Đơn vị trucking
  (`shipment-booking-fields.jsx`), cost lines, VGM, commission broker
  (`commission-form-drawer.jsx`);
- theme — `src/shared/components/custom/meta/theme.js`, shell and pill
  tones copied from `meta-shipments-list.md` / `meta-shipment-detail.md`,
  drawer frame from `meta-shipment-edit-drawer.md`.

Design choices that are not in the current code:
- There is no supplier detail page yet (the list only expands a row), and
  create / edit is a 1040px `SupplierFormDialog`, not a drawer.
- Status tabs with counts, the "Vai trò" column and the stat strip on the
  detail page need data the supplier API does not return yet.
- "Lấy thông tin" from the tax code and the tab error dot are additions.

Sample data is illustrative (QUỐC TẾ CHÍ THÀNH is the broker on the test
commission HH-TEST-26KCT14). Pass the Meta design system
(`assets/0e1589aef5b0498b82ff40927567eb2d`) explicitly — the project's
default theme is the old Maritime one.

## Shared shell (paste at the top of every prompt)

```text
Desktop web app screen (1440px wide) for an import/export logistics ERP. All UI copy is Vietnamese — use the exact strings given. Style: the "Meta" design system — "Optimistic VF Commerce & Hardware": clean, flat, airy, hairline borders, pill-shaped controls, cobalt accent. No gradients, no heavy shadows.

DESIGN TOKENS
- Font: Inter (400/500/600/700), tabular numbers for all figures. Body 14px; notes, captions, table headers and pills 13px; nothing under 12px.
- Colors: accent / primary buttons #0064E0 (hover #1876F2, pressed #004DB0); text #1C1E21; secondary text #65676B; subtle text #8A8D91; hairline border #DEE3E9; inner dividers #E4E6EB; page background #FAF8FF; cards/table #FFFFFF; muted bands (filter bar, table header) #FAF8FF; blue wash #F0F5FF; row hover #F8FAFF; error #BA1A1A on #FFDAD6.
- Pill tones (fully rounded, 1px border, 12px semibold): cobalt (bg #E8F1FF, border rgba(0,100,224,0.2), text #0064E0); indigo (bg #EEF2FF, border #C7D2FE, text #4F46E5); amber (bg #FFFBEB, border #FDE68A, text #B45309); emerald (bg #ECFDF5, border #A7F3D0, text #047857); neutral (bg #F1F3F6, border #DEE3E9, text #65676B).
- Shape: buttons, tabs, badges, search = fully rounded pills; workspace card 16px radius; content cards 12px; inputs 8px, height 40px. Flat: 1px #DEE3E9 borders.
- Formats: en-US numbers ("10,000.00 USD", VND "500,000,000 đ"), dates dd/mm/yyyy, empty values "—".

APP SHELL
- Top bar (64px, white, bottom hairline): left logo "DAI NGHIA GROUP"; right nav pills "Tin tức", "Tài liệu", "Logistics" (active: soft green pill), "Quản trị", a settings icon and an avatar "AC".
- Left sidebar (200px, white): section label "NGHIỆP VỤ" (11px uppercase, muted) with "Hợp đồng", "Shipment", "Commission", "BOQ"; section "ĐỐI TÁC": "Khách hàng", "Nhà cung cấp" (active: pale pill background, bold); section "DANH MỤC": "Quốc gia", "Cảng / Nơi".
```

## 1 — Danh sách nhà cung cấp

```text
[paste SHARED SHELL] Screen: the "Nhà cung cấp" list page.

PAGE HEADER (content area, 24px padding)
- Breadcrumb: "Logistics / Nhà cung cấp".
- Row: title "Danh sách nhà cung cấp" (24px bold) + a small blue-wash count pill with a dot "86 nhà cung cấp". Right side: outlined pill button "Xuất Excel" (download icon, chevron), outlined pill icon button "In", primary cobalt pill button with a plus icon and the text "Thêm nhà cung cấp".

WORKSPACE CARD (white, 16px radius, hairline border) containing:
1) Group tab row (pill tabs with count badges; selected = solid cobalt pill, white text, translucent-white count): "Tất cả 86" (selected), "Forwarder 21", "Hãng tàu 9", "Đại lý hải quan 14", "Trucking 18", "Môi giới 6", "Khác 18".
2) Filter bar (muted band #FAF8FF): wide pill search with a search icon, placeholder "Tìm tên công ty, mã số thuế, điện thoại, người đại diện…", a funnel icon button at its end ("Bộ lọc nâng cao"); compact pill dropdowns "Loại đối tượng: Tất cả" (Tổ chức / Cá nhân), "Nội bộ: Tất cả"; ghost "Đặt lại" with reset icon; "Cột hiển thị" dropdown; refresh icon button.
3) Data table (full width, sticky header, row height 52px, hairline row dividers, sticky right action column). Header 13px bold uppercase, letter-spacing 0.05em, #65676B on #FAF8FF.
   Columns:
   - checkbox
   - "MÃ NCC" (tabular, secondary, e.g. NCC-0042)
   - "TÊN CÔNG TY" (14px semibold ink, UPPERCASE, truncate with ellipsis; second line 13px secondary = group name, e.g. "Forwarder")
   - "MÃ SỐ THUẾ/CCCD" (tabular)
   - "NGƯỜI ĐẠI DIỆN" (name; second line 13px secondary = Chức vụ, e.g. "Giám đốc")
   - "ĐIỆN THOẠI"
   - "ĐỊA CHỈ" (truncate)
   - "TRƯỜNG TÙY Ý" (neutral pill "+2", or "—")
   - "THAO TÁC" (sticky right; icon buttons eye "Xem", pencil "Sửa", printer "In", trash "Xoá" in muted gray, cobalt on hover)
   10 realistic rows, e.g.:
   NCC-0042 · CÔNG TY TNHH QUỐC TẾ CHÍ THÀNH · Môi giới · 0312345678 · Nguyễn Văn An / Giám đốc · 028 3822 1234 · 12 Nguyễn Huệ, Q.1, TP.HCM
   NCC-0017 · XPO GLOBAL VIỆT NAM · Forwarder · 0309876543 · Trần Thị Mai / Trưởng phòng XNK · 028 3930 5566 · 45 Lê Duẩn, Q.1, TP.HCM
   NCC-0031 · SUPER CARGO SERVICE CO., LTD · Forwarder · 0201234567 · — · 0225 374 1122 · 8 Lê Thánh Tông, Ngô Quyền, Hải Phòng
   NCC-0008 · CÔNG TY CP VẬN TẢI BIỂN SAO MAI · Trucking · 0400112233 · Lê Quốc Huy / Phó Giám đốc · 0236 365 8899 · KCN Hòa Khánh, Đà Nẵng
   Include at least one row with empty cells shown as "—".
   Row 2 is EXPANDED inline (row bg #F8FAFF, panel below it, padding 20px, top hairline):
   - left: 40×40 rounded tile (bg #E7F0FF, cobalt building icon), then "XPO GLOBAL VIỆT NAM" (17px bold uppercase) and under it "Trần Thị Mai · Trưởng phòng XNK" (secondary);
   - a 4-column label-over-value grid (label 13px secondary, value 14px ink, dotted underline): Tên công ty, Người đại diện, Chức vụ, Địa chỉ, Mã số thuế, Điện thoại, Website (cobalt link), Nhóm;
   - hairline, then a footer: ghost "Xoá" (trash icon) on the left; outlined pill "In" and primary cobalt pill "Sửa nhà cung cấp" on the right.
4) Footer bar (inside the card, top hairline): left "Hiển thị 1–25 trong tổng số 86 nhà cung cấp" (numbers in small neutral chips); right: pill dropdown "25 dòng / trang", pagination with chevrons and page pills (current = solid cobalt circle).

STATES (add as small secondary frames)
- 3 rows checked → a floating dark bulk bar at the bottom (#2E3038, white text, pill, shadow rgba(20,22,26,0.3) 0 1px 4px): "Đã chọn 3" · "Xuất Excel" · "Xoá" (red text) · "Bỏ chọn".
- Empty catalog: inside the card, centered 48px building icon in a blue-wash circle, "Chưa có nhà cung cấp nào" (16px semibold), "Thêm nhà cung cấp đầu tiên để chọn làm Forwarder, đại lý hải quan hoặc bên môi giới." (secondary), primary pill "Thêm nhà cung cấp".
- Delete confirm dialog: "Xoá nhà cung cấp?" / "“XPO GLOBAL VIỆT NAM” sẽ bị xoá vĩnh viễn. Không xoá được nếu nhà cung cấp đang gắn với Shipment, chi phí, VGM hoặc Commission." with "Huỷ" and a red "Xoá".
```

## 2 — Chi tiết nhà cung cấp

```text
[paste SHARED SHELL] Screen: the read-only DETAIL PAGE for one supplier.

1. Breadcrumb: "← Nhà cung cấp" (semibold cobalt link) › "NCC-0042" (bold ink).
2. Header card (white, 12px radius, hairline, padding 20px):
   - 48×48 rounded tile (bg #E7F0FF, cobalt building icon); name "CÔNG TY TNHH QUỐC TẾ CHÍ THÀNH" (24px bold) + copy icon button + neutral pill "Tổ chức" + cobalt pill "Môi giới".
   - Muted second row: "NCC-0042 • MST 0312345678 • 12 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM".
   - Right: outlined pill "In" (printer icon), outlined pill "Chỉnh sửa" (pencil), ghost "…" menu (Xoá nhà cung cấp in red).
3. Stat strip (4 white cards, 12px radius, hairline, gap 16px; label 13px secondary, value 20px bold tabular):
   "Shipment liên quan" 24 (sub: "Forwarder 18 · Trucking 6") · "Chi phí đã ghi nhận" "182,450,000 đ" · "Hoa hồng đã chi" "4,000.00 / 10,000.00 USD" with a thin cobalt progress bar at 40% · "Hạn mức công nợ" "500,000,000 đ" (sub: "Được nợ 30 ngày").
4. Tab bar: "Tổng quan" | "Liên hệ & hoá đơn" | "Tài khoản ngân hàng" (count "2") | "Địa chỉ" | "Shipment" (count "24") | "Commission" (count "1") | "Ghi chú & bổ sung". Active tab = cobalt text + 2px cobalt underline, count on a filled cobalt pill; inactive #444950 with neutral count pills. Hairline under the bar.

TAB "Tổng quan" (active) — 2 columns, gap 16px:
- Left (2/3), white cards with a title row (15px bold) + hairline:
  • "Thông tin chung" — 3-column label-over-value grid: Tên nhà cung cấp, Loại đối tượng "Tổ chức", Nhóm nhà cung cấp "Môi giới", Mã số thuế/CCCD chủ hộ "0312345678", Mã số ĐVQHNS "—", Điện thoại "028 3822 1234", Website "chithanh.com.vn" (cobalt link), Là đối tượng nội bộ "Không", Địa chỉ (full row).
  • "Điều khoản thanh toán" — 4-column grid: Điều khoản thanh toán "Thanh toán 30 ngày", Số ngày được nợ "30", Số nợ tối đa "500,000,000 đ", Tài khoản công nợ phải trả/thu "331".
- Right (1/3), stacked cards:
  • "Người liên hệ": "Anh Nguyễn Văn An" (semibold), email "an.nguyen@chithanh.com.vn" and phone "0903 123 456", each with a copy icon. Hairline, then "Đại diện theo pháp luật": "Nguyễn Văn An — Giám đốc".
  • "Nhận hoá đơn điện tử": "Phạm Thu Hà · 0912 345 678"; emails as neutral pills "ketoan@chithanh.com.vn", "ha.pham@chithanh.com.vn".
  • "Tài khoản ngân hàng": "0071 0012 34567" (tabular, semibold) / "Vietcombank · CN Sài Gòn · TP.HCM", then a cobalt link "+1 tài khoản khác".

ADD TWO SECONDARY FRAMES (same shell, other tabs active):
- "Shipment": dense table in a white card — "MÃ SHIPMENT" (cobalt link 26KCT34/LOT-01), "HỢP ĐỒNG" (cobalt link 26KCT34), "VAI TRÒ" (pill: Forwarder cobalt, Đại lý hải quan indigo, Đơn vị trucking neutral), "ETD", "ETA", "TÌNH TRẠNG" (status pill with dot: Đang đóng hàng / Khai HQ amber, Hạ bãi chờ xuất / Trucking đến site indigo, Shipping / Đã giao đến cảng cobalt, Đã hoàn thành emerald), "CHI PHÍ" (right-aligned VND). 6 rows, pagination footer.
- "Commission": one row per commission — "MÃ" (cobalt link HH-TEST-26KCT14), "HỢP ĐỒNG" 26KCT14, "TỔNG HOA HỒNG" 10,000.00 USD, "ĐÃ CHI" 4,000.00 USD, "CÒN LẠI" 6,000.00 USD, "TÌNH TRẠNG" amber pill "Chi một phần". Under it the "Tài khoản ngân hàng" tab empty state for a supplier without accounts: muted note "Nhà cung cấp chưa có tài khoản ngân hàng" + outlined pill "Thêm tài khoản".
```

## 3 — Thêm nhà cung cấp (drawer)

```text
[paste SHARED SHELL] Screen: a right-side DRAWER "Thêm nhà cung cấp" sliding in over the supplier list (list visible but dimmed, backdrop rgba(28,30,33,0.4)). Canvas 1440×900; show the drawer at the top, plus secondary frames for other tabs and the error state.

DRAWER FRAME
- Width 960px, full height, white, square corners, soft left-edge shadow. Three regions split by hairlines: fixed header, scrolling body on the muted canvas #FAF8FF, fixed footer.

HEADER (padding 16px)
- 40×40 rounded tile (bg #E7F0FF, cobalt building-plus icon), title "Thêm nhà cung cấp" (20px semibold), under it a muted line "Nhà cung cấp dùng cho Forwarder, đại lý hải quan, trucking và bên môi giới". Ghost "X" close button on the right.

BODY (padding 20px, white section cards, gap 16px). Each section header = short 4px cobalt bar + index and title 15px bold + hairline, with a pill or muted note on the right. Labels above fields; required fields end with a red "*"; optional ones show a muted "(Tuỳ chọn)". 2-column grid, gap 16px, unless noted.

Section 1 — "Thông tin chung" (right: cobalt pill "Bắt buộc")
- Row: "Mã số thuế/CCCD chủ hộ" with an outlined pill button "Lấy thông tin" (search icon) inside the field's right edge, value "0312345678" | "Mã số ĐVQHNS" (Tuỳ chọn).
- Row (3 columns): "Loại đối tượng" segmented pill control "Tổ chức" (selected, cobalt) / "Cá nhân" | "Điện thoại" "028 3822 1234" | "Website" placeholder "https://".
- Row: "Tên nhà cung cấp *" (full width) "CÔNG TY TNHH QUỐC TẾ CHÍ THÀNH".
- Row: "Nhóm nhà cung cấp" searchable select "Môi giới" with a clear x, plus a square 40px outlined "+" icon button beside it (tooltip "Thêm nhóm nhà cung cấp").
- "Địa chỉ" textarea (full width, 3 lines).
- Checkbox "Là đối tượng nội bộ".

Section 2 — "Thông tin chi tiết" (right: muted "Có thể bổ sung sau")
- Pill tab row: "Thông tin liên hệ" (selected, solid cobalt), "Điều khoản thanh toán", "Tài khoản ngân hàng", "Địa chỉ khác", "Ghi chú", "Thông tin bổ sung".
- "Thông tin liên hệ" content:
  Xưng hô "Anh" | Họ và tên "Nguyễn Văn An"
  Email "an.nguyen@chithanh.com.vn" | Số điện thoại "0903 123 456"
  Đại diện theo pháp luật "Nguyễn Văn An" | Chức vụ "Giám đốc"
  Người nhận hóa đơn điện tử "Phạm Thu Hà" | Số điện thoại nhận hóa đơn "0912 345 678"
  "Email nhận hóa đơn (ngăn cách bằng dấu ;)" full width; entered addresses shown as removable neutral pills.

FOOTER (padding 16px, white): left muted hint with a dot "Chưa lưu thay đổi"; right ghost "Huỷ", outlined pill "Lưu & thêm mới", primary cobalt pill "Lưu".

SECONDARY FRAMES (only Section 2 content changes):
- "Điều khoản thanh toán": "Điều khoản thanh toán" searchable select "Thanh toán 30 ngày" | "Số ngày được nợ" "30" | "Số nợ tối đa" "500,000,000" (right-aligned) | "Tài khoản công nợ phải trả/thu" "331".
- "Tài khoản ngân hàng": each account is an open card (12px radius, hairline) with a cobalt number badge "01" and a trash icon at the top right; 4 fields in one row: "Số tài khoản", "Tên ngân hàng", "Chi nhánh", "Tỉnh/TP của ngân hàng". Two cards filled (Vietcombank / CN Sài Gòn, ACB / CN Hải Phòng), then a full-width dashed cobalt button "+ Thêm tài khoản".
- "Địa chỉ khác": Quốc gia "Việt Nam" | Tỉnh/Thành phố "TP. Hồ Chí Minh" | Quận/Huyện | Xã/Phường; checkbox "Địa chỉ giao hàng giống địa chỉ chính" (unchecked) and a repeatable "Địa chỉ giao hàng" list with trash icons and a dashed "+ Thêm địa chỉ".
- "Thông tin bổ sung": key/value rows "Tên trường" / "Giá trị" (e.g. "Mã đại lý hãng tàu" / "CT-8891") with trash icons and a dashed "+ Thêm trường".
- Error state: "Tên nhà cung cấp *" empty with a red #BA1A1A border and the red line "Vui lòng nhập tên nhà cung cấp" under the field; a red banner at the top of the body "Còn 1 trường bắt buộc chưa nhập"; a tab holding an invalid field shows a small red dot after its label.
```
