# Stitch prompt — Drawer "Thêm chi phí logistics" (Meta theme)

Prompt for Google Stitch that designs a right-side drawer for adding one
logistics cost line to a Shipment, in the Meta design system.

There is no such drawer in the app yet: today a cost line is added as an
inline row in the Chi phí grid (`shipment-cost-lines-fields.jsx`). This
drawer is a new design built from:
- the cost line's fields and validation — `config/shipment-schema.js`
  (`shipmentCostLineSchema`) and `shipment-cost-lines-fields.jsx`
  (labels, placeholders, Cost Nature options);
- the fixed LOG-01 … LOG-08 groups and cost item templates — see
  `meta-shipment-detail.md`, section "Nhóm chi phí LOG-01 → LOG-08";
- the Meta drawer frame of `commission-form-drawer.jsx` /
  `contract-boq-edit-drawer.jsx` (`MetaDrawerHeader`, `MetaFormSection`,
  muted canvas, footer with the unsaved-changes hint, discard confirmation).

Design choices that are not in the current code:
- Nhóm chi phí is a grid of 8 selectable cards instead of a searchable select
  (only 8 fixed groups, so they fit on screen at once).
- Cost Nature is a 2-option segmented control instead of a select.
- Suggestion chips under "Tên khoản chi phí" come from
  `GET /api/v1/shipment-cost-item-templates?costCategoryId=…`; the API exists
  but the current grid does not show suggestions. The name stays free text.
- The "after saving" preview (group subtotal, shipment total) is computed from
  the shipment's existing cost lines; nothing new is stored.
- Width 640px (one cost line), not the 960px of the contract / commission
  drawers.
- Field messages are the real ones from `shipmentCostLineSchema`, shown under
  each field; the save-error text "Không thể lưu chi phí" is a placeholder.
- Sample numbers match the Chi phí sample in `meta-shipment-detail.md` (this
  Demurrage line is line 8 there, and the totals are the ones after adding it).

Pass the Meta design system (`assets/0e1589aef5b0498b82ff40927567eb2d`)
explicitly — the project's default theme is the old Maritime one.

## Prompt

```text
Design a desktop right-side DRAWER "Thêm chi phí logistics" (Add a logistics cost) for a B2B
import–export contract management web app (Vietnamese UI). It slides in from the right over the
"Chi phí" tab of a Shipment detail page (page visible but dimmed behind, backdrop
rgba(28,30,33,0.4)); it adds ONE cost line to the shipment. Clean, flat, minimalist-modern
enterprise style — Meta/Facebook business-tool feel ("Meta theme"). Canvas 1440×900.

THEME
- Cobalt accent #0064e0 (hover #1876f2), text #1c1e21 / #65676b, subtle #8a8d91,
  hairline #dee3e9, inner dividers #e4e6eb, drawer canvas #faf8ff, cards #ffffff, error #ba1a1a.
- Pills: neutral (bg #f1f3f6, text #65676b), amber (bg #fffbeb, border #fde68a, text #b45309),
  cobalt (bg #e8f1ff, text #0064e0).
- Inter-like geometric sans, body 14px, tabular numbers. 4px spacing grid; inputs and buttons
  radius 8px, cards radius 12px, pills fully rounded. No gradients, no heavy shadows.
- Number format en-US; VND without decimals, e.g. "4,500,000 đ". Dates dd/mm/yyyy.

DRAWER FRAME
- Width 640px, full height, white, square corners, soft left-edge shadow. Three regions split by
  hairlines: fixed header, scrolling body on the muted canvas #faf8ff, fixed footer.

HEADER (padding 16px)
- 40×40 rounded tile (bg #e7f0ff, cobalt "receipt" icon), then a stack: title
  "Thêm chi phí logistics" (20px semibold); below it the shipment code "26KCT34/LOT-01"
  (13px bold cobalt) • neutral pill "DDP 2020".
- Ghost "X" close button on the right.

BODY (padding 24px, two white section cards, gap 16px). Each section header = short 4px cobalt
bar + 15px bold title + hairline underneath, with a small pill on the right.

Section 1 — "Phân loại" (right: cobalt pill "Bắt buộc")
- Label "Nhóm chi phí *". A 2-column grid of 8 compact selectable cards (radius 8px, hairline
  border, padding 10px 12px). Each card: code in a small neutral pill ("LOG-01") above the
  English group name (13px semibold, max 2 lines):
  LOG-01 Packing & Export Preparation · LOG-02 Origin Inland Transportation & Depot ·
  LOG-03 Origin Port & Export Charges · LOG-04 International Freight & Insurance ·
  LOG-05 Destination Port Charges · LOG-06 Destination Inland Transportation ·
  LOG-07 Import Customs & Clearance · LOG-08 Import Duty & Tax.
  Selected card (LOG-03): cobalt 1.5px border, bg #f0f5ff, code pill turns cobalt, small cobalt
  check circle top-right.
- Label "Cost Nature *". Full-width 2-option segmented control, each option with a title and a
  muted description line:
  "Standard" — "Chi phí thông thường (O/F, THC, D/O…)";
  "Abnormal" — "Phát sinh bất thường (demurrage, detention, lưu kho…)".
  Show "Abnormal" selected: amber border #fde68a, bg #fffbeb, title in #b45309.

Section 2 — "Khoản chi phí"
- "Tên khoản chi phí *" text input, placeholder "Ví dụ: O/F, THC xuất, D/O", filled
  "Demurrage tại cảng xuất", counter "23/200". Under it: muted caption "Gợi ý cho LOG-03" and a
  wrap row of small outlined suggestion chips: "THC xuất", "Seal", "Phí chứng từ", "Telex",
  "Khai hải quan", "Hạ cont tại cảng", "Demurrage tại cảng xuất" (this one highlighted cobalt),
  "B/L amendment".
- Two columns:
  - "Số tiền *" number input, right-aligned tabular "4,500,000" with "đ" suffix inside the field;
    helper "Chỉ ghi nhận bằng VNĐ".
  - "Số hoá đơn" with muted "(Tuỳ chọn)", placeholder "Không bắt buộc".
- "Nhà cung cấp" with "(Tuỳ chọn)": searchable clearable select, placeholder "Chưa xác định",
  filled "Cảng Hải Phòng" with a small "×" clear icon.
- "Ghi chú" with "(Tuỳ chọn)": textarea 3 rows, placeholder "Ghi chú (không bắt buộc)",
  filled "Tàu trễ 3 ngày", counter "14/500".

Preview strip at the bottom of the body (bg #ebf3fe, radius 8px, padding 12px 16px, 2 figures,
label 12px muted, value 15px bold tabular):
"LOG-03 sau khi thêm: 10,850,000 đ" · "Tổng chi phí Shipment: 172,650,000 đ"
and a small amber line "Trong đó Abnormal: 13,000,000 đ".

FOOTER (padding 16px, white, hairline top)
- Left: muted 13px "Có thay đổi chưa lưu".
- Right: secondary large "Huỷ bỏ" and primary large "Thêm chi phí" with a plus icon
  (bg #0064e0, white text, height 44px).

STATES (as variants)
- Empty form: no group selected, Cost Nature = "Standard" preselected (the default), no
  suggestion chips (caption "Chọn nhóm chi phí để xem gợi ý"), preview hidden, footer hint
  "Chưa có thay đổi".
- Validation after pressing "Thêm chi phí" on an empty form: red border and small red message
  under each required field — "Vui lòng chọn nhóm chi phí" (under the card grid),
  "Vui lòng nhập tên khoản chi phí", "Vui lòng nhập số tiền"; typing 0 gives
  "Số tiền phải lớn hơn 0".
- Submitting: spinner inside the primary button, fields disabled.
- Save error: error banner at the top of the body (bg #ffdad6, text #93000a, alert icon)
  "Không thể lưu chi phí".
- Discard confirmation over the drawer (400px dialog): "Bỏ thay đổi chưa lưu?" with
  "Tiếp tục nhập" (secondary) and "Bỏ thay đổi" (red).
```
