# Recommend LOG fees in "Thêm chi phí logistics"

**Status:** done
**Created:** 2026-09-26

## Why

The business's LOG 01-08 workbook
(`docs/LOG_01_08_Danh_muc_chi_phi_Logistics_Ket_cau_thep.xlsx`) lists 106
recommended fee types across the eight cost groups, each with an invoice
keyword, a default Cost Nature, where it occurs and a classification note.
BE-kt-xnk `log-cost-item-catalog` now serves them from
`GET /api/v1/shipment-cost-item-templates` (plus each group's `note`).
Entering a cost line should offer them instead of the old name chips.

## What changes

- `ShipmentCostItemTemplate` type gains `nameEn`, `defaultCostNature`,
  `occurrencePoint`, `note`, `sortOrder`.
- `config/cost-item-templates.js` (tested): `recommendedFees` (group + search
  over name / invoice keyword, dấu- and case-insensitive), `matchingFee`,
  `groupMeaning` (first sentence of a group note).
- `ShipmentCostLineDrawer`: each group card shows its plain meaning; under
  the name, "Loại phí khuyến nghị" = search box + compact list (name,
  keyword · occurrence point, Abnormal pill). Picking a fee fills the name
  and Cost Nature; the picked fee's occurrence point and note show under
  the name. The name stays free text.

## Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-09-26 | Scope = recommend while entering one cost line | User choice; no Incoterm rules, no missing-fee checklist |
| 2026-09-26 | Picking a fee overwrites Cost Nature | Default comes from the catalog; the user can switch it back |
