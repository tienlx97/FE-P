# Proposal: Shipment form by stage

**Status:** done
**Created:** 2026-10-05

## Why

The shipment drawer shows every field at once (5 large sections), although
most of it only becomes known weeks after booking (B/L, goods per line,
customs, C/O). The user asked whether a Stepper wizard should drive the form
by "Tình trạng". A wizard fits neither the per-Incoterm, freely settable
status nor the edit flow (6 call sites share the drawer), so we agreed on
progressive disclosure (options A–D from the 2026-10-05 review).

## What changes

- A: creating shows the booking-time groups; later groups are collapsed with
  "Bổ sung sau".
- B: a section outline beside the form with each group's completeness
  (đủ / còn N / có lỗi); clicking opens and scrolls to the group.
- C: which groups are open follows the status (and data/errors); every group
  can still be opened by hand.
- D: the shipment page shows the status flow for the contract's Incoterm with
  "Chuyển sang …"; it opens the drawer focused on that stage's groups.
- Form groups regrouped: Thông tin cơ bản (incl. POL/POD/delivery), Đơn vị
  tham gia, Booking & tàu, Lịch trình & cut-off, Hàng hóa & bên nhận,
  Hải quan & C/O, Ghi chú.

## Out of scope

- Backend/API, validation rules and required fields (unchanged; whether
  declaration rate/quantity/weight should stay required at booking is an open
  business question).
- The physical journey milestones in the shipment header (unchanged).

## Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-10-05 | Progressive disclosure, not a wizard | Status flow differs per Incoterm and is freely settable; drawer also edits |
