import assert from 'node:assert/strict';
import test from 'node:test';

import {
  overviewEvents,
  overviewGroups,
  shipmentFromEventText,
  shipmentPhase,
} from './shipment-overview-schedule.js';

/** @returns {import('../types/index.js').ShipmentOverview} */
function row(overrides = {}) {
  return {
    contractId: 'c1',
    contractNumber: '26KCT03',
    buyerName: 'ABC',
    incoterm: 'CIF',
    shipmentId: 's1',
    shipmentCode: '26KCT03/LOT-01',
    shipmentName: 'Lô 1',
    type: 'FCL',
    status: 'Booked',
    journeySummary: '',
    bookingNumber: 'BK',
    shippingLine: 'KMTC',
    vesselName: null,
    voyageNumber: null,
    placeOfLoading: 'Hai Phong',
    placeOfDischarge: 'Bangkok',
    etd: null,
    eta: null,
    actualDeparture: null,
    actualArrival: null,
    siCutoff: null,
    cyCutoff: null,
    freeTimeLastDay: null,
    containerCount: 0,
    alerts: [],
    ...overrides,
  };
}

const danger = /** @type {import('../types/index.js').ShipmentAlert} */ ({
  kind: 'FreeTimeOverdue', severity: 'Danger', dueOn: '2026-10-01', days: 2, containerNumber: null, side: null, freeTimeKind: null, containerCount: null,
});

test('phase follows actual, then estimated dates', () => {
  assert.equal(shipmentPhase(row()), 'unscheduled');
  assert.equal(shipmentPhase(row({ eta: '2026-10-25' })), 'waiting');
  assert.equal(shipmentPhase(row({ etd: '2026-10-10', actualDeparture: '2026-10-12' })), 'sailing');
  assert.equal(shipmentPhase(row({ actualDeparture: '2026-10-12', actualArrival: '2026-10-26' })), 'arrived');
});

test('a bar runs from departure to arrival, actual first; deadlines are one-day events', () => {
  const events = overviewEvents(
    [
      row({ etd: '2026-10-10', eta: '2026-10-25', actualDeparture: '2026-10-12', siCutoff: '2026-10-07T17:00:00', freeTimeLastDay: '2026-10-20' }),
      row({ shipmentId: 's2', shipmentCode: '26KCT03/LOT-02', etd: '2026-10-15', eta: '2026-10-05', cyCutoff: '2026-10-13T12:00:00', freeTimeLastDay: '2026-09-20' }),
      row({ shipmentId: 's3', shipmentCode: '26KCT03/LOT-03' }),
    ],
    '2026-09-27',
  );
  assert.deepEqual(
    events.map((e) => [e.id, e.category, e.start, e.end]),
    [
      ['ship:s1', 'sailing', '2026-10-12', '2026-10-25'],
      ['ft:s1', 'freeTime', '2026-10-20', '2026-10-20'],
      ['ship:s2', 'waiting', '2026-10-15', '2026-10-15'],
      ['cy:s2', 'cutoff', '2026-10-13', '2026-10-13'],
      ['ft:s2', 'attention', '2026-09-20', '2026-09-20'],
    ],
  );
  assert.equal(events[0].title, '26KCT03/LOT-01 · KMTC · Hai Phong → Bangkok');
  assert.equal(events[3].title, '26KCT03/LOT-02 · Cut-off hạ bãi');
});

test('a shipment with a danger alert is drawn as "Cần chú ý"', () => {
  assert.equal(overviewEvents([row({ etd: '2026-10-10', alerts: [danger] })], '2026-09-27')[0].category, 'attention');
});

test('a clicked event maps back to its shipment by code, longest code first', () => {
  const rows = [row({ shipmentCode: '26KCT03/LOT-01' }), row({ shipmentId: 's10', shipmentCode: '26KCT03/LOT-010' })];
  assert.equal(shipmentFromEventText('26KCT03/LOT-010 · KMTC', rows)?.shipmentId, 's10');
  assert.equal(shipmentFromEventText('26KCT03/LOT-01 · Hết free time', rows)?.shipmentId, 's1');
  assert.equal(shipmentFromEventText('Tháng 10', rows), null);
});

test('drawer groups: attention first, unscheduled last, empty groups dropped', () => {
  const groups = overviewGroups([
    row({ shipmentId: 'a', etd: '2026-10-10' }),
    row({ shipmentId: 'b' }),
    row({ shipmentId: 'c', actualDeparture: '2026-10-01', alerts: [danger] }),
  ]);
  assert.deepEqual(
    groups.map((g) => [g.label, g.rows.map((r) => r.shipmentId)]),
    [
      ['Cần chú ý', ['c']],
      ['Chờ tàu chạy', ['a']],
      ['Chưa có lịch tàu', ['b']],
    ],
  );
});
