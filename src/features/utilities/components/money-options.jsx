'use client';

import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

/** @typedef {import('../config/number-to-words.js').WordsCurrency} WordsCurrency */
/** @typedef {import('../config/number-to-words.js').WordsLanguage} WordsLanguage */

export const CURRENCY_LABELS = /** @type {Record<WordsCurrency, string>} */ ({
  USD: 'USD',
  VND: 'VNĐ',
});

/**
 * A SegmentedControl with a visible field label above it (the control's own
 * `label` is aria-only).
 * @param {{ label: string, value: string, onChange: (value: string) => void, options: Array<{ value: string, label: string }> }} props
 */
function LabeledSegments({ label, value, onChange, options }) {
  return (
    <VStack gap={1} hAlign="start">
      <Text as="span" size="sm" weight="medium">
        {label}
      </Text>
      <SegmentedControl label={label} value={value} onChange={onChange}>
        {options.map((option) => (
          <SegmentedControlItem
            key={option.value}
            value={option.value}
            label={option.label}
          />
        ))}
      </SegmentedControl>
    </VStack>
  );
}

/** @param {{ value: WordsCurrency, onChange: (value: WordsCurrency) => void }} props */
export function CurrencySegments({ value, onChange }) {
  return (
    <LabeledSegments
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
    <LabeledSegments
      label="Ngôn ngữ"
      value={value}
      onChange={(next) => onChange(/** @type {WordsLanguage} */ (next))}
      options={[
        { value: 'vi', label: 'Tiếng Việt' },
        { value: 'en', label: 'English' },
      ]}
    />
  );
}
