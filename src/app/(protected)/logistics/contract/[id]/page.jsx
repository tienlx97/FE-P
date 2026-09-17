import { Suspense } from 'react';

import { ContractDetailWorkspace } from '@/features/logistics-contracts/index.js';

export const metadata = {
  title: 'Hợp đồng · Logistics · KT-XNK',
};

/**
 * Access is gated by `routeAccessRules` (`logistics:contracts:view`),
 * enforced in middleware before this renders — same permission as
 * `/logistics/contracts`. The backend re-checks the permission
 * (branch-scoped) on every real endpoint call.
 *
 * `ContractDetailWorkspace` reads `?tab=`/`?mode=` via `useSearchParams`,
 * which Next.js requires a `Suspense` boundary for (same pattern as
 * `src/app/login/page.jsx`).
 * @param {{ params: Promise<{ id: string }> }} props
 */
export default async function LogisticsContractDetailPage({ params }) {
  const { id } = await params;

  return (
    <Suspense>
      <ContractDetailWorkspace contractId={id} />
    </Suspense>
  );
}
