import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { LogisticsOverview } from '@/features/logistics/index.js';
import { parsePermissionsCookie } from '@/shared/api/jwt.js';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';
import { SESSION_PERMISSIONS_KEY } from '@/shared/config/session-keys.js';

export const metadata = {
  title: 'Logistics · KT-XNK',
};

/**
 * `logistics:view` alone (`routeAccessRules`) only proves the visitor is
 * Logistics staff — it says nothing about which specific area they can
 * actually open, so this can't just redirect to `/logistics/contracts` for
 * everyone (`routeAccessRules` would 403 that for a `logistics:view`-only
 * visitor — `design.md` section 4 is explicit: never redirect into a route
 * the visitor isn't allowed to open). Instead: redirect straight to Hợp
 * đồng for the common case (`logistics:contracts:view`), fall back to the
 * one narrower area a `logistics:secret`-only visitor can reach (BOQ), or
 * show a plain landing message with no dead links when neither applies.
 */
export default async function LogisticsPage() {
  const cookieStore = await cookies();
  const permissions = parsePermissionsCookie(
    cookieStore.get(SESSION_PERMISSIONS_KEY)?.value,
  );

  if (permissions.includes('logistics:contracts:view')) {
    redirect('/logistics/contracts');
  }

  const hasSecretOnly = permissions.includes('logistics:secret');

  return (
    <PageContentShell isFullWidth>
      <LogisticsOverview hasSecretOnly={hasSecretOnly} />
    </PageContentShell>
  );
}
