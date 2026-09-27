import assert from 'node:assert/strict';
import test from 'node:test';

import {
  filterEvents,
  overviewEvents,
  overviewFilters,
  overviewGroups,
  shipmentPhase,
  shipmentRoute,
  shortPlace,
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
    placeOfLoading: 'Cảng Cát Lái',
    placeOfDischarge: 'Cảng Bangkok',
    placeOfDelivery: null,
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

/** @param {'Warning' | 'Danger'} severity @param {string} kind @param {number} days */
const alert = (severity, kind, days) =>
  /** @type {import('../types/index.js').ShipmentAlert} */ ({
    kind, severity, dueOn: null, days, containerNumber: null, side: null, freeTimeKind: null, containerCount: null,
  });

const TODAY = '2026-09-27';

test('phase follows actual, then estimated dates', () => {
  assert.equal(shipmentPhase(row()), 'unscheduled');
  assert.equal(shipmentPhase(row({ eta: '2026-10-25' })), 'waiting');
  assert.equal(shipmentPhase(row({ etd: '2026-10-10', actualDeparture: '2026-10-12' })), 'sailing');
  assert.equal(shipmentPhase(row({ actualDeparture: '2026-10-12', actualArrival: '2026-10-26' })), 'arrived');
});

test('ports shorten to their first part without "Cảng"', () => {
  assert.equal(shortPlace('Cảng Bangkok'), 'Bangkok');
  assert.equal(shortPlace('Huayyang Subdistrict, Klaeng District, Rayong Province - Thailand'), 'Huayyang Subdistrict');
  assert.equal(shortPlace(null), '?');
});

test('each day reads as standard term + shipment: ETD, ETA, cutoffs, LFD', () => {
  const events = overviewEvents(
    [
      row({
        etd: '2026-10-04',
        eta: '2026-10-20',
        siCutoff: '2026-10-01T17:00:00',
        cyCutoff: '2026-09-29T12:00:00',
        freeTimeLastDay: '2026-09-27',
        alerts: [alert('Warning', 'DepartureDelayed', 4)],
      }),
    ],
    TODAY,
  );
  assert.deepEqual(
    events.map((e) => [e.term, e.category, e.start, e.title]),
    [
      ['ETD', 'departure', '2026-10-04', 'ETD · 26KCT03/LOT-01 · KMTC → Bangkok · trễ 4 ngày'],
      ['ETA', 'arrival', '2026-10-20', 'ETA · 26KCT03/LOT-01 · KMTC · Bangkok'],
      ['Cutoff SI/VGM', 'deadline', '2026-10-01', 'Cutoff SI/VGM · 26KCT03/LOT-01 · 17:00'],
      ['Cutoff CY', 'deadline', '2026-09-29', 'Cutoff CY · 26KCT03/LOT-01 · 12:00'],
      ['LFD', 'deadline', '2026-09-27', 'LFD · 26KCT03/LOT-01'],
    ],
  );
});

test('without a carrier the route still shows', () => {
  const [departure] = overviewEvents([row({ shippingLine: null, etd: '2026-10-04' })], TODAY);
  assert.equal(departure.title, 'ETD · 26KCT03/LOT-01 · → Bangkok');
});

test('red = overdue (deadline past, or ETD / ETA past without the actual), on today with days', () => {
  const events = overviewEvents(
    [
      row({ etd: '2026-09-20', eta: '2026-09-25', cyCutoff: '2026-09-18T12:00:00', freeTimeLastDay: '2026-09-20' }),
      row({ shipmentId: 's2', shipmentCode: '26KCT03/LOT-02', actualDeparture: '2026-09-20', actualArrival: '2026-09-25' }),
    ],
    TODAY,
  );
  assert.deepEqual(
    events.map((e) => [e.id, e.category, e.start, e.title]),
    [
      ['dep:s1', 'overdue', TODAY, 'ETD · 26KCT03/LOT-01 · KMTC → Bangkok · quá 7 ngày'],
      ['arr:s1', 'overdue', TODAY, 'ETA · 26KCT03/LOT-01 · KMTC · Bangkok · quá 2 ngày'],
      ['cy:s1', 'overdue', TODAY, 'Cutoff CY · 26KCT03/LOT-01 · quá 9 ngày'],
      ['ft:s1', 'overdue', TODAY, 'LFD · 26KCT03/LOT-01 · quá 7 ngày'],
      ['dep:s2', 'departure', '2026-09-20', 'ATD · 26KCT03/LOT-02 · KMTC → Bangkok'],
      ['arr:s2', 'arrival', '2026-09-25', 'ATA · 26KCT03/LOT-02 · KMTC · Bangkok'],
    ],
  );
});

test('the header legend counts each kind and filters events', () => {
  const events = overviewEvents(
    [row({ etd: '2026-10-04', eta: '2026-10-20', freeTimeLastDay: '2026-09-20' })],
    TODAY,
  );
  assert.deepEqual(
    overviewFilters(events).map((f) => [f.label, f.count, f.tone]),
    [
      ['Tất cả', 3, null],
      ['ETD/ATD', 1, 'accent'],
      ['ETA/ATA', 1, 'success'],
      ['Cutoff/LFD', 0, 'warning'],
      ['Quá hạn', 1, 'danger'],
    ],
  );
  assert.deepEqual(filterEvents(events, 'overdue').map((e) => e.id), ['ft:s1']);
  assert.equal(filterEvents(events, 'all').length, 3);
});

test('drawer groups: attention first, unscheduled last, empty groups dropped', () => {
  const groups = overviewGroups([
    row({ shipmentId: 'a', etd: '2026-10-10' }),
    row({ shipmentId: 'b' }),
    row({ shipmentId: 'c', actualDeparture: '2026-10-01', alerts: [alert('Danger', 'FreeTimeOverdue', 2)] }),
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

test('the route adds the place of delivery when it is not the discharge port', () => {
  assert.equal(shipmentRoute(row()), 'Cảng Cát Lái → Cảng Bangkok');
  assert.equal(
    shipmentRoute(row({ placeOfDischarge: 'Bangkok Port', placeOfDelivery: 'Huayyang Subdistrict, Rayong' })),
    'Cảng Cát Lái → Bangkok Port → Huayyang Subdistrict, Rayong',
  );
  assert.equal(shipmentRoute(row({ placeOfDelivery: ' Cảng Bangkok ' })), 'Cảng Cát Lái → Cảng Bangkok');
  assert.equal(shipmentRoute(row({ placeOfLoading: null, placeOfDischarge: null })), '');
});
