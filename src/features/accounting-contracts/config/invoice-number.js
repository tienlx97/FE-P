/**
 * Suggest the next suffix after the highest existing project invoice.
 * Gaps are not reused; legacy invoice numbers are left untouched.
 * @param {string} projectCode
 * @param {ReadonlyArray<{invoiceNumber: string}>} invoices
 */
export function nextInvoiceNumber(projectCode, invoices) {
  const prefix = `${projectCode.trim()}/HĐ-`;
  let highest = 0;
  for (const invoice of invoices) {
    if (!invoice.invoiceNumber.startsWith(prefix)) continue;
    const suffix = invoice.invoiceNumber.slice(prefix.length);
    if (/^\d+$/.test(suffix)) highest = Math.max(highest, Number(suffix));
  }
  return `${prefix}${String(highest + 1).padStart(2, '0')}`;
}
