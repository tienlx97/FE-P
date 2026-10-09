import { Suspense } from 'react';

import { CustomerDetailWorkspace } from '@/features/logistics-contracts/index.js';

export const metadata = {
  title: 'Khách hàng · Kế toán · KT-XNK',
};

/**
 * Customer detail page of Kế toán: the shared customer directory's detail
 * (same as `/logistics/customers/[id]`) with the Kế toán breadcrumb. Same
 * access as `/accounting/customers` (`routeAccessRules` prefix match).
 * @param {{ params: Promise<{ id: string }> }} props
 */
export default async function AccountingCustomerDetailPage({ params }) {
  const { id } = await params;

  return (
    <Suspense>
      <CustomerDetailWorkspace customerId={id} area="accounting" />
    </Suspense>
  );
}
