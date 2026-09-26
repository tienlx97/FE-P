import { normalizeForSearch } from '@/shared/config/diacritic-insensitive-filters.js';

/**
 * Recommended fee types of one cost group, in the server's order
 * (`sortOrder`), narrowed by `query` — matched without dấu / case against
 * the Vietnamese name and the English invoice keyword, so "demurrage",
 * "THC" or "phi depot" all find their fee.
 * @param {import('../types/index.js').ShipmentCostItemTemplate[]} templates
 * @param {string} costCategoryId
 * @param {string} [query]
 */
export function recommendedFees(templates, costCategoryId, query = '') {
  const needle = normalizeForSearch(query.trim());
  return templates.filter(
    (template) =>
      template.costCategoryId === costCategoryId &&
      (!needle ||
        normalizeForSearch(template.name).includes(needle) ||
        normalizeForSearch(template.nameEn ?? '').includes(needle)),
  );
}

/**
 * The fee the cost line currently names, if it is one of the group's
 * recommendations (exact name, ignoring surrounding spaces).
 * @param {import('../types/index.js').ShipmentCostItemTemplate[]} templates
 * @param {string} costCategoryId
 * @param {string} name
 */
export function matchingFee(templates, costCategoryId, name) {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  return templates.find(
    (template) =>
      template.costCategoryId === costCategoryId && template.name === trimmed,
  );
}

/**
 * First sentence of a group's `note` — the plain meaning ("Xử lý hàng tại
 * cảng đến"), which the backend seeds as "<meaning>. Flow: <flow>.
 * <definition>". Falls back to the whole note for an edited free-form one.
 * @param {string | null | undefined} note
 */
export function groupMeaning(note) {
  if (!note) return '';
  const flowAt = note.indexOf('. Flow:');
  return flowAt === -1 ? note : note.slice(0, flowAt);
}
