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
  contractNumber: '26KCT27',
  incotermLabel: 'CIF 2010',
  shipmentValue: { amount: 18_000, currency: 'USD' },
  shipmentValueVnd: 466_020_000,
  exchangeRate: 25_890,
  placeOfLoading: 'Cảng Cát Lái',
  placeOfDischarge: 'Cảng Bangkok',
  atd: '2026-09-09',
  ata: null,
  exportedAt: new Date(2026, 9, 8, 22, 30),
  groups: [
    {
      code: 'LOG-01',
      name: 'Packing & Export Preparation',
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
    { code: 'LOG-02', name: 'Origin Inland', lines: [] },
    {
      code: '',
      name: 'Chưa phân nhóm',
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
    'BẢNG KÊ CHI PHÍ LOGISTIC - 26KCT27/LOT-01',
  );
  assert.equal(sheet.getCell('A1').font.size, 20);
  // No shipment-name row: the info block starts right under the title.
  assert.equal(sheet.getCell('A2').value, null);
  assert.equal(sheet.getCell('C3').value, '26KCT27');
  assert.equal(sheet.getCell('H3').value, 'CIF 2010');
  assert.equal(sheet.getCell('A4').value, 'Giá trị lô hàng (USD)');
  assert.equal(sheet.getCell('C4').value, 18_000);
  assert.equal(sheet.getCell('C4').numFmt, '#,##0.00" USD"');
  assert.equal(sheet.getCell('F4').value, 'Tỷ giá (VNĐ/USD)');
  assert.equal(sheet.getCell('H4').value, 25_890);
  assert.equal(sheet.getCell('H4').numFmt, '#,##0');
  assert.equal(sheet.getCell('C5').value, 466_020_000);
  assert.equal(sheet.getCell('H5').value, 'Cảng Cát Lái → Cảng Bangkok');
  // Local day of the export, even late in the evening.
  assert.equal(sheet.getCell('C6').value, '08/10/2026');
  assert.equal(sheet.getCell('H6').value, '09/09/2026  →  —');
  // No ETD / ETA row any more.
  const labels = [3, 4, 5, 6].flatMap((row) => [
    sheet.getCell(`A${row}`).value,
    sheet.getCell(`F${row}`).value,
  ]);
  assert.ok(!labels.includes('ETD / ETA'));
  // No digit right after a font-size code ("&926…").
  assert.doesNotMatch(sheet.headerFooter.oddFooter ?? '', /&\d+\d{2}/);
  assert.match(
    sheet.headerFooter.oddFooter ?? '',
    /&9Bảng kê chi phí logistic — 26KCT27\/LOT-01/,
  );
  assert.equal(sheet.getCell('A8').value, 'STT');
  assert.equal(sheet.getCell('A8').font.size, 12);
  assert.equal(sheet.getCell('K8').value, 'Ghi chú');
  assert.equal(sheet.views[0].state, 'frozen');
  assert.equal(sheet.views[0].ySplit, 8);
  assert.equal(sheet.pageSetup.orientation, 'landscape');
});

test('group bands sum their lines; empty groups are skipped', async () => {
  const sheet = await roundTrip();
  assert.equal(
    sheet.getCell('A9').value,
    'LOG-01 · Chuẩn bị hàng & đóng gói xuất khẩu  (2 khoản)',
  );
  assert.deepEqual(sheet.getCell('E9').value, {
    formula: 'SUM(E10:E11)',
    result: 12_500_000,
  });
  // LOG-02 has no lines → LOG-03 band follows LOG-01's lines directly.
  // No code → the catalog name alone.
  assert.equal(sheet.getCell('A12').value, 'Chưa phân nhóm  (1 khoản)');
  assert.equal(sheet.getCell('E9').numFmt, '#,##0');
});

test('line cells: numbers, dates, abnormal, paid on behalf, plain note', async () => {
  const sheet = await roundTrip();
  const row = sheet.getRow(11);
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
  assert.equal(sheet.getCell('A14').value, 'TỔNG CỘNG (3 khoản phí)');
  assert.deepEqual(sheet.getCell('E14').value, {
    formula: 'E9+E12',
    result: 13_000_000,
  });
  assert.equal(sheet.getCell('E15').value, 9_000_000); // abnormal
  assert.equal(sheet.getCell('E16').value, 9_000_000); // chi hộ
  assert.equal(sheet.getCell('E17').value, 1); // providers
  assert.equal(sheet.getCell('E18').value, 2); // invoices
});

test('USD total, cost / value ratio and the signature block', async () => {
  const sheet = await roundTrip();
  assert.deepEqual(sheet.getCell('E19').value, {
    formula: 'E14/25890',
    result: 13_000_000 / 25_890,
  });
  assert.equal(sheet.getCell('E19').numFmt, '#,##0.00" USD"');
  assert.deepEqual(sheet.getCell('E20').value, {
    formula: 'E14/466020000',
    result: 13_000_000 / 466_020_000,
  });
  assert.equal(sheet.getCell('E20').numFmt, '0.00%');
  assert.equal(sheet.getCell('H23').value, 'Ngày 08 tháng 10 năm 2026');
  assert.equal(sheet.getCell('H24').value, 'TỔNG GIÁM ĐỐC');
  assert.equal(sheet.getCell('H27').value, 'Lê Văn Chí');
});

test('no grey: text and borders are black (or brand colours)', async () => {
  const sheet = await roundTrip();
  const allowed = new Set(['FF000000', 'FFFFFFFF', 'FF0064E0', 'FFB94500']);
  const colors = new Set();
  sheet.eachRow((row) =>
    row.eachCell({ includeEmpty: true }, (cell) => {
      if (cell.font?.color?.argb) colors.add(cell.font.color.argb);
      for (const side of /** @type {const} */ ([
        'top',
        'left',
        'bottom',
        'right',
      ])) {
        const argb = cell.border?.[side]?.color?.argb;
        if (argb) colors.add(argb);
      }
    }),
  );
  assert.deepEqual(
    [...colors].filter((argb) => !allowed.has(argb)),
    [],
  );
});

test('markdownToPlainText', () => {
  assert.equal(markdownToPlainText(null), '');
  assert.equal(
    markdownToPlainText('## Ghi chú\n- **một**\n- _hai_ `ba`'),
    'Ghi chú\n• một\n• hai ba',
  );
});
