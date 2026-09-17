'use client';
import { Badge } from '@astryxdesign/core/Badge';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { HStack } from '@astryxdesign/core/HStack';
import { MetadataList } from '@astryxdesign/core/MetadataList';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useMemo } from 'react';

import { UnderlinedMetadataListItem as MetadataListItem } from '@/shared/components/expandable-row-styles.jsx';

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
 * A "KPI card": secondary caption on top, a bold value line, and an
 * optional small note line underneath — the shared shape for all 5 cards
 * in `ContractOverviewPanel`'s top row.
 *
 * `valueClassName` is a plain (non-`xstyle`) class for the green/red
 * value-color override ("Xanh"/"đỏ" per user request, 2026-09-17) — a
 * StyleX `xstyle` override loses that fight: `Text`'s own built-in
 * `color` style compiles into a higher-priority `@layer` than a plain
 * app-level `stylex.create()` call does (`useCSSLayers: true`,
 * `postcss.config.js`), so the built-in "primary" color kept winning.
 * Same escape hatch `src/app/globals.css`'s `.astryx-button.destructive`
 * rule already documents for the identical class of bug — a plain
 * unlayered CSS rule always beats ANY layered rule for the same
 * property, regardless of specificity or layer order.
 * @param {{ caption: import('react').ReactNode, value: import('react').ReactNode, valueClassName?: string, note?: import('react').ReactNode, children?: import('react').ReactNode }} props
 */
function InfoCard({ caption, value, valueClassName, note, children }) {
  return (
    <Card>
      <VStack gap={1.5} hAlign="stretch">
        {caption}
        <Text weight="semibold" size="lg" className={valueClassName}>
          {value}
        </Text>
        {note ? <Text color="secondary">{note}</Text> : null}
        {children}
      </VStack>
    </Card>
  );
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
 *
 * Top row (5 KPI cards, per a follow-up mockup, 2026-09-17): Giá trị
 * quyết toán / Đã thanh toán / Còn lại / Xuất hàng (HQ) / Incoterm.
 * "Quyết toán" (`contractValue` + annex adjustments) is the same
 * computation `contracts-list.jsx`'s own "QUYẾT TOÁN" column and
 * `ContractExpandedDetails`'s `contractGrandTotal` use — kept identical
 * here so the 3 surfaces never disagree on what a contract "is really
 * worth" after amendments. `getContract(id)` (unlike `searchContracts`)
 * doesn't come back with a pre-computed `ExportedValue`/`SettlementValue`
 * (those are search-only fields, see `ContractsController.MapToResponse`),
 * so this recomputes them client-side from `Shipment`/`ContractAnnex`.
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

  const annexesQuery = useContractAnnexesQuery(contract.id);
  const annexes = annexesQuery.data?.success ? annexesQuery.data.annexes : [];
  // Same sign convention as `ContractExpandedDetails`'s `annexesTotal`:
  // `AmountIncrease` adds, `AmountDecrease` subtracts, `ValueChange` is
  // non-monetary (see `ContractAnnex.amount`'s doc comment) and never
  // affects the total.
  const annexesTotal = annexes.reduce((total, annex) => {
    if (annex.type === 'AmountIncrease') return total + annex.amount;
    if (annex.type === 'AmountDecrease') return total - annex.amount;
    return total;
  }, 0);
  const settlementValue = (contract.contractValue ?? 0) + annexesTotal;

  const remainingValue = Math.max(0, settlementValue - paidValue);
  const paidPercent =
    settlementValue > 0
      ? Math.min(100, Math.round((paidValue / settlementValue) * 100))
      : 0;

  // The agreed payment schedule (`paymentTerms`) has no explicit link to
  // which recorded `PaymentSchedule` fulfills it — both are simply
  // sequential (BE-kt-xnk assigns `paymentNumber` in creation order, one
  // schedule per term), so "the next due term" is inferred positionally:
  // the term at the same index as how many schedules exist so far.
  const nextTerm = contract.paymentTerms[paymentSchedules.length] ?? null;

  const shipmentsQuery = useShipmentsQuery(contract.id);
  const shipments = shipmentsQuery.data?.success
    ? shipmentsQuery.data.shipments
    : [];
  const fclCount = shipments.filter(
    (shipment) => shipment.type === 'FCL',
  ).length;
  const lclCount = shipments.filter(
    (shipment) => shipment.type === 'LCL',
  ).length;
  // Approximation: sums each Shipment's own `declarationValue` regardless
  // of its `declarationCurrency` — matches `contract.currency` in
  // practice, same assumption the header's "Xuất" CSV export makes.
  const exportedValue = shipments.reduce(
    (total, shipment) => total + shipment.declarationValue,
    0,
  );
  const unexportedValue = Math.max(0, settlementValue - exportedValue);

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
      <Grid columns={{ minWidth: 220, max: 5 }} gap={3}>
        <InfoCard
          caption={<Text color="secondary">GIÁ TRỊ QUYẾT TOÁN</Text>}
          value={formatMoney(settlementValue, contract.currency)}
          valueClassName="contract-overview-value-positive"
          note={
            annexes.length > 0
              ? `${annexes.length} phụ lục: ${annexesTotal >= 0 ? '+' : '-'}${formatMoney(Math.abs(annexesTotal), contract.currency)}`
              : 'Chưa có phụ lục'
          }
        />

        <InfoCard
          caption={
            <HStack hAlign="between" vAlign="center">
              <Text color="secondary">ĐÃ THANH TOÁN</Text>
              <Badge label={`${paidPercent}%`} variant="success" />
            </HStack>
          }
          value={formatMoney(paidValue, contract.currency)}
        >
          <ProgressBar
            value={paidPercent}
            label="Đã thanh toán"
            isLabelHidden
          />
        </InfoCard>

        <InfoCard
          caption={<Text color="secondary">CÒN LẠI</Text>}
          value={formatMoney(remainingValue, contract.currency)}
          valueClassName="contract-overview-value-negative"
          note={
            remainingValue === 0
              ? 'Đã thanh toán đủ'
              : nextTerm
                ? `Đợt ${paymentSchedules.length + 1} (${nextTerm.paymentRatioPercent}% · ${nextTerm.paymentCondition})`
                : null
          }
        />

        <InfoCard
          caption={<Text color="secondary">XUẤT HÀNG (HQ)</Text>}
          value={formatMoney(exportedValue, contract.currency)}
          note={`${fclCount} FCL · ${lclCount} LCL — còn ${formatMoney(unexportedValue, contract.currency)}`}
        />

        <InfoCard
          caption={
            <HStack hAlign="between" vAlign="center">
              <Text color="secondary">INCOTERM {contract.incotermYear}</Text>
              <Badge label={contract.incoterm} variant="neutral" />
            </HStack>
          }
          value={orDash(contract.placeOfLoading)}
          note={`→ ${orDash(contract.placeOfDischarge)}`}
        />
      </Grid>

      <Grid columns={isNarrow ? 1 : 2} gap={3}>
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
            <Text weight="semibold">Ngân hàng & lô hàng</Text>
            <MetadataList columns={1} label={{ position: 'top' }}>
              <MetadataListItem label="Ngân hàng thụ hưởng">
                {bankNames.length === 0 ? '—' : bankNames.join(', ')}
              </MetadataListItem>
              <MetadataListItem label="Số lô hàng">
                {shipments.length}
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
