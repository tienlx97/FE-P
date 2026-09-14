import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import { StackItem } from '@astryxdesign/core/Stack';
import { VStack } from '@astryxdesign/core/VStack';

import { UserList } from '@/features/admin-users/index.js';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';

export const metadata = {
  title: 'Người dùng · Quản trị · KT-XNK',
};

/**
 * No token is read or threaded down: client components call the app's own
 * `/api/backend` proxy, which attaches the bearer token from the HttpOnly
 * session cookie server-side (docs/security.md, H-4).
 */
export default function UsersListPage() {
  return (
    <PageContentShell fillHeight>
      <VStack gap={4} hAlign="stretch" height="100%">
        <Breadcrumbs>
          <BreadcrumbItem href="/admin">Quản trị</BreadcrumbItem>
          <BreadcrumbItem isCurrent>Người dùng</BreadcrumbItem>
        </Breadcrumbs>

        <StackItem size="fill">
          <UserList />
        </StackItem>
      </VStack>
    </PageContentShell>
  );
}
