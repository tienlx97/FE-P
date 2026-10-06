/**
 * ISO 6346 container numbers and the BIC BoxTech technical data that fills
 * the container drawer (BE-P `container-specs-boxtech`,
 * `GET /api/v1/containers/{number}/specs`). Mirrors the backend's
 * `ContainerNumbers`.
 */

/** "tgbu 526169-8" → "TGBU5261698". @param {string | null | undefined} text */
export function normalizeContainerNumber(text) {
  return (text ?? '').replace(/[^0-9a-z]/gi, '').toUpperCase();
}

/** @param {string} character */
function valueOf(character) {
  if (/\d/.test(character)) return Number(character);
  // A = 10 … Z = 38, skipping multiples of 11.
  let value = 10;
  for (let code = 65; code < character.charCodeAt(0); code += 1) {
    value += 1;
    if (value % 11 === 0) value += 1;
  }
  return value;
}

/**
 * Owner code (3 letters + U / J / Z), 6-digit serial and a matching check
 * digit: the first 10 characters weighted by 2^position, mod 11, mod 10.
 * @param {string | null | undefined} text
 */
export function isValidContainerNumber(text) {
  const number = normalizeContainerNumber(text);
  if (!/^[A-Z]{3}[UJZ]\d{7}$/.test(number)) return false;
  let sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += valueOf(number[index]) * 2 ** index;
  }
  return (sum % 11) % 10 === Number(number[10]);
}

/** The drawer fields BoxTech can fill. */
export const SPEC_FIELDS = /** @type {const} */ ([
  'containerType',
  'maxGross',
  'tare',
  'payload',
]);

/**
 * The drawer values BoxTech gives for these specs (only what it knows).
 * @param {import('../types/index.js').ContainerSpecs} specs
 * @returns {Partial<Pick<import('../types/index.js').ShipmentVgmFormValues, (typeof SPEC_FIELDS)[number]>>}
 */
export function specValues(specs) {
  return Object.fromEntries(
    /** @type {const} */ ([
      ['containerType', specs.containerType],
      ['maxGross', specs.maxGrossKg],
      ['tare', specs.tareKg],
      ['payload', specs.maxPayloadKg],
    ]).filter(([, value]) => value !== null && value !== undefined),
  );
}

/**
 * What to set in the drawer for the container now typed: a blank field, or
 * one still holding what the previous lookup filled (`previous`, another
 * container), takes BoxTech's value — or is cleared when BoxTech has none
 * (`specs` null: unknown / invalid number). A value typed by hand is kept,
 * unless `overwrite` ("Điền lại").
 * @param {import('../types/index.js').ShipmentVgmFormValues} values
 * @param {import('../types/index.js').ContainerSpecs | null} specs
 * @param {{ overwrite?: boolean, previous?: Partial<Record<(typeof SPEC_FIELDS)[number], unknown>> | null }} [options]
 * @returns {Partial<Pick<import('../types/index.js').ShipmentVgmFormValues, (typeof SPEC_FIELDS)[number]>>}
 */
export function specsFill(
  values,
  specs,
  { overwrite = false, previous = null } = {},
) {
  /** @type {Record<string, unknown>} */
  const next = specs ? specValues(specs) : {};
  /** @type {Record<string, unknown>} */
  const fill = {};
  for (const key of SPEC_FIELDS) {
    const current = values[key];
    const isBlank = current === undefined || current === '';
    const wasFilled =
      previous?.[key] !== undefined && current === previous[key];
    if (key in next) {
      if (overwrite || isBlank || wasFilled) fill[key] = next[key];
    } else if (wasFilled) {
      fill[key] = key === 'containerType' ? '' : undefined;
    }
  }
  return fill;
}

/**
 * Whether the drawer differs from what BoxTech knows (offer "Điền lại").
 * @param {import('../types/index.js').ShipmentVgmFormValues} values
 * @param {import('../types/index.js').ContainerSpecs} specs
 */
export function differsFromSpecs(values, specs) {
  return Object.entries(specValues(specs)).some(
    ([key, value]) =>
      values[/** @type {(typeof SPEC_FIELDS)[number]} */ (key)] !== value,
  );
}

/**
 * "45G1 · tare 3.830 · payload 28.670 · max gross 32.500 kg".
 * @param {import('../types/index.js').ContainerSpecs} specs
 */
export function specsSummary(specs) {
  /** @param {number | null} kg */
  const kg = (kg) => (kg === null ? '—' : kg.toLocaleString('vi-VN'));
  return [
    specs.sizeType,
    `tare ${kg(specs.tareKg)}`,
    `payload ${kg(specs.maxPayloadKg)}`,
    `max gross ${kg(specs.maxGrossKg)} kg`,
  ]
    .filter(Boolean)
    .join(' · ');
}
