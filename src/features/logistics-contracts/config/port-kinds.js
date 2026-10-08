/**
 * Display name of each `PortKind` where a catalog row has no UN/LOCODE to
 * show instead (ports list, place pickers).
 * @type {Record<import('../types/index.js').PortKind, string>}
 */
export const PORT_KIND_LABELS = {
  Port: 'Cảng',
  Facility: 'Nhà máy / Kho',
  Depot: 'Depot cont rỗng',
};
