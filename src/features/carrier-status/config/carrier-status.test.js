import assert from 'node:assert/strict';
import test from 'node:test';

import {
  componentState,
  dayTooltip,
  formatCheckedAt,
  formatLatency,
  formatUptime,
  overallBanner,
  splitCarriers,
} from './carrier-status.js';

/** @param {Partial<import('../types/index.js').CarrierStatusComponent>} overrides */
const component = (overrides) => ({
  integration: /** @type {const} */ ('Schedule'),
  isImplemented: true,
  isWatched: true,
  activeVersion: 'v1',
  latest: null,
  uptimePercent: null,
  days: [],
  ...overrides,
});

/** @param {import('../types/index.js').CarrierHealthOutcome} outcome */
const latest = (outcome) => ({ checkedAtUtc: '2026-09-29T14:00:00Z', outcome, latencyMs: 10, detail: null, adapterVersion: 'v1' });

test('componentState: not connected, not watched, not checked yet, then the latest outcome', () => {
  assert.deepEqual(componentState(component({ isImplemented: false })), { label: 'Chưa kết nối', variant: 'neutral' });
  assert.deepEqual(componentState(component({ isWatched: false })), { label: 'Chưa cấu hình kiểm tra', variant: 'neutral' });
  assert.equal(componentState(component({})).label, 'Chưa kiểm tra');
  assert.equal(componentState(component({ latest: latest('Up') })).variant, 'success');
  assert.equal(componentState(component({ latest: latest('Degraded') })).variant, 'warning');
  assert.equal(componentState(component({ latest: latest('Down') })).variant, 'error');
});

test('overallBanner follows the worst latest outcome', () => {
  assert.equal(overallBanner('Up').status, 'success');
  assert.equal(overallBanner('Degraded').status, 'warning');
  assert.equal(overallBanner('Down').status, 'error');
  assert.equal(overallBanner(null).status, 'info');
});

test('dayTooltip reads a day in Vietnamese', () => {
  assert.equal(dayTooltip({ date: '2026-09-29', outcome: null, checks: 0, down: 0, degraded: 0 }), '29/09/2026 · Không có dữ liệu');
  assert.equal(dayTooltip({ date: '2026-09-29', outcome: 'Up', checks: 56, down: 0, degraded: 0 }), '29/09/2026 · 56 lần kiểm tra · không có sự cố');
  assert.equal(
    dayTooltip({ date: '2026-09-29', outcome: 'Degraded', checks: 56, down: 2, degraded: 1 }),
    '29/09/2026 · 56 lần kiểm tra · 2 lỗi, 1 chậm / rỗng',
  );
});

test('formatting: uptime, latency, check time (VN)', () => {
  assert.equal(formatUptime(null), '—');
  assert.equal(formatUptime(99.3125), '99.31% uptime');
  assert.equal(formatUptime(100), '100% uptime');
  assert.equal(formatLatency(850), '850 ms');
  assert.equal(formatLatency(7210), '7,2 giây');
  assert.equal(formatCheckedAt('2026-09-29T14:05:00Z'), '21:05 29/09/2026');
  assert.equal(formatCheckedAt('2026-09-29T20:05:00'), '03:05 30/09/2026', 'no offset = UTC');
  assert.equal(formatCheckedAt(null), '—');
});

test('splitCarriers: cards for connected carriers, names for the rest', () => {
  const carriers = [
    { carrier: { code: 'KMTC', name: 'KMTC' }, components: [component({}), component({ integration: 'Tracking', isImplemented: false })] },
    { carrier: { code: 'SITC', name: 'SITC' }, components: [component({ isImplemented: false }), component({ integration: 'Tracking', isImplemented: false })] },
  ];
  const { connected, notConnected } = splitCarriers(carriers);
  assert.deepEqual(connected.map((entry) => entry.carrier.code), ['KMTC']);
  assert.deepEqual(notConnected, ['SITC']);
});
