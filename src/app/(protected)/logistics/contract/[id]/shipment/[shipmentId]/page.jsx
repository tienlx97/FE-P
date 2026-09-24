import { Suspense } from 'react';

import { ShipmentDetailWorkspace } from '@/features/logistics-contracts/index.js';

export const metadata = {
  title: 'Lô hàng · Logistics · KT-XNK',
};

/**
 * Access is gated by `routeAccessRules` (`logistics:contracts:view`,
 * `/logistics/contract` prefix), enforced in middleware before this
 * renders. `ShipmentDetailWorkspace` reads `?tab=` via `useSearchParams`,
 * which needs a `Suspense` boundary (same as the contract detail page).
 * @param {{ params: Promise<{ id: string, shipmentId: string }> }} props
 */
export default async function LogisticsShipmentDetailPage({ params }) {
  const { id, shipmentId } = await params;

  return (
    <Suspense>
      <ShipmentDetailWorkspace contractId={id} shipmentId={shipmentId} />
    </Suspense>
  );
}
