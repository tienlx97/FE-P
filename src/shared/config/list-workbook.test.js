import assert from 'node:assert/strict';
import { test } from 'node:test';

import ExcelJS from 'exceljs';

import { buildListWorkbook, listCellValue } from './list-workbook.js';

test('cell values: ISO dates become dates, blanks become empty', () => {
  assert.deepEqual(
    listCellValue('2026-09-23'),
    new Date('2026-09-23T00:00:00Z'),
  );
  assert.equal(listCellValue(''), null);
  assert.equal(listCellValue(undefined), null);
  assert.equal(listCellValue(Number.NaN), null);
  assert.equal(listCellValue('26KCT42'), '26KCT42');
  assert.equal(listCellValue(115854), 115854);
});

test('a list exports with a title block, typed columns and a filter', async () => {
  const workbook = buildListWorkbook(ExcelJS, {
    title: 'DANH SÁCH HỢP ĐỒNG',
    headerRow: ['Số hợp đồng', 'Ngày ký', 'Giá trị', 'Đã xuất (VNĐ)'],
    dataRows: [
      ['26KCT42', '2026-09-23', 115854.5, 466020000],
      ['26KCT41', '2026-09-19', 98000, 0],
    ],
    exportedAt: new Date(2026, 9, 9),
    filterCount: 2,
  });
  const buffer = await workbook.xlsx.writeBuffer();
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(/** @type {any} */ (buffer));
  const sheet = book.getWorksheet('Danh sách');
  assert.ok(sheet);

  assert.equal(sheet.getCell('A1').value, 'DANH SÁCH HỢP ĐỒNG');
  assert.equal(
    sheet.getCell('A2').value,
    '2 dòng  ·  đang lọc theo 2 điều kiện  ·  Xuất ngày 09/10/2026',
  );
  assert.deepEqual(
    [1, 2, 3, 4].map((column) => sheet.getRow(4).getCell(column).value),
    ['Số hợp đồng', 'Ngày ký', 'Giá trị', 'Đã xuất (VNĐ)'],
  );
  // Header frozen and repeated when printed.
  assert.equal(sheet.views[0].ySplit, 4);
  assert.equal(sheet.pageSetup.printTitlesRow, '4:4');

  const date = sheet.getCell('B5');
  assert.ok(date.value instanceof Date);
  assert.equal(date.numFmt, 'dd/mm/yyyy');
  // Decimals only where the column has them.
  assert.equal(sheet.getCell('C5').numFmt, '#,##0.00');
  assert.equal(sheet.getCell('D5').numFmt, '#,##0');
  assert.equal(sheet.getCell('D6').value, 0);
  assert.equal(sheet.getCell('A6').value, '26KCT41');
});
