import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ALL_CARRIERS,
  carrierOptions,
  carriersToSearch,
  carrierTone,
  countryOptions,
  formatCarrierTime,
  portOptions,
  sailingItems,
  sailingTitle,
  scheduleCarriers,
  visibleRange,
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

test('carrier times are shown as given, date then time', () => {
  assert.equal(formatCarrierTime('2026-09-29T23:30:00'), '29/09/2026 23:30');
  assert.equal(formatCarrierTime(null), '—');
});

test('sailingItems puts each sailing on its ETD date, late ETDs included', () => {
  const items = sailingItems(KMTC, [sailing({}), sailing({ etd: '2026-09-29T23:30:00', voyageNumber: '2616S' }), sailing({ etd: null })], 'accent');

  assert.deepEqual(items, [
    { id: 'KMTC:KMTC ULSAN:2615S:2026-09-20T06:20:00', date: '2026-09-20', title: 'KMTC - KMTC ULSAN / 2615S', tone: 'accent' },
    { id: 'KMTC:KMTC ULSAN:2616S:2026-09-29T23:30:00', date: '2026-09-29', title: 'KMTC - KMTC ULSAN / 2616S', tone: 'accent' },
  ]);
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
  adapter('SITC', { enabled: true, isImplemented: false }),
  adapter('RCL', { enabled: false, isImplemented: true }),
  adapter('ONE', null),
];

test('scheduleCarriers keeps carriers whose schedule adapter works', () => {
  assert.deepEqual(scheduleCarriers(ADAPTERS).map((carrier) => carrier.code), ['KMTC']);
});

test('carrierOptions starts with "Tất cả hãng" and marks carriers not connected', () => {
  assert.deepEqual(carrierOptions(ADAPTERS), [
    { value: ALL_CARRIERS, label: 'Tất cả hãng' },
    { value: 'KMTC', label: 'KMTC' },
    { value: 'SITC', label: 'SITC (chưa kết nối)' },
    { value: 'RCL', label: 'RCL (chưa kết nối)' },
    { value: 'ONE', label: 'ONE (chưa kết nối)' },
  ]);
});

test('carriersToSearch: all connected carriers, or exactly the chosen one', () => {
  assert.deepEqual(carriersToSearch(ADAPTERS, ALL_CARRIERS).map((carrier) => carrier.code), ['KMTC']);
  assert.deepEqual(carriersToSearch(ADAPTERS, 'SITC').map((carrier) => carrier.code), ['SITC']);
  assert.deepEqual(carriersToSearch(ADAPTERS, 'MAERSK'), []);
});

test('carrierTone is fixed by the carrier position, never danger', () => {
  const carriers = ADAPTERS.map((entry) => entry.carrier);
  assert.equal(carrierTone(carriers, 'KMTC'), 'accent');
  assert.equal(carrierTone(carriers, 'SITC'), 'success');
  assert.equal(carrierTone(carriers, 'MAERSK'), 'accent');
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

test('countryOptions sorts by name with the ISO code', () => {
  const countries = [
    { id: 'th', name: 'Thái Lan', code: 'TH' },
    { id: 'au', name: 'Úc', code: 'AU' },
    { id: 'x', name: 'Philippines', code: null },
  ];
  assert.deepEqual(countryOptions(countries).map((option) => option.label), ['Philippines', 'Thái Lan (TH)', 'Úc (AU)']);
});
