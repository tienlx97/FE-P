import assert from 'node:assert/strict';
import test from 'node:test';

import {
  billOfLadingSteps,
  blankTransshipmentRow,
  transshipmentErrors,
  transshipmentRoute,
  transshipmentRows,
} from './shipment-documents.js';

test('B/L steps follow the B/L type', () => {
  const base = {
    billOfLadingType: null,
    blDraftReceivedOn: '2026-10-01',
    blIssuedOn: '2026-10-03',
    blReleasedOn: null,
    blReleaseReference: null,
  };
  assert.deepEqual(
    billOfLadingSteps({ ...base, billOfLadingType: 'Surrendered' }).map((step) => [step.label, step.date]),
    [
      ['B/L nháp', '2026-10-01'],
      ['B/L phát hành', '2026-10-03'],
      ['Telex release', null],
    ],
  );
  assert.equal(billOfLadingSteps(base).at(-1)?.label, 'Giao bộ chứng từ gốc');
  assert.equal(billOfLadingSteps({ ...base, billOfLadingType: 'SeawayBill' }).length, 2);
  assert.equal(billOfLadingSteps(null).length, 3);
});

test('transshipment rows round-trip and validate', () => {
  const [row] = transshipmentRows([
    { port: 'Singapore', vesselName: null, voyageNumber: '241E', eta: '2026-10-05', ata: null, etd: null, atd: null },
  ]);
  assert.equal(row.port, 'Singapore');
  assert.equal(row.vesselName, '');
  assert.equal(row.eta, '2026-10-05');

  const blank = blankTransshipmentRow();
  assert.notEqual(blank.rowKey, row.rowKey);
  assert.deepEqual(transshipmentErrors([row, { ...blank, voyageNumber: 'x'.repeat(51) }]), {
    [blank.rowKey]: { port: 'Vui lòng nhập cảng', voyageNumber: 'Tối đa 50 ký tự' },
  });
});

test('route goes through the transshipment ports', () => {
  assert.equal(
    transshipmentRoute('VNSGN', [{ port: 'Singapore' }, { port: 'Port Klang' }].map((leg) => ({
      ...leg, vesselName: null, voyageNumber: null, eta: null, ata: null, etd: null, atd: null,
    })), 'THBKK'),
    'VNSGN → Singapore → Port Klang → THBKK',
  );
  assert.equal(transshipmentRoute('VNSGN', [], 'THBKK'), 'VNSGN → THBKK');
});
