import assert from 'node:assert/strict';
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
  settlementValue: 1000,
  paidValue: 300,
  unpaidValue: 700,
});
const installments = /** @type {any} */ ([
  {
    number: 2,
    note: null,
    subInstallments: [
      sub({
        code: '2.1',
        status: 'Planned',
        valueAfterTax: 700,
        actualPaidAmount: null,
      }),
    ],
  },
  {
    number: 1,
    note: 'Tạm ứng',
    subInstallments: [
      sub({}),
      sub({
        code: '1.2',
        valueAfterTax: 0,
        actualPaidAmount: null,
        status: 'Planned',
      }),
    ],
  },
]);

test('stage bands carry totals and their payments sit indented below', async () => {
  const workbook = buildInstallmentWorkbook(ExcelJS, {
    contract,
    installments,
    exportedAt: new Date('2026-10-10T03:00:00Z'),
  });
  const sheet = workbook.worksheets[0];
  const labels = [];
  sheet.eachRow((row, number) => {
    if (number > 8) labels.push([row.getCell(1).value, row.outlineLevel]);
  });
  assert.deepEqual(labels, [
    ['Đợt 1', 0],
    ['Lần 1.1', 1],
    ['Lần 1.2', 1],
    ['Đợt 2', 0],
    ['Lần 2.1', 1],
    ['TỔNG CỘNG', 0],
  ]);
  // Band totals are formulas over the payment rows, with cached results.
  const band = sheet.getRow(9).getCell(4).value;
  assert.deepEqual(band, { formula: 'SUM(D10:D11)', result: 300 });
  assert.equal(sheet.getRow(9).getCell(7).value, 'Thanh toán một phần');
  const total = sheet.getRow(14).getCell(4).value;
  assert.deepEqual(total, { formula: 'D9+D12', result: 1000 });
  const buffer = await workbook.xlsx.writeBuffer();
  assert.ok(buffer.byteLength > 1000);
});

test('file name carries the contract number and the day', () => {
  assert.equal(
    installmentWorkbookFileName('HD-01', new Date('2026-10-10T03:00:00Z')),
    'Dot-thanh-toan-HD-01-2026-10-10.xlsx',
  );
});
