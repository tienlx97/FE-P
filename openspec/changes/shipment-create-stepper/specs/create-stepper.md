# Create shipment stepper

- Steps (create mode only), each with its groups and stage label:
  1. Cơ bản & đơn vị — basic, parties — "Đã book"
  2. Booking & lịch trình — booking, schedule — "Đã book"
  3. Hàng hóa — goods — "Đang đóng hàng"
  4. Hải quan & C/O — customs — "Hạ bãi chờ xuất"
  5. Ghi chú & xem lại — note — "Tuỳ chọn"; lists every other group's
     completeness, choosing one goes to its step.
- Step state: "error" if any of its groups has a validation error;
  "complete" if every group with key fields is complete; otherwise
  "missing". The review step has no state.
- "Tiếp": validates the current step's groups only (errors elsewhere are
  not shown); moves on only when they are valid. "Quay lại" and choosing a
  step never validate.
- "Tạo Shipment" (every step): full validation; on failure the first step
  with an error becomes current.
- Edit and stage mode: unchanged (outline + collapsible groups).
