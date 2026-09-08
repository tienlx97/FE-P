import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatNumberInput,
  numberValueToInput,
  parseNumberInput,
} from './formatted-number-input.js';

test('formatNumberInput groups integer digits in standard thousands from the right', () => {
  assert.equal(formatNumberInput('1'), '1');
  assert.equal(formatNumberInput('1234'), '1,234');
  assert.equal(formatNumberInput('12345'), '12,345');
  assert.equal(formatNumberInput('27261'), '27,261');
  assert.equal(formatNumberInput('123456.78'), '123,456.78');
  assert.equal(formatNumberInput('123456789.11'), '123,456,789.11');
});

test('formatNumberInput sanitizes pasted values and preserves editing states', () => {
  assert.equal(formatNumberInput('123,456,789.11'), '123,456,789.11');
  assert.equal(formatNumberInput('12 kg 34.567'), '1,234.567');
  assert.equal(formatNumberInput('.'), '0.');
  assert.equal(formatNumberInput('1234.'), '1,234.');
  assert.equal(formatNumberInput(''), '');
});

test('formatNumberInput accepts three through eight decimal digits', () => {
  const decimals = '12345678';

  for (let length = 3; length <= 8; length += 1) {
    const decimalPart = decimals.slice(0, length);
    assert.equal(
      formatNumberInput(`1234.${decimalPart}`),
      `1,234.${decimalPart}`,
    );
  }

  assert.equal(formatNumberInput('1234.123456789'), '1,234.12345678');
});

test('parseNumberInput returns a clean numeric form value', () => {
  assert.equal(parseNumberInput('123,456,789.11'), 123456789.11);
  assert.equal(parseNumberInput('1,234.12345678'), 1234.12345678);
  assert.equal(parseNumberInput('1,234.'), 1234);
  assert.equal(parseNumberInput(''), undefined);
});

test('numberValueToInput formats existing values and handles missing values', () => {
  assert.equal(numberValueToInput(123456.78), '123,456.78');
  assert.equal(numberValueToInput(undefined), '');
});
