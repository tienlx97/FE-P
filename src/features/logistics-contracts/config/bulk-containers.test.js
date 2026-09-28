import assert from 'node:assert/strict';
import test from 'node:test';

import {
  bulkRowVgmState,
  containerExportRecords,
  normalizeContainerDate,
  normalizeContainerTime,
  normalizeWeight,
  parseBulkContainerRows,
  validateBulkContainerRows,
} from './bulk-containers.js';

const carriers = [
  { id: 'carrier-1', companyName: 'Công ty CP Giao Nhận Sao Việt' },
];

test('template columns become full editable rows with the carrier resolved', () => {
  const [row] = parseBulkContainerRows(
    [
      {
        'Số container': 'TCLU1234567',
        'Loại cont': "40'HC",
        'Số seal': 'S-01',
        'Nhà vận chuyển': ' công ty cp giao nhận sao việt ',
        'Ngày đóng': '01/10/2026',
        'Giờ đóng dự kiến': '8:00',
        'Giờ đóng thực tế': 0.3958333333,
        'Giờ xe vào nhà máy': '07h45',
        'Max gross (kg)': 32500,
        'Tare (kg)': '3,900',
        'Payload (kg)': '28.600',
        'Net weight (kg)': 18000,
        'Khối lượng bao bì (kg)': 0,
        'Ghi chú': 'Hàng dễ vỡ',
      },
    ],
    carriers,
  );
  assert.deepEqual(row, {
    id: 'excel-0',
    containerNumber: 'TCLU1234567',
    containerType: 'Size40HC',
    sealNumber: 'S-01',
    carrierName: 'công ty cp giao nhận sao việt',
    carrierCustomerId: 'carrier-1',
    packingDate: '2026-10-01',
    plannedPackingTime: '08:00',
    actualPackingTime: '09:30',
    truckArrivalTime: '07:45',
    maxGross: 32500,
    tare: 3900,
    payload: 28600,
    netWeight: 18000,
    packagingWeight: 0,
    note: 'Hàng dễ vỡ',
  });
  assert.deepEqual(bulkRowVgmState(row), { state: 'declared', vgm: 21900 });
});

test('an exported file imports back with the same values', () => {
  const vgm = /** @type {import('../types/index.js').ShipmentVgm} */ ({
    id: 'v1',
    shipmentId: 's1',
    sequenceNumber: 1,
    containerNumber: 'MSCU7654321',
    sealNumber: null,
    containerType: 'Size20',
    tare: 2200,
    payload: 28000,
    maxGross: 30200,
    netWeight: 15000,
    packagingWeight: 300,
    grossWeight: 15300,
    vgm: 17500,
    packingDate: '2026-10-02',
    plannedPackingTime: '08:00:00',
    actualPackingTime: null,
    truckArrivalTime: null,
    carrierCustomerId: 'carrier-1',
    note: null,
  });
  const [row] = parseBulkContainerRows(
    containerExportRecords([vgm], () => carriers[0].companyName),
    carriers,
  );
  assert.equal(row.containerType, 'Size20');
  assert.equal(row.packingDate, '2026-10-02');
  assert.equal(row.plannedPackingTime, '08:00');
  assert.equal(row.carrierCustomerId, 'carrier-1');
  assert.equal(row.packagingWeight, 300);
  assert.deepEqual(validateBulkContainerRows([row], []), []);
});

test('normalizers read Excel serials and Vietnamese / English number text', () => {
  assert.equal(normalizeContainerDate(46300), '2026-10-05');
  assert.equal(normalizeContainerTime(46300.75), '18:00');
  assert.equal(normalizeWeight('3.900,5'), 3900.5);
  assert.equal(normalizeWeight('3 900'), 3900);
  assert.ok(Number.isNaN(normalizeWeight('abc')));
  assert.equal(normalizeWeight(''), undefined);
});

test('validation reports each bad cell of each row before save', () => {
  const rows = parseBulkContainerRows(
    [
      { ContainerNumber: 'TCLU1234567', ContainerType: 'Size20', Tare: 2200 },
      {
        ContainerNumber: 'tclu1234567',
        ContainerType: 'bad',
        PackingDate: '2026-02-31',
        'Nhà vận chuyển': 'Không có',
        'Giờ đóng dự kiến': '25:00',
        'Max gross (kg)': 'abc',
      },
    ],
    carriers,
  );
  const issues = validateBulkContainerRows(rows, []);
  /** @param {number} line @param {string} field */
  const has = (line, field) =>
    issues.some((issue) => issue.line === line && issue.field === field);
  assert.ok(has(1, 'payload'), 'partial VGM weights');
  assert.ok(has(2, 'containerNumber'), 'duplicate');
  assert.ok(has(2, 'containerType'));
  assert.ok(has(2, 'packingDate'));
  assert.ok(has(2, 'carrierCustomerId'));
  assert.ok(has(2, 'plannedPackingTime'));
  assert.ok(has(2, 'maxGross'));
  assert.ok(
    validateBulkContainerRows([], []).some((issue) => issue.rowId === null),
  );
});
