import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
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
        <VStack gap={1} hAlign="stretch">
          <Breadcrumbs>
            <BreadcrumbItem href="/logistics">Logistics</BreadcrumbItem>
            <BreadcrumbItem>Tiện ích</BreadcrumbItem>
            <BreadcrumbItem isCurrent>Giá trị</BreadcrumbItem>
          </Breadcrumbs>
          <Heading level={1}>Giá trị</Heading>
          <Text as="p" color="secondary">
            Đọc số tiền bằng chữ và chia giá trị theo đợt thanh toán.
          </Text>
        </VStack>
        <ValueUtility />
      </VStack>
    </PageContentShell>
  );
}
