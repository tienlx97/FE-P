'use client';

import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { MetadataList } from '@astryxdesign/core/MetadataList';
import { pixel, proportional, Table } from '@astryxdesign/core/Table';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

import {
  expandableRowStyles,
  UnderlinedMetadataListItem as MetadataListItem,
} from '@/shared/components/expandable-row-styles.jsx';

import { formatMoney } from '../config/currencies.js';
import { labelForPaymentType } from '../config/payment-schedule-types.js';
import { labelForShipmentQuantityUnit } from '../config/shipment-quantity-units.js';
import { labelForShipmentType } from '../config/shipment-types.js';
import { ShipmentVgmSection } from './shipment-vgm-section.jsx';

// Only the legacy nested contract panel owns a bounded scroll region.
const EXPANDED_DETAILS_CONTENT_HEIGHT = 480;

/** @param {string | number | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/**
 * Shipment details shared by the legacy nested contract panel and fullscreen
 * workspace. A controlled tab delegates navigation/scrolling to the dialog.
 * @param {{
 *   activeTab?: string,
 *   contractId: string,
 *   shipment: import('../types/index.js').Shipment,
 *   supplierName: string,
 *   customersById: Map<string, import('../types/index.js').Customer>,
 *   costCategoriesById: Map<string, import('../types/index.js').ShipmentCostCategory>,
 *   onAddVgm: () => void,
 *   onEditVgm: (vgm: import('../types/index.js').ShipmentVgm) => void,
 *   onEdit?: () => void,
 * }} props
 */
export function ShipmentExpandedDetails({
  activeTab: controlledTab,
  contractId,
  shipment,
  supplierName,
  customersById,
  costCategoriesById,
  onAddVgm,
  onEditVgm,
  onEdit,
}) {
  const [localTab, setActiveTab] = useState('info');
  const activeTab = controlledTab ?? localTab;
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
  ];

  return (
    <VStack
      gap={3}
      hAlign="stretch"
      xstyle={!controlledTab && expandableRowStyles.expandedPanel}
    >
      {!controlledTab ? (
        <TabList value={activeTab} onChange={setActiveTab} hasDivider>
          <Tab value="info" label="Thông tin" />
          <Tab value="vgm" label="VGM" />
          <Tab value="costs" label="Chi phí Logistics" />
        </TabList>
      ) : null}

      <VStack
        gap={4}
        hAlign="stretch"
        height={controlledTab ? undefined : EXPANDED_DETAILS_CONTENT_HEIGHT}
        isScrollable={!controlledTab}
      >
        {activeTab === 'info' ? (
          <>
            <MetadataList
              title={<Text weight="bold">Thông tin lô hàng</Text>}
              columns={isNarrow ? 2 : 4}
              label={{ position: 'top' }}
            >
              <MetadataListItem label="Tên lô hàng">
                {shipment.name}
              </MetadataListItem>
              <MetadataListItem label="Loại hình">
                {labelForShipmentType(shipment.type)}
              </MetadataListItem>
              <MetadataListItem label="Điều kiện thanh toán">
                {labelForPaymentType(shipment.paymentCondition)}
              </MetadataListItem>
              <MetadataListItem label="Số lượng">
                {shipment.quantityAmount}{' '}
                {labelForShipmentQuantityUnit(shipment.quantityUnit)}
              </MetadataListItem>
              <MetadataListItem label="Giá trị invoice">
                {formatMoney(shipment.invoiceValue, shipment.invoiceCurrency)}
              </MetadataListItem>
              <MetadataListItem label="Giá trị tờ khai">
                {formatMoney(
                  shipment.declarationValue,
                  shipment.declarationCurrency,
                )}
              </MetadataListItem>
              <MetadataListItem label="Tỷ giá tờ khai">
                {shipment.declarationExchangeRate}
              </MetadataListItem>
              <MetadataListItem label="Khối lượng tờ khai">
                {shipment.declarationWeightKg} kg
              </MetadataListItem>
            </MetadataList>

            <MetadataList
              title={<Text weight="bold">Thông tin Book</Text>}
              columns={isNarrow ? 2 : 4}
              label={{ position: 'top' }}
            >
              <MetadataListItem label="Forwarder">
                {orDash(supplierName)}
              </MetadataListItem>
              <MetadataListItem label="Số booking">
                {shipment.bookingNumber}
              </MetadataListItem>
              <MetadataListItem label="Số B/L">
                {orDash(shipment.billOfLadingNumber)}
              </MetadataListItem>
              <MetadataListItem label="Line tàu">
                {orDash(shipment.shippingLine)}
              </MetadataListItem>
              <MetadataListItem label="Tên tàu">
                {orDash(shipment.vesselName)}
              </MetadataListItem>
              <MetadataListItem label="ETD">
                {orDash(shipment.etd)}
              </MetadataListItem>
              <MetadataListItem label="ETA">
                {orDash(shipment.eta)}
              </MetadataListItem>
              <MetadataListItem label="Cảng/nơi xếp hàng">
                {orDash(shipment.placeOfLoading)}
              </MetadataListItem>
              <MetadataListItem label="Cảng/nơi đến">
                {orDash(shipment.placeOfDischarge)}
              </MetadataListItem>
              <MetadataListItem label="Mã C/O">
                {orDash(shipment.coNumber)}
              </MetadataListItem>
              <MetadataListItem label="Ngày khai C/O">
                {orDash(shipment.coDeclarationDate)}
              </MetadataListItem>
              <MetadataListItem label="Ngày có C/O">
                {orDash(shipment.coIssuedDate)}
              </MetadataListItem>
            </MetadataList>
          </>
        ) : null}

        {activeTab === 'vgm' ? (
          <ShipmentVgmSection
            contractId={contractId}
            shipmentId={shipment.id}
            customersById={customersById}
            onAddVgm={onAddVgm}
            onEditVgm={onEditVgm}
          />
        ) : null}

        {activeTab === 'costs' ? (
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
                    title={
                      <Text weight="semibold">Tổng theo nhóm chi phí</Text>
                    }
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
        ) : null}
      </VStack>

      {onEdit ? (
        <>
          <Divider />
          <HStack hAlign="end">
            <Button
              label="Sửa Shipment"
              variant="secondary"
              size="sm"
              icon={<Icon icon={Pencil} />}
              onClick={onEdit}
            />
          </HStack>
        </>
      ) : null}
    </VStack>
  );
}
