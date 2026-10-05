import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  formatFigure,
  invoiceValueVnd,
  invoiceValueVndTotal,
  missingRateNote,
  sumFigure,
} from './shipment-figures.js';

const rated = { invoiceValue: 100, declarationExchangeRate: 25_000 };
const unrated = { invoiceValue: 300, declarationExchangeRate: null };

test('VNĐ invoice value needs the declaration rate', () => {
  assert.equal(invoiceValueVnd(rated), 2_500_000);
  assert.equal(invoiceValueVnd(unrated), null);
});
test('VNĐ total skips and counts unrated shipments', () => {
  assert.deepEqual(invoiceValueVndTotal([rated, unrated, rated]), {
    total: 5_000_000,
    missingRateCount: 1,
  });
  assert.equal(missingRateNote(1), 'chưa gồm 1 lô chưa có tỷ giá');
  assert.equal(missingRateNote(0), '');
});
test('nullable figures sum and format without turning into 0 or "null"', () => {
  assert.equal(
    sumFigure([{ kg: 1000 }, { kg: null }, { kg: 500 }], (row) => row.kg),
    1500,
  );
  assert.equal(formatFigure(null, String), '—');
  assert.equal(formatFigure(0.5, String), '0.5');
});
