/**
 * Fixed Incoterms 2020 rule set — mirrors the backend's
 * `CompanyManagement.Domain.Contracts.Incoterm` enum (BE-kt-xnk) exactly, so
 * the string sent in `CreateContractRequest.Incoterm` round-trips without a
 * mapping layer.
 * @type {import('../types/index.js').Incoterm[]}
 */
export const INCOTERM_CODES = ['EXW', 'FOB', 'CIF', 'DDP'];

export const incotermOptions = INCOTERM_CODES.map((code) => ({
  value: code,
  label: code,
}));

/**
 * Every Incoterm names a destination port (`Contract.placeOfDischarge`,
 * always required — user request, 2026-09-25). DDP alone also delivers on
 * from the port to the buyer's site (e.g. the construction site), so only
 * DDP carries `Contract.placeOfDelivery` — required there, cleared and
 * sent as `null` otherwise. Mirrors BE-kt-xnk
 * `ContractRules.RequiresPlaceOfDelivery`.
 * @param {import('../types/index.js').Incoterm | ''} incoterm
 * @returns {boolean}
 */
export function requiresPlaceOfDelivery(incoterm) {
  return incoterm === 'DDP';
}
