// Vietnamese lunar calendar (Hồ Ngọc Đức's astronomical algorithm, UTC+7).
// Pure functions: solar date → lunar day/month/year/leap, year Can Chi and observances.

const TIME_ZONE = 7;
const { floor, sin, PI } = Math;

/** Julian day number of a Gregorian date. @param {number} dd @param {number} mm @param {number} yy */
export function jdFromDate(dd, mm, yy) {
  const a = floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd =
    dd +
    floor((153 * m + 2) / 5) +
    365 * y +
    floor(y / 4) -
    floor(y / 100) +
    floor(y / 400) -
    32045;
  if (jd < 2299161) {
    jd = dd + floor((153 * m + 2) / 5) + 365 * y + floor(y / 4) - 32083;
  }
  return jd;
}

/** Day number of the k-th new moon after 1900-01-01. @param {number} k */
function newMoonDay(k) {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = PI / 180;
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  jd1 += 0.00033 * sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * sin(M * dr) + 0.0021 * sin(2 * dr * M);
  C1 = C1 - 0.4068 * sin(Mpr * dr) + 0.0161 * sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * sin(dr * 2 * F) - 0.0051 * sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * sin(dr * (M - Mpr)) + 0.0004 * sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * sin(dr * (2 * F - M)) - 0.0006 * sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.001 * sin(dr * (2 * F - Mpr)) + 0.0005 * sin(dr * (2 * Mpr + M));
  const deltaT =
    T < -11
      ? 0.001 +
        0.000839 * T +
        0.0002261 * T2 -
        0.00000845 * T3 -
        0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return floor(jd1 + C1 - deltaT + 0.5 + TIME_ZONE / 24);
}

/** Sun longitude sector (0–11) at local midnight of a day number. @param {number} jdn */
function sunLongitude(jdn) {
  const T = (jdn - 2451545.5 - TIME_ZONE / 24) / 36525;
  const T2 = T * T;
  const dr = PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * sin(dr * 2 * M) + 0.00029 * sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  L -= PI * 2 * floor(L / (PI * 2));
  return floor((L / PI) * 6);
}

/** Day number of lunar month 11 (the one containing the winter solstice) of a year. @param {number} yy */
function lunarMonth11(yy) {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = floor(off / 29.530588853);
  const nm = newMoonDay(k);
  return sunLongitude(nm) >= 9 ? newMoonDay(k - 1) : nm;
}

/** @param {number} a11 */
function leapMonthOffset(a11) {
  const k = floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last;
  let i = 1;
  let arc = sunLongitude(newMoonDay(k + i));
  do {
    last = arc;
    i += 1;
    arc = sunLongitude(newMoonDay(k + i));
  } while (arc !== last && i < 14);
  return i - 1;
}

/**
 * @typedef {{day:number, month:number, year:number, isLeap:boolean, jd:number}} LunarDate
 * @param {number} dd @param {number} mm @param {number} yy @returns {LunarDate}
 */
export function solarToLunar(dd, mm, yy) {
  const jd = jdFromDate(dd, mm, yy);
  const k = floor((jd - 2415021.076998695) / 29.530588853);
  let monthStart = newMoonDay(k + 1);
  if (monthStart > jd) monthStart = newMoonDay(k);
  let a11 = lunarMonth11(yy);
  let b11 = a11;
  let year;
  if (a11 >= monthStart) {
    year = yy;
    a11 = lunarMonth11(yy - 1);
  } else {
    year = yy + 1;
    b11 = lunarMonth11(yy + 1);
  }
  const day = jd - monthStart + 1;
  const diff = floor((monthStart - a11) / 29);
  let isLeap = false;
  let month = diff + 11;
  if (b11 - a11 > 365) {
    const leapDiff = leapMonthOffset(a11);
    if (diff >= leapDiff) {
      month = diff + 10;
      isLeap = diff === leapDiff;
    }
  }
  if (month > 12) month -= 12;
  if (month >= 11 && diff < 4) year -= 1;
  return { day, month, year, isLeap, jd };
}

const CAN = [
  'Giáp',
  'Ất',
  'Bính',
  'Đinh',
  'Mậu',
  'Kỷ',
  'Canh',
  'Tân',
  'Nhâm',
  'Quý',
];
const CHI = [
  'Tý',
  'Sửu',
  'Dần',
  'Mão',
  'Thìn',
  'Tỵ',
  'Ngọ',
  'Mùi',
  'Thân',
  'Dậu',
  'Tuất',
  'Hợi',
];

/** @param {number} year */
export function yearCanChi(year) {
  return `${CAN[(year + 6) % 10]} ${CHI[(year + 8) % 12]}`;
}

const SOLAR_HOLIDAYS = /** @type {Record<string, string>} */ ({
  '1/1': 'Tết Dương lịch',
  '3/2': 'Ngày thành lập Đảng',
  '8/3': 'Quốc tế Phụ nữ',
  '30/4': 'Ngày Giải phóng miền Nam',
  '1/5': 'Quốc tế Lao động',
  '19/5': 'Ngày sinh Chủ tịch Hồ Chí Minh',
  '1/6': 'Quốc tế Thiếu nhi',
  '2/9': 'Quốc khánh',
  '10/10': 'Ngày Giải phóng Thủ đô',
  '20/10': 'Ngày Phụ nữ Việt Nam',
  '20/11': 'Ngày Nhà giáo Việt Nam',
  '22/12': 'Ngày thành lập QĐND Việt Nam',
  '24/12': 'Lễ Giáng sinh',
});
const LUNAR_HOLIDAYS = /** @type {Record<string, string>} */ ({
  '1/1': 'Tết Nguyên đán',
  '2/1': 'Mùng 2 Tết',
  '3/1': 'Mùng 3 Tết',
  '15/1': 'Tết Nguyên tiêu',
  '10/3': 'Giỗ Tổ Hùng Vương',
  '15/4': 'Lễ Phật đản',
  '5/5': 'Tết Đoan ngọ',
  '15/7': 'Lễ Vu Lan',
  '15/8': 'Tết Trung thu',
  '23/12': 'Ông Công Ông Táo',
});

/** Named solar or lunar observance for a day, else null.
 * @param {number} dd @param {number} mm @param {LunarDate} lunar */
export function holidayName(dd, mm, lunar) {
  return (
    SOLAR_HOLIDAYS[`${dd}/${mm}`] ??
    (lunar.isLeap ? null : LUNAR_HOLIDAYS[`${lunar.day}/${lunar.month}`]) ??
    null
  );
}
