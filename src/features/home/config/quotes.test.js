import assert from 'node:assert/strict';
import { test } from 'node:test';

import { jdFromDate } from './lunar.js';
import { dailyQuote, QUOTE_COUNT } from './quotes.js';

test('quote is stable for a day and changes the next day', () => {
  const jd = jdFromDate(5, 10, 2026);
  assert.deepEqual(dailyQuote(jd), dailyQuote(jd));
  assert.notEqual(dailyQuote(jd).text, dailyQuote(jd + 1).text);
});
test('no quote repeats before the whole list has been shown', () => {
  const jd = jdFromDate(1, 1, 2026);
  const seen = new Set();
  for (let day = 0; day < QUOTE_COUNT; day += 1) {
    const quote = dailyQuote(jd + day);
    assert.ok(quote.text && quote.author);
    seen.add(quote.text);
  }
  assert.equal(seen.size, QUOTE_COUNT);
});
