import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import { StackItem } from '@astryxdesign/core/Stack';
import { VStack } from '@astryxdesign/core/VStack';

import { AccountingContractsList } from '@/features/accounting-contracts/index.js';
import { MetaThemeProvider } from '@/shared/components/custom/meta/theme-provider.jsx';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';

export const metadata = {
  title: 'Hợp đồng · Kế toán · KT-XNK',
};

/** Access is gated by `routeAccessRules` (`accounting:contracts:view`). */
export default function AccountingContractsPage() {
  return (
    <PageContentShell isFullWidth fillHeight>
      <VStack gap={4} hAlign="stretch" height="100%">
        <Breadcrumbs>
          <BreadcrumbItem href="/accounting">Kế toán</BreadcrumbItem>
          <BreadcrumbItem isCurrent>Hợp đồng</BreadcrumbItem>
        </Breadcrumbs>

        <StackItem size="fill">
          <MetaThemeProvider>
            <AccountingContractsList />
          </MetaThemeProvider>
        </StackItem>
      </VStack>
    </PageContentShell>
  );
}
