'use client';

import { useCustomerAccountingContractsQuery } from '@/features/accounting-contracts/index.js';
import { CustomerDetailWorkspace } from '@/features/logistics-contracts/index.js';

/**
 * Customer detail page of either area. The customer directory is shared by
 * Logistics and Kế toán, so the "Hợp đồng" tab merges both kinds of
 * contracts into one table; a feature may not import another, so the page
 * composes them here.
 * @param {{ customerId: string, area: 'logistics' | 'accounting' }} props
 */
export function CustomerDetailWithContracts({ customerId, area }) {
  const query = useCustomerAccountingContractsQuery(customerId);
  const result = query.data;

  const rows = result?.success
    ? result.data.items.map((contract) => ({
        id: `accounting-${contract.id}`,
        href: `/accounting/contract/${contract.id}`,
        contractNumber: contract.contractNumber,
        signedDate: contract.signedDate,
        settlementValue: contract.settlementValue,
        paidValue: contract.paidValue,
        exportedValue: contract.invoicedValue,
        currency: 'VND',
      }))
    : [];

  return (
    <CustomerDetailWorkspace
      customerId={customerId}
      area={area}
      extraContracts={{
        count: result?.success ? result.data.totalCount : 0,
        rows,
        isLoading: query.isLoading,
      }}
    />
  );
}
