# Tasks: Contract "Xem đầy đủ" (Full View) Tab

**Status:** all tasks complete (2026-09-12)

- [x] 1.1 Factor `ShipmentInfoSection`/`ShipmentCostsSection` out of
      `ShipmentExpandedDetails` (no behavior change to the existing
      "Liên quan" row-expansion UI).
- [x] 1.2 `use-shipments-vgms-queries.js`: batch VGM fetch across a
      contract's Shipments, sharing cache with `useShipmentVgmsQuery`.
- [x] 1.3 `ContractFullViewPanel`: search bar + filtered Shipment
      `TabList` + stacked info/VGM(read-only)/costs for the selected
      Shipment.
- [x] 1.4 Wire the 5th "Xem đầy đủ" tab into `ContractFormDialog` /
      `ContractExpandedDetails` / `ContractsList`'s `ExpandedTab`.
- [x] 1.5 `./harness/verify.sh` passes (lint, typecheck, structure, unit
      tests, build, quality thresholds).
- [x] 1.6 Live-verified in browser against the real `BE-kt-xnk`: search
      filtering, per-shipment tab switching, read-only VGM (see
      `harness/PROGRESS.md`, 2026-09-12 entry).
- [x] 2.1 Advanced search dialog, revised twice per live feedback: funnel
      button matches `AdvanceTable`'s own trigger (`icon="funnel"`,
      `variant="ghost"`), dialog reuses `AdvancedFilterBuilder` (field/
      operator/value rows + "Chọn điều kiện lọc" add-field control) rather
      than a fixed text-box form — see proposal.md's "Follow-up" section.
- [x] 2.2 `./harness/verify.sh` passes on the final shape; live-verified
      in browser (added a booking-number condition with "Chứa", narrowed
      to the one matching Shipment; "Bỏ lọc" restored plain search).
