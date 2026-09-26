/**
 * B/L progress and transshipment legs (BE-kt-xnk
 * `add-shipment-bl-transshipment`, spec `docs/shipment-journey-incoterms.md`
 * §4.6–4.7).
 */

/** @type {Record<import('../types/index.js').BillOfLadingType, string>} */
const BL_TYPE_LABELS = {
  Original: 'B/L gốc (Original)',
  Surrendered: 'Surrendered (telex release)',
  SeawayBill: 'Seaway bill',
};

export const billOfLadingTypeOptions = /** @type {const} */ ([
  'Original',
  'Surrendered',
  'SeawayBill',
]).map((type) => ({ value: type, label: BL_TYPE_LABELS[type] }));

/** @param {import('../types/index.js').BillOfLadingType | null | undefined} type */
export function labelForBillOfLadingType(type) {
  return type ? BL_TYPE_LABELS[type] : 'Chưa chọn loại B/L';
}

/** @type {import('../types/index.js').ShipmentDocuments} */
export const EMPTY_DOCUMENTS = {
  billOfLadingType: null,
  blDraftReceivedOn: null,
  blIssuedOn: null,
  blReleasedOn: null,
  blReleaseReference: null,
};

/**
 * The B/L steps in order, with their date: draft → issued → released. The
 * release step is named by the B/L type (originals sent / telex release)
 * and does not exist for a sea waybill.
 * @param {import('../types/index.js').ShipmentDocuments | null | undefined} documents
 * @returns {Array<{ key: 'draft' | 'issued' | 'released', label: string, date: string | null }>}
 */
export function billOfLadingSteps(documents) {
  const values = documents ?? EMPTY_DOCUMENTS;
  const steps = [
    { key: /** @type {const} */ ('draft'), label: 'B/L nháp', date: values.blDraftReceivedOn },
    { key: /** @type {const} */ ('issued'), label: 'B/L phát hành', date: values.blIssuedOn },
  ];
  if (values.billOfLadingType === 'SeawayBill') return steps;
  return [
    ...steps,
    {
      key: /** @type {const} */ ('released'),
      label: values.billOfLadingType === 'Surrendered' ? 'Telex release' : 'Giao bộ chứng từ gốc',
      date: values.blReleasedOn,
    },
  ];
}

let nextRowKey = 0;

/**
 * Editor rows from the saved legs, or one blank row.
 * @param {import('../types/index.js').TransshipmentLeg[] | undefined} legs
 * @returns {import('../types/index.js').TransshipmentLegFormRow[]}
 */
export function transshipmentRows(legs) {
  return (legs ?? []).map((leg) => ({
    rowKey: `leg-${nextRowKey++}`,
    port: leg.port,
    vesselName: leg.vesselName ?? '',
    voyageNumber: leg.voyageNumber ?? '',
    eta: leg.eta ?? '',
    ata: leg.ata ?? '',
    etd: leg.etd ?? '',
    atd: leg.atd ?? '',
  }));
}

/** @returns {import('../types/index.js').TransshipmentLegFormRow} */
export function blankTransshipmentRow() {
  return {
    rowKey: `leg-${nextRowKey++}`,
    port: '',
    vesselName: '',
    voyageNumber: '',
    eta: '',
    ata: '',
    etd: '',
    atd: '',
  };
}

/**
 * Row errors keyed by rowKey: a port is required (≤200), vessel ≤200,
 * voyage ≤50 — same limits as the backend.
 * @param {import('../types/index.js').TransshipmentLegFormRow[]} rows
 * @returns {Record<string, Partial<Record<'port' | 'vesselName' | 'voyageNumber', string>>>}
 */
export function transshipmentErrors(rows) {
  /** @type {Record<string, Partial<Record<'port' | 'vesselName' | 'voyageNumber', string>>>} */
  const errors = {};
  for (const row of rows) {
    /** @type {Partial<Record<'port' | 'vesselName' | 'voyageNumber', string>>} */
    const rowErrors = {};
    if (!row.port.trim()) rowErrors.port = 'Vui lòng nhập cảng';
    else if (row.port.trim().length > 200) rowErrors.port = 'Tối đa 200 ký tự';
    if (row.vesselName.length > 200) rowErrors.vesselName = 'Tối đa 200 ký tự';
    if (row.voyageNumber.length > 50) rowErrors.voyageNumber = 'Tối đa 50 ký tự';
    if (Object.keys(rowErrors).length > 0) errors[row.rowKey] = rowErrors;
  }
  return errors;
}

/**
 * "VNSGN → Singapore → THBKK" — the route through the transshipment ports.
 * @param {string} from
 * @param {import('../types/index.js').TransshipmentLeg[] | undefined} legs
 * @param {string} to
 */
export function transshipmentRoute(from, legs, to) {
  return [from, ...(legs ?? []).map((leg) => leg.port), to].filter(Boolean).join(' → ');
}
