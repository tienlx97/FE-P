import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createInstallment,
  installmentAmount,
  installmentAmounts,
  summarizeInstallments,
} from './installments.js';
import { amountToWords } from './number-to-words.js';

test('amountToWords reads VND in Vietnamese', () => {
  assert.equal(amountToWords(0, 'VND', 'vi'), 'Không đồng');
  assert.equal(amountToWords(15, 'VND', 'vi'), 'Mười lăm đồng');
  assert.equal(amountToWords(21, 'VND', 'vi'), 'Hai mươi mốt đồng');
  assert.equal(amountToWords(105, 'VND', 'vi'), 'Một trăm linh năm đồng');
  assert.equal(
    amountToWords(1_005, 'VND', 'vi'),
    'Một nghìn không trăm linh năm đồng',
  );
  assert.equal(amountToWords(1_000_000, 'VND', 'vi'), 'Một triệu đồng');
  assert.equal(
    amountToWords(125_450_000, 'VND', 'vi'),
    'Một trăm hai mươi lăm triệu bốn trăm năm mươi nghìn đồng',
  );
  assert.equal(
    amountToWords(2_000_015_000, 'VND', 'vi'),
    'Hai tỷ không trăm mười lăm nghìn đồng',
  );
  assert.equal(
    amountToWords(1_000_000_000_000, 'VND', 'vi'),
    'Một nghìn tỷ đồng',
  );
  assert.equal(
    amountToWords(1_234.6, 'VND', 'vi'),
    'Một nghìn hai trăm ba mươi lăm đồng',
  );
});

test('amountToWords reads USD with cents in Vietnamese', () => {
  assert.equal(
    amountToWords(1_250.5, 'USD', 'vi'),
    'Một nghìn hai trăm năm mươi đô la Mỹ và năm mươi xu',
  );
  assert.equal(amountToWords(10.05, 'USD', 'vi'), 'Mười đô la Mỹ và năm xu');
});

test('amountToWords reads English', () => {
  assert.equal(amountToWords(1, 'USD', 'en'), 'One US dollar');
  assert.equal(
    amountToWords(12_345.67, 'USD', 'en'),
    'Twelve thousand three hundred forty-five US dollars and sixty-seven cents',
  );
  assert.equal(
    amountToWords(2_000_000.01, 'USD', 'en'),
    'Two million US dollars and one cent',
  );
  assert.equal(
    amountToWords(1_500_000, 'VND', 'en'),
    'One million five hundred thousand Vietnamese dong',
  );
});

test('amountToWords returns empty for missing or out-of-range input', () => {
  assert.equal(amountToWords(undefined, 'USD', 'en'), '');
  assert.equal(amountToWords(-1, 'USD', 'en'), '');
  assert.equal(amountToWords(0.00000001, 'USD', 'en'), 'Zero US dollars');
  assert.equal(amountToWords(1e16, 'VND', 'vi'), '');
});

test('installments split a total by percent or fixed amount', () => {
  const half = createInstallment({ mode: 'percent', value: 30 });
  const fixed = createInstallment({ mode: 'amount', value: 1_000 });

  assert.equal(installmentAmount(half, 10_000.25, 'USD'), 3_000.08);
  assert.equal(installmentAmount(half, 1_000_001, 'VND'), 300_000);
  assert.equal(installmentAmount(half, undefined, 'USD'), undefined);
  assert.equal(installmentAmount(fixed, undefined, 'USD'), 1_000);
  assert.deepEqual(
    summarizeInstallments(
      installmentAmounts([half, fixed], 10_000, 'USD'),
      10_000,
      'USD',
    ),
    {
      allocated: 4_000,
      remaining: 6_000,
    },
  );
});

test('the last installment absorbs rounding when the split covers the total', () => {
  const split = [
    createInstallment({ mode: 'percent', value: 30 }),
    createInstallment({ mode: 'percent', value: 70 }),
  ];
  assert.deepEqual(
    installmentAmounts(split, 10_000.25, 'USD'),
    [3_000.08, 7_000.17],
  );

  const partial = [createInstallment({ mode: 'percent', value: 30 })];
  assert.deepEqual(installmentAmounts(partial, 10_000.25, 'USD'), [3_000.08]);
});
