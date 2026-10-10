'use client';

import { QuickCreateCustomerProvider } from '@/features/accounting-contracts/index.js';
import { QuickCreateCustomerDialog } from '@/features/logistics-contracts/index.js';

/**
 * The Kế toán contract drawer's "Thêm khách hàng" button opens the shared
 * customer directory's quick-create drawer (from logistics-contracts); a
 * feature may not import another, so the area layout composes them here.
 * @param {{ children: import('react').ReactNode }} props
 */
export function AccountingQuickCreateCustomer({ children }) {
  return (
    <QuickCreateCustomerProvider
      render={(props) => <QuickCreateCustomerDialog {...props} />}
    >
      {children}
    </QuickCreateCustomerProvider>
  );
}
