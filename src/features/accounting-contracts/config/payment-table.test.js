import assert from 'node:assert/strict';
import { test } from 'node:test';

import { paymentTableRows } from './payment-table.js';

/** @param {object} over */
const sub = (over) => ({
  id: over.code,
  number: 1,
  kind: 'Percent',
  percent: 30,
  percentBasis: 'BeforeTax',
  valueBeforeTax: 0,
  taxRatePercent: 10,
  valueAfterTax: 0,
  isValueBeforeTaxManual: false,
  isValueAfterTaxManual: false,
  actualPaidAmount: null,
  condition: null,
  paymentDate: null,
  status: 'Planned',
  note: null,
  ...over,
});

// TEST-KT-02: 1.2 billion at 10 %, one decrease appendix, 3 đợt.
const detail = /** @type {any} */ ({
  installments: [
    {
      id: 's3',
      number: 3,
      note: 'Sau quyết toán',
      amount: 132_000_000,
      paidAmount: 0,
      subInstallments: [
        sub({
          code: '3.1',
          kind: 'Quantity',
          percent: null,
          valueAfterTax: 132_000_000,
        }),
      ],
    },
    {
      id: 's1',
      number: 1,
      note: 'Tạm ứng',
      amount: 264_000_000,
      paidAmount: 264_000_000,
      subInstallments: [
        sub({
          code: '1.1',
          percent: 20,
          valueAfterTax: 264_000_000,
          actualPaidAmount: 264_000_000,
          condition: 'Sau khi ký hợp đồng',
          paymentDate: '2026-03-15',
          status: 'Paid',
        }),
      ],
    },
    {
      id: 's2',
      number: 2,
      note: 'Theo tiến độ',
      amount: 792_000_000,
      paidAmount: 0,
      subInstallments: [
        sub({
          code: '2.1',
          valueAfterTax: 396_000_000,
          condition: 'Mố trụ',
          paymentDate: '2026-07-15',
          note: 'Chưa nhận',
        }),
        sub({
          code: '2.2',
          valueAfterTax: 396_000_000,
          condition: 'Dầm cầu',
          paymentDate: '2026-09-30',
        }),
      ],
    },
  ],
});

test('payment rows follow the Excel layout and run "còn lại" per đợt', () => {
  const { rows, totalAmount, totalPaid, stageCount } = paymentTableRows(detail);
  assert.deepEqual(
    rows.map((r) => [r.code, r.kind, r.amount, r.paid, r.remaining]),
    [
      ['Đợt 1', 'stage', 264_000_000, 264_000_000, 0],
      ['Đợt 2', 'stage', 792_000_000, 0, 792_000_000],
      ['2.1', 'sub', 396_000_000, 0, null],
      ['2.2', 'sub', 396_000_000, 0, null],
      ['Đợt 3', 'stage', 132_000_000, 0, 924_000_000],
    ],
  );
  // Every row knows its đợt, so a lần's actions reach the right đợt.
  assert.deepEqual(
    rows.map((r) => r.stageId),
    ['s1', 's2', 's2', 's2', 's3'],
  );
  assert.equal(totalAmount, 1_188_000_000);
  assert.equal(totalPaid, 264_000_000);
  assert.equal(stageCount, 3);
});

test('a single-lần đợt carries its lần; a multi-lần đợt sums them', () => {
  const [first, second, , , third] = paymentTableRows(detail).rows;
  assert.deepEqual(
    [first.content, first.percent, first.date, first.isParent],
    ['Sau khi ký hợp đồng', 20, '2026-03-15', false],
  );
  assert.deepEqual(
    [second.content, second.percent, second.date, second.isParent, second.note],
    ['Theo tiến độ', 60, null, true, ''],
  );
  // Quantity payments have no percent, so neither does their đợt.
  assert.deepEqual([third.content, third.percent], ['Sau quyết toán', null]);
});

test('no installments: no rows, zero totals', () => {
  const empty = paymentTableRows({ ...detail, installments: [] });
  assert.deepEqual(empty, {
    rows: [],
    totalAmount: 0,
    totalPaid: 0,
    stageCount: 0,
  });
});
