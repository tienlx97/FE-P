# Proposal: Container drawer fills its type and weights from BIC BoxTech

**Status:** done
**Created:** 2026-10-06

## Why

User request: typing a container number in the container drawer should
fill the container's physical data (type, tare, payload, max gross) from a
free API. BE-P `container-specs-boxtech` adds
`GET /api/v1/containers/{number}/specs` (BIC BoxTech) and relaxes the VGM
weights rule so the container weights can be saved before packing.

## What changes

- Container drawer, "Container" group: max gross / tare / payload move here
  (from "Khai VGM"). Leaving the number field with a valid ISO 6346 number
  fills the blank type and weights; a status line shows the BoxTech values
  ("BIC BoxTech" + summary), "Điền lại từ BoxTech" when the drawer differs,
  why there is nothing (not in BoxTech / unavailable), an owner alert, or a
  check-digit warning (still saveable). Typing another number replaces or
  clears what the previous lookup filled, never what was typed.
- `shipmentVgmSchema` mirrors `ShipmentVgmWeights`: container weights
  alone are fine; net + packaging together and only with the three.
  Bulk table state / Excel hints follow.
- `config/container-specs.js` (ISO 6346 check, fill rules), API and hook;
  answers cached for the session (BoxTech quota).

## Out of scope

- Auto-fill in the bulk table / Excel import.

## Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-10-06 | Fill on blur, not while typing | One lookup per number; no effect-driven state |
| 2026-10-06 | Wrong check digit warns, does not block | Existing records may hold non-ISO numbers |
