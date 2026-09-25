import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import { StackItem } from '@astryxdesign/core/Stack';
import { VStack } from '@astryxdesign/core/VStack';

import { PortsList } from '@/features/logistics-contracts/index.js';
import { MetaThemeProvider } from '@/shared/components/custom/meta/theme-provider.jsx';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';

export const metadata = {
  title: 'Cảng đến · Logistics · KT-XNK',
};

/**
 * Access is gated by `routeAccessRules` (`logistics:contracts:view`),
 * enforced in middleware before this renders.
 */
export default function LogisticsPortsPage() {
  return (
    <PageContentShell isFullWidth fillHeight>
      <VStack gap={4} hAlign="stretch" height="100%">
        <Breadcrumbs>
          <BreadcrumbItem href="/logistics">Logistics</BreadcrumbItem>
          <BreadcrumbItem isCurrent>Cảng đến</BreadcrumbItem>
        </Breadcrumbs>

        <StackItem size="fill">
          <MetaThemeProvider>
            <PortsList />
          </MetaThemeProvider>
        </StackItem>
      </VStack>
    </PageContentShell>
  );
}
