'use client';

import { MetadataList } from '@astryxdesign/core/MetadataList';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

import { UnderlinedMetadataListItem as MetadataListItem } from '@/shared/components/expandable-row-styles.jsx';

/** @param {number | null | undefined} value @param {string} [suffix] */
function orDashNumber(value, suffix = '') {
  if (value == null) return '—';
  return `${value.toLocaleString('en-US')}${suffix ? ` ${suffix}` : ''}`;
}

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/** @param {import('../types/index.js').ContractPrivateInfo} privateInfo */
export function isPrivateInfoEntirelyEmpty(privateInfo) {
  return [
    privateInfo.boqSentDate,
    privateInfo.containerCount,
    privateInfo.costPricePerContainer,
    privateInfo.quotedPricePerContainer,
    privateInfo.unitCostLabor,
    privateInfo.unitCostSandblasting,
    privateInfo.unitCostPainting,
    privateInfo.unitCostFactory,
    privateInfo.volumeSale,
    privateInfo.volumeMaterial,
    privateInfo.profit,
    privateInfo.totalAmountUsd,
    privateInfo.exchangeRateVnd,
  ].every((value) => value == null);
}

/**
 * Read-only summary of a Contract's "Thông tin private" — rendered on the
 * "Thông tin private" tab (only reachable when the caller has
 * `logistics:secret`, see `contract-form-dialog.jsx`). Mirrors
 * `ContractCommissionTab`: same field set as
 * `ContractPrivateInfoFields` in read-only mode, just a plain
 * `MetadataList` instead of a form.
 * @param {{ privateInfo: import('../types/index.js').ContractPrivateInfo }} props
 */
export function ContractPrivateInfoTab({ privateInfo }) {
  return (
    <VStack gap={4} hAlign="stretch">
      <MetadataList columns={3} label={{ position: 'top' }}>
        <MetadataListItem label="BOQ · Ngày gửi">
          {orDash(privateInfo.boqSentDate)}
        </MetadataListItem>
      </MetadataList>

      <MetadataList title="Logistics" columns={4} label={{ position: 'top' }}>
        <MetadataListItem label="Số cont">
          {orDashNumber(privateInfo.containerCount)}
        </MetadataListItem>
        <MetadataListItem label="Giá vốn">
          {orDashNumber(privateInfo.costPricePerContainer, 'VNĐ')}
        </MetadataListItem>
        <MetadataListItem label="Giá báo khách">
          {orDashNumber(privateInfo.quotedPricePerContainer, 'VNĐ')}
        </MetadataListItem>
        <MetadataListItem label="Tổng">
          {orDashNumber(privateInfo.logisticsTotal, 'VNĐ')}
        </MetadataListItem>
      </MetadataList>

      <MetadataList
        title="Đơn giá vốn"
        columns={4}
        label={{ position: 'top' }}
      >
        <MetadataListItem label="Nhân công">
          {orDashNumber(privateInfo.unitCostLabor, 'VNĐ')}
        </MetadataListItem>
        <MetadataListItem label="Phun bi">
          {orDashNumber(privateInfo.unitCostSandblasting, 'VNĐ')}
        </MetadataListItem>
        <MetadataListItem label="Sơn">
          {orDashNumber(privateInfo.unitCostPainting, 'VNĐ')}
        </MetadataListItem>
        <MetadataListItem label="Nhà máy">
          {orDashNumber(privateInfo.unitCostFactory, 'VNĐ')}
        </MetadataListItem>
      </MetadataList>

      <MetadataList title="Khối lượng" columns={3} label={{ position: 'top' }}>
        <MetadataListItem label="Sale">
          {orDashNumber(privateInfo.volumeSale)}
        </MetadataListItem>
        <MetadataListItem label="Vật tư">
          {orDashNumber(privateInfo.volumeMaterial)}
        </MetadataListItem>
        <MetadataListItem label="Tờ khai (tổng Shipment)">
          {orDashNumber(privateInfo.volumeDeclaration, 'kg')}
        </MetadataListItem>
      </MetadataList>

      <MetadataList columns={3} label={{ position: 'top' }}>
        <MetadataListItem label="Lợi nhuận">
          {orDashNumber(privateInfo.profit, 'VNĐ')}
        </MetadataListItem>
        <MetadataListItem label="Tổng tiền">
          {orDashNumber(privateInfo.totalAmountUsd, 'USD')}
        </MetadataListItem>
        <MetadataListItem label="Tỷ giá">
          {orDashNumber(privateInfo.exchangeRateVnd, 'VNĐ')}
        </MetadataListItem>
      </MetadataList>

      {privateInfo.extraFields.length > 0 ? (
        <MetadataList
          title="Trường tùy ý"
          columns={3}
          label={{ position: 'top' }}
        >
          {privateInfo.extraFields.map((field) => (
            <MetadataListItem key={field.key} label={field.key}>
              {field.value}
            </MetadataListItem>
          ))}
        </MetadataList>
      ) : null}

      {isPrivateInfoEntirelyEmpty(privateInfo) ? (
        <Text color="secondary">Chưa nhập Thông tin private nào.</Text>
      ) : null}
    </VStack>
  );
}
