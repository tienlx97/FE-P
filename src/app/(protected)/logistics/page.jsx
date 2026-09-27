import { cookies } from 'next/headers';

import { LogisticsOverview } from '@/features/logistics/index.js';
import { ShipmentOverviewSchedule } from '@/features/logistics-contracts/index.js';
import { parsePermissionsCookie } from '@/shared/api/jwt.js';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';
import { SESSION_PERMISSIONS_KEY } from '@/shared/config/session-keys.js';

export const metadata = {
  title: 'Logistics · KT-XNK',
};

/**
 * `logistics:view` alone (`routeAccessRules`) only proves the visitor is
 * Logistics staff — it says nothing about which specific area they can
 * actually open (`design.md` section 4: never link into a route the
 * visitor isn't allowed to open). A `logistics:contracts:view` visitor gets
 * the home schedule of every shipment in progress
 * (`add-logistics-home-schedule`); otherwise fall back to the one narrower
 * area a `logistics:secret`-only visitor can reach (BOQ), or a plain
 * landing message with no dead links when neither applies.
 */
export default async function LogisticsPage() {
  const cookieStore = await cookies();
  const permissions = parsePermissionsCookie(
    cookieStore.get(SESSION_PERMISSIONS_KEY)?.value,
  );

  if (permissions.includes('logistics:contracts:view')) {
    // Home = every shipment in progress on a schedule that fills the page.
    return (
      <PageContentShell isFullWidth fillHeight>
        <ShipmentOverviewSchedule />
      </PageContentShell>
    );
  }

  const hasSecretOnly = permissions.includes('logistics:secret');

  return (
    <PageContentShell isFullWidth>
      <LogisticsOverview hasSecretOnly={hasSecretOnly} />
    </PageContentShell>
  );
}
