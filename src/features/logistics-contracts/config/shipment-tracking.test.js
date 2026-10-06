import assert from 'node:assert/strict';
import test from 'node:test';

import {
  carrierSourcedDates,
  discrepancyTargetLabel,
  formatDateTime,
  isCarrierCutoff,
  trackingEventLabel,
  trackingStatus,
  trackingSubtitle,
} from './shipment-tracking.js';

/** @returns {import('../types/index.js').ShipmentTracking} */
function tracking(overrides = {}) {
  return {
    carrier: { code: 'KMTC', name: 'KMTC' },
    adapter: {
      carrier: { code: 'KMTC', name: 'KMTC' },
      enabled: true,
      activeVersion: 'v2',
      isImplemented: true,
      source: 'test',
      versions: ['v1', 'v2'],
    },
    sync: {
      carrierCode: 'KMTC',
      adapterVersion: 'v2',
      status: 'Synced',
      lastAttemptAt: '2026-09-27T07:05:00Z',
      lastSyncedAt: '2026-09-27T07:05:00Z',
      lastError: null,
      lastCarrierEtd: null,
      lastCarrierEta: null,
    },
    discrepancies: [],
    events: [],
    ...overrides,
  };
}

test('status follows carrier, adapter and last sync', () => {
  assert.deepEqual(
    [trackingStatus(tracking({ carrier: null, adapter: null, sync: null })).label, trackingStatus(tracking({ carrier: null })).canSync],
    ['Chưa nhận ra hãng tàu', false],
  );
  const placeholder = trackingStatus(
    tracking({ adapter: { ...tracking().adapter, activeVersion: 'v1', isImplemented: false } }),
  );
  assert.equal(placeholder.label, 'Chưa kết nối');
  assert.match(placeholder.hint ?? '', /adapter v1/);
  assert.equal(trackingStatus(tracking({ sync: null })).label, 'Chưa đồng bộ');
  assert.deepEqual(
    trackingStatus(tracking({ sync: { ...tracking().sync, status: 'Failed', lastError: 'Trang đổi bố cục' } })),
    { label: 'Lỗi đồng bộ', tone: 'danger', hint: 'Trang đổi bố cục', canSync: true },
  );
  assert.equal(trackingStatus(tracking()).tone, 'success');
  const withDiscrepancy = tracking({
    discrepancies: [
      { id: '1', field: 'ActualDeparture', containerNumber: null, legSequence: null, currentValue: '2026-10-06', carrierValue: '2026-10-05', carrierDepot: null, detectedAt: '' },
    ],
  });
  assert.deepEqual([trackingStatus(withDiscrepancy).label, trackingStatus(withDiscrepancy).tone], ['Hãng tàu báo khác: 1', 'warning']);
});

test('subtitle names carrier, adapter version and last sync in Vietnam time', () => {
  assert.equal(trackingSubtitle(tracking()), 'KMTC · adapter v2 · Đồng bộ lúc 27/09/2026 14:05');
  assert.equal(formatDateTime('2026-09-27T20:30:00'), '28/09/2026 03:30');
});

test('discrepancy targets name the container or the leg', () => {
  const base = { id: '1', currentValue: null, carrierValue: '2026-10-05', carrierDepot: null, detectedAt: '' };
  assert.equal(
    discrepancyTargetLabel({ ...base, field: 'EmptyPickedUpOn', containerNumber: 'TCLU1234567', legSequence: null }),
    'Ngày lấy rỗng · TCLU1234567',
  );
  assert.equal(
    discrepancyTargetLabel({ ...base, field: 'TransshipmentAta', containerNumber: null, legSequence: 1 }, [
      { port: 'Singapore', vesselName: null, voyageNumber: null, eta: null, ata: null, etd: null, atd: null },
    ]),
    'ATA chuyển tải · chặng 1 (Singapore)',
  );
  assert.equal(discrepancyTargetLabel({ ...base, field: 'ActualArrival', containerNumber: null, legSequence: null }), 'ATA');
});

test('events read like the plan table', () => {
  /** @type {Pick<import('../types/index.js').ShipmentTrackingEvent, 'code' | 'isEmpty' | 'classifier' | 'locationRole'>[]} */
  const events = [
    { code: 'GateOut', isEmpty: true, classifier: 'Actual', locationRole: 'Depot' },
    { code: 'GateIn', isEmpty: false, classifier: 'Actual', locationRole: 'PortOfLoading' },
    { code: 'GateOut', isEmpty: false, classifier: 'Actual', locationRole: 'PortOfDischarge' },
    { code: 'GateIn', isEmpty: true, classifier: 'Actual', locationRole: 'Depot' },
    { code: 'Departure', isEmpty: null, classifier: 'Actual', locationRole: 'Transshipment' },
    { code: 'Arrival', isEmpty: null, classifier: 'Estimated', locationRole: 'PortOfDischarge' },
  ];
  assert.deepEqual(events.map(trackingEventLabel), [
    'Cont rỗng ra depot',
    'Cont hàng vào cảng xếp',
    'Cont hàng ra cảng đích',
    'Cont rỗng về depot',
    'Tàu rời cảng chuyển tải',
    'Tàu đến cảng (dự kiến)',
  ]);
});

test('a date is carrier-sourced only while it still equals the date an event filled', () => {
  /** @param {Partial<import('../types/index.js').ShipmentTrackingEvent>} overrides */
  const event = (overrides) => ({
    id: '1', code: 'GateIn', classifier: 'Actual', eventAt: '2026-10-03T08:00:00', locationRole: 'PortOfLoading',
    locationName: 'Hai Phong', containerNumber: 'TCLU 123456-7', isEmpty: false, vesselName: null, voyageNumber: null,
    carrierCode: 'KMTC', adapterVersion: 'v1', receivedAt: '', appliedTo: 'GatedInOn', ...overrides,
  });
  const isFromCarrier = carrierSourcedDates(/** @type {import('../types/index.js').ShipmentTrackingEvent[]} */ ([
    event({}),
    event({ id: '2', code: 'Arrival', eventAt: '2026-10-08T06:00:00', locationName: 'SINGAPORE, SG', containerNumber: null, appliedTo: 'TransshipmentAta' }),
    event({ id: '3', code: 'Departure', eventAt: '2026-10-05T20:00:00', appliedTo: null }),
  ]));

  assert.equal(isFromCarrier({ field: 'GatedInOn', value: '2026-10-03', containerNumber: 'TCLU1234567' }), true);
  assert.equal(isFromCarrier({ field: 'GatedInOn', value: '2026-10-04', containerNumber: 'TCLU1234567' }), false, 'changed by hand');
  assert.equal(isFromCarrier({ field: 'GatedInOn', value: '2026-10-03', containerNumber: 'MSCU0000000' }), false);
  assert.equal(isFromCarrier({ field: 'TransshipmentAta', value: '2026-10-08', port: 'Singapore' }), true);
  assert.equal(isFromCarrier({ field: 'TransshipmentAta', value: '2026-10-08', port: 'Port Klang' }), false);
  assert.equal(isFromCarrier({ field: 'ActualDeparture', value: '2026-10-05' }), false, 'stored but filled nothing');
  assert.equal(isFromCarrier({ field: 'ActualDeparture', value: null }), false);
});

test('a cut-off is the carrier one while it holds the same minute', () => {
  assert.equal(isCarrierCutoff('2026-05-08T09:00:00', '2026-05-08T09:00'), true);
  assert.equal(isCarrierCutoff('2026-05-08T09:00:00', '2026-05-08T10:00:00'), false);
  assert.equal(isCarrierCutoff(null, '2026-05-08T09:00:00'), false);
  assert.equal(isCarrierCutoff('2026-05-08T09:00:00', null), false);
});
