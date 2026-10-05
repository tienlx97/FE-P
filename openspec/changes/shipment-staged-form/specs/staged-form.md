# Staged shipment form

- Status flow per Incoterm: EXW Booked → Packing → Completed; FOB Booked →
  Packing → DeliveredToPort → Completed; CIF Booked → Packing →
  AtYardAwaitingExport → Shipping → DeliveredToPort → Completed; DDP as CIF
  with CustomsDeclaration → TruckingToSite before Completed. A current status
  outside the flow is inserted in global order.
- Groups and their first relevant status: basic/parties/booking/schedule
  (always), goods (Packing), customs (AtYardAwaitingExport), note (none).
- A group is open when it is always relevant, its stage is reached, it holds
  data, it has a validation error, or the user opened it.
- Completeness counts the group's key fields: "Đủ", "Còn N mục", "Tuỳ chọn"
  (no key fields) or "Có lỗi".
- Stage mode ("Chuyển sang X"): status preset to X, only X's groups (+ note)
  shown, "Hiện tất cả mục" reveals the rest; errors elsewhere reveal them.
