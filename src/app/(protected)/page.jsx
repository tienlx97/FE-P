import { cookies } from 'next/headers';

import { LiveHome } from '@/features/home/index.js';
import { HomeOperations } from '@/features/logistics-contracts/index.js';
import { parsePermissionsCookie } from '@/shared/api/jwt.js';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';
import { SESSION_PERMISSIONS_KEY } from '@/shared/config/session-keys.js';
export const metadata = { title: 'Bản tin hôm nay · KT-XNK' };
export default async function HomePage() {
  const store = await cookies();
  const permissions = parsePermissionsCookie(
    store.get(SESSION_PERMISSIONS_KEY)?.value,
  );
  return (
    <PageContentShell>
      <LiveHome
        operations={
          permissions.includes('logistics:contracts:view') ? (
            <HomeOperations />
          ) : null
        }
      />
    </PageContentShell>
  );
}
