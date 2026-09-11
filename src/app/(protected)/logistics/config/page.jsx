import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import { VStack } from '@astryxdesign/core/VStack';

import { PageContentShell } from '@/shared/components/page-content-shell.jsx';
import { RouteHubList } from '@/shared/components/route-hub-list.jsx';

export const metadata = {
  title: 'Cấu hình · Logistics · KT-XNK',
};

const ITEMS = [
  {
    title: 'Nước',
    description: 'Danh mục nước xuất khẩu dùng trong hợp đồng.',
    href: '/logistics/countries',
  },
  {
    title: 'Cảng / Nơi',
    description: 'Danh mục cảng, nơi xếp/dỡ hàng dùng trong hợp đồng.',
    href: '/logistics/places',
  },
];

/**
 * Access is gated by `routeAccessRules` (`logistics:contracts:view`),
 * enforced in middleware before this renders. Kept for backward
 * compatibility with existing bookmarks/links (task 4.1,
 * `openspec/changes/logistics-workspace-redesign/design.md` section 4) —
 * `sidebarLogistics.json` no longer links here; "Nước" and "Cảng / Nơi"
 * are now flat "Danh mục" sidebar entries pointing straight at their own
 * pages.
 */
export default function LogisticsConfigPage() {
  return (
    <PageContentShell isFullWidth>
      <VStack gap={4} hAlign="stretch">
        <Breadcrumbs>
          <BreadcrumbItem href="/logistics">Logistics</BreadcrumbItem>
          <BreadcrumbItem isCurrent>Cấu hình</BreadcrumbItem>
        </Breadcrumbs>

        <RouteHubList items={ITEMS} />
      </VStack>
    </PageContentShell>
  );
}
