import assert from 'node:assert/strict';
import test from 'node:test';

import { findVietnamCountry, isVietnamCountryName } from './vietnam-country.js';

test('isVietnamCountryName matches regardless of diacritics/case/whitespace', () => {
  assert.equal(isVietnamCountryName('Việt Nam'), true);
  assert.equal(isVietnamCountryName('viet nam'), true);
  assert.equal(isVietnamCountryName('VIỆT NAM'), true);
  assert.equal(isVietnamCountryName('  Việt Nam  '), true);
  assert.equal(isVietnamCountryName('Vietnam'), true);
});

test('isVietnamCountryName rejects other countries', () => {
  assert.equal(isVietnamCountryName('Thái Lan'), false);
  assert.equal(isVietnamCountryName('Australia'), false);
  assert.equal(isVietnamCountryName(''), false);
});

test('findVietnamCountry returns the matching entry from a mixed list', () => {
  const countries = [
    { id: '1', name: 'Australia' },
    { id: '2', name: 'Việt Nam' },
    { id: '3', name: 'Thái Lan' },
  ];
  assert.deepEqual(findVietnamCountry(countries), {
    id: '2',
    name: 'Việt Nam',
  });
});

test('findVietnamCountry returns undefined when no match exists', () => {
  assert.equal(findVietnamCountry([{ id: '1', name: 'Australia' }]), undefined);
});

test('findVietnamCountry prefers the ISO code over the name', () => {
  const countries = [
    { id: '1', name: 'Việt Nam (cũ)', code: null },
    { id: '2', name: 'Viet Nam', code: 'VN' },
  ];
  assert.equal(findVietnamCountry(countries)?.id, '2');
});
