import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import { StackItem } from '@astryxdesign/core/Stack';
import { VStack } from '@astryxdesign/core/VStack';

import { ContractPrivateInfosList } from '@/features/logistics-contracts/index.js';
import { MetaThemeProvider } from '@/shared/components/custom/meta/theme-provider.jsx';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';

export const metadata = {
  title: 'BOQ · Logistics · KT-XNK',
};

/**
 * Access is gated by `routeAccessRules` (`logistics:secret`), enforced in
 * middleware before this renders — stricter than every other Logistics
 * route (`logistics:contracts:view`), same permission as the "Thông tin
 * private" tab, since a BOQ list row is the same permission-gated data.
 */
export default function LogisticsBoqPage() {
  return (
    <PageContentShell isFullWidth fillHeight>
      <VStack gap={4} hAlign="stretch" height="100%">
        <Breadcrumbs>
          <BreadcrumbItem href="/logistics">Logistics</BreadcrumbItem>
          <BreadcrumbItem isCurrent>BOQ</BreadcrumbItem>
        </Breadcrumbs>

        <StackItem size="fill">
          <MetaThemeProvider>
            <ContractPrivateInfosList />
          </MetaThemeProvider>
        </StackItem>
      </VStack>
    </PageContentShell>
  );
}
