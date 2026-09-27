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

## Known limits
- The lab month grid has fixed 128 px week rows (`grid-auto-rows`), so the
  grid does not stretch to the page height; no prop controls it.
- Schedule labels "Today" etc. come from the lab component.
