# Add: optional invoice number on Shipment cost lines + contract value/currency same row

**Status:** done
**Created:** 2026-09-07

## Why

User request:
1. Each cost line in a Shipment's "Thông tin chi phí Logistics" needs an
   optional invoice number field, so staff can record which invoice a
   cost was billed on when known. See BE-kt-xnk's
   `openspec/changes/add-shipment-cost-invoice-number/` for the backend
   half.
2. "Giá trị hợp đồng" (contract value) and "Tiền tệ" (currency) were
   rendering on two separate rows in the Contract form — should be on
   one row, matching the existing money+currency pairing pattern used
   elsewhere in this form (`FormGrid`/`StackItem`).

## What changes

- `shipment-schema.js`: `shipmentCostLineSchema` — new optional
  `invoiceNumber` field (max 100 chars), mirrors the backend's
  `MaximumLength(100)`.
- `use-shipment-cost-line-rows.js`: `emptyRow()` seeds `invoiceNumber: ''`.
- `use-shipment-form.js`: `invoiceNumber` threaded through the initial
  row seed, `reset()`, and submit-time `costLines` mapping.
- `api/shipments.js`: `toCostsRequestBody()` sends `InvoiceNumber`.
- `shipment-cost-lines-fields.jsx`: new editable "Số hoá đơn" column
  (`TextInput`).
- `shipment-expanded-details.jsx`: new read-only "Số hoá đơn" column.
- `types/index.js`: `invoiceNumber` added to `ShipmentCostLine`,
  `ShipmentCostLineFormValues`, `ShipmentCostLineRow`.
- `contract-general-fields.jsx`: "Giá trị hợp đồng" +
  "Tiền tệ" wrapped in `FormGrid`/`StackItem` (`size="fill"` +
  `size="static"`), same pattern already used for Shipment's
  invoice/declaration value + currency pairs.

## Verification

- `pnpm exec tsc --noEmit`, `eslint`, and `node --test` (131/131) all
  clean; `./harness/verify.sh` full suite green.
- Live browser check against the running dev stack + rebuilt BE: sample
  Contract's "Giá trị hợp đồng"/"Tiền tệ" render side-by-side; the
  sample Shipment's "Chi phí Logistics" tab shows the new "Số hoá đơn"
  column with seeded values (`HD-DN-2026-0001` for "Phí THC", `—` for
  "Phí kéo container") in the read-only view.
