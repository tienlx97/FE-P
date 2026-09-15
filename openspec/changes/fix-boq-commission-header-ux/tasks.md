# Tasks: Fix BOQ/Commission actions, table header borders, and party-picker UX

- [x] 1.1 Add "Thêm" + contract picker to the BOQ list — verify: agent-browser
  flow (pick contract → BOQ detail dialog opens in edit mode for it).
- [x] 1.2 Fix invisible header divider borders in `TanStackDataTable` —
  verify: computed `border-*-color` against header background passes
  contrast, confirmed visually via screenshot.
- [x] 1.3 Show Số hợp đồng/Dự án in the Commission create dialog — verify:
  agent-browser screenshot of "Tạo Commission" showing both fields.
- [x] 1.4 Disable "Xem thêm thông tin chi tiết" until Bên bán/Khách hàng is
  picked — verify: agent-browser check of `aria-disabled` before/after
  selection in the Contract create dialog.

## 2. Verification

- [x] 2.1 `./harness/verify.sh` passes (lint, typecheck, structure, unit
  tests, build, quality thresholds all green).
