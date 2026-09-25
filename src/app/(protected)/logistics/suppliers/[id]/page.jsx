import { Suspense } from 'react';

import { SupplierDetailWorkspace } from '@/features/logistics-contracts/index.js';

export const metadata = {
  title: 'Nhà cung cấp · Logistics · KT-XNK',
};

/**
 * Supplier detail page. Same access as `/logistics/suppliers`
 * (`routeAccessRules` prefix match); `SupplierDetailWorkspace` reads
 * `?tab=` via `useSearchParams`, which needs a `Suspense` boundary.
 * @param {{ params: Promise<{ id: string }> }} props
 */
export default async function LogisticsSupplierDetailPage({ params }) {
  const { id } = await params;

  return (
    <Suspense>
      <SupplierDetailWorkspace supplierId={id} />
    </Suspense>
  );
}
