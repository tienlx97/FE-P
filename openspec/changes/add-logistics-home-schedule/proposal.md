# Logistics home schedule

## Why
User request (2026-09-27): `/logistics` shows the shipments in progress on
the Astryx lab `Schedule` to grasp them at a glance; the schedule fills the
page (full width and height, fixed); more detail opens in a drawer.

## What
- `/logistics` for `logistics:contracts:view`: `ShipmentOverviewSchedule`
  (was a redirect to `/logistics/contracts`); `logistics:secret`-only /
  bare visitors keep `LogisticsOverview`.
- Data: BE-kt-xnk `GET /shipments/overview` (not Completed).
- Events (`config/shipment-overview-schedule.js`, tested): one bar per
  shipment departure → arrival (ATD / ATA first, else ETD / ETA), colored
  by phase (Chờ tàu chạy / Đang trên tàu / Đã đến cảng) or red "Cần chú ý"
  with a danger alert; one-day SI / CY cut-offs until it sails; earliest
  running free-time day (red once past). Views: 2 tuần (default — fills the
  page height) / Tháng / Tuần.
- Drawer (`ShipmentOverviewDrawer`): header button "Lô hàng (n)" lists
  every shipment grouped (Cần chú ý, phases, Chưa có lịch tàu); clicking an
  event (matched by its shipment code — the lab Schedule gives events no
  handler) opens that shipment: alerts, dates / deadlines, info, "Mở lô hàng".

## Optimization (2026-09-27, after tracking dashboards)
Patterns from GoFreight's tracking dashboard (status bar with counts per
stage, click to filter; arrivals window; flag for ETA differences),
Terminal49 (last free day first) and Portcast (early delay warnings):
- Stage filter with counts in the header (Tất cả / Cần chú ý / Chờ tàu
  chạy / Đang trên tàu / Đã đến cảng).
- Day list ("2 tuần") shows departure and arrival as separate events
  ("Tàu chạy (ETD)" / "Tàu đã chạy (ATD)" …) instead of repeating a
  shipment every day at sea; month / week keep the bar.
- ETD / ETA delay ("ETA trễ 4 ngày") in the titles; ports shortened to
  their first comma part.

## Read at a glance (2026-09-27, user request)
"Nhìn qua schedule là hiểu sơ bộ":
- Every view shows day items only — no journey bars: departure (ATD else
  ETD), arrival (ATA else ETA), SI / CY cut-off until it sails, earliest
  free-time day. Title = verb first ("Tàu chạy · 26KCT02/LOT-01 · KMTC →
  Bangkok · trễ 4 ngày", "Cut-off hạ bãi · … · 12:00", "Hết free time · …").
- Color = kind: blue departs, green arrives, yellow deadline, red overdue
  (deadline past, or ETD / ETA past without the actual). The header filter
  is the color legend (StatusDot + count per kind).
- Overdue items roll onto today with their own date in the title ("từ
  20/09", "ETD 20/09"): the lab mutes past days' events.
- Month is the default view again (the whole month at a glance); "2 tuần"
  remains for a list that fills the height.

## Known limits
- The lab month grid has fixed 128 px week rows (`grid-auto-rows`), so the
  grid does not stretch to the page height; no prop controls it.
- Schedule labels "Today", "All day" and the lowercase month title come
  from the lab component; the pale event tints are the lab's too.
