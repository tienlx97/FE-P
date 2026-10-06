import assert from 'node:assert/strict';
import { test } from 'node:test';

import { placeWithoutPortWord } from './place-options.js';

test('drops only a leading "Cảng"', () => {
  assert.equal(
    placeWithoutPortWord('Cảng Laem Chabang, Thailand'),
    'Laem Chabang, Thailand',
  );
  assert.equal(placeWithoutPortWord('cảng  Busan'), 'Busan');
  assert.equal(placeWithoutPortWord('Bangkok'), 'Bangkok');
  assert.equal(placeWithoutPortWord('Cảngxyz'), 'Cảngxyz');
  assert.equal(placeWithoutPortWord('Kho Cảng Cát Lái'), 'Kho Cảng Cát Lái');
});
