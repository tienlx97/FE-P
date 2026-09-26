/**
 * Money amount → words, Vietnamese or English, for USD / VND. Works on the
 * digit string (not float math) so large amounts read exactly. Amounts are
 * rounded to the currency's minor unit first: cents for USD, none for VND.
 */

/** @typedef {'vi' | 'en'} WordsLanguage */
/** @typedef {'USD' | 'VND'} WordsCurrency */

export const WORDS_CURRENCIES = /** @type {const} */ (['USD', 'VND']);

/** Largest amount read — past this a JS number can't hold every digit. */
export const MAX_WORDS_AMOUNT = 999_999_999_999_999;

/** @type {Record<WordsCurrency, number>} */
export const CURRENCY_DECIMALS = { USD: 2, VND: 0 };

const VI_DIGITS = [
  'không',
  'một',
  'hai',
  'ba',
  'bốn',
  'năm',
  'sáu',
  'bảy',
  'tám',
  'chín',
];

/**
 * One 3-digit group. `isFull` = not the leading group, so its zero
 * hundreds / tens are still read ("không trăm linh năm").
 * @param {number} group
 * @param {boolean} isFull
 */
function viGroup(group, isFull) {
  const hundreds = Math.floor(group / 100);
  const tens = Math.floor((group % 100) / 10);
  const units = group % 10;
  /** @type {string[]} */
  const words = [];

  if (hundreds > 0 || isFull) words.push(VI_DIGITS[hundreds], 'trăm');

  if (tens === 0) {
    if (units > 0 && (hundreds > 0 || isFull)) words.push('linh');
  } else if (tens === 1) {
    words.push('mười');
  } else {
    words.push(VI_DIGITS[tens], 'mươi');
  }

  if (units === 1 && tens > 1) words.push('mốt');
  else if (units === 5 && tens > 0) words.push('lăm');
  else if (units > 0) words.push(VI_DIGITS[units]);

  return words.join(' ');
}

/**
 * Vietnamese reading of a non-negative integer given as digits. Units repeat
 * past "tỷ": 10^12 = "một nghìn tỷ", 10^15 = "một triệu tỷ".
 * @param {string} digits
 * @returns {string}
 */
function viInteger(digits) {
  const clean = digits.replace(/^0+/, '');
  if (!clean) return VI_DIGITS[0];

  /** @param {string} part @param {boolean} isFull */
  const readBelowBillion = (part, isFull) => {
    const units = ['', 'nghìn', 'triệu'];
    const padded = part.padStart(9, '0');
    const groups = [0, 3, 6].map((start) =>
      Number(padded.slice(start, start + 3)),
    );
    /** @type {string[]} */
    const words = [];
    let hasLeading = isFull;

    groups.forEach((group, index) => {
      if (group === 0) return;
      words.push(viGroup(group, hasLeading));
      const unit = units[2 - index];
      if (unit) words.push(unit);
      hasLeading = true;
    });

    return words.join(' ');
  };

  if (clean.length <= 9) return readBelowBillion(clean, false);

  const high = clean.slice(0, -9);
  const low = clean.slice(-9);
  const lowWords = Number(low) === 0 ? '' : readBelowBillion(low, true);

  return [viInteger(high), 'tỷ', lowWords].filter(Boolean).join(' ');
}

const EN_ONES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];

const EN_TENS = [
  '',
  '',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
];

const EN_SCALES = ['', 'thousand', 'million', 'billion', 'trillion'];

/** @param {number} group 1–999 */
function enGroup(group) {
  const hundreds = Math.floor(group / 100);
  const rest = group % 100;
  /** @type {string[]} */
  const words = [];

  if (hundreds > 0) words.push(EN_ONES[hundreds], 'hundred');
  if (rest >= 20) {
    const units = rest % 10;
    words.push(
      units
        ? `${EN_TENS[Math.floor(rest / 10)]}-${EN_ONES[units]}`
        : EN_TENS[Math.floor(rest / 10)],
    );
  } else if (rest > 0) {
    words.push(EN_ONES[rest]);
  }

  return words.join(' ');
}

/** @param {string} digits */
function enInteger(digits) {
  const clean = digits.replace(/^0+/, '');
  if (!clean) return EN_ONES[0];

  const padded = clean.padStart(Math.ceil(clean.length / 3) * 3, '0');
  const groupCount = padded.length / 3;
  /** @type {string[]} */
  const words = [];

  for (let index = 0; index < groupCount; index += 1) {
    const group = Number(padded.slice(index * 3, index * 3 + 3));
    if (group === 0) continue;
    const scale = EN_SCALES[groupCount - 1 - index];
    words.push(enGroup(group));
    if (scale) words.push(scale);
  }

  return words.join(' ');
}

/** @param {string} text */
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Rounds to the currency's minor unit and splits into integer / fraction
 * digit strings.
 * @param {number} amount
 * @param {WordsCurrency} currency
 */
export function splitAmount(amount, currency) {
  const decimals = CURRENCY_DECIMALS[currency];
  const [integer, fraction = ''] = roundToCurrency(Math.abs(amount), currency)
    .toFixed(decimals)
    .split('.');
  return { integer, fraction };
}

/**
 * Rounds half away from zero to the currency's minor unit. Shifts the
 * exponent in the string form so 3000.075 → 3000.08 (plain `toFixed` gives
 * 3000.07 because 3000.075 is stored as 3000.07499…).
 * @param {number} amount
 * @param {WordsCurrency} currency
 */
export function roundToCurrency(amount, currency) {
  const decimals = CURRENCY_DECIMALS[currency];
  const sign = amount < 0 ? -1 : 1;
  const shifted = Math.round(
    Number(`${Math.abs(amount).toFixed(10)}e${decimals}`),
  );
  return sign * Number(`${shifted}e-${decimals}`);
}

/**
 * e.g. 1,250.5 USD →
 *   vi: "Một nghìn hai trăm năm mươi đô la Mỹ và năm mươi xu"
 *   en: "One thousand two hundred fifty US dollars and fifty cents"
 * Returns '' for a missing, negative or too-large amount.
 * @param {number | undefined} amount
 * @param {WordsCurrency} currency
 * @param {WordsLanguage} language
 */
export function amountToWords(amount, currency, language) {
  if (
    typeof amount !== 'number' ||
    !Number.isFinite(amount) ||
    amount < 0 ||
    amount > MAX_WORDS_AMOUNT
  ) {
    return '';
  }

  const { integer, fraction } = splitAmount(amount, currency);
  const cents = Number(fraction || 0);

  if (language === 'vi') {
    const unit = currency === 'USD' ? 'đô la Mỹ' : 'đồng';
    const main = `${viInteger(integer)} ${unit}`;
    const text = cents > 0 ? `${main} và ${viInteger(fraction)} xu` : main;
    return capitalize(text);
  }

  if (currency === 'VND') {
    return capitalize(`${enInteger(integer)} Vietnamese dong`);
  }

  const dollarUnit = integer === '1' ? 'US dollar' : 'US dollars';
  const main = `${enInteger(integer)} ${dollarUnit}`;
  const text =
    cents > 0
      ? `${main} and ${enInteger(fraction)} ${cents === 1 ? 'cent' : 'cents'}`
      : main;
  return capitalize(text);
}

/**
 * "12,345.67 USD" / "1,500,000 VNĐ"; '' when missing.
 * @param {number | undefined} amount
 * @param {WordsCurrency} currency
 */
export function formatAmount(amount, currency) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '';
  const decimals = CURRENCY_DECIMALS[currency];
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
  return `${formatted} ${currency === 'VND' ? 'VNĐ' : currency}`;
}
