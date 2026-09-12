'use client';

import { useMediaQuery } from '@astryxdesign/core/hooks';
import { MetadataList } from '@astryxdesign/core/MetadataList';
import { pixel, proportional, Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

import { UnderlinedMetadataListItem as MetadataListItem } from '@/shared/components/expandable-row-styles.jsx';

import { formatMoney } from '../config/currencies.js';

/** @param {string | number | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/**
 * The "Chi phí Logistics" table + per-category totals, factored out of
 * `ShipmentExpandedDetails` so `ContractFullViewPanel`'s stacked
 * info+VGM+costs layout (per user request, 2026-09-12) can reuse it —
 * mirrors `ShipmentInfoSection`/`ShipmentVgmSection`'s own factoring.
 * @param {{
 *   shipment: import('../types/index.js').Shipment,
 *   customersById: Map<string, import('../types/index.js').Customer>,
 *   costCategoriesById: Map<string, import('../types/index.js').ShipmentCostCategory>,
 * }} props
 */
export function ShipmentCostsSection({
  shipment,
  customersById,
  costCategoriesById,
}) {
  const isNarrow = useMediaQuery('(max-width: 640px)');

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').ShipmentCostLine & Record<string, unknown>>[]} */
  const costColumns = [
    {
      key: 'costCategoryId',
      header: 'Nhóm chi phí',
      width: pixel(320),
      renderCell: (cost) =>
        orDash(costCategoriesById.get(cost.costCategoryId)?.name),
    },
    {
      key: 'name',
      header: 'Tên khoản chi phí',
      width: proportional(1, { minWidth: 160 }),
      renderCell: (cost) => cost.name,
    },
    {
      key: 'amount',
      header: 'Số tiền',
      width: pixel(160),
      renderCell: (cost) => `${formatMoney(cost.amount)} đ`,
    },
    {
      key: 'note',
      header: 'Ghi chú',
      width: proportional(1),
      renderCell: (cost) => orDash(cost.note),
    },
    {
      key: 'providerCustomerId',
      header: 'Nhà cung cấp',
      width: proportional(1, { minWidth: 160 }),
      renderCell: (cost) =>
        orDash(
          cost.providerCustomerId
            ? customersById.get(cost.providerCustomerId)?.companyName
            : null,
        ),
    },
    {
      key: 'invoiceNumber',
      header: 'Số hoá đơn',
      width: pixel(160),
      renderCell: (cost) => orDash(cost.invoiceNumber),
    },
  ];

  return (
    <VStack gap={2} hAlign="stretch">
      <Text weight="semibold">Thông tin chi phí logistics</Text>

      {shipment.costs.length === 0 ? (
        <Text color="secondary">Chưa có khoản chi phí nào</Text>
      ) : (
        <>
          <Table
            columns={costColumns}
            data={shipment.costs}
            idKey="id"
            dividers="rows"
            density="compact"
          />
          {shipment.costTotalsByCategory.length > 0 ? (
            <MetadataList
              title={<Text weight="semibold">Tổng theo nhóm chi phí</Text>}
              columns={isNarrow ? 2 : 4}
              label={{ position: 'top' }}
            >
              {shipment.costTotalsByCategory.map((total) => (
                <MetadataListItem
                  key={total.costCategoryId}
                  label={total.costCategoryName}
                >
                  {formatMoney(total.totalAmount)} đ
                </MetadataListItem>
              ))}
            </MetadataList>
          ) : null}
        </>
      )}
    </VStack>
  );
}
