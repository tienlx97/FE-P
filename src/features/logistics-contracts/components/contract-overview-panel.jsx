'use client';
import { Badge } from '@astryxdesign/core/Badge';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Link } from '@astryxdesign/core/Link';
import { MetadataList } from '@astryxdesign/core/MetadataList';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { CheckCircle2, Circle } from 'lucide-react';
import { useMemo } from 'react';

import { UnderlinedMetadataListItem as MetadataListItem } from '@/shared/components/expandable-row-styles.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { labelForContractAnnexType } from '../config/contract-annex-types.js';
import { formatMoney } from '../config/currencies.js';
import { labelForPaymentType } from '../config/payment-schedule-types.js';
import { useContractAnnexesQuery } from '../hooks/use-contract-annexes-query.js';
import { useContractBanksQuery } from '../hooks/use-contract-banks-query.js';
import { useCountriesQuery } from '../hooks/use-countries-query.js';
import { usePaymentSchedulesQuery } from '../hooks/use-payment-schedules-query.js';
import { useShipmentsQuery } from '../hooks/use-shipments-query.js';

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/**
 * A "KPI card": secondary caption on top, a bold value line, and an
 * optional small note line underneath — the shared shape for the 4 cards
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
 * One party block ("Bên bán"/"Bên mua") inside the "Đối tác" card — the
 * section label renders as a `Badge` per user request (2026-09-17). The
 * mockup this was based on also showed a country/flag next to it, but
 * neither `Buyer` nor `ContractSeller` has a country field (only
 * `Contract.countryId`, a single contract-level "Nước xuất khẩu" that
 * doesn't belong to one party) — substituted with the "Đã ký"/"Chưa ký"
 * signed status instead, since that data actually exists per party.
 * @param {{
 *   label: string,
 *   party: import('../types/index.js').Buyer | import('../types/index.js').ContractSeller,
 *   isSigned: boolean,
 * }} props
 */
function PartyBlock({ label, party, isSigned }) {
  return (
    <VStack gap={2} hAlign="stretch">
      <HStack hAlign="between" vAlign="center">
        <Badge label={label} variant="neutral" />
        <Badge
          label={isSigned ? 'Đã ký' : 'Chưa ký'}
          variant={isSigned ? 'success' : 'neutral'}
        />
      </HStack>
      <Text weight="semibold">{party.companyName}</Text>
      <MetadataList columns={1} label={{ position: 'top' }}>
        <MetadataListItem label="Đại diện">
          {orDash(party.representativeName)}
        </MetadataListItem>
        <MetadataListItem label="Chức vụ">
          {orDash(party.representativeTitle)}
        </MetadataListItem>
        <MetadataListItem label="Địa chỉ">
          {orDash(party.address)}
        </MetadataListItem>
      </MetadataList>
    </VStack>
  );
}

/**
 * "Đại lý nhận hàng (Consignee)"/"Bên nhận thông báo (Notify Party)"
 * block — both are `ContractPartyContact | null`, read-only (see that
 * type's doc comment: no form exists yet for editing either).
 * `extraFields` is the only place a phone/contact name could live today
 * (the type has no dedicated field for it) — rendered generically as
 * `key: value` lines rather than assuming any particular key exists.
 * @param {{ label: string, contact: import('../types/index.js').ContractPartyContact }} props
 */
function PartyContactBlock({ label, contact }) {
  return (
    <VStack gap={1} hAlign="stretch">
      <Badge label={label} variant="neutral" />
      <Text weight="semibold">{contact.name}</Text>
      {contact.address ? (
        <Text color="secondary">{contact.address}</Text>
      ) : null}
      {contact.extraFields.map((field) => (
        <Text key={field.key} color="secondary">
          {field.key}: {field.value}
        </Text>
      ))}
    </VStack>
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
 * Layout (per 2 follow-up mockups, 2026-09-17):
 * - Top row, 4 KPI cards (Incoterm dropped per the 2nd mockup — its
 *   fields moved into "Điều kiện giao hàng" below): Giá trị quyết toán /
 *   Đã thanh toán / Còn lại / Xuất hàng (HQ). "Quyết toán"
 *   (`contractValue` + annex adjustments) is the same computation
 *   `contracts-list.jsx`'s own "QUYẾT TOÁN" column and
 *   `ContractExpandedDetails`'s `contractGrandTotal` use, so all 3
 *   surfaces never disagree on what a contract "is really worth" after
 *   amendments.
 * - Second row, 3 responsive cards: Đối tác (seller/buyer/consignee/
 *   notify party) / Ngân hàng & Đợt thanh toán (bank details + a
 *   paid-vs-pending payment timeline + a Phụ lục preview linking to that
 *   tab) / Điều kiện giao hàng (Incoterm, places, category, shipment mix).
 * @param {{ contract: import('../types/index.js').Contract, onViewAllAnnexes?: () => void }} props
 */
export function ContractOverviewPanel({ contract, onViewAllAnnexes }) {
  const paymentSchedulesQuery = usePaymentSchedulesQuery(contract.id);
  const paymentSchedules = useMemo(
    () =>
      (paymentSchedulesQuery.data?.success
        ? paymentSchedulesQuery.data.schedules
        : []
      )
        .slice()
        .sort((a, b) => a.paymentNumber - b.paymentNumber),
    [paymentSchedulesQuery.data],
  );
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

  // One row per agreed `paymentTerms` entry: "paid" once a matching
  // `PaymentSchedule` has been recorded, "pending" otherwise. Both lists
  // are simply sequential — there is no explicit FK between a term and
  // the schedule that fulfills it (BE-kt-xnk assigns `paymentNumber`
  // sequentially in creation order, one schedule per term) — same
  // implicit assumption the rest of the app already relies on.
  const paymentRows = useMemo(() => {
    const rowCount = Math.max(
      paymentSchedules.length,
      contract.paymentTerms.length,
    );
    const rows = [];
    for (let index = 0; index < rowCount; index += 1) {
      const schedule = paymentSchedules[index];
      const term = contract.paymentTerms[index];
      if (schedule) {
        rows.push({
          key: schedule.id,
          orderNumber: index + 1,
          isPaid: true,
          typeLabel: labelForPaymentType(schedule.type),
          amount: schedule.amount,
          date: schedule.paymentDate,
          note: schedule.note,
        });
      } else if (term) {
        rows.push({
          key: term.id,
          orderNumber: index + 1,
          isPaid: false,
          typeLabel: term.paymentCondition,
          amount: (term.paymentRatioPercent / 100) * settlementValue,
          date: null,
          note: null,
        });
      }
    }
    return rows;
  }, [paymentSchedules, contract.paymentTerms, settlementValue]);
  const nextPendingRow = paymentRows.find((row) => !row.isPaid);

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
  const banks = useMemo(() => {
    const banksById = new Map(
      (banksQuery.data?.success ? banksQuery.data.banks : []).map((bank) => [
        bank.id,
        bank,
      ]),
    );
    return contract.bankIds
      .map((bankId) => banksById.get(bankId))
      .filter((bank) => bank != null);
  }, [banksQuery.data, contract.bankIds]);

  const countriesQuery = useCountriesQuery();
  const countryName = (
    countriesQuery.data?.success ? countriesQuery.data.countries : []
  ).find((country) => country.id === contract.countryId)?.name;

  return (
    <VStack gap={4} hAlign="stretch">
      <Grid columns={{ minWidth: 240, max: 4 }} gap={3}>
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
              : nextPendingRow
                ? `Đợt ${nextPendingRow.orderNumber} (${nextPendingRow.typeLabel})`
                : null
          }
        />

        <InfoCard
          caption={<Text color="secondary">XUẤT HÀNG (HQ)</Text>}
          value={formatMoney(exportedValue, contract.currency)}
          note={`${fclCount} FCL · ${lclCount} LCL — còn ${formatMoney(unexportedValue, contract.currency)}`}
        />
      </Grid>

      <Grid columns={{ minWidth: 320, max: 3 }} gap={3}>
        <Card>
          <VStack gap={3} hAlign="stretch">
            <Text weight="semibold">Đối tác</Text>
            <PartyBlock
              label="BÊN BÁN"
              party={contract.seller}
              isSigned={contract.sellerSigned}
            />
            <Divider />
            <PartyBlock
              label="BÊN MUA"
              party={contract.buyer}
              isSigned={contract.buyerSigned}
            />
            {contract.consignee ? (
              <>
                <Divider />
                <PartyContactBlock
                  label="ĐẠI LÝ NHẬN HÀNG (CONSIGNEE)"
                  contact={contract.consignee}
                />
              </>
            ) : null}
            {contract.notifyParty ? (
              <>
                <Divider />
                <PartyContactBlock
                  label="BÊN NHẬN THÔNG BÁO (NOTIFY PARTY)"
                  contact={contract.notifyParty}
                />
              </>
            ) : null}
          </VStack>
        </Card>

        <Card>
          <VStack gap={3} hAlign="stretch">
            <Text weight="semibold">Ngân hàng & Đợt thanh toán</Text>

            <VStack gap={2} hAlign="stretch">
              <Text color="secondary" weight="semibold">
                NGÂN HÀNG THỤ HƯỞNG
              </Text>
              {banks.length === 0 ? (
                <Text color="secondary">Chưa chọn ngân hàng</Text>
              ) : (
                banks.map((bank, index) => (
                  <VStack key={bank.id} gap={0.5} hAlign="stretch">
                    {index > 0 ? <Divider /> : null}
                    <Text weight="semibold">{bank.bankName}</Text>
                    <Text color="secondary">
                      Tài khoản: {orDash(bank.bankAccountNumber)}
                    </Text>
                    <Text color="secondary">
                      SWIFT: {orDash(bank.swiftCode)}
                    </Text>
                  </VStack>
                ))
              )}
            </VStack>

            <Divider />

            <VStack gap={2} hAlign="stretch">
              <Text color="secondary" weight="semibold">
                ĐỢT THANH TOÁN
              </Text>
              {paymentRows.length === 0 ? (
                <Text color="secondary">Chưa có đợt thanh toán nào.</Text>
              ) : (
                paymentRows.map((row) => (
                  <HStack key={row.key} hAlign="between" vAlign="start">
                    <HStack gap={2} vAlign="start">
                      <Icon
                        icon={row.isPaid ? CheckCircle2 : Circle}
                        size="sm"
                        color={row.isPaid ? 'success' : 'secondary'}
                      />
                      <VStack gap={0}>
                        <Text weight="semibold">
                          Đợt {row.orderNumber} · {row.typeLabel}
                        </Text>
                        <Text color="secondary">
                          {row.isPaid
                            ? `Đã nhận ${formatDisplayDate(row.date)}${row.note ? ` · ${row.note}` : ''}`
                            : 'Chưa thanh toán'}
                        </Text>
                      </VStack>
                    </HStack>
                    <Text weight="semibold">
                      {formatMoney(row.amount, contract.currency)}
                    </Text>
                  </HStack>
                ))
              )}
            </VStack>

            <Divider />

            <VStack gap={2} hAlign="stretch">
              <HStack hAlign="between" vAlign="center">
                <Text color="secondary" weight="semibold">
                  PHỤ LỤC
                </Text>
                {onViewAllAnnexes ? (
                  <Link onClick={onViewAllAnnexes}>Xem tất cả</Link>
                ) : null}
              </HStack>
              {annexes.length === 0 ? (
                <Text color="secondary">Chưa có phụ lục</Text>
              ) : (
                annexes.slice(0, 3).map((annex) => (
                  <HStack key={annex.id} hAlign="between">
                    <Text>
                      {annex.annexCode} ·{' '}
                      {labelForContractAnnexType(annex.type)}
                    </Text>
                    <Text weight="semibold">
                      {formatMoney(
                        annex.type === 'ValueChange' ? 0 : annex.amount,
                        contract.currency,
                      )}
                    </Text>
                  </HStack>
                ))
              )}
            </VStack>
          </VStack>
        </Card>

        <Card>
          <VStack gap={3} hAlign="stretch">
            <Text weight="semibold">Điều kiện giao hàng</Text>
            <MetadataList columns={1} label={{ position: 'top' }}>
              <MetadataListItem label="Incoterm">
                <Badge label={contract.incoterm} variant="neutral" />{' '}
                {contract.incotermYear}
              </MetadataListItem>
              <MetadataListItem label="Nước xuất khẩu">
                {orDash(countryName)}
              </MetadataListItem>
              <MetadataListItem label="Cảng xếp hàng">
                {orDash(contract.placeOfLoading)}
              </MetadataListItem>
              <MetadataListItem label="Cảng dỡ hàng">
                {orDash(contract.placeOfDischarge)}
              </MetadataListItem>
              <MetadataListItem label="Hạng mục">
                {orDash(contract.category)}
              </MetadataListItem>
              <MetadataListItem label="Số lô hàng">
                {shipments.length === 0
                  ? '0'
                  : `${shipments.length} (${fclCount} FCL · ${lclCount} LCL)`}
              </MetadataListItem>
              <MetadataListItem label="Ngày hoàn thành dự án">
                {contract.projectCompletionDate
                  ? formatDisplayDate(contract.projectCompletionDate)
                  : 'Chưa hoàn thành'}
              </MetadataListItem>
            </MetadataList>
          </VStack>
        </Card>
      </Grid>
    </VStack>
  );
}
