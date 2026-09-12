# Proposal: Table Header Background Color

**Status:** implemented
**Created:** 2026-09-12

## Why

User request: "Tôi muốn header table có background color được không. Hiện
tại toàn màu trắng đen." Astryx's `Table` ships with no default `<thead>`
background — every table in the app (contract/shipment/commission lists,
nested Shipment/VGM/cost tables) rendered its header row as plain black
text on the same white the body rows use, with nothing marking where the
header ends and data begins.

## What changes

- `src/shared/components/theme.js`: new `components.table-header` override
  (`astryx theme targets Table` confirmed `table-header` as the key that
  paints `.astryx-table-header`), `base: { backgroundColor: 'var(--color-background-muted)' }`.
  This is theme-level, so it applies to every `Table` instance in the app
  automatically — no per-usage changes anywhere.

## Scope decisions

- **`--color-background-muted` (#f5f5f5), not `--color-accent-muted`**:
  the accent-muted token is already reserved for a specific meaning
  (selected `SideNavItem`, `<Note>` callout background — see this file's
  own pre-existing comment on that token) and it's more saturated brand
  mint than a header row needs. The neutral gray wash is the same one
  already used for hover/press fills elsewhere, so this reads as "one more
  place using the existing neutral chrome" rather than a new brand-colored
  surface.
- **Theme-level, not per-`Table`-usage**: the request was about tables in
  general ("toàn màu trắng đen" — everything is white/black), and this
  repo's own convention (`AGENTS.md`'s Astryx workflow) is theme/token
  overrides for anything that should apply app-wide, never a per-instance
  `xstyle` hack repeated at every call site.

## Out of scope

- Per-table customization (e.g. a specific table wanting a different
  header color) — no such request exists; if one comes up later, it's a
  component-level `xstyle` override on that `Table`, not a theme change.
