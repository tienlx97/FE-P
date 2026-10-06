# Proposal: "Timeline & lịch tàu" read like a carrier tracking page

**Status:** done
**Created:** 2026-10-06

## Why

User request: adjust the shipment detail "Timeline & lịch tàu" tab to fit
the design, using the Heung-A e-Service "Container → Tracking" page as a
reference. The tab opened with a label/value "Lịch tàu" card whose ETD / ETA
showed "—" with the ATD / ATA as stray pills below, beside a per-container
timeline, so there was no one-glance view of the route and of how far each
milestone is across containers. Heung-A reads top-down: schedule row
(POL → vessel / transit → POD, cut-offs), a horizontal tracking bar with
"Pickup (4/4)" counts and weekday + time, then the details.

## What changes

- "Lịch tàu" becomes a full-width route summary: POL and POD with the
  actual date (ATD / ATA, "API" when the carrier filled it) or the current
  estimate, the estimate / first estimate under it when they differ; in
  between the vessel / voyage (first one when changed), a dashed sea leg and
  "n ngày hành trình". Cut-offs as two field tiles. Stacks on phones.
  (`scheduleRoute`, unit-tested.)
- "Timeline vận chuyển" goes full width and starts with a horizontal
  milestone strip: each event once across containers, "x/y cont" done,
  date, weekday (T2…CN) · time, "Tiếp theo" / "Quá hạn"
  (`buildMilestoneStrip`, `weekdayLabel`, unit-tested; new shared
  `MetaMilestoneStrip`). The per-container timeline follows under
  "CHI TIẾT THEO CONTAINER".
- B/L, transshipment, carrier tracking, free time and history unchanged.

## Out of scope

- The voyage map and Excel export of the reference page.
- Backend / API changes.
