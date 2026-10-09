import { Suspense } from 'react';

import { AccountingContractDetailWorkspace } from '@/features/accounting-contracts/index.js';

export const metadata = {
  title: 'Hợp đồng · Kế toán · KT-XNK',
};

/**
 * Access is gated by `routeAccessRules` (`/accounting` → `accounting:contracts:view`);
 * the backend re-checks the permission in the contract's company.
 * @param {{ params: Promise<{ id: string }> }} props
 */
export default async function AccountingContractDetailPage({ params }) {
  const { id } = await params;

  // The workspace reads `?tab=` (useSearchParams), which needs a Suspense boundary.
  return (
    <Suspense>
      <AccountingContractDetailWorkspace contractId={id} />
    </Suspense>
  );
}
