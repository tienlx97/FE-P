import { searchContracts } from './contracts.js';

const LIMIT = 5;

/**
 * "Tra cứu nhanh" (Ctrl + K) for Kế toán contracts: by project code ("Mã
 * công trình") or contract number, merged without duplicates, project-code
 * matches first. A failed side (e.g. no accounting permission) comes back
 * empty.
 * @param {string} query
 * @returns {Promise<import('../types/index.js').AccountingContractSummary[]>}
 */
export async function quickSearchAccountingContracts(query) {
  const term = query.trim();
  if (!term) return [];

  /** @param {string} field */
  const by = (field) =>
    searchContracts({
      page: 1,
      pageSize: LIMIT,
      conditions: [{ field, operator: 'Contains', value: term }],
    });
  const [byCode, byNumber] = await Promise.all([
    by('projectCode'),
    by('contractNumber'),
  ]);

  const seen = new Set();
  return [byCode, byNumber]
    .flatMap((result) => (result.success ? result.data.items : []))
    .filter((contract) => !seen.has(contract.id) && seen.add(contract.id))
    .slice(0, LIMIT);
}
