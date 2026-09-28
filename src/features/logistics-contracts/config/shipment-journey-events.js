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

/**
 * Container first, then voyage/leg; null container events remain visible as
 * whole-shipment facts. Keep the server's chronological event order.
 * @param {import('../types/index.js').PhysicalJourneyEvent[]} events
 */
export function groupPhysicalEvents(events) {
  /** @type {Map<string, {container: string, voyages: Map<string, {id: string, label: string, events: import('../types/index.js').PhysicalJourneyEvent[]}>}>} */
  const containers = new Map();
  for (const event of events) {
    const container = event.containerNumber || 'Toàn lô';
    if (!containers.has(container)) {
      containers.set(container, { container, voyages: new Map() });
    }
    const group = /** @type {NonNullable<ReturnType<typeof containers.get>>} */ (containers.get(container));
    const voyageLabel = [event.vesselName, event.voyageNumber].filter(Boolean).join(' / ');
    const label = voyageLabel || (event.legSequence ? `Chặng ${event.legSequence}` : 'Chặng chung');
    const voyageKey = `${event.legSequence ?? 0}|${label}`;
    if (!group.voyages.has(voyageKey)) {
      group.voyages.set(voyageKey, { id: voyageKey, label, events: [] });
    }
    group.voyages.get(voyageKey)?.events.push(event);
  }
  return [...containers.values()]
    .sort((a, b) => a.container === 'Toàn lô' ? -1 : b.container === 'Toàn lô' ? 1 : a.container.localeCompare(b.container))
    .map((group) => ({ container: group.container, voyages: [...group.voyages.values()] }));
}
