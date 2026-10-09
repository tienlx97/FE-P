import assert from 'node:assert/strict';
import { test } from 'node:test';

import ExcelJS from 'exceljs';

import {
  buildContractsWorkbook,
  CONTRACT_EXPORT_COLUMNS,
  contractsWorkbookFileName,
} from './contracts-workbook.js';

/** @param {object} over */
const contract = (over) => ({
  signedDate: '2026-08-05',
  contractNumber: 'HD-01',
  projectCode: 'CT-01',
  customerName: 'Khách A',
  projectName: 'Nhà xưởng',
  sourceName: null,
  valueBeforeTax: 1000,
  taxRatePercent: 10,
  valueAfterTax: 1100,
  settlementValue: 1100,
  paidValue: 550,
  unpaidValue: 550,
  invoicedValue: 300,
  remainingToInvoice: 800,
  paymentDueDate: '2026-09-30',
  overdueDays: 9,
  note: null,
  ...over,
});

test('rows, per-row progress formula and a SUBTOTAL totals row', async () => {
  const rows = /** @type {any[]} */ ([
    contract({}),
    contract({
      contractNumber: 'HD-02',
      settlementValue: 0,
      paidValue: 0,
      unpaidValue: 0,
      overdueDays: null,
      paymentDueDate: null,
    }),
  ]);
  const workbook = buildContractsWorkbook(ExcelJS, {
    rows,
    exportedAt: new Date('2026-10-10T03:00:00Z'),
    scope: 'all',
  });
  const sheet = workbook.worksheets[0];
  const letter = (/** @type {string} */ key) =>
    String.fromCharCode(
      65 + CONTRACT_EXPORT_COLUMNS.findIndex((column) => column.key === key),
    );
  assert.equal(sheet.getCell(`${letter('contractNumber')}9`).value, 'HD-01');
  assert.equal(sheet.getCell(`${letter('contractNumber')}10`).value, 'HD-02');
  assert.equal(sheet.getCell(`${letter('paymentDueDate')}10`).value, null);
  assert.deepEqual(sheet.getCell(`${letter('paidPercent')}9`).value, {
    formula: 'IF(K9=0,0,L9/K9)',
    result: 0.5,
  });
  assert.match(
    String(
      /** @type {{ formula: string }} */ (
        sheet.getCell(`${letter('paidPercent')}10`).value
      ).formula,
    ),
    /^IF\(K10=0/u,
  );
  assert.deepEqual(sheet.getCell(`${letter('settlementValue')}11`).value, {
    formula: 'SUBTOTAL(109,K9:K10)',
    result: 1100,
  });
  assert.match(
    String(sheet.getCell('A2').value),
    /2 hợp đồng.*toàn bộ dữ liệu/u,
  );
  const buffer = await workbook.xlsx.writeBuffer();
  assert.ok(buffer.byteLength > 1000);
});

test('an empty list still builds, without a filter range', () => {
  const workbook = buildContractsWorkbook(ExcelJS, {
    rows: [],
    exportedAt: new Date(),
    scope: 'page',
  });
  assert.ok(!workbook.worksheets[0].autoFilter);
});

test('file name carries the day', () => {
  assert.equal(
    contractsWorkbookFileName(new Date('2026-10-10T03:00:00Z')),
    'Danh-sach-hop-dong-ke-toan-2026-10-10.xlsx',
  );
});
