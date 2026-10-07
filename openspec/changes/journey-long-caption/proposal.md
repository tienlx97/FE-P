# Proposal: Long journey captions end in "…"

**Status:** done
**Created:** 2026-10-07

## Why

User (2026-10-07): "Hành trình vận chuyển › Site Delivery › vị trí giao
hàng dài nên để …". The DDP Site Delivery caption is the full delivery
address; it already had `maxLines={1}`, but the step column had no max
width, so the column grew to ~500px instead of truncating. Its
`minWidth: calc(var(--spacing-32) + var(--spacing-4))` never applied
either: Astryx has no `--spacing-32` (scale stops at `--spacing-12`), so
the whole `calc()` was invalid.

## What changes

- `MetaMilestoneStrip` step: `minWidth` 4 × `--spacing-12` (192px, fits
  "Shipped on Board" + edit), `maxWidth` 5 × `--spacing-12` (240px). Long
  captions and titles end in "…"; Astryx `Text maxLines` shows the full
  text in a tooltip.

## Out of scope

- Other undefined spacing tokens (`--spacing-40`, `--spacing-24`), logged
  under Harness gaps.
