import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import { VStack } from '@astryxdesign/core/VStack';

import { BackupList } from '@/features/admin-backups/index.js';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';

export const metadata = {
  title: 'Sao lưu & khôi phục · Quản trị · KT-XNK',
};

/**
 * No token is read or threaded down: client components call the app's own
 * `/api/backend` proxy, which attaches the bearer token from the HttpOnly
 * session cookie server-side (docs/security.md, H-4).
 */
export default function BackupsPage() {
  return (
    <PageContentShell>
      <VStack gap={4} hAlign="stretch">
        <Breadcrumbs>
          <BreadcrumbItem href="/admin">Quản trị</BreadcrumbItem>
          <BreadcrumbItem isCurrent>Sao lưu &amp; khôi phục</BreadcrumbItem>
        </Breadcrumbs>

        <BackupList />
      </VStack>
    </PageContentShell>
  );
}
