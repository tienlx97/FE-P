import assert from 'node:assert/strict';
import { test } from 'node:test';

import { blankToNull, sourceSchema } from './catalog-schemas.js';

test('source needs a name', () => {
  assert.equal(sourceSchema.safeParse({ name: ' ', note: '' }).success, false);
  assert.equal(
    sourceSchema.safeParse({ name: 'Ban QLDA', note: '' }).success,
    true,
  );
});

test('blankToNull trims and turns blank into null', () => {
  assert.equal(blankToNull('  '), null);
  assert.equal(blankToNull(' a '), 'a');
});
