# Proposal: Shipments list — port without "Cảng", view in the URL

**Status:** done
**Created:** 2026-10-06

## Why

User request: in "Danh sách Shipment" the "Cảng đến" column repeats the
word "Cảng" (ports save their long name, "Cảng Laem Chabang, …"), and the
table views (Cơ bản / Giá trị & Chi phí / Nhà cung cấp) are not in the URL
the way contract detail tabs are (`?tab=`).

## What changes

- "Cảng đến" cells drop a leading "Cảng" (`placeWithoutPortWord`); saved
  data unchanged.
- `?tab=basic|value|supplier` selects the view on load and is updated
  (`router.replace`, other params kept) when the view changes; unknown or
  missing → Cơ bản. Supersedes the 2026-09-24 "F5 always opens Cơ bản"
  only for URLs that carry `?tab=`.

## Out of scope

- Export, filters and other port displays.
