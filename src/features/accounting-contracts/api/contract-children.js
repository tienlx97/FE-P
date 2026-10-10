import { blankToNull } from '../config/catalog-schemas.js';
import { accountingRequest } from './request.js';

/** @typedef {import('../types/index.js').AccountingResult<import('../types/index.js').AccountingContractDetail>} DetailResult */

/**
 * Every child change answers with the whole refreshed contract.
 * @param {string} contractId
 * @param {string} path e.g. `appendices/{id}`
 * @param {'POST' | 'PUT' | 'DELETE'} method
 * @param {unknown} [body]
 * @returns {Promise<DetailResult>}
 */
function send(contractId, path, method, body) {
  return accountingRequest(
    `/api/v1/accounting/contracts/${contractId}/${path}`,
    {
      method,
      body,
      errorMessage: 'Không thể lưu thay đổi của hợp đồng',
    },
  );
}

/** @param {import('../types/index.js').AccountingAppendixFormValues} values */
export function appendixBody(values) {
  return {
    type: values.type,
    valueBeforeTax:
      values.type === 'InfoChange' ? 0 : (values.valueBeforeTax ?? 0),
    taxRatePercent: values.taxRatePercent ?? null,
    signedDate: values.signedDate,
    buyerSigned: values.buyerSigned,
    sellerSigned: values.sellerSigned,
    note: blankToNull(values.note),
  };
}

/** @param {import('../types/index.js').AccountingInvoiceFormValues} values */
export function invoiceBody(values) {
  return {
    invoiceNumber: values.invoiceNumber.trim(),
    issuedDate: values.issuedDate,
    valueBeforeTax: values.valueBeforeTax,
    taxRatePercent: values.taxRatePercent ?? null,
    note: blankToNull(values.note),
  };
}

/** @param {import('../types/index.js').AccountingSubInstallmentFormValues} values */
export function subInstallmentBody(values) {
  return {
    kind: values.kind,
    percent: values.kind === 'Percent' ? values.percent : null,
    percentBasis: values.kind === 'Percent' ? values.percentBasis : null,
    valueBeforeTax: values.kind === 'Quantity' ? values.valueBeforeTax : null,
    taxRatePercent: values.taxRatePercent ?? null,
    actualPaidAmount: values.actualPaidAmount ?? null,
    condition: blankToNull(values.condition),
    paymentDate: values.paymentDate || null,
    status: values.status,
    note: blankToNull(values.note),
  };
}

/**
 * @typedef {{ kind: 'appendix', values: import('../types/index.js').AccountingAppendixFormValues, id?: string }
 *   | { kind: 'invoice', values: import('../types/index.js').AccountingInvoiceFormValues, id?: string }
 *   | { kind: 'installment', note: string, subInstallments?: import('../types/index.js').AccountingSubInstallmentFormValues[], id?: string, existingSubs?: {id: string, values: import('../types/index.js').AccountingSubInstallmentFormValues}[] }
 *   | { kind: 'sub', installmentId: string, values: import('../types/index.js').AccountingSubInstallmentFormValues, id?: string }
 *   | { kind: 'delete', path: string }} ChildChange
 */

/**
 * @param {string} contractId
 * @param {ChildChange} change
 * @returns {Promise<DetailResult>}
 */
export function saveContractChild(contractId, change) {
  switch (change.kind) {
    case 'appendix':
      return change.id
        ? send(
            contractId,
            `appendices/${change.id}`,
            'PUT',
            appendixBody(change.values),
          )
        : send(contractId, 'appendices', 'POST', appendixBody(change.values));
    case 'invoice':
      return change.id
        ? send(
            contractId,
            `invoices/${change.id}`,
            'PUT',
            invoiceBody(change.values),
          )
        : send(contractId, 'invoices', 'POST', invoiceBody(change.values));
    case 'installment':
      return change.id
        ? saveInstallmentRows(
            contractId,
            change.id,
            change.note,
            change.existingSubs ?? [],
          )
        : send(contractId, 'installments', 'POST', {
            note: blankToNull(change.note),
            subInstallments: (change.subInstallments ?? []).map(
              subInstallmentBody,
            ),
          });
    case 'sub': {
      const base = `installments/${change.installmentId}/sub-installments`;
      return change.id
        ? send(
            contractId,
            `${base}/${change.id}`,
            'PUT',
            subInstallmentBody(change.values),
          )
        : send(contractId, base, 'POST', subInstallmentBody(change.values));
    }
    case 'delete':
      return send(contractId, change.path, 'DELETE');
  }
}

/** Updates existing rows by ID, so retrying after a partial failure cannot create duplicates.
 * The backend offers separate PUTs, not an atomic stage update.
 * @param {string} contractId @param {string} stageId @param {string} note
 * @param {{id: string, values: import('../types/index.js').AccountingSubInstallmentFormValues}[]} rows
 * @param {typeof send} [request]
 * @returns {Promise<DetailResult>} */
export async function saveInstallmentRows(
  contractId,
  stageId,
  note,
  rows,
  request = send,
) {
  let result = await request(contractId, `installments/${stageId}`, 'PUT', {
    note: blankToNull(note),
  });
  if (!result.success) return result;
  for (const row of rows) {
    result = await request(
      contractId,
      `installments/${stageId}/sub-installments/${row.id}`,
      'PUT',
      subInstallmentBody(row.values),
    );
    if (!result.success)
      return {
        ...result,
        message: `Một phần thay đổi đã được lưu. ${result.message} Hãy kiểm tra và lưu lại để hoàn tất.`,
      };
  }
  return result;
}
