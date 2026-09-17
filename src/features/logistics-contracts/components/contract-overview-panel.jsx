'use client';
import { Badge } from '@astryxdesign/core/Badge';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { MetadataList } from '@astryxdesign/core/MetadataList';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useMemo } from 'react';

import { UnderlinedMetadataListItem as MetadataListItem } from '@/shared/components/expandable-row-styles.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { formatMoney } from '../config/currencies.js';
import { useContractAnnexesQuery } from '../hooks/use-contract-annexes-query.js';
import { useContractBanksQuery } from '../hooks/use-contract-banks-query.js';
import { usePaymentSchedulesQuery } from '../hooks/use-payment-schedules-query.js';
import { useShipmentsQuery } from '../hooks/use-shipments-query.js';

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/**
 * "Tổng quan & Tiến độ" — the Contract detail page's first tab
 * (`openspec/changes/add-contract-detail-page/`), a read-only dashboard
 * built entirely from fields already on `Contract`/`PaymentSchedule`/
 * `ContractAnnex`/`Shipment`/`ContractBank` (per user's explicit choice,
 * 2026-09-17: only existing fields, no new BE work for bank-guarantee/
 * e-signature/audit-log/sailing-progress — those don't exist in the data
 * model). Reuses the same query hooks `ContractExpandedDetails` already
 * fires for "Thanh toán"/"Phụ lục"/"Liên quan", so no extra requests beyond
 * what those tabs need anyway once visited.
 * @param {{ contract: import('../types/index.js').Contract }} props
 */
export function ContractOverviewPanel({ contract }) {
  const isNarrow = useMediaQuery('(max-width: 640px)');

  const paymentSchedulesQuery = usePaymentSchedulesQuery(contract.id);
  const paymentSchedules = paymentSchedulesQuery.data?.success
    ? paymentSchedulesQuery.data.schedules
    : [];
  const paidValue = paymentSchedules.reduce(
    (total, schedule) => total + schedule.amount,
    0,
  );
  const remainingValue = Math.max(0, contract.contractValue - paidValue);
  const paidPercent =
    contract.contractValue > 0
      ? Math.min(100, Math.round((paidValue / contract.contractValue) * 100))
      : 0;
  const latestPaymentSchedule = [...paymentSchedules].sort((a, b) =>
    b.paymentDate.localeCompare(a.paymentDate),
  )[0];

  const annexesQuery = useContractAnnexesQuery(contract.id);
  const annexes = annexesQuery.data?.success ? annexesQuery.data.annexes : [];

  const shipmentsQuery = useShipmentsQuery(contract.id);
  const shipments = shipmentsQuery.data?.success
    ? shipmentsQuery.data.shipments
    : [];

  const banksQuery = useContractBanksQuery();
  const bankNames = useMemo(() => {
    const banksById = new Map(
      (banksQuery.data?.success ? banksQuery.data.banks : []).map((bank) => [
        bank.id,
        bank,
      ]),
    );
    return contract.bankIds
      .map((bankId) => banksById.get(bankId)?.bankName)
      .filter(Boolean);
  }, [banksQuery.data, contract.bankIds]);

  return (
    <VStack gap={4} hAlign="stretch">
      <Grid columns={isNarrow ? 1 : 3} gap={3}>
        <Card>
          <VStack gap={1}>
            <Text color="secondary">Tổng giá trị hợp đồng</Text>
            <Text weight="semibold" size="lg">
              {formatMoney(contract.contractValue, contract.currency)}
            </Text>
          </VStack>
        </Card>
        <Card>
          <VStack gap={1}>
            <Text color="secondary">Đã thu ({paidPercent}%)</Text>
            <Text weight="semibold" size="lg">
              {formatMoney(paidValue, contract.currency)}
            </Text>
          </VStack>
        </Card>
        <Card>
          <VStack gap={1}>
            <Text color="secondary">Còn phải thu</Text>
            <Text weight="semibold" size="lg">
              {formatMoney(remainingValue, contract.currency)}
            </Text>
          </VStack>
        </Card>
      </Grid>

      <ProgressBar value={paidPercent} label="Tiến độ thu tiền" hasValueLabel />

      <Grid columns={isNarrow ? 1 : 3} gap={3}>
        <Card>
          <VStack gap={3} hAlign="stretch">
            <Text weight="semibold">Các bên liên quan</Text>
            <MetadataList columns={1} label={{ position: 'top' }}>
              <MetadataListItem label="Bên bán">
                {contract.seller.companyName}
                {contract.sellerSigned ? (
                  <Badge label="Đã ký" variant="success" />
                ) : null}
              </MetadataListItem>
              <MetadataListItem label="Bên mua">
                {contract.buyer.companyName}
                {contract.buyerSigned ? (
                  <Badge label="Đã ký" variant="success" />
                ) : null}
              </MetadataListItem>
              {contract.consignee ? (
                <MetadataListItem label="Đại lý nhận hàng">
                  {contract.consignee.name}
                </MetadataListItem>
              ) : null}
            </MetadataList>
          </VStack>
        </Card>

        <Card>
          <VStack gap={3} hAlign="stretch">
            <Text weight="semibold">Vận chuyển & hàng hoá</Text>
            <MetadataList columns={1} label={{ position: 'top' }}>
              <MetadataListItem label="Incoterm">
                {contract.incoterm} {contract.incotermYear}
              </MetadataListItem>
              <MetadataListItem label="Nơi xếp / dỡ hàng">
                {orDash(contract.placeOfLoading)} →{' '}
                {orDash(contract.placeOfDischarge)}
              </MetadataListItem>
              <MetadataListItem label="Số lô hàng">
                {shipments.length}
              </MetadataListItem>
            </MetadataList>
          </VStack>
        </Card>

        <Card>
          <VStack gap={3} hAlign="stretch">
            <Text weight="semibold">Ngân hàng & thanh toán</Text>
            <MetadataList columns={1} label={{ position: 'top' }}>
              <MetadataListItem label="Ngân hàng thụ hưởng">
                {bankNames.length === 0 ? '—' : bankNames.join(', ')}
              </MetadataListItem>
              <MetadataListItem label="Đợt thanh toán gần nhất">
                {latestPaymentSchedule
                  ? `${formatMoney(latestPaymentSchedule.amount, contract.currency)} · ${formatDisplayDate(latestPaymentSchedule.paymentDate)}`
                  : '—'}
              </MetadataListItem>
              <MetadataListItem label="Phụ lục đang có">
                {annexes.length}
              </MetadataListItem>
            </MetadataList>
          </VStack>
        </Card>
      </Grid>
    </VStack>
  );
}
