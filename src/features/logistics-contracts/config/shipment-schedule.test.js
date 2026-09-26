import assert from 'node:assert/strict';
import test from 'node:test';

import {
  alertMessage,
  daysBetween,
  freeTimeClockStatus,
  freeTimeErrors,
  freeTimeFormValues,
  freeTimeRequestBody,
  freeTimeSummary,
  originalScheduleValues,
  revisionChanges,
  scheduleDateLabel,
  scheduleFormErrors,
  scheduleFormValues,
  shiftIsoDate,
  shipmentTimeProgress,
  tracksDestinationFreeTime,
  tracksOriginFreeTime,
} from './shipment-schedule.js';

test('free time sides follow the Incoterm', () => {
  assert.deepEqual(
    ['EXW', 'FOB', 'CIF', 'DDP'].map((code) => [
      tracksOriginFreeTime(code),
      tracksDestinationFreeTime(code),
    ]),
    [
      [false, false],
      [true, false],
      [true, true],
      [true, true],
    ],
  );
});

test('free time round-trips between the API and the form', () => {
  const combined = { mode: /** @type {const} */ ('Combined'), demDays: null, detDays: null, combinedDays: 14 };
  const form = freeTimeFormValues(combined);
  assert.deepEqual(freeTimeRequestBody(form), { Mode: 'Combined', CombinedDays: 14 });
  assert.equal(freeTimeRequestBody(freeTimeFormValues(null)), null);
  assert.deepEqual(
    freeTimeRequestBody({ mode: 'Separate', demDays: 7, detDays: 5, combinedDays: 14 }),
    { Mode: 'Separate', DemDays: 7, DetDays: 5 },
  );
});

test('free time needs the days of its mode', () => {
  assert.deepEqual(freeTimeErrors({ mode: 'Separate', demDays: 7, detDays: undefined, combinedDays: undefined }), {
    detDays: 'Vui lòng nhập số ngày',
  });
  assert.deepEqual(freeTimeErrors({ mode: 'Combined', demDays: undefined, detDays: undefined, combinedDays: 400 }), {
    combinedDays: 'Số ngày nguyên từ 0 đến 365',
  });
  assert.deepEqual(freeTimeErrors({ mode: '', demDays: undefined, detDays: undefined, combinedDays: undefined }), {});
});

test('free time summary', () => {
  assert.equal(freeTimeSummary({ mode: 'Separate', demDays: 7, detDays: 5, combinedDays: null }), 'DEM 7 + DET 5 ngày');
  assert.equal(freeTimeSummary({ mode: 'Combined', demDays: null, detDays: null, combinedDays: 14 }), 'Combined 14 ngày');
  assert.equal(freeTimeSummary(null), '—');
});

/** @param {Partial<import('../types/index.js').FreeTimeClock>} overrides */
function clock(overrides) {
  return /** @type {import('../types/index.js').FreeTimeClock} */ ({
    side: 'Origin',
    kind: 'Det',
    days: 5,
    startOn: '2026-10-01',
    endOn: null,
    lastFreeDay: '2026-10-05',
    daysLeft: 3,
    overdueDays: 0,
    state: 'Running',
    ...overrides,
  });
}

test('clock status reads days left, last day and overdue', () => {
  assert.deepEqual(freeTimeClockStatus(clock({})), { label: 'Còn 3 ngày', tone: 'success' });
  assert.deepEqual(freeTimeClockStatus(clock({ daysLeft: 2 })), { label: 'Còn 2 ngày', tone: 'warning' });
  assert.deepEqual(freeTimeClockStatus(clock({ daysLeft: 0 })), { label: 'Hết free time hôm nay', tone: 'warning' });
  assert.deepEqual(freeTimeClockStatus(clock({ daysLeft: -2, overdueDays: 2 })), { label: 'Quá 2 ngày', tone: 'danger' });
  assert.deepEqual(freeTimeClockStatus(clock({ state: 'Stopped', endOn: '2026-10-04', daysLeft: null })), {
    label: 'Trong free time',
    tone: 'success',
  });
  assert.deepEqual(freeTimeClockStatus(clock({ state: 'NotStarted', startOn: null })), {
    label: 'Chưa bắt đầu',
    tone: 'neutral',
  });
});

test('alert messages', () => {
  assert.equal(
    alertMessage({
      kind: 'FreeTimeOverdue', severity: 'Danger', dueOn: '2026-10-19', days: 1,
      containerNumber: 'TCLU1234567', side: 'Destination', freeTimeKind: 'Combined', containerCount: null,
    }),
    'Cont TCLU1234567: DEM/DET đầu đích quá 1 ngày (hết 19/10/2026)',
  );
  assert.equal(
    alertMessage({
      kind: 'CyCutoffSoon', severity: 'Warning', dueOn: '2026-10-22', days: 2,
      containerNumber: null, side: null, freeTimeKind: null, containerCount: 1,
    }),
    'Cut-off hạ bãi 22/10/2026 (còn 2 ngày), còn 1 cont chưa hạ bãi',
  );
});

test('schedule date label shows the delay', () => {
  assert.equal(scheduleDateLabel(null, '2026-10-13', 3), '13/10/2026 · trễ 3 ngày');
  assert.equal(scheduleDateLabel('2026-10-14', '2026-10-13', 0), '14/10/2026');
  assert.equal(scheduleDateLabel(null, null, null), '—');
});

test('schedule form starts from the current schedule', () => {
  const values = scheduleFormValues(
    {
      version: 3,
      current: {
        etd: '2026-10-12', eta: '2026-10-27', siCutoff: '2026-10-09T17:00:00',
        cyCutoff: null, vesselName: 'KMTC JAKARTA', voyageNumber: null,
      },
      actualDeparture: null,
      actualArrival: null,
      originFreeTime: { mode: 'Combined', demDays: null, detDays: null, combinedDays: 14 },
      destinationFreeTime: null,
      summary: {
        originalEtd: '2026-10-10', originalEta: '2026-10-25', etdChangeCount: 1,
        etaChangeCount: 1, departureDelayDays: 2, arrivalDelayDays: 2,
      },
      revisions: [],
    },
    '2026-10-01',
  );
  assert.equal(values.siCutoffTime, '17:00');
  assert.equal(values.cyCutoffDate, '');
  assert.equal(values.noticeOn, '2026-10-01');
  assert.equal(values.reason, 'CarrierDelay');
  assert.equal(values.originFreeTime.combinedDays, 14);
  assert.deepEqual(scheduleFormErrors(values), {});
  assert.deepEqual(
    scheduleFormErrors({
      ...values,
      reason: '',
      cyCutoffTime: '12:00',
      destinationFreeTime: { mode: 'Separate', demDays: 5 },
    }),
    {
      reason: 'Vui lòng chọn lý do',
      cyCutoffDate: 'Vui lòng chọn ngày',
      'destinationFreeTime.detDays': 'Vui lòng nhập số ngày',
    },
  );
});

/** @param {Partial<import('../types/index.js').ShipmentScheduleValues>} values */
function values(values) {
  return {
    etd: null, eta: null, siCutoff: null, cyCutoff: null, vesselName: null, voyageNumber: null,
    ...values,
  };
}

test('revisions: original values and the changes of each', () => {
  const newest = {
    id: 'r2', noticeOn: '2026-10-03', reason: /** @type {const} */ ('CarrierDelay'), note: null,
    recordedAt: '2026-10-03T02:00:00Z',
    previous: values({ etd: '2026-10-12', siCutoff: '2026-10-09T17:00:00' }),
    next: values({ etd: '2026-10-13', siCutoff: '2026-10-10T17:00:00' }),
  };
  const oldest = {
    id: 'r1', noticeOn: '2026-10-01', reason: /** @type {const} */ ('CarrierDelay'), note: null,
    recordedAt: '2026-10-01T02:00:00Z',
    previous: values({ etd: '2026-10-10', siCutoff: '2026-10-09T17:00:00' }),
    next: values({ etd: '2026-10-12', siCutoff: '2026-10-09T17:00:00' }),
  };
  assert.deepEqual(revisionChanges(newest), [
    'ETD 12/10/2026 → 13/10/2026',
    'Cut-off SI / VGM 09/10/2026 17:00 → 10/10/2026 17:00',
  ]);
  const original = originalScheduleValues({
    version: 5,
    current: values({ etd: '2026-10-13', eta: '2026-10-27', siCutoff: '2026-10-10T17:00:00' }),
    actualDeparture: null,
    actualArrival: null,
    originFreeTime: null,
    destinationFreeTime: null,
    summary: {
      originalEtd: '2026-10-10', originalEta: '2026-10-27', etdChangeCount: 2,
      etaChangeCount: 0, departureDelayDays: 3, arrivalDelayDays: 0,
    },
    revisions: [newest, oldest],
  });
  assert.equal(original.etd, '2026-10-10');
  assert.equal(original.siCutoff, '2026-10-09T17:00:00');
  assert.equal(original.eta, '2026-10-27');
});

test('time-based journey progress', () => {
  const base = { startOn: '2026-10-01', actualArrival: null, eta: '2026-10-21', isJourneyDone: false };
  assert.deepEqual(shipmentTimeProgress({ ...base, today: '2026-10-11' }), {
    percent: 50,
    label: '50% · còn 10 ngày đến ETA',
  });
  assert.deepEqual(shipmentTimeProgress({ ...base, today: '2026-10-25' }), {
    percent: 99,
    label: '99% · quá ETA 4 ngày',
  });
  assert.deepEqual(
    shipmentTimeProgress({ ...base, actualArrival: '2026-10-20', today: '2026-10-22' }),
    { percent: 99, label: '99% · đã đến 20/10/2026' },
  );
  assert.deepEqual(shipmentTimeProgress({ ...base, isJourneyDone: true, today: '2026-10-01' }), {
    percent: 100,
    label: '100% · hoàn tất',
  });
  assert.equal(shipmentTimeProgress({ ...base, startOn: null, today: '2026-10-11' }), null);
  assert.equal(shipmentTimeProgress({ ...base, eta: null, today: '2026-10-11' }), null);
});

test('date helpers', () => {
  assert.equal(shiftIsoDate('2026-10-30', 3), '2026-11-02');
  assert.equal(daysBetween('2026-10-10', '2026-10-13'), 3);
  assert.equal(daysBetween('', '2026-10-13'), null);
});
