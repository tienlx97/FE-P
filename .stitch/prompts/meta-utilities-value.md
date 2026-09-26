# Stitch prompt — Tiện ích › Giá trị (Meta theme)

Prompt for Google Stitch that designs the `/logistics/utilities/value` page
("Giá trị") in the Meta design system.

Built from:
- page — `src/app/(protected)/logistics/utilities/value/page.jsx`;
- sections — `src/features/utilities/components/amount-in-words-section.jsx`
  (Đọc số tiền bằng chữ) and `installments-section.jsx` (Chia đợt thanh
  toán), shared pieces `money-options.jsx` (Đơn vị tính / Ngôn ngữ segmented
  controls) and `words-output.jsx` (muted words box + copy button);
- logic — `config/number-to-words.js` (vi / en words, USD cents, VND no
  decimals, max 15 integer digits) and `config/installments.js` (value =
  total × %, or a fixed amount; the last installment takes the rounding
  remainder when the split covers the total exactly);
- shell and tokens — copied from `meta-suppliers.md`; sidebar updated with
  the current "Cảng đến" and the new "TIỆN ÍCH" section.

Design choices that are not in the current code:
- The code is a plain single column (two sections split by a divider, no
  cards, no page header). The prompt puts each section in a white card, adds
  a page title row, a "Bằng chữ" caption on each words box, a numbered tile
  per installment, a thin split bar and pill-styled "Còn lại" — presentation
  only, same fields and behavior.
- The "Tổng giá trị" of section 2 is independent of section 1 in code (no
  "Dùng số tiền ở trên" link); don't add one.

Sample data is illustrative; every words string below is what the code
actually outputs for that number. Pass the Meta design system
(`assets/0e1589aef5b0498b82ff40927567eb2d`) explicitly — the project's
default theme is the old Maritime one.

## Shared shell (paste at the top of the prompt)

```text
Desktop web app screen (1440px wide) for an import/export logistics ERP. All UI copy is Vietnamese — use the exact strings given. Style: the "Meta" design system — "Optimistic VF Commerce & Hardware": clean, flat, airy, hairline borders, pill-shaped controls, cobalt accent. No gradients, no heavy shadows.

DESIGN TOKENS
- Font: Inter (400/500/600/700), tabular numbers for all figures. Body 14px; notes, captions and pills 13px; nothing under 12px.
- Colors: accent / primary buttons #0064E0 (hover #1876F2, pressed #004DB0); text #1C1E21; secondary text #65676B; subtle text #8A8D91; hairline border #DEE3E9; inner dividers #E4E6EB; page background #FAF8FF; cards #FFFFFF; muted bands #F1F3F6; blue wash #F0F5FF; error #BA1A1A on #FFDAD6.
- Pill tones (fully rounded, 1px border, 12px semibold): cobalt (bg #E8F1FF, border rgba(0,100,224,0.2), text #0064E0); indigo (bg #EEF2FF, border #C7D2FE, text #4F46E5); amber (bg #FFFBEB, border #FDE68A, text #B45309); emerald (bg #ECFDF5, border #A7F3D0, text #047857); neutral (bg #F1F3F6, border #DEE3E9, text #65676B).
- Shape: buttons, segmented controls, badges = fully rounded pills; content cards 12px radius; inputs 8px, height 40px. Flat: 1px #DEE3E9 borders.
- Formats: en-US numbers ("10,000.25 USD", VND "1,500,000 VNĐ"), empty values "—".

APP SHELL
- Top bar (64px, white, bottom hairline): left logo "DAI NGHIA GROUP"; right nav pills "Tin tức", "Tài liệu", "Logistics" (active: soft green pill), "Quản trị", a settings icon and an avatar "AC".
- Left sidebar (200px, white): section label "NGHIỆP VỤ" (11px uppercase, muted) with "Hợp đồng", "Shipment", "Commission", "BOQ"; section "ĐỐI TÁC": "Khách hàng", "Nhà cung cấp"; section "DANH MỤC": "Quốc gia", "Cảng đến"; section "TIỆN ÍCH": "Giá trị" (active: pale pill background, bold), "Xăng dầu".
```

## Giá trị

```text
[paste SHARED SHELL] Screen: the "Giá trị" utility page — a calculator, not a list. Content column max 1120px, centered, 24px padding, sections stacked with 24px gap.

PAGE HEADER
- Breadcrumb: "Logistics / Tiện ích / Giá trị" ("Tiện ích" plain text, not a link).
- Title "Giá trị" (24px bold) and a secondary line under it: "Đọc số tiền bằng chữ và chia giá trị theo đợt thanh toán."

CARD 1 — "Đọc số tiền bằng chữ" (white, 12px radius, hairline, padding 20px)
- Header: title 17px bold, under it secondary 13px "Nhập số tiền và đơn vị tính để xuất ra số tiền bằng chữ tiếng Việt hoặc tiếng Anh."
- One row, 3 columns, gap 16px, bottom-aligned, label above each control (13px medium):
  • "Số tiền" — input group: text input value "125,450,000.5" (tabular, right side joined to a muted add-on cell "USD" that follows the unit), placeholder "0.00".
  • "Đơn vị tính" — segmented pill control: "USD" (selected: white segment with subtle shadow on a #F1F3F6 track, bold) | "VNĐ".
  • "Ngôn ngữ" — segmented pill control: "Tiếng Việt" (selected) | "English".
- Result box (full width, muted band #F1F3F6, 8px radius, padding 12px 16px): small label "Bằng chữ" (12px uppercase muted) above the words in 15px semibold ink: "Một trăm hai mươi lăm triệu bốn trăm năm mươi nghìn đô la Mỹ và năm mươi xu". At the right edge, a ghost icon button with a copy icon (tooltip "Sao chép").

CARD 2 — "Chia đợt thanh toán" (same card style)
- Header: title 17px bold, secondary 13px "Nhập tổng giá trị và các đợt thanh toán theo tỷ lệ % hoặc số tiền. Giá trị mỗi đợt = tổng giá trị × tỷ lệ, kèm số tiền bằng chữ."
- Same 3-column row: "Tổng giá trị" input "10,000.25" + add-on "USD"; "Đơn vị tính" USD (selected) | VNĐ; "Ngôn ngữ" Tiếng Việt (selected) | English.
- Result box for the total: "Bằng chữ" / "Mười nghìn đô la Mỹ và hai mươi lăm xu" + copy button.
- Thin split bar (full width, 8px tall, fully rounded): 30% cobalt, 70% indigo, with a legend under it: "Đợt 1 · 30%" (cobalt dot), "Đợt 2 · 70%" (indigo dot).
- Installment list, each item separated by a hairline, 16px vertical padding:
  Item "Đợt 1":
  • Header row: 28×28 rounded tile (bg #E8F1FF, cobalt text "01", tabular bold) + "Đợt 1" (15px bold); right side a ghost trash icon button (tooltip "Xoá đợt").
  • Row, 3 columns, bottom-aligned: "Cách tính" segmented control "Tỷ lệ %" (selected) | "Số tiền"; "Tỷ lệ" input "30" with add-on "%"; "Giá trị" read-only figure "3,000.08 USD" (20px bold cobalt, tabular).
  • Result box: "Ba nghìn đô la Mỹ và tám xu" + copy button.
  Item "Đợt 2" (tile tone indigo: bg #EEF2FF, text #4F46E5, "02"):
  • "Cách tính" "Tỷ lệ %" (selected); "Tỷ lệ" "70" + "%"; "Giá trị" "7,000.17 USD".
  • Result box: "Bảy nghìn đô la Mỹ và mười bảy xu".
- Below the list: outlined pill button "Thêm đợt" with a circle-plus icon.
- Summary footer (top hairline, padding-top 16px): left "Tổng các đợt: 10,000.25 USD" (14px semibold, tabular); right an emerald pill "Còn lại: 0.00 USD" with a check icon.

STATES (add as small secondary frames, same card style)
1) Empty page: inputs show placeholder "0.00", results show muted placeholder text (#8A8D91, regular weight) — card 1: "Nhập số tiền để xem bằng chữ"; card 2 total: "Nhập tổng giá trị để xem bằng chữ"; each installment: "Nhập tổng giá trị để tính đợt này", "Giá trị" shows "—" in muted gray. Copy buttons disabled.
2) Mixed modes + mismatch, English, VNĐ: Tổng giá trị "1,500,000,000" + "VNĐ"; Ngôn ngữ "English". Đợt 1 "Số tiền" selected, input "500,000,000" + "VNĐ", Giá trị "500,000,000 VNĐ", words "Five hundred million Vietnamese dong". Đợt 2 "Tỷ lệ %" "50" → "750,000,000 VNĐ", "Seven hundred fifty million Vietnamese dong". Split bar only 83% filled, the rest a striped gray gap. Footer: "Tổng các đợt: 1,250,000,000 VNĐ", right amber pill "Còn lại: 250,000,000 VNĐ". Under the footer an amber warning banner (bg #FFFBEB, border #FDE68A, text #B45309, warning-triangle icon, 8px radius): "Các đợt chưa đủ tổng giá trị, còn thiếu 250,000,000 VNĐ."
3) Over-allocated: same as the main screen but Đợt 2 = 80% → footer "Còn lại: -1,000.03 USD" in a red pill (bg #FFDAD6, text #BA1A1A) and banner "Các đợt vượt tổng giá trị 1,000.03 USD." (amber banner style).
4) Too large: card 1 "Số tiền" "1,000,000,000,000,000" with a red border and inline error "Số tiền quá lớn (tối đa 15 chữ số)"; result box shows the empty placeholder.
5) Copied: the copy icon becomes a check icon with tooltip "Đã sao chép" for 2 seconds.
```
