# Proposal: Apply Maritime components to the Contract detail page

**Status:** complete (2026-09-19)
**Created:** 2026-09-19

## Why

`/preview-maritime` holds a set of Maritime-theme components rebuilt from the
Stitch mockup (overview card, tab nav, payment summary, foundation grid,
payment progress, shipment list, annex list, commission panel). User wants
them applied to the real `/logistics/contract/[id]` page (currently IBM Plex
Corporate theme + Astryx primitives), replacing the preview's demo data with
real `Contract` data.

## How (staged)

One component per step. After each step: typecheck + lint + browser check,
user reviews and approves, then the next step starts. Do NOT batch steps.
The page keeps working (edit mode, related-entity dialogs, `?tab=` sync)
at every step; a step only swaps one visual piece and, if needed, adds
props to the Maritime component so it can take real data.
