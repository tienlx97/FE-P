export {};

/**
 * "Nguồn" — where a contract's project file came from (BE-P `AccountingSource`).
 * @typedef {Object} AccountingSource
 * @property {string} id
 * @property {string} name
 * @property {string | null} note
 */

/** @typedef {{ name: string, note: string }} AccountingSourceFormValues */

/**
 * A customer of the shared directory (`/api/v1/customers`, same as
 * Logistics), in the shape the accounting screens use.
 * @typedef {Object} AccountingCustomer
 * @property {string} id
 * @property {string | null} code
 * @property {string} name
 * @property {string | null} taxCode
 * @property {string | null} address
 * @property {string | null} phone
 * @property {string | null} email
 * @property {string | null} contactPerson
 * @property {string | null} note
 */

/** @typedef {{ id: string, name: string }} Company */

/** @typedef {'Increase' | 'Decrease' | 'InfoChange'} AppendixType */
/** @typedef {'Percent' | 'Quantity'} PaymentKind */
/** @typedef {'Planned' | 'Paid'} PaymentStatus */

/**
 * One contract row: header plus every value the backend derives on read.
 * @typedef {Object} AccountingContractSummary
 * @property {string} id
 * @property {string} companyId
 * @property {string} contractNumber
 * @property {string} signedDate
 * @property {string} projectCode
 * @property {string} projectName
 * @property {string | null} sourceId
 * @property {string | null} sourceName
 * @property {string} customerId
 * @property {string | null} customerName
 * @property {number} valueBeforeTax
 * @property {number} taxRatePercent
 * @property {number} valueAfterTax
 * @property {number} settlementValue
 * @property {number} invoicedValue
 * @property {number} remainingToInvoice
 * @property {number} paidValue
 * @property {number} unpaidValue
 * @property {string | null} paymentDueDate
 * @property {number | null} overdueDays
 * @property {string | null} note
 * @property {number} version
 */

/**
 * @typedef {Object} AccountingAppendix
 * @property {string} id
 * @property {AppendixType} type
 * @property {number} valueBeforeTax
 * @property {number} valueAfterTax At the contract's tax rate (backend-derived).
 * @property {string} signedDate
 * @property {boolean} buyerSigned
 * @property {boolean} sellerSigned
 * @property {string | null} note
 */

/**
 * @typedef {Object} AccountingInvoice
 * @property {string} id
 * @property {string} invoiceNumber
 * @property {string} issuedDate
 * @property {number} valueBeforeTax
 * @property {number} taxRatePercent The invoice's own rate (the contract's by default).
 * @property {number} valueAfterTax
 * @property {string | null} note
 */

/**
 * "Đợt thanh toán con" — `code` is "2.1".
 * @typedef {Object} AccountingSubInstallment
 * @property {string} id
 * @property {number} number
 * @property {string} code
 * @property {PaymentKind} kind
 * @property {number | null} percent
 * @property {number} valueBeforeTax Percent: contract value before tax × percent; Quantity: entered.
 * @property {number} taxRatePercent The payment's own rate (the contract's by default).
 * @property {number} valueAfterTax
 * @property {number | null} actualPaidAmount "Giá trị thực tế thanh toán"; the contract's paid value sums these.
 * @property {string | null} condition
 * @property {string | null} paymentDate
 * @property {PaymentStatus} status
 * @property {string | null} note
 */

/**
 * @typedef {Object} AccountingInstallment
 * @property {string} id
 * @property {number} number
 * @property {string | null} note
 * @property {number} amount Σ its payments' value after tax.
 * @property {number} paidAmount Σ its payments' actual paid amount.
 * @property {AccountingSubInstallment[]} subInstallments
 */

/**
 * @typedef {Object} AccountingContractDetail
 * @property {AccountingContractSummary} contract
 * @property {AccountingAppendix[]} appendices
 * @property {AccountingInvoice[]} invoices
 * @property {AccountingInstallment[]} installments
 */

/**
 * @typedef {Object} AccountingContractFormValues
 * @property {string} companyId
 * @property {string} contractNumber
 * @property {string} signedDate
 * @property {string} projectCode
 * @property {string} projectName
 * @property {string} sourceId
 * @property {string} customerId
 * @property {number | undefined} valueBeforeTax
 * @property {number | undefined} taxRatePercent
 * @property {string} paymentDueDate
 * @property {string} note
 */

/**
 * @typedef {Object} AccountingAppendixFormValues
 * @property {AppendixType | ''} type
 * @property {number | undefined} valueBeforeTax
 * @property {string} signedDate
 * @property {boolean} buyerSigned
 * @property {boolean} sellerSigned
 * @property {string} note
 */

/**
 * @typedef {Object} AccountingInvoiceFormValues
 * @property {string} invoiceNumber
 * @property {string} issuedDate
 * @property {number | undefined} valueBeforeTax
 * @property {number | undefined} taxRatePercent
 * @property {string} note
 */

/**
 * @typedef {Object} AccountingSubInstallmentFormValues
 * @property {PaymentKind} kind
 * @property {number | undefined} percent
 * @property {number | undefined} valueBeforeTax Quantity only.
 * @property {number | undefined} taxRatePercent
 * @property {number | undefined} actualPaidAmount
 * @property {string} condition
 * @property {string} paymentDate
 * @property {PaymentStatus} status
 * @property {string} note
 */

/**
 * @template T
 * @typedef {{ success: true, data: T } | { success: false, message: string }} AccountingResult
 */
