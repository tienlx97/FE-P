'use client';

import { Button } from '@astryxdesign/core/Button';
import {
  MetadataList,
  MetadataListItem,
} from '@astryxdesign/core/MetadataList';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Info, ListChecks } from 'lucide-react';

import {
  MetaMetricsCard,
  MetaPill,
  MetaTableCard,
} from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { formatVnd } from '../config/money.js';

/** @param {string | null | undefined} iso */
function dateOrDash(iso) {
  return iso ? formatDisplayDate(iso) : '—';
}

/**
 * "Tổng quan" tab: the five value KPI cards, then the contract's own facts.
 * @param {{
 *   detail: import('../types/index.js').AccountingContractDetail,
 *   metrics: ReturnType<typeof import('../config/contract-view.js').contractMetrics>,
 *   onOpenTab: (tab: 'installments') => void,
 * }} props
 */
export function ContractOverviewPanel({ detail, metrics, onOpenTab }) {
  const contract = detail.contract;

  return (
    <VStack gap={5} hAlign="stretch">
      <MetaMetricsCard
        title="GIÁ TRỊ & TIẾN ĐỘ HỢP ĐỒNG"
        metrics={[
          metrics.settlement,
          metrics.invoiced,
          metrics.paid,
          metrics.unpaid,
        ]}
        maxColumns={4}
      />

      <MetaTableCard
        icon={Info}
        title="Thông tin hợp đồng"
        isBodyPadded
        actions={
          <Button
            label="Xem đợt thanh toán"
            variant="secondary"
            size="sm"
            icon={<ListChecks size={16} />}
            onClick={() => onOpenTab('installments')}
          />
        }
      >
        <MetadataList columns={4} label={{ position: 'top' }}>
          <MetadataListItem label="Số hợp đồng">
            <Text weight="semibold">{contract.contractNumber}</Text>
          </MetadataListItem>
          <MetadataListItem label="Mã công trình">
            {contract.projectCode}
          </MetadataListItem>
          <MetadataListItem label="Tên dự án">
            {contract.projectName}
          </MetadataListItem>
          <MetadataListItem label="Khách hàng">
            {contract.customerName ?? '—'}
          </MetadataListItem>
          <MetadataListItem label="Nguồn">
            {contract.sourceName ?? '—'}
          </MetadataListItem>
          <MetadataListItem label="Ngày ký">
            {dateOrDash(contract.signedDate)}
          </MetadataListItem>
          <MetadataListItem label="Ngày tới hạn thanh toán">
            {dateOrDash(contract.paymentDueDate)}
          </MetadataListItem>
          <MetadataListItem label="Số ngày quá hạn">
            {contract.overdueDays ? (
              <MetaPill
                label={`${contract.overdueDays} ngày`}
                tone="danger"
                hasDot
              />
            ) : (
              '—'
            )}
          </MetadataListItem>
          <MetadataListItem label="Giá trị HĐ (trước thuế)">
            {formatVnd(contract.valueBeforeTax)}
          </MetadataListItem>
          <MetadataListItem label="Thuế">
            {contract.taxRatePercent}%
          </MetadataListItem>
          <MetadataListItem label="Giá trị HĐ (sau thuế)">
            {formatVnd(contract.valueAfterTax)}
          </MetadataListItem>
          <MetadataListItem label="Còn phải xuất hoá đơn">
            {formatVnd(contract.remainingToInvoice)}
          </MetadataListItem>
          <MetadataListItem label="Ghi chú">
            {contract.note ?? '—'}
          </MetadataListItem>
        </MetadataList>
      </MetaTableCard>
    </VStack>
  );
}
