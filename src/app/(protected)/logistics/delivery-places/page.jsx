import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import { StackItem } from '@astryxdesign/core/Stack';
import { VStack } from '@astryxdesign/core/VStack';

import { DeliveryPlacesList } from '@/features/logistics-contracts/index.js';
import { MetaThemeProvider } from '@/shared/components/custom/meta/theme-provider.jsx';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';

export const metadata = {
  title: 'Nơi giao hàng · Logistics · KT-XNK',
};

/**
 * Access is gated by `routeAccessRules` (`logistics:contracts:view`),
 * enforced in middleware before this renders.
 */
export default function LogisticsDeliveryPlacesPage() {
  return (
    <PageContentShell isFullWidth fillHeight>
      <VStack gap={4} hAlign="stretch" height="100%">
        <Breadcrumbs>
          <BreadcrumbItem href="/logistics">Logistics</BreadcrumbItem>
          <BreadcrumbItem isCurrent>Nơi giao hàng</BreadcrumbItem>
        </Breadcrumbs>

        <StackItem size="fill">
          <MetaThemeProvider>
            <DeliveryPlacesList />
          </MetaThemeProvider>
        </StackItem>
      </VStack>
    </PageContentShell>
  );
}
