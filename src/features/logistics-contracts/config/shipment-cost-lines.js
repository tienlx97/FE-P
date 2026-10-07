/**
 * Empty cost line form values. `amount` starts unset so the form shows an
 * empty field rather than 0.
 * @param {string} [costCategoryId]
 * @returns {import('../types/index.js').ShipmentCostLineFormValues}
 */
export function emptyCostLineValues(costCategoryId = '') {
  return {
    costCategoryId,
    name: '',
    amount: /** @type {number} */ (/** @type {unknown} */ (undefined)),
    quantity: 1,
    note: '',
    providerCustomerId: '',
    invoiceNumber: '',
    invoiceDate: '',
    costNature: 'Standard',
    paidOnBehalf: false,
    payeeName: '',
    reimbursedOn: '',
    reimbursementReference: '',
  };
}

/**
 * A saved cost line as form values (the shape the shipment PUT takes).
 * Every field round-trips, so resending a shipment never drops a cost
 * line's "chi hộ" payee or reimbursement.
 * @param {import('../types/index.js').ShipmentCostLine} cost
 * @returns {import('../types/index.js').ShipmentCostLineFormValues}
 */
export function costLineFormValues(cost) {
  return {
    costCategoryId: cost.costCategoryId,
    name: cost.name,
    amount: cost.amount,
    quantity: cost.quantity ?? 1,
    note: cost.note ?? '',
    providerCustomerId: cost.providerCustomerId ?? '',
    invoiceNumber: cost.invoiceNumber ?? '',
    invoiceDate: cost.invoiceDate ?? '',
    costNature: cost.costNature ?? 'Standard',
    paidOnBehalf: cost.paidOnBehalf ?? false,
    payeeName: cost.payeeName ?? '',
    reimbursedOn: cost.reimbursedOn ?? '',
    reimbursementReference: cost.reimbursementReference ?? '',
  };
}

/**
 * Splits a shipment's cost total into the suppliers' own services and the
 * fees they paid on our behalf ("chi hộ").
 * @param {Pick<import('../types/index.js').ShipmentCostLine, 'amount' | 'paidOnBehalf'>[]} costs
 */
export function costTotalsByPayment(costs) {
  let service = 0;
  let paidOnBehalf = 0;
  for (const cost of costs) {
    if (cost.paidOnBehalf) paidOnBehalf += cost.amount;
    else service += cost.amount;
  }
  return { service, paidOnBehalf, total: service + paidOnBehalf };
}
