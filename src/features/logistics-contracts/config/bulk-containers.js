import { SHIPMENT_CONTAINER_TYPES } from './shipment-container-types.js';

/** @param {string} [id] @returns {import('../types/index.js').BulkContainerRow} */
export function emptyBulkContainerRow(id = 'manual-0') {
  return { id, containerNumber: '', containerType: 'Size40HC', sealNumber: '', packingDate: '' };
}

/** @param {unknown} value */
export function normalizeContainerType(value) {
  const key = String(value ?? '').trim().toUpperCase().replace(/['\s_-]/g, '');
  const options = /** @type {Record<string, import('../types/index.js').ShipmentContainerType>} */ ({
    '20': 'Size20', '20GP': 'Size20', SIZE20: 'Size20',
    '40': 'Size40', '40GP': 'Size40', SIZE40: 'Size40',
    '40HC': 'Size40HC', '40HQ': 'Size40HC', SIZE40HC: 'Size40HC',
    '45': 'Size45', SIZE45: 'Size45',
  });
  return options[key] ?? '';
}

/** @param {unknown} value */
export function normalizeContainerDate(value) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86_400_000)
      .toISOString().slice(0, 10);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  const vietnamese = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  return vietnamese
    ? `${vietnamese[3]}-${vietnamese[2].padStart(2, '0')}-${vietnamese[1].padStart(2, '0')}`
    : text;
}

/**
 * Read the downloadable template or the same columns in the existing VGM
 * export. Unknown columns are ignored; every nonblank source row is retained
 * for correction in the preview table.
 * @param {Record<string, unknown>[]} records
 */
export function parseBulkContainerRows(records) {
  return records.map((record, index) => {
    const containerNumber = String(record['Số container'] ?? record.ContainerNumber ?? '').trim();
    const containerType = normalizeContainerType(record['Loại cont'] ?? record.ContainerType);
    const sealNumber = String(record['Số seal'] ?? record.SealNumber ?? '').trim();
    const packingDate = normalizeContainerDate(record['Ngày đóng'] ?? record.PackingDate);
    return { id: `excel-${index}`, containerNumber, containerType, sealNumber, packingDate };
  }).filter((row) => row.containerNumber || row.containerType || row.sealNumber || row.packingDate);
}

/** @param {string} value */
function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/**
 * @param {import('../types/index.js').BulkContainerRow[]} rows
 * @param {string[]} existingNumbers
 * @returns {string[]}
 */
export function validateBulkContainerRows(rows, existingNumbers) {
  const issues = [];
  if (rows.length < 1 || rows.length > 100) issues.push('Nhập từ 1 đến 100 container mỗi lần.');
  const seen = new Set(existingNumbers.map((number) => number.trim().toUpperCase()));
  rows.forEach((row, index) => {
    const line = index + 1;
    const number = row.containerNumber.trim();
    if (!number || number.length > 50) issues.push(`Dòng ${line}: số container phải có 1–50 ký tự.`);
    else if (seen.has(number.toUpperCase())) issues.push(`Dòng ${line}: số container ${number} bị trùng.`);
    else seen.add(number.toUpperCase());
    if (!SHIPMENT_CONTAINER_TYPES.includes(/** @type {import('../types/index.js').ShipmentContainerType} */ (row.containerType))) {
      issues.push(`Dòng ${line}: chọn loại container hợp lệ.`);
    }
    if (row.sealNumber.length > 50) issues.push(`Dòng ${line}: số seal tối đa 50 ký tự.`);
    if (row.packingDate && !isIsoDate(row.packingDate)) issues.push(`Dòng ${line}: ngày đóng hàng không hợp lệ.`);
  });
  return issues;
}
