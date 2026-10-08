import assert from 'node:assert/strict';
import { test } from 'node:test';

import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';

import { parseBulkContainerRows } from './bulk-containers.js';
import {
  buildContainerExportWorkbook,
  buildContainerTemplateWorkbook,
  columnLetter,
  findContainerHeaderRow,
} from './container-workbook.js';

const carriers = [{ id: 'carrier-1', companyName: 'Sao Việt Logistics' }];
const depots = [
  {
    id: 'depot-1',
    name: 'ICD Phước Long',
    fullName: 'ICD Phước Long, Thủ Đức, TP. Hồ Chí Minh',
  },
];

/** @type {import('./container-workbook.js').ContainerExportRow} */
const exportRow = {
  sequenceNumber: 1,
  containerNumber: 'TCLU1234567',
  typeLabel: "40'HC",
  sealNumber: 'SL-01',
  carrier: 'Sao Việt Logistics',
  depot: 'ICD Phước Long',
  packingDate: '2026-10-02',
  plannedPackingTime: '08:00',
  actualPackingTime: '',
  truckArrivalTime: '07:30',
  maxGross: 32500,
  tare: 3900,
  payload: 28600,
  netWeight: 15000.5,
  packagingWeight: 300,
  note: 'Hàng dễ vỡ',
  grossWeight: 15300.5,
  vgm: 19200.5,
  isVgmDeclared: true,
};

/**
 * Reads a workbook the way the bulk drawer does: first sheet, header row
 * found below the title block.
 * @param {import('exceljs').Workbook} workbook
 */
async function readBack(workbook) {
  const buffer = await workbook.xlsx.writeBuffer();
  const book = XLSX.read(buffer, { type: 'array' });
  const sheet = book.Sheets[book.SheetNames[0]];
  const cells = /** @type {unknown[][]} */ (
    XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  );
  const records = /** @type {Record<string, unknown>[]} */ (
    XLSX.utils.sheet_to_json(sheet, {
      range: findContainerHeaderRow(cells),
      defval: '',
    })
  );
  return { book, records };
}

test('columnLetter counts past Z', () => {
  assert.deepEqual(
    [1, 26, 27, 52].map(columnLetter),
    ['A', 'Z', 'AA', 'AZ'],
  );
});

test('the export imports back, depot and carrier resolved, total row ignored', async () => {
  const workbook = buildContainerExportWorkbook(ExcelJS, {
    shipmentCode: '26KCT27/LOT-01',
    typeMix: "1×40'HC",
    rows: [exportRow],
    exportedAt: new Date(2026, 9, 8),
  });
  const sheet = workbook.getWorksheet('Containers');
  assert.ok(sheet);
  assert.equal(sheet.getCell('A1').value, 'DANH SÁCH CONTAINER & VGM - 26KCT27/LOT-01');
  // Header row frozen and repeated on printed pages.
  assert.equal(sheet.views[0].ySplit, 5);
  assert.equal(sheet.pageSetup.printTitlesRow, '5:5');
  // Total: G.W and VGM as live sums.
  const total = sheet.getRow(7);
  assert.equal(total.getCell(1).value, 'TỔNG CỘNG · 1 CONT');
  const headers = /** @type {unknown[]} */ (sheet.getRow(5).values);
  const vgmColumn = headers.indexOf('VGM (kg)');
  const letter = columnLetter(vgmColumn);
  assert.deepEqual(total.getCell(vgmColumn).value, {
    formula: `SUM(${letter}6:${letter}6)`,
    result: 19200.5,
  });

  const { records } = await readBack(workbook);
  const rows = parseBulkContainerRows(records, carriers, depots);
  assert.equal(rows.length, 1, 'the total row is not a container');
  const [row] = rows;
  assert.equal(row.containerNumber, 'TCLU1234567');
  assert.equal(row.containerType, 'Size40HC');
  assert.equal(row.carrierCustomerId, 'carrier-1');
  assert.equal(row.emptyPickupDepotId, 'depot-1');
  assert.equal(row.packingDate, '2026-10-02');
  assert.equal(row.plannedPackingTime, '08:00');
  assert.equal(row.truckArrivalTime, '07:30');
  assert.equal(row.netWeight, 15000.5);
  assert.equal(row.note, 'Hàng dễ vỡ');
});

test('the template has drop-downs from "Danh mục", header notes and a guide', async () => {
  const workbook = buildContainerTemplateWorkbook(ExcelJS, {
    shipmentCode: '26KCT27/LOT-01',
    typeLabels: ["20'", "40'", "40'HC", "45'"],
    carriers: ['Sao Việt Logistics'],
    depots: [{ name: 'ICD Phước Long', fullName: 'ICD Phước Long, Thủ Đức' }],
    createdAt: new Date(2026, 9, 8),
  });
  assert.deepEqual(
    workbook.worksheets.map((sheet) => sheet.name),
    ['Containers', 'Danh mục', 'Hướng dẫn'],
  );
  const sheet = workbook.getWorksheet('Containers');
  assert.ok(sheet);
  const header = sheet.getRow(5);
  assert.equal(header.getCell(1).value, 'Số container');
  assert.match(String(header.getCell(1).note), /^BẮT BUỘC/u);
  assert.equal(header.getCell(5).value, 'Depot lấy rỗng');
  assert.equal(sheet.getCell('A4').value, 'CONTAINER');

  const typeValidation = sheet.getCell('B6').dataValidation;
  assert.equal(typeValidation.type, 'list');
  assert.deepEqual(typeValidation.formulae, ["'Danh mục'!$A$2:$A$5"]);
  assert.deepEqual(sheet.getCell('E105').dataValidation.formulae, [
    "'Danh mục'!$C$2:$C$2",
  ]);

  const lists = workbook.getWorksheet('Danh mục');
  assert.equal(lists?.getCell('C2').value, 'ICD Phước Long');
  assert.equal(lists?.getCell('D2').value, 'ICD Phước Long, Thủ Đức');

  // An empty template reads back as no containers.
  const { records } = await readBack(workbook);
  assert.deepEqual(parseBulkContainerRows(records, carriers, depots), []);
});

test('findContainerHeaderRow falls back to the first row', () => {
  assert.equal(findContainerHeaderRow([['Tiêu đề'], [], ['Số container']]), 2);
  assert.equal(findContainerHeaderRow([['ContainerNumber', 'Loại cont']]), 0);
  assert.equal(findContainerHeaderRow([['khác']]), 0);
});
