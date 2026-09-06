# Requirements

- Contracts, Shipments and Commission lists expose one final, always-visible,
  end-pinned Chức năng dropdown column with Xem and Sửa.
- Standalone Shipment and Commission lists never expand rows. Xem opens
  read-only details, Sửa opens editable fields in the same dialog component
  used for creation. View-to-edit never submits. Existing dirty/pending guards
  apply to edits. Closing view never asks to discard untouched data.
- VGM, commission annex and quick payment actions remain reachable from view.
- Reordering/hiding columns cannot displace or unpin the action column.
