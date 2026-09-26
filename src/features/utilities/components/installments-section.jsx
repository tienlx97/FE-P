'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { VStack } from '@astryxdesign/core/VStack';
import { CirclePlus, WalletCards } from 'lucide-react';
import { useState } from 'react';

import {
  MetaAllocationBar,
  MetaAllocationFooter,
  MetaInstallmentItem,
  MetaSegmentedField,
  MetaUtilityCard,
  MetaValueFigure,
  MetaWordsBox,
} from '@/shared/components/custom/meta/index.js';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';

import {
  allocationStatus,
  createInstallment,
  installmentAmounts,
  shareOfTotal,
  summarizeInstallments,
} from '../config/installments.js';
import {
  amountToWords,
  CURRENCY_DECIMALS,
  formatAmount,
} from '../config/number-to-words.js';
import {
  CURRENCY_LABELS,
  CurrencySegments,
  LanguageSegments,
} from './money-options.jsx';

/** @typedef {import('../types/index.js').Installment} Installment */
/** @typedef {import('../config/number-to-words.js').WordsCurrency} WordsCurrency */
/** @typedef {import('../config/number-to-words.js').WordsLanguage} WordsLanguage */

const INITIAL_INSTALLMENTS = () => [
  createInstallment({ value: 30 }),
  createInstallment({ value: 70 }),
];

/**
 * "3,000.08" without the currency code, for the big value figure.
 * @param {number} amount
 * @param {WordsCurrency} currency
 */
function formatFigure(amount, currency) {
  const decimals = CURRENCY_DECIMALS[currency];
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * One installment's inputs (Cách tính | Tỷ lệ or Số tiền | Giá trị thành
 * tiền) and its words.
 * @param {{
 *   installment: Installment,
 *   index: number,
 *   amount: number | undefined,
 *   total: number | undefined,
 *   currency: WordsCurrency,
 *   language: WordsLanguage,
 *   onChange: (installment: Installment) => void,
 * }} props
 */
function InstallmentFields({
  installment,
  index,
  amount,
  total,
  currency,
  language,
  onChange,
}) {
  const isPercent = installment.mode === 'percent';

  return (
    <>
      <Grid columns={{ minWidth: 240, max: 3 }} gap={4} align="end">
        <MetaSegmentedField
          label="Cách tính"
          value={installment.mode}
          onChange={(mode) =>
            onChange({
              ...installment,
              mode: /** @type {Installment['mode']} */ (mode),
              value: undefined,
            })
          }
          options={[
            { value: 'percent', label: 'Tỷ lệ %' },
            { value: 'amount', label: 'Số tiền' },
          ]}
        />
        <FormattedNumberTextInput
          label={isPercent ? 'Tỷ lệ' : 'Số tiền'}
          value={installment.value}
          onChange={(value) => onChange({ ...installment, value })}
          units={isPercent ? '%' : CURRENCY_LABELS[currency]}
        />
        <MetaValueFigure
          label="Giá trị thành tiền"
          index={index}
          value={
            amount === undefined ? undefined : formatFigure(amount, currency)
          }
          unit={CURRENCY_LABELS[currency]}
        />
      </Grid>

      <MetaWordsBox
        isCompact
        words={amountToWords(amount, currency, language)}
        placeholder={
          isPercent && total === undefined
            ? 'Nhập tổng giá trị để tính đợt này'
            : 'Nhập tỷ lệ hoặc số tiền để xem bằng chữ'
        }
      />
    </>
  );
}

/**
 * "Chia đợt thanh toán" (Figma 156:73): total + currency, then installments
 * by % or fixed amount; each shows its value (total × %) and words.
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
  const status = allocationStatus(remaining);

  /** @param {Installment} next */
  const updateInstallment = (next) =>
    setInstallments((current) =>
      current.map((item) => (item.key === next.key ? next : item)),
    );

  /** @param {string} key */
  const removeInstallment = (key) =>
    setInstallments((current) => current.filter((item) => item.key !== key));

  return (
    <MetaUtilityCard
      icon={WalletCards}
      title="Chia đợt thanh toán"
      tag="Module 02"
      description="Nhập tổng giá trị và các đợt thanh toán theo tỷ lệ % hoặc số tiền. Giá trị mỗi đợt = tổng giá trị × tỷ lệ, kèm số tiền bằng chữ."
    >
      <Grid columns={{ minWidth: 240, max: 3 }} gap={4} align="end">
        <FormattedNumberTextInput
          label="Tổng giá trị hợp đồng"
          value={total}
          onChange={setTotal}
          units={CURRENCY_LABELS[currency]}
        />
        <CurrencySegments value={currency} onChange={setCurrency} />
        <LanguageSegments value={language} onChange={setLanguage} />
      </Grid>

      <MetaWordsBox
        caption="Bằng chữ (tổng hợp đồng)"
        words={amountToWords(total, currency, language)}
        placeholder="Nhập tổng giá trị để xem bằng chữ"
      />

      <MetaAllocationBar
        label="Phân bổ tỷ trọng các đợt"
        status={status}
        statusLabel={
          total === undefined
            ? 'Chưa nhập tổng giá trị'
            : `${shareOfTotal(allocated, total)}% đã phân bổ`
        }
        segments={installments.map((installment, index) => {
          const amount = amounts[index];
          const share =
            total === undefined && installment.mode === 'percent'
              ? (installment.value ?? 0)
              : shareOfTotal(amount, total);
          return {
            key: installment.key,
            label: `Đợt ${index + 1}`,
            ratio: share,
            ratioLabel: `${share}%`,
            detail:
              amount === undefined ? undefined : formatAmount(amount, currency),
          };
        })}
      />

      <VStack gap={0} hAlign="stretch">
        {installments.map((installment, index) => (
          <MetaInstallmentItem
            key={installment.key}
            index={index}
            title={`Đợt ${index + 1}`}
            isRemoveDisabled={installments.length <= 1}
            onRemove={() => removeInstallment(installment.key)}
          >
            <InstallmentFields
              installment={installment}
              index={index}
              amount={amounts[index]}
              total={total}
              currency={currency}
              language={language}
              onChange={updateInstallment}
            />
          </MetaInstallmentItem>
        ))}
      </VStack>

      <HStack>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          label="Thêm đợt"
          icon={<Icon icon={CirclePlus} size="sm" />}
          onClick={() =>
            setInstallments((current) => [...current, createInstallment()])
          }
        />
      </HStack>

      <MetaAllocationFooter
        label="Tổng các đợt:"
        total={formatAmount(allocated, currency)}
        status={status}
        remainingLabel={
          remaining === undefined
            ? undefined
            : `Còn lại: ${formatAmount(remaining, currency)}`
        }
      />

      {remaining !== undefined && status !== 'balanced' ? (
        <Banner
          status="warning"
          container="card"
          title={
            status === 'under'
              ? `Các đợt chưa đủ tổng giá trị, còn thiếu ${formatAmount(remaining, currency)}.`
              : `Các đợt vượt tổng giá trị ${formatAmount(-remaining, currency)}.`
          }
        />
      ) : null}
    </MetaUtilityCard>
  );
}
