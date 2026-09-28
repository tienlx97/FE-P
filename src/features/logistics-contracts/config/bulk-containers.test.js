import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeContainerDate, parseBulkContainerRows, validateBulkContainerRows } from './bulk-containers.js';

test('Excel template and current export columns become editable rows', () => {
  const rows = parseBulkContainerRows([
    { 'Số container': 'TCLU1234567', 'Loại cont': "40'HC", 'Số seal': 'S-01', 'Ngày đóng': '01/10/2026' },
    { ContainerNumber: 'MSCU7654321', ContainerType: 'Size20', PackingDate: 46300 },
  ]);
  assert.equal(rows[0].containerType, 'Size40HC');
  assert.equal(rows[0].packingDate, '2026-10-01');
  assert.equal(rows[1].containerType, 'Size20');
  assert.equal(rows[1].packingDate, normalizeContainerDate(46300));
});

test('bulk validation blocks duplicates, unknown types and invalid dates before save', () => {
  const rows = parseBulkContainerRows([
    { ContainerNumber: 'TCLU1234567', ContainerType: 'Size20' },
    { ContainerNumber: 'tclu1234567', ContainerType: 'bad', PackingDate: '2026-02-31' },
  ]);
  const issues = validateBulkContainerRows(rows, []);
  assert.ok(issues.some((issue) => issue.includes('bị trùng')));
  assert.ok(issues.some((issue) => issue.includes('loại container')));
  assert.ok(issues.some((issue) => issue.includes('ngày đóng hàng')));
});
