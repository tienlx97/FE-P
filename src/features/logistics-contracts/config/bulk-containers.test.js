import assert from 'node:assert/strict';
import test from 'node:test';

import {
  bulkRowVgmState,
  normalizeContainerDate,
  normalizeContainerTime,
  normalizeWeight,
  parseBulkContainerRows,
  validateBulkContainerRows,
} from './bulk-containers.js';

const carriers = [
  { id: 'carrier-1', companyName: 'Công ty CP Giao Nhận Sao Việt' },
];
const depots = [
  {
    id: 'depot-1',
    name: 'ICD Phước Long',
    fullName: 'ICD Phước Long, Thủ Đức, TP. Hồ Chí Minh',
  },
];

test('template columns become full editable rows with carrier and depot resolved', () => {
  const [row] = parseBulkContainerRows(
    [
      {
        'Số container': 'TCLU1234567',
        'Loại cont': "40'HC",
        'Số seal': 'S-01',
        'Nhà vận chuyển': ' công ty cp giao nhận sao việt ',
        'Depot lấy rỗng': 'icd phước long',
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
    depots,
  );
  assert.deepEqual(row, {
    id: 'excel-0',
    containerNumber: 'TCLU1234567',
    containerType: 'Size40HC',
    sealNumber: 'S-01',
    carrierName: 'công ty cp giao nhận sao việt',
    carrierCustomerId: 'carrier-1',
    depotName: 'icd phước long',
    emptyPickupDepotId: 'depot-1',
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
      {
        ContainerNumber: 'TCLU1234567',
        ContainerType: 'Size20',
        Tare: 2200,
        NetWeight: 18000,
      },
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
  assert.ok(has(1, 'payload'), 'a declaration needs the container weights');
  assert.ok(has(1, 'packagingWeight'), 'net weight needs packaging');
  assert.deepEqual(
    validateBulkContainerRows(
      parseBulkContainerRows([
        {
          ContainerNumber: 'SEGU6154506',
          ContainerType: 'Size40HC',
          Tare: 3830,
        },
      ]),
      [],
    ),
    [],
    'container weights alone are fine',
  );
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

test('a depot is matched by its full name; an unknown depot is reported', () => {
  const rows = parseBulkContainerRows(
    [
      {
        'Số container': 'TCLU1234567',
        'Loại cont': "20'",
        'Depot lấy rỗng': 'ICD Phước Long, Thủ Đức, TP. Hồ Chí Minh',
      },
      {
        'Số container': 'MSCU7654321',
        'Loại cont': "20'",
        'Depot lấy rỗng': 'Depot không có',
      },
    ],
    carriers,
    depots,
  );
  assert.equal(rows[0].emptyPickupDepotId, 'depot-1');
  assert.equal(rows[1].emptyPickupDepotId, '');
  const issues = validateBulkContainerRows(rows, []);
  assert.deepEqual(
    issues.map((issue) => [issue.line, issue.field]),
    [[2, 'emptyPickupDepotId']],
  );
  assert.match(issues[0].message, /Depot không có/u);
});
