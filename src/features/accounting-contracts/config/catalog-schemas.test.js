import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  blankToNull,
  customerSchema,
  sourceSchema,
} from './catalog-schemas.js';

const customer = {
  name: 'Công ty A',
  taxCode: '',
  address: '',
  phone: '',
  email: '',
  contactPerson: '',
  note: '',
};

test('source needs a name', () => {
  assert.equal(sourceSchema.safeParse({ name: ' ', note: '' }).success, false);
  assert.equal(
    sourceSchema.safeParse({ name: 'Ban QLDA', note: '' }).success,
    true,
  );
});

test('customer email is optional but must be valid when given', () => {
  assert.equal(customerSchema.safeParse(customer).success, true);
  assert.equal(
    customerSchema.safeParse({ ...customer, email: 'sai' }).success,
    false,
  );
  assert.equal(
    customerSchema.safeParse({ ...customer, email: 'kt@example.com' }).success,
    true,
  );
});

test('blankToNull trims and turns blank into null', () => {
  assert.equal(blankToNull('  '), null);
  assert.equal(blankToNull(' a '), 'a');
});
