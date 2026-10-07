'use client';

import { Avatar, AvatarStatusDot } from '@astryxdesign/core/Avatar';
import { AvatarGroup } from '@astryxdesign/core/AvatarGroup';
import { Badge } from '@astryxdesign/core/Badge';
import { Card } from '@astryxdesign/core/Card';
import { Citation } from '@astryxdesign/core/Citation';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { HStack } from '@astryxdesign/core/HStack';
import { Kbd } from '@astryxdesign/core/Kbd';
import { List, ListItem } from '@astryxdesign/core/List';
import { Pagination } from '@astryxdesign/core/Pagination';
import { SelectableCard } from '@astryxdesign/core/SelectableCard';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Timestamp } from '@astryxdesign/core/Timestamp';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

import { Table } from '@/shared/components/table.jsx';

import { ShowcaseSection } from '../showcase-section.jsx';

/** @type {('neutral' | 'info' | 'success' | 'warning' | 'error')[]} */
const SEMANTIC_BADGES = ['neutral', 'info', 'success', 'warning', 'error'];
/** @type {('blue' | 'cyan' | 'green' | 'orange' | 'pink' | 'purple' | 'red' | 'teal' | 'yellow')[]} */
const CATEGORY_BADGES = [
  'blue',
  'cyan',
  'green',
  'orange',
  'pink',
  'purple',
  'red',
  'teal',
  'yellow',
];
/** @type {('default' | 'muted' | 'transparent')[]} */
const CARD_VARIANTS = ['default', 'muted', 'transparent'];

/**
 * @typedef {Object} Shipment
 * @property {string} id
 * @property {string} route
 * @property {string} status
 * @property {number} containers
 */

/** @type {Shipment[]} */
const SHIPMENTS = [
  {
    id: 'KT-2026-014',
    route: 'Cát Lái → Rotterdam',
    status: 'Đang vận chuyển',
    containers: 3,
  },
  {
    id: 'KT-2026-015',
    route: 'Hải Phòng → Busan',
    status: 'Đã thông quan',
    containers: 1,
  },
  {
    id: 'KT-2026-016',
    route: 'Đà Nẵng → Tokyo',
    status: 'Chờ chứng từ',
    containers: 2,
  },
];

export function DataDisplaySection() {
  const [selectedCard, setSelectedCard] = useState('sea');
  const [page, setPage] = useState(1);

  return (
    <>
      <ShowcaseSection
        title="Badge"
        description="neutral/info/success/warning/error là màu trạng thái hệ thống (cố ý giữ mặc định Astryx). Các màu còn lại chỉ để phân loại/tag."
      >
        <VStack gap={3}>
          <HStack gap={2} wrap="wrap">
            {SEMANTIC_BADGES.map((variant) => (
              <Badge key={variant} label={variant} variant={variant} />
            ))}
          </HStack>
          <HStack gap={2} wrap="wrap">
            {CATEGORY_BADGES.map((variant) => (
              <Badge key={variant} label={variant} variant={variant} />
            ))}
          </HStack>
        </VStack>
      </ShowcaseSection>

      <ShowcaseSection title="Card / ClickableCard / SelectableCard">
        <VStack gap={4}>
          <HStack gap={3} wrap="wrap">
            {CARD_VARIANTS.map((variant) => (
              <Card key={variant} width={200} variant={variant}>
                <VStack gap={1}>
                  <Heading level={4}>{variant}</Heading>
                  <Text type="supporting" color="secondary">
                    variant=&quot;{variant}&quot;
                  </Text>
                </VStack>
              </Card>
            ))}
          </HStack>
          <HStack gap={3} wrap="wrap">
            <ClickableCard label="Xem chi tiết lô hàng" width={220}>
              <VStack gap={1}>
                <Heading level={4}>ClickableCard</Heading>
                <Text type="supporting" color="secondary">
                  Cả card là 1 vùng bấm được
                </Text>
              </VStack>
            </ClickableCard>
            <SelectableCard
              label="Vận chuyển đường biển"
              isSelected={selectedCard === 'sea'}
              onChange={() => setSelectedCard('sea')}
              width={200}
            >
              <Text type="label">Đường biển</Text>
            </SelectableCard>
            <SelectableCard
              label="Vận chuyển đường hàng không"
              isSelected={selectedCard === 'air'}
              onChange={() => setSelectedCard('air')}
              width={200}
            >
              <Text type="label">Đường hàng không</Text>
            </SelectableCard>
          </HStack>
        </VStack>
      </ShowcaseSection>

      <ShowcaseSection title="Avatar / AvatarGroup">
        <VStack gap={4}>
          <HStack gap={4} vAlign="center">
            <Avatar
              name="Lê Xuân Tiến"
              size="xl"
              status={<AvatarStatusDot variant="success" label="Online" />}
            />
            <Avatar name="Nguyễn Văn A" size="lg" />
            <Avatar
              name="Trần Thị B"
              size="md"
              status={<AvatarStatusDot variant="error" label="Bận" />}
            />
          </HStack>
          <AvatarGroup size="md">
            <Avatar name="Lê Xuân Tiến" />
            <Avatar name="Nguyễn Văn A" />
            <Avatar name="Trần Thị B" />
            <Avatar name="Phạm Văn C" />
          </AvatarGroup>
        </VStack>
      </ShowcaseSection>

      <ShowcaseSection
        title="Table"
        description="width mỗi cột dùng proportional()/pixel() — bỏ qua sẽ mất min-width, dễ vỡ trên mobile."
      >
        <Card width="100%" padding={0}>
          <Table
            data={SHIPMENTS}
            idKey="id"
            hasHover
            columns={[
              { key: 'id', header: 'Mã lô hàng', width: proportional(1) },
              { key: 'route', header: 'Tuyến', width: proportional(2) },
              { key: 'status', header: 'Trạng thái', width: proportional(1) },
              { key: 'containers', header: 'Container', width: pixel(100) },
            ]}
          />
        </Card>
      </ShowcaseSection>

      <ShowcaseSection title="List / Pagination">
        <VStack gap={4}>
          <List header="Lô hàng gần đây" hasDividers>
            {SHIPMENTS.map((s) => (
              <ListItem key={s.id} label={s.id} description={s.route} />
            ))}
          </List>
          <Pagination
            page={page}
            onChange={setPage}
            totalItems={60}
            pageSize={10}
          />
        </VStack>
      </ShowcaseSection>

      <ShowcaseSection title="Token / Timestamp / Citation / Kbd">
        <VStack gap={4}>
          <HStack gap={2} wrap="wrap" vAlign="center">
            <Token label="Đang xử lý" color="blue" />
            <Token label="Đã xoá" color="red" onRemove={() => {}} />
            <Token label="Ưu tiên cao" color="orange" />
          </HStack>
          <HStack gap={4} vAlign="center">
            <Timestamp
              value="2026-08-06T22:00:00Z"
              format="auto"
              color="primary"
            />
            <Timestamp
              value="2026-03-25T12:00:00Z"
              format="date_time"
              color="secondary"
            />
          </HStack>
          <Citation
            source={{
              title: 'Hải quan Việt Nam',
              url: 'https://www.customs.gov.vn',
            }}
            number={1}
            variant="label"
          />
          <Text type="body">
            Nhấn <Kbd keys="mod+k" /> để mở bảng lệnh nhanh.
          </Text>
        </VStack>
      </ShowcaseSection>
    </>
  );
}
