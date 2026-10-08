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

const EVENT_ORDER = Object.keys(PHYSICAL_EVENT_LABELS);
const TRANSSHIPMENT_PHASE = EVENT_ORDER.indexOf('TransshipmentArrival');

/**
 * Where an event sits in the physical process (`PHYSICAL_EVENT_LABELS`
 * order: pickup → packing → gate-in → … → empty return), the transshipment
 * events grouped leg by leg. A container's timeline follows the process,
 * not the dates — a gate-in dated before packing (a typo, or packing
 * logged by day only) must not jump ahead of it (user, 2026-10-08).
 * @param {{ code: string, leg: number }} item
 * @returns {[number, number, number]}
 */
function processRank(item) {
  const index = EVENT_ORDER.indexOf(item.code);
  const rank = index === -1 ? EVENT_ORDER.length : index;
  return item.code.startsWith('Transshipment')
    ? [TRANSSHIPMENT_PHASE, item.leg, rank]
    : [rank, 0, 0];
}

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** @param {string | null | undefined} iso date → "T2" … "CN", '' when missing */
export function weekdayLabel(iso) {
  if (!iso) return '';
  const day = new Date(`${iso.slice(0, 10)}T00:00:00Z`).getUTCDay();
  return Number.isNaN(day) ? '' : WEEKDAYS[day];
}

/**
 * @typedef {{
 *   id: string,
 *   code: import('../types/index.js').PhysicalJourneyEvent['code'],
 *   leg: number,
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
      leg: event.legSequence ?? 0,
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
        const rankA = processRank(a);
        const rankB = processRank(b);
        const byProcess =
          rankA[0] - rankB[0] || rankA[1] - rankB[1] || rankA[2] - rankB[2];
        if (byProcess !== 0) return byProcess;
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

/**
 * The physical event that dates each Incoterm journey milestone (none for
 * "OriginInland", the trucking leg itself).
 * @type {Partial<Record<import('../types/index.js').ShipmentMilestone, import('../types/index.js').PhysicalJourneyEvent['code']>>}
 */
const MILESTONE_EVENT = {
  EmptyPickup: 'EmptyPickup',
  CargoReady: 'Packing',
  ExwHandover: 'ExwHandover',
  OriginPort: 'OriginGateIn',
  OnBoard: 'Load',
  Ocean: 'Departure',
  DestinationPort: 'Arrival',
  Discharged: 'Discharge',
  ImportClearance: 'ImportClearance',
  DestinationInland: 'DestinationGateOut',
  Site: 'SiteDelivery',
  EmptyReturn: 'EmptyReturn',
};

/**
 * The milestone strip step (`buildMilestoneStrip`) of a journey milestone:
 * its event on the main voyage (leg 0) first, else any leg; null when the
 * milestone has no event or none is dated yet.
 * @param {string} milestone
 * @param {MilestoneStripStep[]} strip
 */
export function stripStepForMilestone(milestone, strip) {
  const code =
    MILESTONE_EVENT[
      /** @type {import('../types/index.js').ShipmentMilestone} */ (milestone)
    ];
  if (!code) return null;
  return (
    strip.find((step) => step.id === `${code}|0`) ??
    strip.find((step) => step.code === code) ??
    null
  );
}

/**
 * @typedef {{
 *   id: string,
 *   code: import('../types/index.js').PhysicalJourneyEvent['code'],
 *   containerDone: number,
 *   containerTotal: number,
 *   shown: import('../types/index.js').PhysicalJourneyEvent,
 *   state: 'done' | 'next' | 'overdue' | 'upcoming',
 * }} MilestoneStripStep
 */

/**
 * The whole shipment at a glance (carrier "Tracking" bar): one step per
 * event + leg across every container, in date order. A container event
 * counts its done containers against all containers ("Lấy rỗng 3/4");
 * 0 total = a vessel / whole-shipment event. Done once nothing is pending
 * and every container has it; overdue when a pending member is; the first
 * other pending step is `next`. `shown` = the earliest pending expected
 * date, else the latest actual one.
 * @param {ReturnType<typeof buildPhysicalTimeline>} groups
 * @returns {MilestoneStripStep[]}
 */
export function buildMilestoneStrip(groups) {
  const containerCount = groups.filter(
    (group) => group.id !== WHOLE_SHIPMENT,
  ).length;
  /** @type {Map<string, { code: PhysicalTimelineItem['code'], members: PhysicalTimelineItem[], doneContainers: Set<string>, hasContainers: boolean }>} */
  const steps = new Map();
  for (const group of groups) {
    const isContainer = group.id !== WHOLE_SHIPMENT;
    for (const item of group.items) {
      const id = `${item.code}|${item.leg}`;
      const step = steps.get(id) ?? {
        code: item.code,
        members: [],
        doneContainers: new Set(),
        hasContainers: false,
      };
      step.members.push(item);
      step.hasContainers ||= isContainer;
      if (isContainer && item.state === 'done') {
        step.doneContainers.add(group.id);
      }
      steps.set(id, step);
    }
  }

  /** @param {PhysicalTimelineItem} item */
  const eventOf = (item) =>
    /** @type {import('../types/index.js').PhysicalJourneyEvent} */ (
      item.actual ?? item.expected
    );
  let hasNext = false;
  return [...steps.entries()]
    .map(([id, step]) => {
      const keys = step.members.map((item) => sortKey(eventOf(item))).sort();
      return { id, step, first: keys[0] };
    })
    .sort((a, b) => a.first.localeCompare(b.first))
    .map(({ id, step }) => {
      const pending = step.members
        .filter((item) => item.state !== 'done')
        .sort((a, b) => sortKey(eventOf(a)).localeCompare(sortKey(eventOf(b))));
      const actuals = step.members
        .filter((item) => item.state === 'done')
        .sort((a, b) => sortKey(eventOf(b)).localeCompare(sortKey(eventOf(a))));
      const containerTotal = step.hasContainers ? containerCount : 0;
      const containerDone = step.doneContainers.size;
      /** @type {MilestoneStripStep['state']} */
      let state;
      if (pending.some((item) => item.state === 'overdue')) {
        state = 'overdue';
      } else if (pending.length === 0 && containerDone >= containerTotal) {
        state = 'done';
      } else {
        state = hasNext ? 'upcoming' : 'next';
        hasNext = true;
      }
      return {
        id,
        code: step.code,
        containerDone,
        containerTotal,
        shown: eventOf(pending[0] ?? actuals[0]),
        state,
      };
    });
}

/**
 * Gate-in at the port of loading measured from the actual packing of the
 * same container: hours / minutes when both have a time, else days; a
 * gate-in before packing is flagged. Null unless both are done.
 * @param {PhysicalTimelineItem[]} items one container's timeline
 * @returns {{ label: string, tone: 'neutral' | 'warning' } | null}
 */
export function packingToGateIn(items) {
  const packing = items.find((item) => item.code === 'Packing')?.actual;
  const gateIn = items.find((item) => item.code === 'OriginGateIn')?.actual;
  if (!packing || !gateIn) return null;
  if (packing.eventAt && gateIn.eventAt) {
    const minutes = Math.round(
      (Date.parse(gateIn.eventAt) - Date.parse(packing.eventAt)) / 60_000,
    );
    if (minutes < 0) {
      return {
        label: `Gate-in trước giờ đóng hàng ${packing.eventAt.slice(11, 16)}`,
        tone: 'warning',
      };
    }
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    const span = [
      hours > 0 ? `${hours} giờ` : '',
      rest > 0 || hours === 0 ? `${rest} phút` : '',
    ]
      .filter(Boolean)
      .join(' ');
    return { label: `Sau đóng hàng ${span}`, tone: 'neutral' };
  }
  const days = daysBetween(packing.eventOn, gateIn.eventOn);
  if (days < 0) return { label: 'Gate-in trước ngày đóng hàng', tone: 'warning' };
  return {
    label: days === 0 ? 'Cùng ngày đóng hàng' : `Sau đóng hàng ${days} ngày`,
    tone: 'neutral',
  };
}