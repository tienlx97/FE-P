import { AccountingQuickCreateCustomer } from '../_components/accounting-quick-create-customer.jsx';

/**
 * Every Kế toán page: composes the cross-feature quick-create customer drawer.
 * @param {{ children: import('react').ReactNode }} props
 */
export default function AccountingLayout({ children }) {
  return (
    <AccountingQuickCreateCustomer>{children}</AccountingQuickCreateCustomer>
  );
}
