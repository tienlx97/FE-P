import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveTableSizes } from './tanstack-table-columns.js';

test('fixed action columns keep their width; proportional columns fill remaining space', () => {
  const columns = [
    { key: 'name', width: { type: 'proportional', value: 1 } },
    { key: 'value', width: { type: 'proportional', value: 2 } },
    { key: 'actions', width: { type: 'pixel', value: 140 } },
  ];
  assert.deepEqual(
    resolveTableSizes(columns, ['name', 'value', 'actions'], 680),
    { name: 220, value: 320, actions: 140 },
  );
  assert.deepEqual(resolveTableSizes(columns, ['name', 'actions'], 100), {
    name: 120,
    actions: 140,
  });
  assert.deepEqual(resolveTableSizes(columns, ['actions'], 900), {
    actions: 140,
  });
});

test('hidden columns consume no width; defaults and custom minima survive narrow screens', () => {
  assert.deepEqual(
    resolveTableSizes(
      [
        { key: 'name' },
        {
          key: 'value',
          width: { type: 'proportional', value: 1, minWidth: 180 },
        },
        { key: 'hidden', width: { type: 'pixel', value: 300 } },
      ],
      ['name', 'value'],
      200,
    ),
    { name: 120, value: 180 },
  );
  assert.deepEqual(resolveTableSizes([], [], 1000), {});
});
