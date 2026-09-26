'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { CirclePlus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';

import {
  createInstallment,
  installmentAmounts,
  summarizeInstallments,
} from '../config/installments.js';
import { amountToWords, formatAmount } from '../config/number-to-words.js';
import {
  CURRENCY_LABELS,
  CurrencySegments,
  LanguageSegments,
} from './money-options.jsx';
import { WordsOutput } from './words-output.jsx';

/** @typedef {import('../types/index.js').Installment} Installment */
/** @typedef {import('../config/number-to-words.js').WordsCurrency} WordsCurrency */
/** @typedef {import('../config/number-to-words.js').WordsLanguage} WordsLanguage */

const INITIAL_INSTALLMENTS = () => [
  createInstallment({ value: 30 }),
  createInstallment({ value: 70 }),
];

/**
 * One installment: mode (Tỷ lệ % | Số tiền), its input, then the resulting
 * value and words.
 * @param {{
 *   installment: Installment,
 *   amount: number | undefined,
 *   sequence: number,
 *   total: number | undefined,
 *   currency: WordsCurrency,
 *   language: WordsLanguage,
 *   canRemove: boolean,
 *   onChange: (installment: Installment) => void,
 *   onRemove: () => void,
 * }} props
 */
function InstallmentRow({
  installment,
  amount,
  sequence,
  total,
  currency,
  language,
  canRemove,
  onChange,
  onRemove,
}) {
  const isPercent = installment.mode === 'percent';

  return (
    <VStack gap={3} hAlign="stretch">
      <HStack hAlign="between" vAlign="center" gap={3}>
        <Text as="span" weight="bold">
          Đợt {sequence}
        </Text>
        <IconButton
          label={`Xoá đợt ${sequence}`}
          tooltip="Xoá đợt"
          icon={<Icon icon={Trash2} size="sm" />}
          type="button"
          variant="ghost"
          size="sm"
          isDisabled={!canRemove}
          onClick={onRemove}
        />
      </HStack>

      <Grid columns={{ minWidth: 220, max: 3 }} gap={4} align="end">
        <VStack gap={1} hAlign="start">
          <Text as="span" size="sm" weight="medium">
            Cách tính
          </Text>
          <SegmentedControl
            label={`Cách tính đợt ${sequence}`}
            value={installment.mode}
            onChange={(mode) =>
              onChange({
                ...installment,
                mode: /** @type {Installment['mode']} */ (mode),
                value: undefined,
              })
            }
          >
            <SegmentedControlItem value="percent" label="Tỷ lệ %" />
            <SegmentedControlItem value="amount" label="Số tiền" />
          </SegmentedControl>
        </VStack>
        <FormattedNumberTextInput
          label={isPercent ? 'Tỷ lệ' : 'Số tiền'}
          value={installment.value}
          onChange={(value) => onChange({ ...installment, value })}
          units={isPercent ? '%' : CURRENCY_LABELS[currency]}
        />
        <VStack gap={1} hAlign="stretch">
          <Text as="span" size="sm" weight="medium">
            Giá trị
          </Text>
          <Text
            as="span"
            size="lg"
            weight="bold"
            color={amount === undefined ? 'placeholder' : 'accent'}
            hasTabularNumbers
          >
            {amount === undefined ? '—' : formatAmount(amount, currency)}
          </Text>
        </VStack>
      </Grid>

      <WordsOutput
        words={amountToWords(amount, currency, language)}
        placeholder={
          isPercent && total === undefined
            ? 'Nhập tổng giá trị để tính đợt này'
            : 'Nhập tỷ lệ hoặc số tiền để xem bằng chữ'
        }
      />
    </VStack>
  );
}

/**
 * "Chia đợt thanh toán": total + currency, then installments by % or fixed
 * amount; each shows its value (total × %) and words.
 */
export function InstallmentsSection() {
  const [total, setTotal] = useState(
    /** @type {number | undefined} */ (undefined),
  );
  const [currency, setCurrency] = useState(
    /** @type {WordsCurrency} */ ('USD'),
  );
  const [language, setLanguage] = useState(/** @type {WordsLanguage} */ ('vi'));
  const [installments, setInstallments] = useState(INITIAL_INSTALLMENTS);

  const amounts = installmentAmounts(installments, total, currency);
  const { allocated, remaining } = summarizeInstallments(
    amounts,
    total,
    currency,
  );
  const hasMismatch = remaining !== undefined && remaining !== 0;

  /** @param {Installment} next */
  const updateInstallment = (next) =>
    setInstallments((current) =>
      current.map((item) => (item.key === next.key ? next : item)),
    );

  /** @param {string} key */
  const removeInstallment = (key) =>
    setInstallments((current) => current.filter((item) => item.key !== key));

  return (
    <VStack gap={4} hAlign="stretch">
      <VStack gap={1} hAlign="stretch">
        <Heading level={2}>Chia đợt thanh toán</Heading>
        <Text as="p" color="secondary">
          Nhập tổng giá trị và các đợt thanh toán theo tỷ lệ % hoặc số tiền. Giá
          trị mỗi đợt = tổng giá trị × tỷ lệ, kèm số tiền bằng chữ.
        </Text>
      </VStack>

      <Grid columns={{ minWidth: 220, max: 3 }} gap={4} align="end">
        <FormattedNumberTextInput
          label="Tổng giá trị"
          value={total}
          onChange={setTotal}
          units={CURRENCY_LABELS[currency]}
        />
        <CurrencySegments value={currency} onChange={setCurrency} />
        <LanguageSegments value={language} onChange={setLanguage} />
      </Grid>

      <WordsOutput
        words={amountToWords(total, currency, language)}
        placeholder="Nhập tổng giá trị để xem bằng chữ"
      />

      {installments.map((installment, index) => (
        <VStack key={installment.key} gap={4} hAlign="stretch">
          <Divider />
          <InstallmentRow
            installment={installment}
            amount={amounts[index]}
            sequence={index + 1}
            total={total}
            currency={currency}
            language={language}
            canRemove={installments.length > 1}
            onChange={updateInstallment}
            onRemove={() => removeInstallment(installment.key)}
          />
        </VStack>
      ))}

      <HStack>
        <Button
          type="button"
          variant="secondary"
          label="Thêm đợt"
          icon={<Icon icon={CirclePlus} size="sm" />}
          onClick={() =>
            setInstallments((current) => [...current, createInstallment()])
          }
        />
      </HStack>

      <Divider />

      <HStack hAlign="between" vAlign="center" gap={4}>
        <Text as="span" weight="medium">
          Tổng các đợt: {formatAmount(allocated, currency)}
        </Text>
        {remaining === undefined ? null : (
          <Text
            as="span"
            weight="medium"
            color={hasMismatch ? 'secondary' : 'accent'}
          >
            Còn lại: {formatAmount(remaining, currency)}
          </Text>
        )}
      </HStack>

      {hasMismatch ? (
        <Banner
          status="warning"
          container="card"
          title={
            remaining > 0
              ? `Các đợt chưa đủ tổng giá trị, còn thiếu ${formatAmount(remaining, currency)}.`
              : `Các đợt vượt tổng giá trị ${formatAmount(-remaining, currency)}.`
          }
        />
      ) : null}
    </VStack>
  );
}
