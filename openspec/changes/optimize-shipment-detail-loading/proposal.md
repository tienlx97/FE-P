# Optimize shipment detail loading

## Why
`/logistics/contract/[id]/shipment/[shipmentId]` fetched the whole contract's
shipment list (every cost line) to `.find()` one row, loaded the LOG cost
groups although only the Costs tab uses them, and refetched static reference
data (suppliers, cost groups) on every mount and focus (`staleTime` 0).

## What changes
- Fetch one shipment with the existing `GET /contracts/{id}/shipments/{shipmentId}`.
- Load cost groups only when the Costs tab is active.
- 5-minute `staleTime` for suppliers and cost groups.

## Out of scope (kept)
- Suppliers and schedule stay eager: the header journey, the transshipment
  legs and the Costs provider picker read them. Replacing the full supplier
  list by an id-batch lookup needs a new BE endpoint (follow-up).
