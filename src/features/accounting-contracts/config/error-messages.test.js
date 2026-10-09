import assert from 'node:assert/strict';
import { test } from 'node:test';

import { vietnameseMessage } from './error-messages.js';

test('translates known backend messages and keeps the rest', () => {
  assert.equal(
    vietnameseMessage('A contract with this number already exists'),
    'Số hợp đồng đã tồn tại',
  );
  assert.equal(vietnameseMessage('Đã có lỗi'), 'Đã có lỗi');
});
