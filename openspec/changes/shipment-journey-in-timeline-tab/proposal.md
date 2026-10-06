# Proposal: Journey moves from the page header into the Timeline tab

**Status:** done
**Created:** 2026-10-06

## Why

User question "Thật sự có cần HÀNH TRÌNH VẬN CHUYỂN không" (2026-10-06). The
shipment page showed the journey three times: the header's 7–9 journey
cards + "TIẾN ĐỘ LỘ TRÌNH" (on every tab, ~350px, sideways scrolling, many
cards "—"), "Tình trạng lô hàng", and the new milestone strip of
"Timeline & lịch tàu". Only the header cards had the Incoterm meaning
(Seller / Buyer scope, "Chuyển rủi ro" / "Hết cước & BH"), the confirm /
record actions and the progress. User chose: drop the header journey and
move those into the Timeline tab.

## What changes

- `MetaShipmentHeaderCard`: code, pills, incoterm, actions only (journey
  cards, progress row and `MetaJourneySkeleton` removed; page skeleton too).
- "Tình trạng lô hàng" shows "Tiến độ lộ trình: …" (time-based, else steps).
- Timeline tab "Hành trình vận chuyển": the strip's steps are the Incoterm
  journey milestones, each dated by its physical event when there is one
  (`stripStepForMilestone`: weekday · time, "x/y cont", overdue), else the
  card's key date; buyer steps dashed / muted; marker and alert pills; the
  milestone's action as an edit button. Physical-only strip when the journey
  is not loaded. Subtitle = the Incoterm summary.

## Out of scope

- Backend; the per-container timeline below the strip; Figma update
  (the header in Figma 115:8469 is now intentionally different).

## Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-10-06 | Diverge from Figma 115:8469 header journey | User choice: one journey view, tabs start at the top |
