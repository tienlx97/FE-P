'use client';

import {
  CustomerAccountingContracts,
  useCustomerAccountingContractsQuery,
} from '@/features/accounting-contracts/index.js';
import { CustomerDetailWorkspace } from '@/features/logistics-contracts/index.js';

/**
 * Customer detail page of either area. The customer directory is shared by
 * Logistics and Kế toán, so the "Hợp đồng" tab lists both kinds of
 * contracts; a feature may not import another, so the page composes them
 * here.
 * @param {{ customerId: string, area: 'logistics' | 'accounting' }} props
 */
export function CustomerDetailWithContracts({ customerId, area }) {
  const accountingQuery = useCustomerAccountingContractsQuery(customerId);

  return (
    <CustomerDetailWorkspace
      customerId={customerId}
      area={area}
      extraContracts={{
        count: accountingQuery.data?.success
          ? accountingQuery.data.data.totalCount
          : 0,
        node: <CustomerAccountingContracts customerId={customerId} />,
      }}
    />
  );
}
