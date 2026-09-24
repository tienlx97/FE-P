import { Suspense } from 'react';

import { CommissionDetailWorkspace } from '@/features/logistics-contracts/index.js';

export const metadata = {
  title: 'Hoa hồng · Logistics · KT-XNK',
};

/**
 * Access is gated by `routeAccessRules` (`logistics:contracts:view`,
 * `/logistics/contract` prefix), enforced in middleware before this
 * renders. `CommissionDetailWorkspace` reads `?tab=` via `useSearchParams`,
 * which needs a `Suspense` boundary (same as the contract detail page).
 * @param {{ params: Promise<{ id: string }> }} props
 */
export default async function LogisticsCommissionDetailPage({ params }) {
  const { id } = await params;

  return (
    <Suspense>
      <CommissionDetailWorkspace contractId={id} />
    </Suspense>
  );
}
