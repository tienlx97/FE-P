# Wire the contract review backend changes

## Why

The backend (BE-P, 2026-09-30) added party kinds and per-shipment
Consignee/Notify overrides, T/T or L/C per payment term, company-scoped
contract numbers and commission codes, a commission summary on contract
detail, and contract / shipment goods lines. The contract form here also
**loses data today**: it always sends `NotifyParty: null, Consignee: null`
(wiping both on every save) and sends no `PaymentType` (turning L/C terms
back into T/T).

## What changes

- Contract form: Consignee / Notify Party cards (kind, name, address; extra
  fields and catalog link preserved) and a T/T | L/C choice per payment
  term; overview shows the B/L wording (`displayName`).
- Duplicate checks pass `companyId` (contract number) and `contractId`
  (commission code).
- Contract goods lines: table in the form, shipped / remaining on detail.
- Shipment form: carried goods lines and Consignee / Notify override
  ("Theo hợp đồng" / "Tùy chỉnh").
- Commission summary from contract detail where it saves a request.
