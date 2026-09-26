'use client';

import { Grid } from '@astryxdesign/core/Grid';
import { SpellCheck2 } from 'lucide-react';
import { useState } from 'react';

import {
  MetaUtilityCard,
  MetaWordsBox,
} from '@/shared/components/custom/meta/index.js';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';

import { amountToWords, MAX_WORDS_AMOUNT } from '../config/number-to-words.js';
import {
  CURRENCY_LABELS,
  CurrencySegments,
  LanguageSegments,
} from './money-options.jsx';

/** @typedef {import('../config/number-to-words.js').WordsCurrency} WordsCurrency */
/** @typedef {import('../config/number-to-words.js').WordsLanguage} WordsLanguage */

/** "Đọc số tiền bằng chữ" (Figma 156:23): amount + currency + language → words. */
export function AmountInWordsSection() {
  const [amount, setAmount] = useState(
    /** @type {number | undefined} */ (undefined),
  );
  const [currency, setCurrency] = useState(
    /** @type {WordsCurrency} */ ('USD'),
  );
  const [language, setLanguage] = useState(/** @type {WordsLanguage} */ ('vi'));
  const isTooLarge = typeof amount === 'number' && amount > MAX_WORDS_AMOUNT;

  return (
    <MetaUtilityCard
      icon={SpellCheck2}
      title="Đọc số tiền bằng chữ"
      tag="Module 01"
      description="Nhập số tiền và đơn vị tính để xuất ra số tiền bằng chữ tiếng Việt hoặc tiếng Anh."
    >
      <Grid columns={{ minWidth: 240, max: 3 }} gap={4} align="end">
        <FormattedNumberTextInput
          label="Số tiền"
          value={amount}
          onChange={setAmount}
          units={CURRENCY_LABELS[currency]}
          status={
            isTooLarge
              ? { type: 'error', message: 'Số tiền quá lớn (tối đa 15 chữ số)' }
              : undefined
          }
        />
        <CurrencySegments value={currency} onChange={setCurrency} />
        <LanguageSegments value={language} onChange={setLanguage} />
      </Grid>

      <MetaWordsBox
        caption="Bằng chữ"
        words={amountToWords(amount, currency, language)}
        placeholder="Nhập số tiền để xem bằng chữ"
      />
    </MetaUtilityCard>
  );
}
