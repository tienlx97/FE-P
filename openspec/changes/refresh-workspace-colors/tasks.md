# Tasks

- [x] 1.1 Refresh shared theme colors, verify contrast and desktop/mobile
      table/navigation/dialog behavior, run the full gate, record evidence.

Gate: `harness/runs/20260912-112042-2663/`.
Visual evidence: `harness/runs/20260912-color-refresh/` (local fixtures).

- [x] 1.2 Fix pinned body cell backgrounds and verify horizontal scroll/hover parity.

- [x] 1.3 Fix the "GIÁ TRỊ" spanning group-header bar
      (`table-header-group.jsx`, used by `contracts-list.jsx`'s financial
      view) showing a different background than the rest of the header row
      after task 1.1's `table-header-cell` recolor — it was still hardcoded
      to `--color-background-surface`. Replaced the hardcoded color with a
      runtime read of the real header cell's own `getComputedStyle(...).
      backgroundColor`, so the bar always matches the header exactly
      regardless of future theme changes — no color value to keep in sync
      by hand. User caught via a live screenshot ("cột GIÁ TRỊ, đang có
      background khác"). `pnpm exec eslint`/`pnpm typecheck` clean; full
      `./harness/verify.sh` PASSED: `harness/runs/20260912-113657-3039/`.
      Live-verified on `/logistics/contracts`'s "Tài chính" view — the bar
      now blends seamlessly with "HỢP ĐỒNG"/"QUYẾT TOÁN"/"ĐÃ THANH TOÁN"/
      "CHƯA THANH TOÁN"'s header background (zoomed screenshot confirmed no
      visible seam). No console errors.

