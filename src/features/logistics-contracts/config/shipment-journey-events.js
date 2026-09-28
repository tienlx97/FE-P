/** @type {Record<import('../types/index.js').PhysicalJourneyEvent['code'], string>} */
export const PHYSICAL_EVENT_LABELS = {
  EmptyPickup: 'Lấy container rỗng',
  Packing: 'Đóng hàng',
  ExwHandover: 'Giao hàng EXW',
  OriginGateIn: 'Gate-in cảng xuất',
  Load: 'Xếp lên tàu (LOAD)',
  Departure: 'Tàu rời cảng (DEPA)',
  TransshipmentArrival: 'Tàu đến cảng chuyển tải',
  TransshipmentDischarge: 'Dỡ tại cảng chuyển tải',
  TransshipmentLoad: 'Xếp lên tàu nối',
  TransshipmentDeparture: 'Rời cảng chuyển tải',
  Arrival: 'Tàu đến cảng đích (ARRI)',
  Discharge: 'Dỡ khỏi tàu (DISC)',
  ImportClearance: 'Thông quan nhập khẩu',
  DestinationGateOut: 'Gate-out cảng đích',
  SiteDelivery: 'Giao hàng tại nơi nhận',
  EmptyReturn: 'Trả container rỗng',
};

export const PHYSICAL_EVENT_CLASSIFIERS = {
  Actual: 'Thực tế',
  Estimated: 'Dự kiến',
  Planned: 'Kế hoạch',
};

export const PHYSICAL_EVENT_SOURCES = {
  Container: 'Container',
  Milestone: 'Xác nhận',
  Schedule: 'Lịch tàu',
  Carrier: 'Hãng tàu',
};

export const WHOLE_SHIPMENT = 'Toàn lô';

/** @param {string} from @param {string} to ISO dates → whole days */
function daysBetween(from, to) {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000,
  );
}

/**
 * "Vessel / voyage", without repeating a voyage number the vessel name
 * already carries (e.g. "KMTC JAKARTA // 2604S").
 * @param {import('../types/index.js').PhysicalJourneyEvent} event
 */
function voyageLabel(event) {
  const vessel = event.vesselName?.trim() ?? '';
  const voyage = event.voyageNumber?.trim() ?? '';
  if (voyage && vessel.includes(voyage)) return vessel;
  return [vessel, voyage].filter(Boolean).join(' / ');
}

/** @param {import('../types/index.js').PhysicalJourneyEvent} event */
const sortKey = (event) =>
  `${event.eventOn}T${event.eventAt?.slice(11, 16) ?? '99:99'}`;

/**
 * @typedef {{
 *   id: string,
 *   code: import('../types/index.js').PhysicalJourneyEvent['code'],
 *   location: string | null,
 *   voyage: string,
 *   actual: import('../types/index.js').PhysicalJourneyEvent | null,
 *   expected: import('../types/index.js').PhysicalJourneyEvent | null,
 *   state: 'done' | 'next' | 'overdue' | 'upcoming',
 *   deltaDays: number | null,
 * }} PhysicalTimelineItem
 */

/**
 * One timeline per container ("Toàn lô" first for whole-shipment facts,
 * then containers A→Z). The server sends each fact once per classifier
 * (a planned or estimated date and, later, the actual one); they merge
 * into one item per event + leg + place. `expected` is the latest
 * estimate (or the plan when there is none), `actual` the confirmed
 * date. Items run in date order. State: `done` once actual, `overdue`
 * when the expected date has passed without an actual one, the first
 * remaining upcoming item is `next`. `deltaDays` = actual − expected
 * (late > 0), or for an overdue item, today − expected.
 * @param {import('../types/index.js').PhysicalJourneyEvent[]} events
 * @param {string} today ISO date
 */
export function buildPhysicalTimeline(events, today) {
  /** @type {Map<string, Map<string, Omit<PhysicalTimelineItem, 'state' | 'deltaDays'> & { order: number }>>} */
  const containers = new Map();
  events.forEach((event, order) => {
    const container = event.containerNumber || WHOLE_SHIPMENT;
    if (!containers.has(container)) containers.set(container, new Map());
    const items =
      /** @type {Map<string, Omit<PhysicalTimelineItem, 'state' | 'deltaDays'> & { order: number }>} */ (
        containers.get(container)
      );
    const id = [event.code, event.legSequence ?? 0, event.location ?? ''].join(
      '|',
    );
    const item = items.get(id) ?? {
      id,
      code: event.code,
      location: event.location,
      voyage: '',
      actual: null,
      expected: null,
      order,
    };
    item.voyage ||= voyageLabel(event);
    if (event.classifier === 'Actual') {
      item.actual = event;
    } else if (
      !item.expected ||
      event.classifier === 'Estimated' ||
      item.expected.classifier === 'Planned'
    ) {
      item.expected = event;
    }
    items.set(id, item);
  });

  return [...containers.entries()]
    .sort(([a], [b]) =>
      a === WHOLE_SHIPMENT ? -1 : b === WHOLE_SHIPMENT ? 1 : a.localeCompare(b),
    )
    .map(([container, map]) => {
      const sorted = [...map.values()].sort((a, b) => {
        const keyA = sortKey(
          /** @type {import('../types/index.js').PhysicalJourneyEvent} */ (
            a.actual ?? a.expected
          ),
        );
        const keyB = sortKey(
          /** @type {import('../types/index.js').PhysicalJourneyEvent} */ (
            b.actual ?? b.expected
          ),
        );
        return keyA === keyB ? a.order - b.order : keyA.localeCompare(keyB);
      });
      let hasNext = false;
      /** @type {PhysicalTimelineItem[]} */
      const items = sorted.map(({ order: _order, ...item }) => {
        if (item.actual) {
          return {
            ...item,
            state: 'done',
            deltaDays: item.expected
              ? daysBetween(item.expected.eventOn, item.actual.eventOn)
              : null,
          };
        }
        const expectedOn =
          /** @type {import('../types/index.js').PhysicalJourneyEvent} */ (
            item.expected
          ).eventOn;
        if (expectedOn < today) {
          return {
            ...item,
            state: 'overdue',
            deltaDays: daysBetween(expectedOn, today),
          };
        }
        const state = hasNext ? 'upcoming' : 'next';
        hasNext = true;
        return { ...item, state, deltaDays: null };
      });
      return {
        id: container,
        label: container,
        items,
        doneCount: items.filter((item) => item.state === 'done').length,
      };
    });
}
