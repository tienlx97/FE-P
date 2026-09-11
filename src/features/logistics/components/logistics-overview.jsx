import { Banner } from '@astryxdesign/core/Banner';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

import { RouteHubList } from '@/shared/components/route-hub-list.jsx';

/**
 * Landing page for the `logistics:view`-gated `/logistics` route, reached
 * only by a visitor `logistics/page.jsx` didn't already redirect past (no
 * `logistics:contracts:view`, so `/logistics/contracts` and everything
 * else under `routeAccessRules`' broad `logistics:contracts:view` rule
 * would 403) — task 4.1,
 * `openspec/changes/logistics-workspace-redesign/design.md` section 4.
 * `hasSecretOnly` covers the one narrower case: a visitor with
 * `logistics:secret` but not `logistics:contracts:view` can still open BOQ
 * directly (`routeAccessRules` checks BOQ's own, more specific rule first),
 * so that's offered instead of nothing. Neither case ever links to a route
 * `routeAccessRules` would then reject.
 * @param {{ hasSecretOnly?: boolean }} props
 */
export function LogisticsOverview({ hasSecretOnly = false }) {
  return (
    <VStack gap={4} hAlign="stretch">
      <VStack gap={1}>
        <Heading level={1}>Logistics</Heading>
        <Text color="secondary">
          Khu vực dành riêng cho bộ phận Logistics.
        </Text>
      </VStack>

      {hasSecretOnly ? (
        <RouteHubList
          items={[
            {
              title: 'BOQ',
              description: 'Giá vốn, báo giá và lợi nhuận theo hợp đồng.',
              href: '/logistics/boq',
            },
          ]}
        />
      ) : (
        <Banner
          status="info"
          title="Chưa có quyền truy cập nghiệp vụ cụ thể"
          description="Tài khoản của bạn hiện chỉ có quyền xem tổng quan Logistics. Liên hệ quản trị viên nếu cần quyền truy cập Hợp đồng, Shipment, Commission hoặc danh mục liên quan."
          container="card"
        />
      )}
    </VStack>
  );
}
