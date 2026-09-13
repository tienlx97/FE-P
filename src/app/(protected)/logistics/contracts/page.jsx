import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import { VStack } from '@astryxdesign/core/VStack';

import { ContractsList } from '@/features/logistics-contracts/index.js';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';

export const metadata = {
  title: 'Hợp đồng · Logistics · KT-XNK',
};

/**
 * Access is gated by `routeAccessRules` (`logistics:contracts:view`),
 * enforced in middleware before this renders. The backend re-checks the
 * permission (branch-scoped) on every real endpoint call.
 */
export default function LogisticsContractsPage() {
  return (
    <PageContentShell isFullWidth>
      <VStack gap={4} hAlign="stretch">
        <Breadcrumbs>
          <BreadcrumbItem href="/logistics">Logistics</BreadcrumbItem>
          <BreadcrumbItem isCurrent>Hợp đồng</BreadcrumbItem>
        </Breadcrumbs>

        <ContractsList />
      </VStack>
    </PageContentShell>
  );
}
