import assert from 'node:assert/strict';
import { test } from 'node:test';

import { toAccountingCustomer } from './customers.js';

test('a shared customer reads as the accounting customer shape', () => {
  assert.deepEqual(
    toAccountingCustomer({
      id: 'c1',
      companyName: 'Công ty A',
      address: '12 Lê Lợi',
      representativeName: 'Ông B',
      profile: {
        code: 'KH-01',
        taxCode: '0312',
        phone: '090',
        contactName: '',
        contactEmail: 'kt@a.vn',
        notes: null,
      },
    }),
    {
      id: 'c1',
      code: 'KH-01',
      name: 'Công ty A',
      taxCode: '0312',
      address: '12 Lê Lợi',
      phone: '090',
      email: 'kt@a.vn',
      contactPerson: 'Ông B',
      note: null,
    },
  );
});

test('missing profile values become null', () => {
  const customer = toAccountingCustomer({ id: 'c2', companyName: 'B' });
  assert.equal(customer.taxCode, null);
  assert.equal(customer.contactPerson, null);
});
