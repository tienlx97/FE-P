# Logistics vessel schedule page (`/logistics/schedule`)

## Why
User request 2026-09-29: a page to look up carriers' vessel schedules by
POL and POD, shown in the Astryx lab `Schedule` component (full width and
height), each sailing tagged `[HÃNG TÀU] - [TÊN TÀU] / [SỐ CHUYẾN]`.
Backed by BE-kt-xnk `add-carrier-schedules`
(`GET /api/v1/shipments/schedules`, KMTC implemented first).

## What
- Route `/logistics/schedule` ("Lịch tàu" in the NGHIỆP VỤ sidebar group),
  gated by `logistics:contracts:view` (same as the endpoint).
- POL and POD pickers: `Typeahead` over the port catalog
  (`POST /ports/search`, code / name / full name contains); the port's
  UN/LOCODE (else its name) is sent to the BE.
- `Schedule` monthly view (+ week / list views) fills the page. Its async
  loader asks every carrier whose schedule adapter is implemented
  (`GET /shipments/tracking/carriers` → `schedule.isImplemented`) for the
  visible range; "tháng trước / tháng sau" pages through months (the BE
  caches KMTC's month responses).
- Each sailing is an event at its ETD (carrier's local port time, shown
  as given), title `KMTC - KMTC ULSAN / 2615S`, one category colour per
  carrier. A carrier that fails or is blocked shows its message next to
  the pickers; the others still show.
