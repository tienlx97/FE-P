import { labelForShipmentContainerType } from './shipment-container-types.js';
import { shipmentVgmSchema } from './shipment-vgm-schema.js';

/**
 * Every column of the container Excel file, in template order — the
 * template, the import and the "Xuất Excel" export all use these headers,
 * so an exported file can be edited and imported again. `aliases` also
 * accept the API field names. `key` is the `BulkContainerRow` field the
 * column fills (`carrierName` is resolved to `carrierCustomerId`).
 * @type {ReadonlyArray<{ key: keyof import('../types/index.js').BulkContainerRow, header: string, aliases: string[], hint: string, width: number }>}
 */
export const BULK_CONTAINER_COLUMNS = [
  {
    key: 'containerNumber',
    header: 'Số container',
    aliases: ['ContainerNumber'],
    hint: 'Bắt buộc · tối đa 50 ký tự · không trùng trong lô',
    width: 18,
  },
  {
    key: 'containerType',
    header: 'Loại cont',
    aliases: ['ContainerType'],
    hint: "Bắt buộc · 20' / 40' / 40'HC / 45'",
    width: 12,
  },
  {
    key: 'sealNumber',
    header: 'Số seal',
    aliases: ['SealNumber'],
    hint: 'Tuỳ chọn · tối đa 50 ký tự',
    width: 16,
  },
  {
    key: 'carrierName',
    header: 'Nhà vận chuyển',
    aliases: ['Carrier', 'CarrierName'],
    hint: 'Tuỳ chọn · tên đúng như danh mục Nhà cung cấp (xem sheet "Nhà vận chuyển")',
    width: 36,
  },
  {
    key: 'packingDate',
    header: 'Ngày đóng',
    aliases: ['PackingDate'],
    hint: 'Tuỳ chọn · dd/mm/yyyy',
    width: 14,
  },
  {
    key: 'plannedPackingTime',
    header: 'Giờ đóng dự kiến',
    aliases: ['PlannedPackingTime'],
    hint: 'Tuỳ chọn · HH:mm',
    width: 16,
  },
  {
    key: 'actualPackingTime',
    header: 'Giờ đóng thực tế',
    aliases: ['ActualPackingTime'],
    hint: 'Tuỳ chọn · HH:mm',
    width: 16,
  },
  {
    key: 'truckArrivalTime',
    header: 'Giờ xe vào nhà máy',
    aliases: ['TruckArrivalTime'],
    hint: 'Tuỳ chọn · HH:mm',
    width: 18,
  },
  {
    key: 'maxGross',
    header: 'Max gross (kg)',
    aliases: ['MaxGross'],
    hint: 'Container · > 0 · tare / payload / max gross nhập riêng được; khai VGM (net + bao bì) cần đủ cả 3',
    width: 15,
  },
  {
    key: 'tare',
    header: 'Tare (kg)',
    aliases: ['Tare'],
    hint: 'Container · > 0',
    width: 12,
  },
  {
    key: 'payload',
    header: 'Payload (kg)',
    aliases: ['Payload'],
    hint: 'Container · > 0',
    width: 14,
  },
  {
    key: 'netWeight',
    header: 'Net weight (kg)',
    aliases: ['NetWeight'],
    hint: 'Khai VGM · > 0 · cùng khối lượng bao bì',
    width: 15,
  },
  {
    key: 'packagingWeight',
    header: 'Khối lượng bao bì (kg)',
    aliases: ['PackagingWeight'],
    hint: 'Khai VGM · ≥ 0 · cùng net weight',
    width: 20,
  },
  {
    key: 'note',
    header: 'Ghi chú',
    aliases: ['Note'],
    hint: 'Tuỳ chọn · tối đa 2000 ký tự',
    width: 32,
  },
];

/** The five weights: the container's three, then the declaration's two. */
export const VGM_WEIGHT_KEYS = /** @type {const} */ ([
  'maxGross',
  'tare',
  'payload',
  'netWeight',
  'packagingWeight',
]);

/** @param {string} [id] @returns {import('../types/index.js').BulkContainerRow} */
export function emptyBulkContainerRow(id = 'manual-0') {
  return {
    id,
    containerNumber: '',
    containerType: 'Size40HC',
    sealNumber: '',
    carrierName: '',
    carrierCustomerId: '',
    packingDate: '',
    plannedPackingTime: '',
    actualPackingTime: '',
    truckArrivalTime: '',
    maxGross: undefined,
    tare: undefined,
    payload: undefined,
    netWeight: undefined,
    packagingWeight: undefined,
    note: '',
  };
}

/** @param {unknown} value */
export function normalizeContainerType(value) {
  const key = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/['\s_-]/g, '');
  const options =
    /** @type {Record<string, import('../types/index.js').ShipmentContainerType>} */ ({
      20: 'Size20',
      '20GP': 'Size20',
      '20DC': 'Size20',
      SIZE20: 'Size20',
      40: 'Size40',
      '40GP': 'Size40',
      '40DC': 'Size40',
      SIZE40: 'Size40',
      '40HC': 'Size40HC',
      '40HQ': 'Size40HC',
      SIZE40HC: 'Size40HC',
      45: 'Size45',
      '45HC': 'Size45',
      SIZE45: 'Size45',
    });
  return options[key] ?? '';
}

/** Excel serial day 0 (the 1900 date system, with its leap-year bug). */
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);

/**
 * Excel serial number, `dd/mm/yyyy` text or ISO text → `yyyy-mm-dd`.
 * Anything else is returned trimmed, for validation to flag.
 * @param {unknown} value
 */
export function normalizeContainerDate(value) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(EXCEL_EPOCH + Math.floor(value) * 86_400_000)
      .toISOString()
      .slice(0, 10);
  }
  const text = String(value).trim();
  const vietnamese = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text);
  return vietnamese
    ? `${vietnamese[3]}-${vietnamese[2].padStart(2, '0')}-${vietnamese[1].padStart(2, '0')}`
    : text;
}

/**
 * Excel time (fraction of a day, possibly on a date serial) or `H:mm` /
 * `HH:mm[:ss]` text → `HH:mm`. Anything else is returned trimmed.
 * @param {unknown} value
 */
export function normalizeContainerTime(value) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    const minutes = Math.round((value - Math.floor(value)) * 1440) % 1440;
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  }
  const text = String(value).trim();
  const match = /^(\d{1,2})[:hH.](\d{2})(?::\d{2})?$/.exec(text);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : text;
}

/**
 * Number cell or text such as `3,900.5`, `3.900,5` or `3 900` → number;
 * blank → undefined; unreadable text → NaN (validation flags it).
 * @param {unknown} value
 * @returns {number | undefined}
 */
export function normalizeWeight(value) {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'number') return value;
  let text = String(value).trim().replace(/\s/g, '');
  if (text === '') return undefined;
  text = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(text)
    ? text.replace(/\./g, '').replace(',', '.')
    : text.replace(/,/g, '');
  return /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : Number.NaN;
}

/** @param {string} value */
const nameKey = (value) => value.trim().toLocaleLowerCase('vi');

/**
 * @param {Record<string, unknown>} record
 * @param {{ header: string, aliases: string[] }} column
 */
function cell(record, column) {
  for (const name of [column.header, ...column.aliases]) {
    if (name in record) return record[name];
  }
  return '';
}

/**
 * Rows of the template, or of a "Xuất Excel" export (extra columns such as
 * STT / G.W / VGM are ignored). Every nonblank source row is kept so it can
 * be corrected in the drawer. A carrier name is matched to the supplier
 * catalog case-insensitively; an unknown name keeps `carrierCustomerId`
 * empty and `validateBulkContainerRows` reports it.
 * @param {Record<string, unknown>[]} records
 * @param {{ id: string, companyName: string }[]} carriers
 * @returns {import('../types/index.js').BulkContainerRow[]}
 */
export function parseBulkContainerRows(records, carriers = []) {
  const carrierIds = new Map(
    carriers.map((carrier) => [nameKey(carrier.companyName), carrier.id]),
  );
  /** @param {Record<string, unknown>} record @param {string} key */
  const read = (record, key) =>
    cell(
      record,
      /** @type {(typeof BULK_CONTAINER_COLUMNS)[number]} */ (
        BULK_CONTAINER_COLUMNS.find((column) => column.key === key)
      ),
    );
  /** @param {unknown} value */
  const text = (value) => String(value ?? '').trim();

  return records
    .map((record, index) => {
      const carrierName = text(read(record, 'carrierName'));
      return {
        id: `excel-${index}`,
        containerNumber: text(read(record, 'containerNumber')),
        containerType: normalizeContainerType(read(record, 'containerType')),
        sealNumber: text(read(record, 'sealNumber')),
        carrierName,
        carrierCustomerId: carrierName
          ? (carrierIds.get(nameKey(carrierName)) ?? '')
          : '',
        packingDate: normalizeContainerDate(read(record, 'packingDate')),
        plannedPackingTime: normalizeContainerTime(
          read(record, 'plannedPackingTime'),
        ),
        actualPackingTime: normalizeContainerTime(
          read(record, 'actualPackingTime'),
        ),
        truckArrivalTime: normalizeContainerTime(
          read(record, 'truckArrivalTime'),
        ),
        maxGross: normalizeWeight(read(record, 'maxGross')),
        tare: normalizeWeight(read(record, 'tare')),
        payload: normalizeWeight(read(record, 'payload')),
        netWeight: normalizeWeight(read(record, 'netWeight')),
        packagingWeight: normalizeWeight(read(record, 'packagingWeight')),
        note: text(read(record, 'note')),
      };
    })
    .filter((row) =>
      BULK_CONTAINER_COLUMNS.some((column) => {
        const value = row[column.key];
        return typeof value === 'number' || Boolean(value);
      }),
    );
}

/** @param {string} value */
function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

/** @param {string} value */
const isTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

/**
 * VGM status of a row for the drawer's table: not declared until net weight
 * or packaging is entered (container weights alone are fine), then declared
 * once all five are in.
 * @param {import('../types/index.js').BulkContainerRow} row
 * @returns {{ state: 'declared', vgm: number } | { state: 'partial', missing: number } | { state: 'empty' }}
 */
export function bulkRowVgmState(row) {
  const entered = VGM_WEIGHT_KEYS.filter((key) => row[key] !== undefined);
  if (row.netWeight === undefined && row.packagingWeight === undefined) {
    return { state: 'empty' };
  }
  if (entered.length < VGM_WEIGHT_KEYS.length) {
    return {
      state: 'partial',
      missing: VGM_WEIGHT_KEYS.length - entered.length,
    };
  }
  return {
    state: 'declared',
    vgm: (row.netWeight ?? 0) + (row.packagingWeight ?? 0) + (row.tare ?? 0),
  };
}

/**
 * @typedef {{ rowId: string | null, line: number | null, field: string | null, message: string }} BulkContainerIssue
 */

/**
 * Same rules as the single-container form (`shipmentVgmSchema`) plus the
 * batch rules: 1–100 rows, container numbers unique within the batch and
 * against the shipment's existing containers, a carrier name that matches
 * the catalog, valid dates / times / numbers.
 * @param {import('../types/index.js').BulkContainerRow[]} rows
 * @param {string[]} existingNumbers
 * @returns {BulkContainerIssue[]}
 */
export function validateBulkContainerRows(rows, existingNumbers) {
  /** @type {BulkContainerIssue[]} */
  const issues = [];
  if (rows.length < 1 || rows.length > 100) {
    issues.push({
      rowId: null,
      line: null,
      field: null,
      message: 'Nhập từ 1 đến 100 container mỗi lần.',
    });
  }
  const seen = new Set(
    existingNumbers.map((number) => number.trim().toUpperCase()),
  );
  rows.forEach((row, index) => {
    const line = index + 1;
    /** @param {string} field @param {string} message */
    const add = (field, message) => {
      if (
        !issues.some((issue) => issue.rowId === row.id && issue.field === field)
      ) {
        issues.push({ rowId: row.id, line, field, message });
      }
    };

    const number = row.containerNumber.trim().toUpperCase();
    if (number && seen.has(number))
      add(
        'containerNumber',
        `Số container ${row.containerNumber.trim()} bị trùng.`,
      );
    else if (number) seen.add(number);

    if (row.carrierName && !row.carrierCustomerId) {
      add(
        'carrierCustomerId',
        `Không tìm thấy nhà vận chuyển “${row.carrierName}” trong danh mục.`,
      );
    }
    for (const key of VGM_WEIGHT_KEYS) {
      if (Number.isNaN(row[key])) add(key, 'Khối lượng không phải là số.');
    }
    if (row.packingDate && !isIsoDate(row.packingDate))
      add('packingDate', 'Ngày đóng hàng không hợp lệ.');
    for (const key of /** @type {const} */ ([
      'plannedPackingTime',
      'actualPackingTime',
      'truckArrivalTime',
    ])) {
      if (row[key] && !isTime(row[key])) add(key, 'Giờ không hợp lệ (HH:mm).');
    }

    const { id: _id, carrierName: _name, ...values } = row;
    const result = shipmentVgmSchema.safeParse({
      ...values,
      ...Object.fromEntries(
        VGM_WEIGHT_KEYS.map((key) => [
          key,
          Number.isNaN(row[key]) ? undefined : row[key],
        ]),
      ),
    });
    if (!result.success) {
      for (const issue of result.error.issues)
        add(String(issue.path[0]), issue.message);
    }
  });
  return issues;
}

/** @param {string | null | undefined} iso `yyyy-mm-dd` */
const toDisplayDate = (iso) =>
  iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '';

/**
 * One export record per container, keyed by the template headers (plus
 * the read-only STT / G.W / VGM / "Đã khai VGM"), so the file imports back.
 * @param {import('../types/index.js').ShipmentVgm[]} vgms
 * @param {(customerId: string | null) => string} carrierName
 * @returns {Record<string, string | number>[]}
 */
export function containerExportRecords(vgms, carrierName) {
  return vgms.map((vgm) => ({
    STT: vgm.sequenceNumber,
    'Số container': vgm.containerNumber,
    'Loại cont': labelForShipmentContainerType(vgm.containerType),
    'Số seal': vgm.sealNumber ?? '',
    'Nhà vận chuyển': carrierName(vgm.carrierCustomerId),
    'Ngày đóng': toDisplayDate(vgm.packingDate),
    'Giờ đóng dự kiến': vgm.plannedPackingTime?.slice(0, 5) ?? '',
    'Giờ đóng thực tế': vgm.actualPackingTime?.slice(0, 5) ?? '',
    'Giờ xe vào nhà máy': vgm.truckArrivalTime?.slice(0, 5) ?? '',
    'Max gross (kg)': vgm.maxGross ?? '',
    'Tare (kg)': vgm.tare ?? '',
    'Payload (kg)': vgm.payload ?? '',
    'Net weight (kg)': vgm.netWeight ?? '',
    'Khối lượng bao bì (kg)': vgm.packagingWeight ?? '',
    'Ghi chú': vgm.note ?? '',
    'G.W (kg)': vgm.grossWeight ?? '',
    'VGM (kg)': vgm.vgm ?? '',
    'Đã khai VGM': (vgm.isVgmDeclared ?? vgm.vgm !== null) ? 'Có' : 'Chưa',
  }));
}

/**
 * The template's guide sheet: one row per column with what it accepts,
 * then the accepted container types.
 * @param {{ value: string, label: string }[]} typeOptions
 * @returns {string[][]}
 */
export function bulkContainerGuideRows(typeOptions) {
  return [
    ['Cột', 'Cách nhập'],
    ...BULK_CONTAINER_COLUMNS.map((column) => [column.header, column.hint]),
    [],
    ['Loại cont hợp lệ', typeOptions.map((option) => option.label).join(' · ')],
    [
      'Lưu ý',
      'Mỗi lần nhập tối đa 100 container. Dòng trống bị bỏ qua. Có thể nhập lại tệp "Xuất Excel" (các cột STT, G.W, VGM, Đã khai VGM được bỏ qua).',
    ],
  ];
}
