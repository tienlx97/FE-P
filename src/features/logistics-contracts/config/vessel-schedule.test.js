import assert from 'node:assert/strict';
import test from 'node:test';

import {
  carrierCategories,
  instantToDate,
  localToInstant,
  portQueryValue,
  sailingEvents,
  sailingTitle,
  scheduleCarriers,
  searchWindows,
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

test('carrier local times are read in Việt Nam time so they show as given', () => {
  const instant = localToInstant('2026-09-20T06:20:00');
  assert.equal(new Date(/** @type {number} */ (instant)).toISOString(), '2026-09-19T23:20:00.000Z');
  assert.equal(instantToDate(/** @type {number} */ (instant)), '2026-09-20');
  assert.equal(localToInstant(null), null);
  assert.equal(localToInstant('not a date'), null);
});

test('sailingEvents puts one event at each ETD in the carrier category', () => {
  const events = sailingEvents(KMTC, [sailing({}), sailing({ etd: null, vesselName: 'NO ETD' })]);

  assert.equal(events.length, 1);
  assert.equal(events[0].title, 'KMTC - KMTC ULSAN / 2615S');
  assert.equal(events[0].category, 'KMTC');
  assert.equal(events[0].start, localToInstant('2026-09-20T06:20:00'));
  assert.ok(events[0].end > events[0].start);
  assert.equal(events[0].id, 'KMTC:KMTC ULSAN:2615S:2026-09-20T06:20:00');
});

test('searchWindows turns the visible range into dated windows of at most 62 days', () => {
  // Monthly grid of October 2026: Sun 27/09 00:00 → Sun 08/11 00:00 (exclusive), Việt Nam time.
  const start = /** @type {number} */ (localToInstant('2026-09-27T00:00:00'));
  const end = /** @type {number} */ (localToInstant('2026-11-08T00:00:00'));
  assert.deepEqual(searchWindows(start, end), [{ from: '2026-09-27', to: '2026-11-07' }]);

  const long = searchWindows(start, /** @type {number} */ (localToInstant('2027-01-01T00:00:00')));
  assert.deepEqual(long, [
    { from: '2026-09-27', to: '2026-11-27' },
    { from: '2026-11-28', to: '2026-12-31' },
  ]);
});

test('scheduleCarriers keeps carriers whose schedule adapter works', () => {
  const adapter = (/** @type {string} */ code, /** @type {any} */ schedule) =>
    /** @type {import('../types/index.js').CarrierTrackingAdapter} */ ({
      carrier: { code, name: code },
      enabled: true,
      activeVersion: 'v1',
      isImplemented: false,
      source: null,
      versions: ['v1'],
      schedule,
    });
  const carriers = scheduleCarriers([
    adapter('KMTC', { enabled: true, isImplemented: true }),
    adapter('SITC', { enabled: true, isImplemented: false }),
    adapter('RCL', { enabled: false, isImplemented: true }),
    adapter('ONE', null),
  ]);

  assert.deepEqual(carriers.map((carrier) => carrier.code), ['KMTC']);
});

test('carrierCategories labels by carrier name with a colour each', () => {
  const categories = carrierCategories([KMTC, { code: 'SITC', name: 'SITC' }]);
  assert.deepEqual(categories.map((category) => category.label), ['KMTC', 'SITC']);
  assert.notEqual(categories[0].color, categories[1].color);
});

test('portQueryValue sends the UN/LOCODE, else the name', () => {
  assert.equal(portQueryValue({ code: 'VNSGN', name: 'Ho Chi Minh' }), 'VNSGN');
  assert.equal(portQueryValue({ code: null, name: 'Cang Bangkok' }), 'Cang Bangkok');
  assert.equal(portQueryValue(null), '');
});
