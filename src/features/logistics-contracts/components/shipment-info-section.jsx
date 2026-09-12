'use client';

import { useMediaQuery } from '@astryxdesign/core/hooks';
import { MetadataList } from '@astryxdesign/core/MetadataList';
import { Text } from '@astryxdesign/core/Text';

import { UnderlinedMetadataListItem as MetadataListItem } from '@/shared/components/expandable-row-styles.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { formatMoney } from '../config/currencies.js';
import { labelForPaymentType } from '../config/payment-schedule-types.js';
import { labelForShipmentQuantityUnit } from '../config/shipment-quantity-units.js';
import { labelForShipmentType } from '../config/shipment-types.js';

/** @param {string | number | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/**
 * The two "Thông tin lô hàng"/"Thông tin Book" `MetadataList`s, factored out
 * of `ShipmentExpandedDetails` so `ContractFullViewPanel`'s stacked
 * info+VGM+costs layout (per user request, 2026-09-12) can reuse the same
 * fields instead of duplicating them — mirrors how `ShipmentVgmSection` was
 * already factored out for the same reason.
 * @param {{
 *   shipment: import('../types/index.js').Shipment,
 *   supplierName: string,
 * }} props
 */
export function ShipmentInfoSection({ shipment, supplierName }) {
  const isNarrow = useMediaQuery('(max-width: 640px)');

  return (
    <>
      <MetadataList
        title={<Text weight="bold">Thông tin lô hàng</Text>}
        columns={isNarrow ? 2 : 4}
        label={{ position: 'top' }}
      >
        <MetadataListItem label="Tên lô hàng">{shipment.name}</MetadataListItem>
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
          {formatMoney(shipment.declarationValue, shipment.declarationCurrency)}
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
        <MetadataListItem label="ETD">{orDash(shipment.etd)}</MetadataListItem>
        <MetadataListItem label="ETA">{orDash(shipment.eta)}</MetadataListItem>
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
          {formatDisplayDate(shipment.coDeclarationDate)}
        </MetadataListItem>
        <MetadataListItem label="Ngày có C/O">
          {formatDisplayDate(shipment.coIssuedDate)}
        </MetadataListItem>
        <MetadataListItem label="Số tờ khai">
          {orDash(shipment.customsDeclarationNumber)}
        </MetadataListItem>
        <MetadataListItem label="Ngày Khai">
          {formatDisplayDate(shipment.customsDeclarationDate)}
        </MetadataListItem>
        <MetadataListItem label="Bị kiểm hoá">
          {shipment.customsInspected ? 'Có' : 'Không'}
        </MetadataListItem>
      </MetadataList>
    </>
  );
}
