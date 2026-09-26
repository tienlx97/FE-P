'use client';

import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';

import { amountToWords, MAX_WORDS_AMOUNT } from '../config/number-to-words.js';
import {
  CURRENCY_LABELS,
  CurrencySegments,
  LanguageSegments,
} from './money-options.jsx';
import { WordsOutput } from './words-output.jsx';

/** @typedef {import('../config/number-to-words.js').WordsCurrency} WordsCurrency */
/** @typedef {import('../config/number-to-words.js').WordsLanguage} WordsLanguage */

/** "Đọc số tiền": amount + currency + language → words. */
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
    <VStack gap={4} hAlign="stretch">
      <VStack gap={1} hAlign="stretch">
        <Heading level={2}>Đọc số tiền bằng chữ</Heading>
        <Text as="p" color="secondary">
          Nhập số tiền và đơn vị tính để xuất ra số tiền bằng chữ tiếng Việt
          hoặc tiếng Anh.
        </Text>
      </VStack>

      <Grid columns={{ minWidth: 220, max: 3 }} gap={4} align="end">
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

      <WordsOutput words={amountToWords(amount, currency, language)} />
    </VStack>
  );
}
