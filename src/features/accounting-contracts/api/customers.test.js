import assert from 'node:assert/strict';
import { test } from 'node:test';

import { customerBody } from './customers.js';

test('customer body trims and sends blanks as null', () => {
  assert.deepEqual(
    customerBody({
      name: ' A ',
      taxCode: ' 03 ',
      address: '',
      phone: ' ',
      email: '',
      contactPerson: 'B',
      note: '',
    }),
    {
      name: 'A',
      taxCode: '03',
      address: null,
      phone: null,
      email: null,
      contactPerson: 'B',
      note: null,
    },
  );
});
