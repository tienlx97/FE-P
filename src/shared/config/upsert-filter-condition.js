import { generateRowKey } from './generate-row-key.js';

/**
 * Replaces (by `field`) or removes a single `Equals` condition in an
 * `AdvancedFilterCondition` array, leaving every other condition
 * untouched — e.g. a status quick-filter pill can set/clear its own
 * condition without disturbing an already-applied default filter (like
 * `default-contracts-list-official-filter`'s `contractType Equals
 * Official`) or anything the user added via the funnel dialog. Unlike the
 * funnel dialog's full builder, a quick filter only ever wants "at most
 * one condition for this field, no connector choice, no other operator".
 * @param {import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]} conditions
 * @param {string} field
 * @param {string | null} value `null` (or `''`) removes the condition
 *   entirely instead of setting an empty one.
 * @returns {import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]}
 */
export function upsertEqualsFilterCondition(conditions, field, value) {
  const rest = conditions.filter((condition) => condition.field !== field);
  if (!value) return rest;
  return [
    ...rest,
    { id: generateRowKey(), field, operator: 'Equals', value, connector: 'And' },
  ];
}

/**
 * Same as {@link upsertEqualsFilterCondition}, but a substring `Contains`
 * condition instead of an exact `Equals` — for a free-text quick-search box
 * that needs to search the whole backend dataset (not just the currently
 * loaded page), rather than a single-value pill/dropdown.
 * @param {import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]} conditions
 * @param {string} field
 * @param {string} value Blank (after trimming) removes the condition entirely.
 * @returns {import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]}
 */
export function upsertContainsFilterCondition(conditions, field, value) {
  const rest = conditions.filter((condition) => condition.field !== field);
  if (!value.trim()) return rest;
  return [
    ...rest,
    { id: generateRowKey(), field, operator: 'Contains', value, connector: 'And' },
  ];
}
