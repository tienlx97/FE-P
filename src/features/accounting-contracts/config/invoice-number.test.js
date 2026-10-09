import assert from 'node:assert/strict';
import { test } from 'node:test';

import { nextInvoiceNumber } from './invoice-number.js';

test('project invoice starts at 01 and advances past gaps without reusing numbers', () => {
  assert.equal(nextInvoiceNumber('26KCT10', []), '26KCT10/HĐ-01');
  assert.equal(
    nextInvoiceNumber('26KCT10', [
      { invoiceNumber: '26KCT10/HĐ-01' },
      { invoiceNumber: '26KCT10/HĐ-03' },
      { invoiceNumber: '26KCT11/HĐ-99' },
      { invoiceNumber: 'legacy-invoice' },
      { invoiceNumber: '26KCT10/HĐ-12x' },
    ]),
    '26KCT10/HĐ-04',
  );
  assert.equal(
    nextInvoiceNumber(' 26KCT10 ', [{ invoiceNumber: '26KCT10/HĐ-99' }]),
    '26KCT10/HĐ-100',
  );
});
