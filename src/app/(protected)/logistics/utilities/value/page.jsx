import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import { VStack } from '@astryxdesign/core/VStack';

import { ValueUtility } from '@/features/utilities/index.js';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';

export const metadata = {
  title: 'Giá trị · Tiện ích · KT-XNK',
};

/** Access: `/logistics` rule (`logistics:view`) in `routeAccessRules`. */
export default function LogisticsValueUtilityPage() {
  return (
    <PageContentShell>
      <VStack gap={6} hAlign="stretch">
        <Breadcrumbs>
          <BreadcrumbItem href="/logistics">Logistics</BreadcrumbItem>
          <BreadcrumbItem>Tiện ích</BreadcrumbItem>
          <BreadcrumbItem isCurrent>Giá trị</BreadcrumbItem>
        </Breadcrumbs>
        <ValueUtility />
      </VStack>
    </PageContentShell>
  );
}
