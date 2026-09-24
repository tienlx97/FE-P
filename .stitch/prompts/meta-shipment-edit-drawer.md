# Stitch prompt — Drawer "Chỉnh sửa Shipment" (Meta theme)

Prompt for Google Stitch that designs a right-side drawer for editing a
Shipment's information (Book + lô hàng), in the Meta design system.

Today "Chỉnh sửa" on the shipment detail page
(`shipment-detail-workspace.jsx`) opens `ShipmentFormDialog`, a fullscreen
dialog with Thông tin / VGM / Chi phí Logistics tabs. This drawer replaces
only the information part; VGM and costs are edited from their own tabs.

Built from:
- fields, labels, placeholders and required flags — `shipment-booking-fields.jsx`,
  `shipment-lot-fields.jsx`;
- validation messages — `config/shipment-schema.js` (`shipmentSchema`);
- option lists — `config/shipment-status.js`, `shipment-types.js`,
  `payment-schedule-types.js`, `shipment-operational-details.js`,
  `currencies.js` (USD, VND, EUR, CNY, JPY, GBP);
- the Meta drawer frame of `contract-boq-edit-drawer.jsx` /
  `commission-form-drawer.jsx` (960px, `MetaDrawerHeader`, numbered
  `MetaFormSection`s on a muted canvas, footer with the unsaved-changes hint,
  discard confirmation).

Rules taken from the code:
- "Loại hình" (LCL/FCL) is locked when editing: the shipment code prefix and
  numbering depend on it. The code only disables the select; the helper text
  "Không đổi được sau khi tạo Shipment" is a design addition.
- "Số lượng" unit follows Loại hình: FCL → Cont, LCL → Kiện (no unit select).
- "Giờ nộp SI / VGM" needs a date: a time without "Hạn nộp SI / VGM" gives
  "Vui lòng chọn ngày".
- Field errors: the current dialog shows them as tooltips (`statusVariant="tooltip"`);
  this drawer shows them as a red line under the field (`statusVariant="detached"`),
  like the real Meta shipment drawer `shipment-cost-line-drawer.jsx`, so every
  error stays visible in a long form.

Design choices that are not in the current code:
- The code has two form sections (Thông tin Book, Thông tin lô hàng). The drawer
  splits Book into "Booking & vận chuyển" and "Hải quan & C/O" and puts
  "Thông tin lô hàng" first, since it holds most of the required fields.
- Customs channel values shown as coloured dots (Xanh / Vàng / Đỏ).
- The "Dự kiến transit" note under ETD/ETA, the changed-field dot and the
  segmented control for "Phương thức vận chuyển" (a select in the code) are
  design additions.

Sample data matches `meta-shipment-detail.md` (26KCT34/LOT-01, FCL, DDP).
Pass the Meta design system (`assets/0e1589aef5b0498b82ff40927567eb2d`)
explicitly — the project's default theme is the old Maritime one.

## Prompt

```text
Design a desktop right-side DRAWER "Chỉnh sửa Shipment" (Edit shipment information) for a B2B
import–export contract management web app (Vietnamese UI). It slides in from the right over the
Shipment detail page (page visible but dimmed behind, backdrop rgba(28,30,33,0.4)).
Clean, flat, minimalist-modern enterprise style — Meta/Facebook business-tool feel ("Meta theme").
Canvas 1440×900; show the drawer scrolled to the top, plus a second frame scrolled to the bottom.

THEME
- Cobalt accent #0064e0 (hover #1876f2), text #1c1e21 / #65676b, subtle #8a8d91,
  hairline #dee3e9, inner dividers #e4e6eb, drawer canvas #faf8ff, cards #ffffff, error #ba1a1a.
- Pills (fully rounded, 1px border, 12px semibold): cobalt (bg #e8f1ff, text #0064e0),
  indigo (bg #eef2ff, border #c7d2fe, text #4f46e5), amber (bg #fffbeb, border #fde68a,
  text #b45309), emerald (bg #ecfdf5, border #a7f3d0, text #047857),
  neutral (bg #f1f3f6, text #65676b).
- Inter-like geometric sans, body 14px, tabular numbers. 4px spacing grid; inputs and buttons
  radius 8px, height 40px; cards radius 12px. Labels above fields; required fields end with "*";
  optional fields show a muted "(Tuỳ chọn)". No gradients, no heavy shadows.
- Number format en-US ("412,500.00", "25,380", "98,450.00"). Dates dd/mm/yyyy, times HH:mm.

DRAWER FRAME
- Width 960px, full height, white, square corners, soft left-edge shadow. Three regions split by
  hairlines: fixed header, scrolling body on the muted canvas #faf8ff, fixed footer.

HEADER (padding 16px)
- 40×40 rounded tile (bg #e7f0ff, cobalt "ship" icon), then a stack: title "Chỉnh sửa Shipment"
  (20px semibold); below it "26KCT34/LOT-01" (13px bold cobalt) • cobalt pill "FCL" •
  indigo pill "Hạ bãi chờ xuất".
- Ghost "X" close button on the right.

BODY (padding 20px, three white section cards, gap 16px). Each section header = short 4px cobalt
bar + index and title ("1  Thông tin lô hàng") 15px bold + hairline underneath, with a pill or
muted note on the right. Fields in a 2-column grid (gap 16px) unless noted.

Section 1 — "Thông tin lô hàng" (right: cobalt pill "Bắt buộc")
- Row: "Tên lô hàng *" (wide) = "Thép cuộn cán nóng – đợt 1" | "Loại hình *" (140px select) =
  "FCL", DISABLED (grey fill #f1f3f6, lock icon) with helper "Không đổi được sau khi tạo Shipment".
- Row: "Điều kiện thanh toán *" select (T/T, L/C) = "L/C" | "Số L/C" (Tuỳ chọn), placeholder
  "Khi thanh toán bằng L/C", value "LC-VCB-2026-0391".
- Row: "Tình trạng *" select = "Hạ bãi chờ xuất" (show the value as an indigo pill inside the
  field) | "Số hoá đơn thương mại" (Tuỳ chọn), placeholder "Ví dụ: INV-26KCT-01",
  value "INV-26KCT-01".
- Row: "Giá trị invoice *" number input "412,500.00" with "USD" suffix + narrow "Đơn vị *" select
  "USD" | "Giá trị tờ khai *" "412,500.00" "USD" + "Đơn vị *" "USD".
- Row (3 columns): "Tỷ giá tờ khai *" "25,380" suffix "đ" | "Số lượng *" "4" suffix "Cont" |
  "Khối lượng tờ khai *" "98,450.00" suffix "kg".
- Show the "Tình trạng" select open in a variant, 8 options each as its pill:
  Đã book (neutral), Đang đóng hàng (amber), Hạ bãi chờ xuất (indigo, selected + check),
  Shipping (cobalt), Đã giao đến cảng (cobalt), Khai HQ (amber), Trucking đến site (indigo),
  Đã hoàn thành (emerald).

Section 2 — "Booking & vận chuyển"
- Row (full width): "Forwarder *" searchable select = "Công ty TNHH Đại Phát Logistics",
  with a square secondary icon button "+" beside it (tooltip "Thêm nhà cung cấp").
- Row: "Đại lý hải quan" (Tuỳ chọn) multi-select with removable chips ("Hải quan Minh Anh") |
  "Đơn vị trucking" (Tuỳ chọn) multi-select, chips "Vận tải Hưng Thịnh", "Trucking Bắc Việt";
  placeholder when empty "Chọn một hoặc nhiều nhà cung cấp".
- Row: "Số booking *" = "KMTCVN01154082" | "Số B/L" = "KMTCHPH0456789".
- Row: "Line tàu" placeholder "Ví dụ: KMTC, SITC" = "KMTC" | "Tên tàu" placeholder
  "Ví dụ: KMTC JAKARTA // 2604S" = "KMTC JAKARTA // 2604S".
- Row: "Số chuyến" placeholder "Ví dụ: 2604S" = "2604S" | "Hạn nộp SI / VGM" date "29/09/2026"
  + "Giờ nộp SI / VGM" time "16:00" side by side.
- Row: "Điều kiện giao nhận" select (CY/CY, CY/CFS, CFS/CY, CFS/CFS), placeholder
  "CY/CY, CFS/CFS…" = "CY/CY" | "Phương thức vận chuyển" as a 2-option segmented control:
  "Đi thẳng (Direct)" (selected) / "Chuyển tải (Transshipment)".
- Row: "ETD" date "02/10/2026" | "ETA" date "12/10/2026". Under them a muted inline note
  "Dự kiến transit: 10 ngày".
- Row: "Hạn trả cont rỗng" date "20/10/2026" (half width).
- Row: "Cảng/nơi xếp hàng" = "Hải Phòng (VNHPH)" | "Cảng/nơi đến" = "Laem Chabang (THLCH)".
- All fields in this section except Forwarder and Số booking are optional.

Section 3 — "Hải quan & C/O" (right: muted note "Do hải quan cấp, tự nhập")
- Row: "Mã C/O" placeholder "Do hải quan cấp, tự nhập" = "VN-TH 26/01/0452" | "Form C/O"
  placeholder "Ví dụ: Form D, Form E" = "Form D".
- Row: "Ngày khai C/O" "28/09/2026" | "Ngày có C/O" "30/09/2026".
- Row: "Số tờ khai" = "305123456780" | "Luồng tờ khai" select, placeholder "Xanh / Vàng / Đỏ",
  options with a coloured dot: Luồng Xanh (green), Luồng Vàng (amber), Luồng Đỏ (red);
  value "Luồng Vàng".
- Row: "Ngày khai" "29/09/2026" | checkbox "Bị kiểm hoá" (checked).
- All fields in this section are optional.

FOOTER (padding 16px, white, hairline top)
- Left: muted 13px "Có thay đổi chưa lưu" (or "Chưa có thay đổi").
- Right: secondary large "Huỷ bỏ" and primary large "Lưu thay đổi" with a save icon
  (bg #0064e0, white text, height 44px).

STATES (as variants)
- Changed field: a small cobalt dot next to the label of each edited field.
- Validation: red border + a small red message line under the field, e.g. "Số booking" empty →
  "Vui lòng nhập số booking"; "Giá trị invoice" 0 → "Giá trị phải lớn hơn 0";
  "Giờ nộp SI / VGM" filled without a date → under "Hạn nộp SI / VGM": "Vui lòng chọn ngày".
  The drawer scrolls to the first invalid field.
- Save error: error banner at the top of the body (bg #ffdad6, text #93000a, alert icon),
  e.g. "Không thể cập nhật lần xuất hàng" (the generic update error from api/shipments.js).
- Saving: spinner in "Lưu thay đổi", fields disabled.
- Discard confirmation over the drawer (400px dialog): "Bỏ thay đổi chưa lưu?" with
  "Tiếp tục nhập" (secondary) and "Bỏ thay đổi" (red).
```
