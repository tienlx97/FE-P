import assert from 'node:assert/strict';
import { test } from 'node:test';

import ExcelJS from 'exceljs';

import {
  buildShipmentCostWorkbook,
  markdownToPlainText,
} from './shipment-cost-workbook.js';

/** @type {import('./shipment-cost-workbook.js').CostWorkbookLine} */
const baseLine = {
  name: 'THC',
  quantity: 1,
  unitPrice: 3_500_000,
  amount: 3_500_000,
  isAbnormal: false,
  provider: 'GIA HUY',
  paidOnBehalf: false,
  payee: null,
  invoiceNumber: 'HD-01',
  invoiceDate: '2026-09-04',
  note: null,
};

/** @type {import('./shipment-cost-workbook.js').CostWorkbookInput} */
const input = {
  shipmentCode: '26KCT27/LOT-01',
  shipmentName: 'Lô 1',
  contractNumber: '26KCT27',
  incotermLabel: 'CIF 2010',
  bookingNumber: 'VN01159030',
  vessel: 'SAWASDEE CAPELLA // 2609S',
  placeOfLoading: 'Cảng Cát Lái',
  placeOfDischarge: 'Cảng Bangkok',
  etd: '2026-09-08',
  eta: '2026-09-11',
  atd: '2026-09-09',
  ata: null,
  exportedAt: new Date(2026, 9, 8, 22, 30),
  groups: [
    {
      label: 'LOG-01 · ORIGIN',
      lines: [
        baseLine,
        {
          ...baseLine,
          name: 'Trucking',
          quantity: 2,
          unitPrice: 4_500_000,
          amount: 9_000_000,
          isAbnormal: true,
          paidOnBehalf: true,
          payee: 'Cảng Cát Lái',
          invoiceNumber: 'HD-02',
          note: '**Gấp** — xem [biên bản](https://x.test)',
        },
      ],
    },
    { label: 'LOG-02 · EMPTY', lines: [] },
    {
      label: 'LOG-03 · DEST',
      lines: [
        { ...baseLine, name: 'D/O', amount: 500_000, unitPrice: 500_000 },
      ],
    },
  ],
};

async function roundTrip() {
  const buffer = await buildShipmentCostWorkbook(
    ExcelJS,
    input,
  ).xlsx.writeBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook.getWorksheet('Chi phí logistics');
}

test('title, info block and frozen header row', async () => {
  const sheet = await roundTrip();
  assert.ok(sheet);
  assert.equal(
    sheet.getCell('A1').value,
    'BẢNG CHI PHÍ LOGISTICS — 26KCT27/LOT-01',
  );
  assert.equal(sheet.getCell('C4').value, '26KCT27');
  assert.equal(sheet.getCell('H6').value, '08/09/2026  →  11/09/2026');
  // Local day of the export, even late in the evening.
  assert.equal(sheet.getCell('C7').value, '08/10/2026');
  assert.equal(sheet.getCell('H7').value, '09/09/2026  →  —');
  // No digit right after a font-size code ("&826…").
  assert.doesNotMatch(sheet.headerFooter.oddFooter ?? '', /&\d+\d{2}/);
  assert.match(
    sheet.headerFooter.oddFooter ?? '',
    /&8Chi phí logistics — 26KCT27\/LOT-01/,
  );
  assert.equal(sheet.getCell('A9').value, 'STT');
  assert.equal(sheet.getCell('K9').value, 'Ghi chú');
  assert.equal(sheet.views[0].state, 'frozen');
  assert.equal(sheet.views[0].ySplit, 9);
  assert.equal(sheet.pageSetup.orientation, 'landscape');
});

test('group bands sum their lines; empty groups are skipped', async () => {
  const sheet = await roundTrip();
  assert.equal(sheet.getCell('A10').value, 'LOG-01 · ORIGIN  (2 khoản)');
  assert.deepEqual(sheet.getCell('E10').value, {
    formula: 'SUM(E11:E12)',
    result: 12_500_000,
  });
  // LOG-02 has no lines → LOG-03 band follows LOG-01's lines directly.
  assert.equal(sheet.getCell('A13').value, 'LOG-03 · DEST  (1 khoản)');
  assert.equal(sheet.getCell('E10').numFmt, '#,##0');
});

test('line cells: numbers, dates, abnormal, paid on behalf, plain note', async () => {
  const sheet = await roundTrip();
  const row = sheet.getRow(12);
  assert.equal(row.getCell(1).value, 2);
  assert.equal(row.getCell(3).value, 2);
  assert.equal(row.getCell(5).value, 9_000_000);
  assert.equal(row.getCell(6).value, 'Phát sinh');
  assert.equal(row.getCell(8).value, 'Cảng Cát Lái');
  const invoiceDate = /** @type {Date} */ (row.getCell(10).value);
  assert.equal(invoiceDate.toISOString().slice(0, 10), '2026-09-04');
  assert.equal(row.getCell(10).numFmt, 'dd/mm/yyyy');
  assert.equal(row.getCell(11).value, 'Gấp — xem biên bản');
});

test('total row adds the subtotals; breakdown below it', async () => {
  const sheet = await roundTrip();
  assert.equal(sheet.getCell('A15').value, 'TỔNG CỘNG (3 khoản phí)');
  assert.deepEqual(sheet.getCell('E15').value, {
    formula: 'E10+E13',
    result: 13_000_000,
  });
  assert.equal(sheet.getCell('E16').value, 9_000_000); // abnormal
  assert.equal(sheet.getCell('E17').value, 9_000_000); // chi hộ
  assert.equal(sheet.getCell('E18').value, 1); // providers
  assert.equal(sheet.getCell('E19').value, 2); // invoices
});

test('markdownToPlainText', () => {
  assert.equal(markdownToPlainText(null), '');
  assert.equal(
    markdownToPlainText('## Ghi chú\n- **một**\n- _hai_ `ba`'),
    'Ghi chú\n• một\n• hai ba',
  );
});
