# Proposal: Timeline tab without the B/L card

**Status:** done
**Created:** 2026-10-07

## Why

User (2026-10-07): "Trong chi tiết shipment, tab Timeline & lịch tàu: Giá trị
trong Card Chứng từ B/L không cần thiết". The card's B/L step list (phát hành,
surrender / giao bộ gốc, mostly "Chưa có") added noise to a tab about the
vessel schedule and journey.

## What changes

- "Timeline & lịch tàu": the "Chứng từ B/L" card is removed; "Chuyển tải"
  now spans the full width.
- The B/L documents dialog stays reachable from the shipment header's "more"
  menu ("Chứng từ B/L"), so no data entry is lost.

## Out of scope

- Backend; the documents dialog itself; `billOfLadingSteps` (still used by
  the dialog).
