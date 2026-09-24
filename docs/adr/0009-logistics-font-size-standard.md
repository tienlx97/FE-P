# ADR-0009: Logistics font-size standard

Date: 2026-09-25
Status: accepted

## Context

The `/logistics/**` pages (all under the Meta theme) set text size ad hoc:
`size="base"` was written out on ~40 texts where it is already the default,
panel tables (VGM, logistics costs) used `sm` (12px) cells while the list
tables used base (14px), and notes / hints / captions used `sm` or even
`xsm` (10px) — too small to read comfortably.

## Decision

One scale, set in the Meta theme (`src/shared/components/custom/meta/theme.js`):

| Role | Size | px |
|---|---|---|
| Body text, data values, table cells, form values, row titles | base (default — no `size` prop) | 14 |
| Notes, hints, captions, meta lines, caps labels, table headers, pills, counters | `sm` / `type="supporting"` | 13 |
| Compact chips only: tab count badges, small `MetaPill`, live pill | `--font-size-xs` | 12 |
| Emphasized totals | `lg` | 17 |
| Titles | `Heading` level 4 / 3 / 2 / 1 | 14 / 17 / 20 / 24 |
| KPI figures | `display-*` types | 29+ |

- The theme pins `--font-size-sm` to 13px (the 14 × 1.2 scale gives 12px)
  and `--font-size-xs` to 12px, so nothing renders below 12px; supporting /
  heading-5 line height is 20px (1.5385).
- `<Text size="base">` is not written (except with `type="inherit"` or a type
  that has its own size); `xsm` and smaller are not used for text.
- `harness/checks/logistics-font-sizes.mjs` (run by `verify.sh`) fails the
  build on either.

## Consequences

Every `sm` inside Meta surfaces (Astryx sm buttons / selectors, table
headers, pills) grows 1px. Other themes (app default, Maritime) are
unchanged.
