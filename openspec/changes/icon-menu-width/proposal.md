# Proposal: "…" menus wide enough for their items

**Status:** done
**Created:** 2026-10-07

## Why

User (2026-10-07): in shipment detail, the "…" menu next to In / Chỉnh sửa
clips its items ("Cập...", "Ch..."). Astryx `DropdownMenu` defaults the
menu width to the trigger's, and the trigger is an icon-only button.

## What changes

- Shipment header and party detail "…" menus: `menuWidth="max-content"`,
  `alignment="end"`.
- ESLint (`no-restricted-syntax`): an icon-only `DropdownMenu` without
  `menuWidth` is an error, so the next one cannot ship clipped.

## Out of scope

- Menus with a labelled trigger (already as wide as their label).
