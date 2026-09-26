import assert from 'node:assert/strict';
import test from 'node:test';

import {
  groupMeaning,
  matchingFee,
  recommendedFees,
} from './cost-item-templates.js';

const LOG_03 = 'log-03';
const LOG_05 = 'log-05';

/** @type {import('../types/index.js').ShipmentCostItemTemplate[]} */
const templates = [
  {
    id: '1',
    name: 'THC đầu xuất',
    nameEn: 'Origin THC',
    costCategoryId: LOG_03,
    defaultCostNature: 'Standard',
    occurrencePoint: 'Origin terminal',
    note: null,
    sortOrder: 1,
  },
  {
    id: '2',
    name: 'Demurrage tại cảng xuất',
    nameEn: 'Origin demurrage',
    costCategoryId: LOG_03,
    defaultCostNature: 'Abnormal',
    occurrencePoint: 'Origin port',
    note: 'Container nằm trong cảng quá free time.',
    sortOrder: 2,
  },
  {
    id: '3',
    name: 'THC đầu nhập',
    nameEn: 'Destination THC',
    costCategoryId: LOG_05,
    defaultCostNature: 'Standard',
    occurrencePoint: null,
    note: null,
    sortOrder: 1,
  },
];

test('recommendedFees keeps only the group, in order', () => {
  assert.deepEqual(
    recommendedFees(templates, LOG_03).map((fee) => fee.id),
    ['1', '2'],
  );
});

test('recommendedFees matches the English keyword and ignores dấu / case', () => {
  assert.deepEqual(
    recommendedFees(templates, LOG_03, 'DEMURRAGE').map((fee) => fee.id),
    ['2'],
  );
  assert.deepEqual(
    recommendedFees(templates, LOG_03, 'dau xuat').map((fee) => fee.id),
    ['1'],
  );
  assert.deepEqual(recommendedFees(templates, LOG_05, 'demurrage'), []);
});

test('matchingFee finds the named fee within the group only', () => {
  assert.equal(matchingFee(templates, LOG_03, ' THC đầu xuất ')?.id, '1');
  assert.equal(matchingFee(templates, LOG_05, 'THC đầu xuất'), undefined);
  assert.equal(matchingFee(templates, LOG_03, ''), undefined);
});

test('groupMeaning takes the part before "Flow:"', () => {
  assert.equal(
    groupMeaning(
      'Xử lý hàng tại cảng đến. Flow: Destination Port / Terminal. Chi phí…',
    ),
    'Xử lý hàng tại cảng đến',
  );
  assert.equal(groupMeaning('Ghi chú tự do'), 'Ghi chú tự do');
  assert.equal(groupMeaning(null), '');
});
