# Add Contract and Shipment status fields

**Status:** done
**Created:** 2026-09-07

## Why

BE-kt-xnk shipped `Contract.Status` (`InProgress`/`Completed`/`Cancelled`)
and `Shipment.Status` (`Booked`/`Packing`/`AtYardAwaitingExport`/
`Shipping`/`DeliveredToPort`/`CustomsDeclaration`/`TruckingToSite`/
`Completed`) — see BE-kt-xnk's
`openspec/changes/add-contract-and-shipment-status/`. This FE work wires
both up, per the user's own instruction ("Sau đó làm ở FE").

## What changes

- New `config/contract-status.js`/`config/shipment-status.js` (Vietnamese
  labels, `labelFor*` helpers) — same shape as `contract-types.js`/
  `shipment-types.js`.
- `status` added to `Contract`/`ContractFormValues`/`Shipment`/
  `ShipmentFormValues` types, `contract-schema.js`/`shipment-schema.js`
  (zod `enum`, required), `api/contracts.js`/`api/shipments.js` (request
  body), `use-contract-form.js`/`use-shipment-form.js` (defaults —
  `InProgress`/`Booked`, matching the backend's own default).
- New "Trạng thái hợp đồng" Selector on `contract-general-fields.jsx`
  (after Công ty), new "Tình trạng" Selector on `shipment-lot-fields.jsx`
  (after Điều kiện thanh toán) — both required, read-only in Xem mode.
- New "Trạng thái"/"Tình trạng" column in every list that shows a
  Contract or Shipment: `contracts-list.jsx` (also in
  `DEFAULT_COLUMN_KEYS`), `shipments-list.jsx` (also in
  `DEFAULT_COLUMN_KEYS`), and the nested Shipment table inside
  `contract-expanded-details.jsx`.
- `status` made filterable (advanced-search `FILTER_FIELD_DEFS`) and
  quick-searchable (`SEARCH_FIELD_DEFS`) on both Contracts and Shipments,
  mirroring the backend's new filterable field.

## Verification

- `./harness/verify.sh`: lint, typecheck, structure, unit tests (131, up
  from 126), build, quality — all green.
- Live browser check against BE-kt-xnk (sample data already carries
  Status from the BE session): logged in as Nguyễn Văn A — contracts list
  shows "Đang thực hiện" for the sample Contract; the Shipment tab inside
  it shows "Đã book" (LCL) and "Đã hoàn thành" (FCL) correctly; the edit
  form's "Trạng thái hợp đồng" Selector opened with all 3 options and the
  currently-selected one checked, selecting "Đã hoàn thành" updated the
  field correctly (changes discarded afterward to leave sample data
  untouched — an unrelated pre-existing quirk, requiring the Seller field
  to be re-picked on every edit, blocked the save; not caused by this
  change and not investigated further here).
