import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import { StackItem } from '@astryxdesign/core/Stack';
import { VStack } from '@astryxdesign/core/VStack';

import { CustomersList } from '@/features/logistics-contracts/index.js';
import { MetaThemeProvider } from '@/shared/components/custom/meta/theme-provider.jsx';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';

export const metadata = {
  title: 'Khách hàng · Kế toán · KT-XNK',
};

/**
 * Access is gated by `routeAccessRules` (`accounting:contracts:view`).
 * Kế toán and Logistics share one customer directory (BE-P
 * accounting-contracts task 1.7), so this is the Logistics list, linking to
 * `/accounting/customers/[id]`.
 */
export default function AccountingCustomersPage() {
  return (
    <PageContentShell isFullWidth fillHeight>
      <VStack gap={4} hAlign="stretch" height="100%">
        <Breadcrumbs>
          <BreadcrumbItem href="/accounting">Kế toán</BreadcrumbItem>
          <BreadcrumbItem isCurrent>Khách hàng</BreadcrumbItem>
        </Breadcrumbs>

        <StackItem size="fill">
          <MetaThemeProvider>
            <CustomersList basePath="/accounting/customers" />
          </MetaThemeProvider>
        </StackItem>
      </VStack>
    </PageContentShell>
  );
}
