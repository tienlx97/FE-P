import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

import { FuelPriceUtility } from '@/features/utilities/index.js';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';

export const metadata = {
  title: 'Xăng dầu · Tiện ích · KT-XNK',
};

/** Access: `/logistics` rule (`logistics:view`) in `routeAccessRules`. */
export default function LogisticsFuelUtilityPage() {
  return (
    <PageContentShell>
      <VStack gap={6} hAlign="stretch">
        <VStack gap={1} hAlign="stretch">
          <Breadcrumbs>
            <BreadcrumbItem href="/logistics">Logistics</BreadcrumbItem>
            <BreadcrumbItem>Tiện ích</BreadcrumbItem>
            <BreadcrumbItem isCurrent>Xăng dầu</BreadcrumbItem>
          </Breadcrumbs>
          <Heading level={1}>Giá xăng dầu</Heading>
          <Text as="p" color="secondary">
            Giá bán lẻ xăng dầu trong nước qua từng kỳ điều hành.
          </Text>
        </VStack>
        <FuelPriceUtility />
      </VStack>
    </PageContentShell>
  );
}
