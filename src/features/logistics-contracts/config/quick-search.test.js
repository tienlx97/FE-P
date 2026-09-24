import assert from 'node:assert/strict';
import test from 'node:test';

import {
  matchesLotSuffix,
  parseQuickSearchQuery,
  rankExactFirst,
} from './quick-search.js';

test('a bare code is a contract term, case-insensitive', () => {
  assert.deepEqual(parseQuickSearchQuery('  26kct14 '), {
    contractTerm: '26KCT14',
    lot: null,
  });
});

test('blank or slash-only queries look nothing up', () => {
  assert.equal(parseQuickSearchQuery(''), null);
  assert.equal(parseQuickSearchQuery('   '), null);
  assert.equal(parseQuickSearchQuery('/LOT-1'), null);
});

test('lot suffixes parse with or without dash and padding', () => {
  for (const query of [
    '26KCT14/LOT-1',
    '26kct14/lot1',
    '26KCT14/LOT-01',
    '26KCT14 / LOT 01',
    '26KCT14/FCL-1',
  ]) {
    assert.deepEqual(parseQuickSearchQuery(query), {
      contractTerm: '26KCT14',
      lot: { prefix: 'LOT', number: 1 },
    });
  }

  assert.deepEqual(parseQuickSearchQuery('26KCT14/lcl-2'), {
    contractTerm: '26KCT14',
    lot: { prefix: 'LCL', number: 2 },
  });
  assert.deepEqual(parseQuickSearchQuery('26KCT14/'), {
    contractTerm: '26KCT14',
    lot: { prefix: null, number: null },
  });
  assert.deepEqual(parseQuickSearchQuery('26KCT14/3'), {
    contractTerm: '26KCT14',
    lot: { prefix: null, number: 3 },
  });
});

test('a suffix that cannot be a shipment code looks nothing up', () => {
  assert.equal(parseQuickSearchQuery('26KCT14/AN-1'), null);
});

test('matchesLotSuffix compares type and number', () => {
  const lot1 = { prefix: /** @type {'LOT'} */ ('LOT'), number: 1 };
  assert.equal(matchesLotSuffix('26KCT14/LOT-01', lot1), true);
  assert.equal(matchesLotSuffix('26KCT14/LOT-10', lot1), false);
  assert.equal(matchesLotSuffix('26KCT14/LCL-01', lot1), false);
  assert.equal(
    matchesLotSuffix('26KCT14/LCL-01', { prefix: null, number: 1 }),
    true,
  );
  assert.equal(
    matchesLotSuffix('26KCT14/LCL-07', { prefix: 'LCL', number: null }),
    true,
  );
  assert.equal(matchesLotSuffix('26KCT14/LOT-01', null), true);
});

test('rankExactFirst puts the exact code first, keeps the rest in order', () => {
  const codes = ['26KCT14', '26KCT1', '26KCT15'];
  assert.deepEqual(
    rankExactFirst(codes, (code) => code, '26KCT1'),
    ['26KCT1', '26KCT14', '26KCT15'],
  );
});
