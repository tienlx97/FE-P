import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPhysicalTimeline,
  WHOLE_SHIPMENT,
} from './shipment-journey-events.js';

/**
 * @param {Partial<import('../types/index.js').PhysicalJourneyEvent>} event
 * @returns {import('../types/index.js').PhysicalJourneyEvent}
 */
const fact = (event) => ({
  code: 'Departure',
  classifier: 'Actual',
  eventOn: '2026-09-02',
  eventAt: null,
  location: 'POL',
  containerNumber: null,
  legSequence: null,
  vesselName: 'Vessel A',
  voyageNumber: '001',
  source: 'Schedule',
  sourceDetail: null,
  ...event,
});

test('buildPhysicalTimeline puts whole-shipment facts first and one timeline per container', () => {
  const groups = buildPhysicalTimeline(
    [
      fact({ code: 'Load', containerNumber: 'CONT2', legSequence: 1 }),
      fact({}),
      fact({
        code: 'OriginGateIn',
        containerNumber: 'CONT1',
        eventOn: '2026-09-01',
        vesselName: null,
        voyageNumber: null,
      }),
    ],
    '2026-09-20',
  );
  assert.deepEqual(
    groups.map((group) => group.label),
    [WHOLE_SHIPMENT, 'CONT1', 'CONT2'],
  );
  assert.equal(groups[1].items[0].code, 'OriginGateIn');
});

test('estimated and actual facts of one event merge into one item with the delay', () => {
  const [group] = buildPhysicalTimeline(
    [
      fact({ classifier: 'Planned', eventOn: '2026-01-20' }),
      fact({ classifier: 'Estimated', eventOn: '2026-01-22' }),
      fact({ classifier: 'Actual', eventOn: '2026-01-23' }),
      fact({
        code: 'Arrival',
        classifier: 'Estimated',
        eventOn: '2026-02-10',
        location: 'POD',
      }),
      fact({
        code: 'Discharge',
        classifier: 'Estimated',
        eventOn: '2026-02-11',
        location: 'POD',
      }),
      fact({
        code: 'EmptyReturn',
        classifier: 'Planned',
        eventOn: '2026-02-20',
        location: 'POD',
      }),
    ],
    '2026-02-10',
  );
  assert.deepEqual(
    group.items.map((item) => [item.code, item.state, item.deltaDays]),
    [
      ['Departure', 'done', 1],
      ['Arrival', 'next', null],
      ['Discharge', 'upcoming', null],
      ['EmptyReturn', 'upcoming', null],
    ],
  );
  assert.equal(group.items[0].expected?.classifier, 'Estimated');
  assert.equal(group.doneCount, 1);
});

test('an expected date that passed without an actual one is overdue', () => {
  const [group] = buildPhysicalTimeline(
    [
      fact({
        code: 'Arrival',
        classifier: 'Estimated',
        eventOn: '2026-02-10',
        location: 'POD',
      }),
      fact({
        code: 'Discharge',
        classifier: 'Estimated',
        eventOn: '2026-02-20',
        location: 'POD',
      }),
    ],
    '2026-02-13',
  );
  assert.deepEqual(
    group.items.map((item) => [item.state, item.deltaDays]),
    [
      ['overdue', 3],
      ['next', null],
    ],
  );
});

test('the voyage label does not repeat a voyage number the vessel name carries', () => {
  const [plain, embedded] = buildPhysicalTimeline(
    [
      fact({}),
      fact({
        containerNumber: 'CONT1',
        vesselName: 'KMTC JAKARTA // 2604S',
        voyageNumber: '2604S',
      }),
    ],
    '2026-09-20',
  );
  assert.equal(plain.items[0].voyage, 'Vessel A / 001');
  assert.equal(embedded.items[0].voyage, 'KMTC JAKARTA // 2604S');
});
