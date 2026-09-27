# Carrier tracking panel

## Why
`docs/carrier-tracking-integration-plan.md` §6 phase 1 (user request
2026-09-27). BE-kt-xnk `add-carrier-tracking` serves the tracking of a
shipment (carrier resolved from "Hãng tàu", adapter version per carrier,
last sync, "Hãng tàu báo khác", events).

## What
- Tab "Lịch tàu & Free time": section "Theo dõi hãng tàu" (carrier ·
  adapter version · last sync, status pill, "Đồng bộ ngay", hint when the
  carrier is not recognized / the adapter is a placeholder / the sync
  failed; "Hãng tàu báo khác" table with "Lấy giá trị hãng tàu" / "Giữ giá
  trị đang có") and "Sự kiện từ hãng tàu" (latest 30, "Đã điền …" = source
  API, carrier + adapter version).
- Schedule history reason `CarrierUpdate` → "Hãng tàu cập nhật".
- A sync / accept refreshes the shipment, containers, journey, schedule and
  alerts.
