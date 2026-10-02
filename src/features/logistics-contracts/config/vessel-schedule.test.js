import assert from 'node:assert/strict';
import test from 'node:test';

import {
  bookingState,
  carrierOptions,
  carrierSelectionLabel,
  carriersToSearch,
  carrierTone,
  formatCarrierTime,
  localNow,
  onCarriageNote,
  parseRecentPorts,
  portOptions,
  portSearchConditions,
  RECENT_PORTS_LIMIT,
  sailingId,
  sailingTitle,
  scheduleCarriers,
  scheduleItems,
  visibleRange,
  withRecentPort,
} from './vessel-schedule.js';

const KMTC = { code: 'KMTC', name: 'KMTC' };

/** @param {Partial<import('../types/index.js').CarrierSailing>} overrides */
const sailing = (overrides) =>
  /** @type {import('../types/index.js').CarrierSailing} */ ({
    vesselName: 'KMTC ULSAN',
    voyageNumber: '2615S',
    portOfLoading: 'HOCHIMINH,VIETNAM',
    portOfLoadingTerminal: 'Cat Lai Terminal(HCM)',
    portOfDischarge: 'BANGKOK,THAILAND',
    etd: '2026-09-20T06:20:00',
    eta: '2026-09-22T13:48:00',
    siCutoff: '2026-09-18T16:00:00',
    cyCutoff: '2026-09-19T21:00:00',
    vgmCutoff: null,
    transshipmentPorts: [],
    transitDays: 2,
    serviceCode: 'KST',
    ...overrides,
  });

test('sailingTitle tags [HÃNG TÀU] - [TÊN TÀU] / [SỐ CHUYẾN]', () => {
  assert.equal(sailingTitle('KMTC', sailing({})), 'KMTC - KMTC ULSAN / 2615S');
  assert.equal(sailingTitle('Yang Ming', sailing({ vesselName: 'YM WELLNESS', voyageNumber: null })), 'Yang Ming - YM WELLNESS');
});

test('sailingTitle puts TS between the carrier and the vessel of a transshipment', () => {
  assert.equal(
    sailingTitle('Heung-A', sailing({ vesselName: 'STARSHIP JUPITER', voyageNumber: '2607N', transshipmentPorts: ['BUSAN'] })),
    'Heung-A - [TS] - STARSHIP JUPITER / 2607N',
  );
  assert.equal(
    sailingTitle('Heung-A', sailing({ transshipmentPorts: ['LAEM CHABANG'], onCarriage: 'Barge' })),
    'Heung-A - [TS] - KMTC ULSAN / 2615S',
  );
});

test('onCarriageNote tells where the vessel stops and how the cargo goes on', () => {
  const barge = sailing({ portOfDischarge: 'BANGKOK', transshipmentPorts: ['LAEM CHABANG'], onCarriage: 'Barge', eta: null });
  assert.equal(onCarriageNote(barge), 'Dỡ tại LAEM CHABANG, đi tiếp bằng sà lan (barge) tới BANGKOK — hãng chưa có giờ đến');
  assert.equal(
    onCarriageNote({ ...barge, onCarriage: 'X', eta: '2026-10-08T10:00:00' }),
    'Dỡ tại LAEM CHABANG, đi tiếp bằng X tới BANGKOK',
  );
  assert.equal(onCarriageNote(sailing({ transshipmentPorts: ['BUSAN'] })), null);
  assert.equal(onCarriageNote(sailing({})), null);
});

test('sailingId tells a call at the POD from the same vessel going on by barge', () => {
  const direct = sailing({ portOfDischarge: 'BANGKOK' });
  const barge = sailing({ portOfDischarge: 'BANGKOK', transshipmentPorts: ['LAEM CHABANG'], onCarriage: 'Barge' });
  assert.notEqual(sailingId('HEUNGA', direct), sailingId('HEUNGA', barge));
  assert.equal(sailingId('HEUNGA', direct), sailingId('HEUNGA', { ...direct }));
});

test('sailingId tells two routings via the same transshipment port apart by their ETA', () => {
  const first = sailing({ transshipmentPorts: ['KAOHSIUNG'], eta: '2026-10-13T00:00:00' });
  const later = sailing({ transshipmentPorts: ['KAOHSIUNG'], eta: '2026-10-14T00:00:00' });
  assert.notEqual(sailingId('EVERGREEN', first), sailingId('EVERGREEN', later));
});

test('carrier times are shown as given, date then time', () => {
  assert.equal(formatCarrierTime('2026-09-29T23:30:00'), '29/09/2026 23:30');
  assert.equal(formatCarrierTime(null), '—');
});

const NOW = '2026-09-29T11:00:00';

const HEUNGA = { code: 'HEUNGA', name: 'Heung-A' };

test('scheduleItems puts each sailing on its ETD date, titled by its tag only', () => {
  const items = scheduleItems(
    [{ carrier: KMTC, tone: 'accent', sailings: [sailing({ bookingStatus: 'Open' }), sailing({ etd: '2026-09-29T23:30:00', voyageNumber: '2616S', bookingStatus: 'Open' }), sailing({ etd: null })] }],
    NOW,
  );

  assert.deepEqual(items, [
    { id: 'KMTC:KMTC ULSAN:2616S:2026-09-29T23:30:00:2026-09-22T13:48:00:BANGKOK,THAILAND::', date: '2026-09-29', title: 'KMTC - KMTC ULSAN / 2616S', tone: 'accent' },
    { id: 'KMTC:KMTC ULSAN:2615S:2026-09-20T06:20:00:2026-09-22T13:48:00:BANGKOK,THAILAND::', date: '2026-09-20', title: 'KMTC - KMTC ULSAN / 2615S', tone: 'danger' },
  ]);
});

test('scheduleItems: bookable first, then ETD, then carrier order; red ones last', () => {
  const day = '2026-10-07';
  const items = scheduleItems(
    [
      {
        carrier: KMTC,
        tone: 'accent',
        sailings: [
          sailing({ voyageNumber: 'FULL', etd: `${day}T01:00:00`, siCutoff: '2026-10-05T16:00:00', bookingStatus: 'Full' }),
          sailing({ voyageNumber: 'A', etd: `${day}T09:00:00`, bookingStatus: 'Open' }),
          sailing({ voyageNumber: 'B', etd: `${day}T12:00:00`, bookingStatus: 'Open' }),
        ],
      },
      { carrier: HEUNGA, tone: 'success', sailings: [sailing({ vesselName: 'SKY ORION', voyageNumber: 'C', etd: `${day}T09:00:00`, bookingStatus: 'Open' })] },
    ],
    NOW,
  );

  assert.deepEqual(
    items.map((item) => [item.title, item.tone]),
    [
      ['KMTC - KMTC ULSAN / A', 'accent'],
      ['Heung-A - SKY ORION / C', 'success'],
      ['KMTC - KMTC ULSAN / B', 'accent'],
      ['KMTC - KMTC ULSAN / FULL', 'danger'],
    ],
  );
});

test('bookingState: carrier-closed is "hết chỗ" only before the cut-off', () => {
  const futureEtd = '2026-10-07T05:00:00';
  assert.equal(bookingState(sailing({ etd: futureEtd, bookingStatus: 'Full', siCutoff: '2026-10-05T16:00:00' }), NOW), 'full');
  assert.equal(bookingState(sailing({ etd: futureEtd, bookingStatus: 'Full', siCutoff: '2026-09-28T16:00:00' }), NOW), 'closed');
  assert.equal(bookingState(sailing({ etd: futureEtd, bookingStatus: 'Full', siCutoff: null, cyCutoff: null }), NOW), 'full');
  assert.equal(bookingState(sailing({ etd: futureEtd, bookingStatus: 'CutoffPassed' }), NOW), 'closed');
  assert.equal(bookingState(sailing({ etd: futureEtd, bookingStatus: 'NotYetOpen' }), NOW), 'notYetOpen');
  assert.equal(bookingState(sailing({ etd: futureEtd, bookingStatus: 'Open' }), NOW), 'open');
  assert.equal(bookingState(sailing({ etd: futureEtd, bookingStatus: undefined }), NOW), 'unknown');
  assert.equal(bookingState(sailing({ bookingStatus: 'Open' }), NOW), 'departed');
});

test('every confirmed unavailable status is red, without the reason in the title', () => {
  for (const bookingStatus of ['CutoffPassed', 'NotYetOpen', 'Full']) {
    const [item] = scheduleItems(
      [{ carrier: KMTC, tone: 'accent', sailings: [sailing({ etd: '2026-10-07T05:00:00', siCutoff: '2026-10-05T16:00:00', bookingStatus })] }],
      NOW,
    );
    assert.equal(item.tone, 'danger');
    assert.equal(item.title, 'KMTC - KMTC ULSAN / 2615S');
  }
});

test('localNow is Việt Nam local time', () => {
  assert.equal(localNow(Date.parse('2026-09-29T04:00:00Z')), '2026-09-29T11:00:00');
});

test('visibleRange covers the month grid or the two weeks shown', () => {
  // October 2026: the grid starts Monday 28/09 and ends Sunday 01/11.
  assert.deepEqual(visibleRange('month', '2026-10-15'), { from: '2026-09-28', to: '2026-11-01' });
  assert.deepEqual(visibleRange('twoWeeks', '2026-10-15'), { from: '2026-10-15', to: '2026-10-28' });
});

/** @param {string} code @param {any} schedule */
const adapter = (code, schedule) =>
  /** @type {import('../types/index.js').CarrierTrackingAdapter} */ ({
    carrier: { code, name: code },
    enabled: true,
    activeVersion: 'v1',
    isImplemented: false,
    source: null,
    versions: ['v1'],
    schedule,
  });

const ADAPTERS = [
  adapter('KMTC', { enabled: true, isImplemented: true }),
  adapter('HEUNGA', { enabled: true, isImplemented: true }),
  adapter('SITC', { enabled: true, isImplemented: false }),
  adapter('RCL', { enabled: false, isImplemented: true }),
  adapter('ONE', null),
];

test('scheduleCarriers keeps carriers whose schedule adapter works', () => {
  assert.deepEqual(scheduleCarriers(ADAPTERS).map((carrier) => carrier.code), ['KMTC', 'HEUNGA']);
});

test('carrierOptions lists every carrier, those not connected disabled', () => {
  assert.deepEqual(carrierOptions(ADAPTERS), [
    { value: 'KMTC', label: 'KMTC' },
    { value: 'HEUNGA', label: 'HEUNGA' },
    { value: 'SITC', label: 'SITC (chưa kết nối)', isDisabled: true },
    { value: 'RCL', label: 'RCL (chưa kết nối)', isDisabled: true },
    { value: 'ONE', label: 'ONE (chưa kết nối)', isDisabled: true },
  ]);
});

test('carriersToSearch: the checked connected carriers, none checked = all connected', () => {
  const codes = (/** @type {string[]} */ checked) => carriersToSearch(ADAPTERS, checked).map((carrier) => carrier.code);
  assert.deepEqual(codes([]), ['KMTC', 'HEUNGA']);
  assert.deepEqual(codes(['HEUNGA']), ['HEUNGA']);
  assert.deepEqual(codes(['HEUNGA', 'KMTC']), ['KMTC', 'HEUNGA'], 'list order, not click order');
  assert.deepEqual(codes(['SITC', 'MAERSK']), ['KMTC', 'HEUNGA'], 'nothing connected checked = all connected');
});

test('carrierSelectionLabel: "Tất cả hãng" for none or all, else the names', () => {
  assert.equal(carrierSelectionLabel([], 2), 'Tất cả hãng');
  assert.equal(carrierSelectionLabel([{ label: 'KMTC' }, { label: 'Heung-A' }], 2), 'Tất cả hãng');
  assert.equal(carrierSelectionLabel([{ label: 'Heung-A' }], 2), 'Heung-A');
  assert.equal(carrierSelectionLabel([{ label: 'KMTC' }, { label: 'Heung-A' }], 3), 'KMTC, Heung-A');
});

test('portSearchConditions looks the text up in code, name or full name', () => {
  assert.deepEqual(portSearchConditions('  '), [], 'blank = every port');
  assert.deepEqual(
    portSearchConditions('  laem ').map(({ field, operator, value, connector }) => [field, operator, value, connector]),
    [
      ['code', 'Contains', 'laem', 'And'],
      ['name', 'Contains', 'laem', 'Or'],
      ['fullName', 'Contains', 'laem', 'Or'],
    ],
  );
});

test('withRecentPort puts the pick first, once, and keeps the list short', () => {
  const lch = { code: 'THLCH', name: 'Laem Chabang' };
  const bkk = { code: 'THBKK', name: 'Bangkok' };
  assert.deepEqual(withRecentPort([bkk, lch], lch), [lch, bkk]);
  const many = Array.from({ length: RECENT_PORTS_LIMIT }, (_, index) => ({ code: `P${index}`, name: `Port ${index}` }));
  const next = withRecentPort(many, lch);
  assert.equal(next.length, RECENT_PORTS_LIMIT);
  assert.deepEqual(next[0], lch);
});

test('parseRecentPorts reads stored ports and drops anything malformed', () => {
  assert.deepEqual(parseRecentPorts(null), []);
  assert.deepEqual(parseRecentPorts('not json'), []);
  assert.deepEqual(parseRecentPorts('{"code":"THLCH"}'), []);
  assert.deepEqual(
    parseRecentPorts('[{"code":"THLCH","name":"Laem Chabang","extra":1},{"code":2},null]'),
    [{ code: 'THLCH', name: 'Laem Chabang' }],
  );
});

test('carrierTone is fixed by the carrier position, never danger', () => {
  const carriers = ADAPTERS.map((entry) => entry.carrier);
  assert.equal(carrierTone(carriers, 'KMTC'), 'accent');
  assert.equal(carrierTone(carriers, 'HEUNGA'), 'success');
  assert.equal(carrierTone(carriers, 'SITC'), 'warning');
  assert.equal(carrierTone(carriers, 'MAERSK'), 'accent');
});

test('carrierTone gives every connected carrier its own tone, placeholders take none', () => {
  const connected = ['KMTC', 'HEUNGA', 'NAMSUNG', 'SITC', 'EVERGREEN', 'RCL', 'ONE'].map((code) => ({ code, name: code }));
  const tones = connected.map((carrier) => carrierTone(connected, carrier.code));
  assert.equal(new Set(tones).size, 7);
  assert.ok(!tones.includes('danger'));
  assert.deepEqual(tones.slice(4), ['indigo', 'pink', 'teal'], 'ONE after RCL, not wrapped onto Namsung as 9th of all carriers');
});

test('portOptions keeps UN/LOCODE ports, code first, sorted', () => {
  const ports = /** @type {import('../types/index.js').Port[]} */ ([
    { id: '1', code: 'VNSGN', name: 'Ho Chi Minh City' },
    { id: '2', code: null, name: 'Nhà máy Vsip' },
    { id: '3', code: 'VNCLI', name: 'Cát Lái' },
  ]);
  assert.deepEqual(portOptions(ports), [
    { value: 'VNCLI', label: 'VNCLI — Cát Lái' },
    { value: 'VNSGN', label: 'VNSGN — Ho Chi Minh City' },
  ]);
});
