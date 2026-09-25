import { Suspense } from 'react';

import { CustomerDetailWorkspace } from '@/features/logistics-contracts/index.js';

export const metadata = {
  title: 'Khách hàng · Logistics · KT-XNK',
};

/**
 * Customer detail page. Same access as `/logistics/customers`
 * (`routeAccessRules` prefix match); `CustomerDetailWorkspace` reads
 * `?tab=` via `useSearchParams`, which needs a `Suspense` boundary.
 * @param {{ params: Promise<{ id: string }> }} props
 */
export default async function LogisticsCustomerDetailPage({ params }) {
  const { id } = await params;

  return (
    <Suspense>
      <CustomerDetailWorkspace customerId={id} />
    </Suspense>
  );
}
