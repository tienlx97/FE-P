import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { VStack } from '@astryxdesign/core/VStack';

import { PageContentShell } from '@/shared/components/page-content-shell.jsx';

export const metadata = {
  title: 'Xăng dầu · Tiện ích · KT-XNK',
};

/** Access: `/logistics` rule (`logistics:view`) in `routeAccessRules`. */
export default function LogisticsFuelUtilityPage() {
  return (
    <PageContentShell>
      <VStack gap={6} hAlign="stretch">
        <Breadcrumbs>
          <BreadcrumbItem href="/logistics">Logistics</BreadcrumbItem>
          <BreadcrumbItem>Tiện ích</BreadcrumbItem>
          <BreadcrumbItem isCurrent>Xăng dầu</BreadcrumbItem>
        </Breadcrumbs>
        <EmptyState
          headingLevel={1}
          title="Xăng dầu"
          description="Tiện ích này đang được xây dựng."
        />
      </VStack>
    </PageContentShell>
  );
}
