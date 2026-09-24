/**
 * The commission detail page — one commission per contract, so it lives
 * under the contract's own route.
 * @param {string} contractId
 * @param {'overview' | 'payments' | 'annexes'} [tab]
 */
export function commissionDetailHref(contractId, tab) {
  const base = `/logistics/contract/${contractId}/commission`;
  return tab ? `${base}?tab=${tab}` : base;
}
