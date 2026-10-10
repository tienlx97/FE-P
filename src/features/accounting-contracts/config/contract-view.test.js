import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  appendixTotals,
  contractMetrics,
  contractStatus,
  percentOf,
} from './contract-view.js';

const contract = {
  id: 'c',
  companyId: 'x',
  contractNumber: 'HD',
  signedDate: '2026-01-01',
  projectCode: 'CT',
  projectName: 'P',
  sourceId: null,
  sourceName: null,
  customerId: 'k',
  customerName: 'K',
  valueBeforeTax: 100,
  taxRatePercent: 8,
  valueAfterTax: 108,
  settlementValue: 116,
  invoicedValue: 58,
  remainingToInvoice: 58,
  paidValue: 29,
  unpaidValue: 87,
  paymentDueDate: null,
  overdueDays: null,
  note: null,
  version: 1,
};

test('percentOf rounds and clamps', () => {
  assert.equal(percentOf(29, 116), 25);
  assert.equal(percentOf(5, 0), 0);
  assert.equal(percentOf(200, 100), 100);
});

test('status: overdue, then fully paid, else in progress', () => {
  assert.equal(
    contractStatus({ ...contract, overdueDays: 3 }).label,
    'QUÁ HẠN 3 NGÀY',
  );
  assert.equal(contractStatus({ ...contract, unpaidValue: 0 }).tone, 'success');
  assert.equal(contractStatus(contract).tone, 'accent');
});

test('appendix totals split by direction; metrics show paid progress', () => {
  const appendices = [
    {
      id: '1',
      type: /** @type {const} */ ('Increase'),
      valueBeforeTax: 10,
      valueAfterTax: 10,
      signedDate: '',
      buyerSigned: true,
      sellerSigned: true,
      note: null,
    },
    {
      id: '2',
      type: /** @type {const} */ ('Decrease'),
      valueBeforeTax: 2,
      valueAfterTax: 2,
      signedDate: '',
      buyerSigned: true,
      sellerSigned: true,
      note: null,
    },
    {
      id: '3',
      type: /** @type {const} */ ('InfoChange'),
      valueBeforeTax: 0,
      valueAfterTax: 0,
      signedDate: '',
      buyerSigned: true,
      sellerSigned: true,
      note: null,
    },
  ];
  assert.deepEqual(appendixTotals(appendices), { increase: 10, decrease: 2 });
  const Icon = () => null;
  const icons = {
    settlement: Icon,
    invoice: Icon,
    paid: Icon,
    unpaid: Icon,
    base: Icon,
    up: Icon,
    down: Icon,
  };
  const metrics = contractMetrics(
    { contract, appendices, invoices: [], installments: [] },
    icons,
  );
  assert.equal(metrics.paid.start.value, '25%');
  assert.equal(metrics.paid.end.hint, '(0/0 đợt)');
  assert.equal(metrics.settlement.end.value, 'PL: +8');
});

test('paid KPI counts complete stages, not individual paid occurrences', () => {
  const Icon = () => null;
  const icons = {
    settlement: Icon,
    invoice: Icon,
    paid: Icon,
    unpaid: Icon,
    base: Icon,
    up: Icon,
    down: Icon,
  };
  const metrics = contractMetrics(
    /** @type {any} */ ({
      contract,
      appendices: [],
      invoices: [],
      installments: [
        { subInstallments: [{ status: 'Paid' }, { status: 'Paid' }] },
        { subInstallments: [{ status: 'Paid' }, { status: 'Planned' }] },
        { subInstallments: [] },
      ],
    }),
    icons,
  );
  assert.equal(metrics.paid.end.hint, '(1/3 đợt)');
});
