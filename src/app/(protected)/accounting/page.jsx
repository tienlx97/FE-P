import { redirect } from 'next/navigation';

/** The area opens on its contract list (`routeAccessRules`: `accounting:contracts:view`). */
export default function AccountingPage() {
  redirect('/accounting/customers');
}
