/**
 * Saved records → the form values their PUT takes: the drawers start from
 * these, and a quick edit sends one of them back with a single field
 * changed. Only typed values are carried; a computed one stays undefined
 * (sent as null) so the backend keeps computing it.
 */

/**
 * @param {import('../types/index.js').AccountingContractSummary | null} contract
 * @param {string} defaultCompanyId
 * @returns {import('../types/index.js').AccountingContractFormValues}
 */
export function contractFormValues(contract, defaultCompanyId) {
  return {
    companyId: contract?.companyId ?? defaultCompanyId,
    contractNumber: contract?.contractNumber ?? '',
    signedDate: contract?.signedDate ?? '',
    projectCode: contract?.projectCode ?? '',
    projectName: contract?.projectName ?? '',
    sourceId: contract?.sourceId ?? '',
    customerId: contract?.customerId ?? '',
    valueBeforeTax: contract?.valueBeforeTax,
    taxRatePercent: contract?.taxRatePercent ?? 8,
    valueAfterTax: contract?.isValueAfterTaxManual
      ? contract.valueAfterTax
      : undefined,
    paymentDueDate: contract?.paymentDueDate ?? '',
    note: contract?.note ?? '',
  };
}

/**
 * A new invoice starts empty except the contract's tax rate.
 * @param {import('../types/index.js').AccountingInvoice | null} invoice
 * @param {number} contractTaxRatePercent
 * @returns {import('../types/index.js').AccountingInvoiceFormValues}
 */
export function invoiceFormValues(invoice, contractTaxRatePercent) {
  return {
    invoiceNumber: invoice?.invoiceNumber ?? '',
    issuedDate: invoice?.issuedDate ?? '',
    valueBeforeTax: invoice?.valueBeforeTax,
    taxRatePercent: invoice?.taxRatePercent ?? contractTaxRatePercent,
    valueAfterTax: invoice?.isValueAfterTaxManual
      ? invoice.valueAfterTax
      : undefined,
    note: invoice?.note ?? '',
  };
}

/**
 * A new appendix starts at the contract's tax rate; it can be changed.
 * @param {import('../types/index.js').AccountingAppendix | null} appendix
 * @param {number} contractTaxRatePercent
 * @returns {import('../types/index.js').AccountingAppendixFormValues}
 */
export function appendixFormValues(appendix, contractTaxRatePercent) {
  return {
    type: appendix?.type ?? 'Increase',
    valueBeforeTax:
      appendix && appendix.type !== 'InfoChange'
        ? appendix.valueBeforeTax
        : undefined,
    taxRatePercent: appendix?.taxRatePercent ?? contractTaxRatePercent,
    valueAfterTax: appendix?.isValueAfterTaxManual
      ? appendix.valueAfterTax
      : undefined,
    signedDate: appendix?.signedDate ?? '',
    buyerSigned: appendix?.buyerSigned ?? false,
    sellerSigned: appendix?.sellerSigned ?? false,
    note: appendix?.note ?? '',
  };
}

/**
 * What a quick edit stores: nothing typed, or the computed value typed
 * again, means "computed" (undefined → null in the body).
 * @param {number | undefined} draft
 * @param {number | undefined} computed
 */
export function typedOrComputed(draft, computed) {
  return draft === undefined || draft === computed ? undefined : draft;
}
