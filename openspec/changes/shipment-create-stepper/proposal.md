# Proposal: Create shipment as a stepper

**Status:** in progress
**Created:** 2026-10-06

## Why

"Thêm Shipment" shows all seven groups in one long drawer. The user asked
for a YouTube-Studio-like stepper: one group of information per step, in
stage order, free to jump, savable from any step. Reviewed 2026-10-06
against a status-driven stepper (steps = Tình trạng per Incoterm); chose
information steps, because later status steps carry no new fields and
moving between steps must not silently change the saved status.

## What changes

- Create mode only: a horizontal Stepper replaces the outline. Steps:
  Cơ bản & đơn vị (basic, parties) · Booking & lịch trình (booking,
  schedule) · Hàng hóa (goods) · Hải quan & C/O (customs) · Ghi chú & xem
  lại (note + completeness of every group, each linking to its step).
- Each step is labelled with the stage its data usually arrives at.
- "Tiếp" checks only the current step's fields; "Quay lại" never checks.
  Any step can be chosen directly. A step shows a check when its groups
  are complete and an error mark when it holds an error.
- "Tạo Shipment" is available on every step and validates everything; on
  failure the drawer moves to the first step with an error.
- "Tình trạng" stays an explicit field in step 1; the existing rule that
  declaration figures are required from "Hạ bãi chờ xuất" still applies.

## Out of scope

- Edit and "Chuyển sang …" (stage mode) keep the outline layout.
- Backend: required fields and payload unchanged, so no BE change.

## Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-10-06 | Information steps, not status steps | Status steps after Packing have no new fields; navigating must not change status |
| 2026-10-06 | Create only | Edit fills one stage at a time, served by stage mode |
