import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  commissionTrail,
  contractTrail,
  shipmentTrail,
  supplierTrail,
} from './breadcrumbs.js';

test('contract trail falls back to the contracts list', () => {
  const trail = contractTrail({ contractNumber: '26KCT10' });
  assert.deepEqual(
    trail.items.map((item) => item.label),
    ['Logistics', 'Hợp đồng', '26KCT10'],
  );
  assert.equal(trail.items.at(-1)?.href, undefined);
  assert.equal(trail.fallbackHref, '/logistics/contracts');
});

test('shipment trail goes through its contract and falls back to it', () => {
  const trail = shipmentTrail({
    contractId: 'c1',
    contractNumber: '26KCT10',
    shipmentCode: '26KCT10/LOT-03',
  });
  assert.deepEqual(trail.items[2], {
    label: '26KCT10',
    href: '/logistics/contract/c1?tab=shipments',
  });
  assert.equal(trail.fallbackHref, '/logistics/contract/c1?tab=shipments');
});

test('commission trail falls back to the contract commission tab', () => {
  const trail = commissionTrail({ contractId: 'c1', contractNumber: 'X' });
  assert.equal(trail.items.at(-1)?.label, 'Commission');
  assert.equal(trail.fallbackHref, '/logistics/contract/c1?tab=commission');
});

test('trails show a placeholder while data loads', () => {
  assert.equal(supplierTrail({}).items.at(-1)?.label, '…');
  assert.equal(supplierTrail({}).fallbackHref, '/logistics/suppliers');
});
