import assert from 'node:assert/strict';
import test from 'node:test';

import { groupPhysicalEvents } from './shipment-journey-events.js';

test('groupPhysicalEvents keeps whole-shipment events and separates container voyages without changing event order', () => {
    /** @type {import('../types/index.js').PhysicalJourneyEvent[]} */
    const events = [
      { code: 'Departure', classifier: 'Actual', eventOn: '2026-09-02', eventAt: null, location: 'POL', containerNumber: null, legSequence: null, vesselName: 'Vessel A', voyageNumber: '001', source: 'Schedule', sourceDetail: null },
      { code: 'OriginGateIn', classifier: 'Actual', eventOn: '2026-09-01', eventAt: null, location: 'POL', containerNumber: 'CONT1', legSequence: null, vesselName: null, voyageNumber: null, source: 'Container', sourceDetail: null },
      { code: 'Load', classifier: 'Actual', eventOn: '2026-09-02', eventAt: null, location: 'POL', containerNumber: 'CONT1', legSequence: 1, vesselName: 'Vessel A', voyageNumber: '001', source: 'Carrier', sourceDetail: 'line' },
      { code: 'Discharge', classifier: 'Actual', eventOn: '2026-09-10', eventAt: null, location: 'POD', containerNumber: 'CONT1', legSequence: 2, vesselName: 'Vessel B', voyageNumber: '002', source: 'Carrier', sourceDetail: 'line' },
    ];

    const groups = groupPhysicalEvents(events);
    assert.deepEqual(groups.map((group) => group.container), ['Toàn lô', 'CONT1']);
    assert.deepEqual(groups[1].voyages.map((voyage) => voyage.events.map((event) => event.code)),
      [['OriginGateIn'], ['Load'], ['Discharge']]);
});
