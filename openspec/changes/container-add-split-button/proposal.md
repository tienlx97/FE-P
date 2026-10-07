# Proposal: "Thêm container" menu button, simpler Excel import card

**Status:** done
**Created:** 2026-10-07

## Why

User (2026-10-07), Container & VGM tab: the header had four buttons (Xuất
Excel · Nhập từ Excel · Thêm bằng bảng · Thêm container) — "Button 'Thêm
container' (bên phải là drop down [Thêm bằng bảng, Nhập từ Excel])". In the
"Thêm danh sách container" drawer, card "1. Nhập từ Excel": "chỉnh sao cho
đẹp. Cho drawer dài ra".

## What changes

- Header: Xuất Excel + one "Thêm container" menu button (primary, chevron,
  same `DropdownMenu` pattern as the contracts list "Xuất Excel" — user
  rejected a ButtonGroup split button as ugly): Thêm 1 container · Thêm
  bằng bảng · Nhập từ Excel.
- Drawer width 1240 → 1480 (capped to the viewport by the drawer).
- Card 1 kept simple, per user ("chỉ cần kéo thả vào, không cần hướng
  dẫn chi tiết"): only the dropzone (Vietnamese text, label hidden) and
  "Đã đọc N container từ tệp." after a file is read; template download
  stays the card action.

## Out of scope

- Import parsing / validation rules, cards 2–4.
