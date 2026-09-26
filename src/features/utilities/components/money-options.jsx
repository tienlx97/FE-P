'use client';

import { MetaSegmentedField } from '@/shared/components/custom/meta/index.js';

/** @typedef {import('../config/number-to-words.js').WordsCurrency} WordsCurrency */
/** @typedef {import('../config/number-to-words.js').WordsLanguage} WordsLanguage */

export const CURRENCY_LABELS = /** @type {Record<WordsCurrency, string>} */ ({
  USD: 'USD',
  VND: 'VNĐ',
});

/** @param {{ value: WordsCurrency, onChange: (value: WordsCurrency) => void }} props */
export function CurrencySegments({ value, onChange }) {
  return (
    <MetaSegmentedField
      label="Đơn vị tính"
      value={value}
      onChange={(next) => onChange(/** @type {WordsCurrency} */ (next))}
      options={[
        { value: 'USD', label: CURRENCY_LABELS.USD },
        { value: 'VND', label: CURRENCY_LABELS.VND },
      ]}
    />
  );
}

/** @param {{ value: WordsLanguage, onChange: (value: WordsLanguage) => void }} props */
export function LanguageSegments({ value, onChange }) {
  return (
    <MetaSegmentedField
      label="Ngôn ngữ đọc"
      value={value}
      onChange={(next) => onChange(/** @type {WordsLanguage} */ (next))}
      options={[
        { value: 'vi', label: 'Tiếng Việt' },
        { value: 'en', label: 'English' },
      ]}
    />
  );
}
