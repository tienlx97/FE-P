import { roundToCurrency } from './number-to-words.js';

/** @typedef {import('../types/index.js').Installment} Installment */
/** @typedef {import('./number-to-words.js').WordsCurrency} WordsCurrency */

let nextInstallmentKey = 0;

/** @param {Array<number | undefined>} amounts */
function sumAmounts(amounts) {
  let sum = 0;
  for (const amount of amounts) sum += amount ?? 0;
  return sum;
}

/**
 * @param {Partial<Installment>} [overrides]
 * @returns {Installment}
 */
export function createInstallment(overrides = {}) {
  nextInstallmentKey += 1;
  return {
    key: `installment-${nextInstallmentKey}`,
    mode: 'percent',
    value: undefined,
    ...overrides,
  };
}

/**
 * Installment value: "percent" = total × value%, "amount" = value as is.
 * Rounded to the currency's minor unit; undefined until computable.
 * @param {Installment} installment
 * @param {number | undefined} total
 * @param {WordsCurrency} currency
 */
export function installmentAmount(installment, total, currency) {
  if (typeof installment.value !== 'number') return undefined;
  if (installment.mode === 'amount') {
    return roundToCurrency(installment.value, currency);
  }
  if (typeof total !== 'number') return undefined;
  return roundToCurrency((total * installment.value) / 100, currency);
}

/**
 * Every installment's value. When the installments add up to exactly the
 * total (e.g. 30% + 70%), the last one takes the rounding remainder so the
 * rounded values still sum to the total (3,000.08 + 7,000.17 = 10,000.25,
 * not 7,000.18).
 * @param {Installment[]} installments
 * @param {number | undefined} total
 * @param {WordsCurrency} currency
 * @returns {Array<number | undefined>}
 */
export function installmentAmounts(installments, total, currency) {
  const amounts = installments.map((installment) =>
    installmentAmount(installment, total, currency),
  );
  const lastIndex = installments.length - 1;
  if (
    typeof total !== 'number' ||
    lastIndex < 0 ||
    amounts.some((amount) => amount === undefined)
  ) {
    return amounts;
  }

  const exactSum = installments.reduce(
    (sum, installment) =>
      sum +
      (installment.mode === 'percent'
        ? (total * (installment.value ?? 0)) / 100
        : (installment.value ?? 0)),
    0,
  );
  if (
    roundToCurrency(exactSum, currency) !== roundToCurrency(total, currency)
  ) {
    return amounts;
  }

  const othersSum = sumAmounts(amounts.slice(0, lastIndex));
  amounts[lastIndex] = roundToCurrency(total - othersSum, currency);
  return amounts;
}

/**
 * Sum of the installments and what is left of the total.
 * @param {Array<number | undefined>} amounts from `installmentAmounts`
 * @param {number | undefined} total
 * @param {WordsCurrency} currency
 */
export function summarizeInstallments(amounts, total, currency) {
  const allocated = roundToCurrency(sumAmounts(amounts), currency);
  const remaining =
    typeof total === 'number'
      ? roundToCurrency(total - allocated, currency)
      : undefined;

  return { allocated, remaining };
}

/**
 * Share of the total, in % (2 decimals); 0 when either side is missing.
 * @param {number | undefined} amount
 * @param {number | undefined} total
 */
export function shareOfTotal(amount, total) {
  if (typeof amount !== 'number' || typeof total !== 'number' || total <= 0) {
    return 0;
  }
  return Math.round((amount / total) * 10_000) / 100;
}

/**
 * "balanced" when nothing is left, "under" while short (or no total yet),
 * "over" past the total.
 * @param {number | undefined} remaining
 * @returns {'balanced' | 'under' | 'over'}
 */
export function allocationStatus(remaining) {
  if (remaining === undefined || remaining > 0) return 'under';
  return remaining < 0 ? 'over' : 'balanced';
}
