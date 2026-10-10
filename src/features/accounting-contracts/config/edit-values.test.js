import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  appendixFormValues,
  contractFormValues,
  invoiceFormValues,
  typedOrComputed,
} from './edit-values.js';

test('a new invoice starts empty except the contract tax rate', () => {
  const values = invoiceFormValues(null, 10);
  assert.equal(values.valueBeforeTax, undefined);
  assert.equal(values.valueAfterTax, undefined);
  assert.equal(values.taxRatePercent, 10);
  assert.equal(values.invoiceNumber, '');
});

test('saved records carry only typed values back to the form', () => {
  const invoice = {
    id: 'i',
    invoiceNumber: '01',
    issuedDate: '2026-03-01',
    valueBeforeTax: 114_311.83,
    taxRatePercent: 8,
    valueAfterTax: 123_457,
    isValueAfterTaxManual: true,
    note: null,
  };
  assert.equal(invoiceFormValues(invoice, 10).valueAfterTax, 123_457);
  assert.equal(invoiceFormValues(invoice, 10).taxRatePercent, 8);
  assert.equal(
    invoiceFormValues({ ...invoice, isValueAfterTaxManual: false }, 10)
      .valueAfterTax,
    undefined,
  );

  const appendix = {
    id: 'a',
    type: /** @type {const} */ ('Increase'),
    valueBeforeTax: 10_000_000,
    taxRatePercent: 8,
    valueAfterTax: 10_800_001,
    isValueAfterTaxManual: true,
    signedDate: '2026-02-01',
    buyerSigned: true,
    sellerSigned: false,
    note: null,
  };
  assert.equal(appendixFormValues(appendix, 10).valueAfterTax, 10_800_001);
  assert.equal(
    appendixFormValues({ ...appendix, type: 'InfoChange' }, 10).valueBeforeTax,
    undefined,
  );

  const contract =
    /** @type {import('../types/index.js').AccountingContractSummary} */ ({
      id: 'c',
      companyId: 'co',
      contractNumber: 'HD',
      signedDate: '2026-01-01',
      projectCode: 'CT',
      projectName: 'P',
      sourceId: null,
      customerId: 'k',
      valueBeforeTax: 100,
      taxRatePercent: 8,
      valueAfterTax: 108,
      isValueAfterTaxManual: false,
      paymentDueDate: null,
      note: null,
    });
  assert.equal(contractFormValues(contract, 'x').valueAfterTax, undefined);
  assert.equal(contractFormValues(contract, 'x').companyId, 'co');
  assert.equal(contractFormValues(null, 'x').companyId, 'x');
});

test('a quick edit equal to the computed value means computed', () => {
  assert.equal(typedOrComputed(123_457, 123_456.78), 123_457);
  assert.equal(typedOrComputed(123_456.78, 123_456.78), undefined);
  assert.equal(typedOrComputed(undefined, 123_456.78), undefined);
});
