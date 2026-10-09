'use client';

import { quickSearchAccountingContracts } from '@/features/accounting-contracts/index.js';
import { QuickSearchPalette } from '@/features/logistics-contracts/index.js';

/**
 * "Tra cứu nhanh" (Ctrl + K) with Kế toán contracts wired in: the palette
 * lives in the Logistics feature and may not import the accounting one, and
 * the layout is a Server Component that cannot pass a function down.
 * @param {{ canLogistics: boolean, canAccounting: boolean }} props
 */
export function AppQuickSearch({ canLogistics, canAccounting }) {
  return (
    <QuickSearchPalette
      canLogistics={canLogistics}
      canAccounting={canAccounting}
      searchAccountingContracts={quickSearchAccountingContracts}
    />
  );
}
