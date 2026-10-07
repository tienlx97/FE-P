# Proposal: Vessel / voyage in "Hãng tàu báo khác"

**Status:** done
**Created:** 2026-10-07

## Why

User (2026-10-07): "Khi click Đồng bộ ngay … có cập nhật Tên tàu, Số chuyến
không?" → "điều chỉnh sao cho phù hợp". BE-P `tracking-vessel-sync` now fills
a blank vessel / voyage from carrier tracking and reports a different one as
a discrepancy with `field: "Vessel"`.

## What changes

- "Theo dõi hãng tàu" → "Hãng tàu báo khác": a "Tàu / chuyến" row shows the
  shipment's and the carrier's vessel / voyage, with "Tàu chạy dd/MM/yyyy"
  (the departure the carrier gives). Accept / dismiss unchanged; accepting
  refreshes the schedule (vessel in "Lịch tàu", revision in history).
- `discrepancyValues` (config) formats both kinds; types gain the 4 fields.

## Out of scope

- Backend (BE-P `tracking-vessel-sync`); an "API" tag on the vessel name.
