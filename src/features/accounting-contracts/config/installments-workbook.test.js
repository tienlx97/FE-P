import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

import ExcelJS from 'exceljs';

import {
  buildInstallmentWorkbook,
  installmentWorkbookFileName,
} from './installments-workbook.js';

/** @param {object} over */
const sub = (over) => ({
  code: '1.1',
  kind: 'Percent',
  percent: 30,
  valueAfterTax: 300,
  actualPaidAmount: 300,
  paymentDate: '2026-08-12',
  status: 'Paid',
  condition: 'Tạm ứng',
  note: null,
  ...over,
});

const contract = /** @type {any} */ ({
  contractNumber: 'HD-01',
  customerName: 'Khách A',
  projectCode: 'CT-01',
  projectName: 'Nhà xưởng',
  signedDate: '2026-08-05',
  valueBeforeTax: 1000,
  taxRatePercent: 8,
  valueAfterTax: 1080,
  settlementValue: 1180,
  paidValue: 300,
  unpaidValue: 880,
});
const appendices = /** @type {any} */ ([
  { type: 'Decrease', valueAfterTax: 50, signedDate: '2026-09-02' },
  { type: 'InfoChange', valueAfterTax: 0, signedDate: '2026-08-20' },
  { type: 'Increase', valueAfterTax: 150, signedDate: '2026-08-10' },
]);
const installments = /** @type {any} */ ([
  {
    number: 2,
    note: 'Quyết toán',
    subInstallments: [
      sub({
        code: '2.1',
        percent: 40,
        status: 'Planned',
        valueAfterTax: 400,
        actualPaidAmount: null,
        paymentDate: null,
      }),
      sub({
        code: '2.2',
        kind: 'Quantity',
        percent: null,
        status: 'Planned',
        valueAfterTax: 480,
        actualPaidAmount: null,
        paymentDate: null,
      }),
    ],
  },
  { number: 1, note: null, subInstallments: [sub({})] },
]);

test('template content in the report style: value block, đợt and lần rows, totals', async () => {
  const workbook = buildInstallmentWorkbook(ExcelJS, {
    contract,
    appendices,
    installments,
    exportedAt: new Date('2026-10-10T03:00:00Z'),
  });
  const sheet = workbook.worksheets[0];
  assert.equal(sheet.getCell('A1').value, 'BẢNG CÁC ĐỢT THANH TOÁN');
  assert.equal(sheet.getCell('B8').value, 'NỘI DUNG THANH TOÁN THEO HỢP ĐỒNG');
  const rows = [];
  sheet.eachRow((row, number) => {
    if (number > 8) {
      rows.push([row.getCell(1).value, row.getCell(2).value, row.outlineLevel]);
    }
  });
  assert.deepEqual(rows, [
    ['I. GIÁ TRỊ HỢP ĐỒNG', 'I. GIÁ TRỊ HỢP ĐỒNG', 0],
    [null, 'Giá trị hợp đồng trước VAT', 0],
    [null, 'VAT 8%', 0],
    [null, 'Giá trị hợp đồng sau VAT', 0],
    [null, 'Phụ lục số 01  ·  Phát sinh tăng  ·  ký ngày 10/08/2026', 0],
    [null, 'Phụ lục số 02  ·  Phát sinh giảm  ·  ký ngày 02/09/2026', 0],
    [null, 'GIÁ TRỊ QUYẾT TOÁN', 0],
    ['II. CÁC ĐỢT THANH TOÁN', 'II. CÁC ĐỢT THANH TOÁN', 0],
    ['Đợt 1', 'Tạm ứng', 0],
    ['Đợt 2', 'Quyết toán', 0],
    ['2.1', 'Tạm ứng', 1],
    ['2.2', 'Tạm ứng', 1],
    ['TỔNG CỘNG  ·  2 đợt', 'TỔNG CỘNG  ·  2 đợt', 0],
  ]);
  // Contract value = before tax + VAT; decreases are negative.
  assert.deepEqual(sheet.getCell('D12').value, {
    formula: 'D10+D11',
    result: 1080,
  });
  assert.equal(sheet.getCell('D11').value, 80);
  assert.equal(sheet.getCell('D14').value, -50);
  assert.deepEqual(sheet.getCell('D15').value, {
    formula: 'D12+D13+D14',
    result: 1180,
  });
  // "Còn lại" runs previous + số tiền − đã TT; a đợt with lần sums them.
  assert.equal(sheet.getCell('G17').formula, 'D17-F17');
  assert.deepEqual(sheet.getCell('D18').value, {
    formula: 'SUM(D19:D20)',
    result: 880,
  });
  assert.deepEqual(sheet.getCell('G18').value, {
    formula: 'G17+D18-F18',
    result: 880,
  });
  assert.equal(sheet.getCell('C17').value, 0.3);
  assert.equal(sheet.getCell('C18').value, null);
  // Totals over the đợt rows; the settlement row and headline figures follow.
  assert.deepEqual(sheet.getCell('D21').value, {
    formula: 'D17+D18',
    result: 1180,
  });
  assert.deepEqual(sheet.getCell('F15').value, { formula: 'F21', result: 300 });
  assert.deepEqual(sheet.getCell('G15').value, {
    formula: 'D15-F15',
    result: 880,
  });
  assert.deepEqual(sheet.getCell('A6').value, { formula: 'D15', result: 1180 });
  const buffer = await workbook.xlsx.writeBuffer();
  assert.ok(buffer.byteLength > 1000);

  // Excel refuses a <sheetPr> whose children break the schema order
  // (tabColor, outlinePr, pageSetUpPr) — ExcelJS writes pageSetUpPr first.
  const JSZip = createRequire(import.meta.resolve('exceljs'))('jszip');
  const zip = await JSZip.loadAsync(buffer);
  const sheetXml = await zip.file('xl/worksheets/sheet1.xml').async('string');
  const sheetPr = sheetXml.match(/<sheetPr>(.*?)<\/sheetPr>/)?.[1] ?? '';
  const order = [...sheetPr.matchAll(/<(\w+)/g)].map((m) => m[1]);
  const schema = ['tabColor', 'outlinePr', 'pageSetUpPr'];
  assert.deepEqual(
    order,
    [...order].sort((a, b) => schema.indexOf(a) - schema.indexOf(b)),
  );
});

test('file name carries the contract number and the day', () => {
  assert.equal(
    installmentWorkbookFileName('HD-01', new Date('2026-10-10T03:00:00Z')),
    'Dot-thanh-toan-HD-01-2026-10-10.xlsx',
  );
});
