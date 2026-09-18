'use client';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import {
  pixel,
  proportional,
  Table,
  useTableRowExpansion,
} from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Pencil, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { createRowExpansionInteractionPlugin } from '@/shared/components/expandable-row-styles.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';
import { useSessionPermissions } from '@/shared/hooks/use-session-permissions.js';

import { formatMoney } from '../config/currencies.js';
import { labelForPaymentType } from '../config/payment-schedule-types.js';
import { reasonContractIneligibleForShipment } from '../config/shipment-contract-eligibility.js';
import { labelForShipmentQuantityUnit } from '../config/shipment-quantity-units.js';
import { labelForShipmentStatus } from '../config/shipment-status.js';
import { labelForShipmentType } from '../config/shipment-types.js';
import { useCommissionQuery } from '../hooks/use-commission-query.js';
import { useContractAnnexesQuery } from '../hooks/use-contract-annexes-query.js';
import { useContractPrivateInfoQuery } from '../hooks/use-contract-private-info-query.js';
import { usePaymentSchedulesQuery } from '../hooks/use-payment-schedules-query.js';
import { useShipmentsQuery } from '../hooks/use-shipments-query.js';
import { ContractAnnexesPanel } from './contract-annexes-panel.jsx';
import { ContractFullViewPanel } from './contract-full-view-panel.jsx';
import { isPrivateInfoEntirelyEmpty } from './contract-private-info-fields.jsx';
import { ShipmentExpandedDetails } from './shipment-expanded-details.jsx';

/** @typedef {'profile' | 'annexes' | 'payments' | 'related' | 'fullView'} ExpandedTab */

const LOGISTICS_SECRET_PERMISSION = 'logistics:secret';

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

// No backend `status` field exists yet on `PaymentSchedule` — derived
// straight from `paymentDate` vs. today, same "đã thu / chưa đến hạn"
// split the Figma mockup's status column implies.
/** @param {string} paymentDate ISO date (YYYY-MM-DD) */
function isPaymentSchedulePaid(paymentDate) {
  return new Date(paymentDate).getTime() <= Date.now();
}

const kpiStyles = stylex.create({
  card: {
    borderRadius: 'var(--radius-outer)',
  },
  valueSuccess: {
    color: 'var(--color-success)',
  },
  valueAccent: {
    color: 'var(--color-accent)',
  },
});

/**
 * Renders the "Phụ lục"/"Thanh toán"/"Liên quan"/"Xem đầy đủ" tab bodies for the
 * Contract workspace (`ContractFormDialog`'s "Hồ sơ" tab is its own
 * `<form>`, not this component — see that file). Task 3.1
 * (`openspec/changes/logistics-workspace-redesign/design.md` section 3)
 * narrowed this from five tabs down to four: Commission and "Thông tin
 * private" (BOQ) no longer embed their full editors here — "Liên quan"
 * shows a summary card for each with a button that opens the same
 * standalone dialog `commissions-list.jsx`/`contract-private-infos-list.jsx`
 * use (`onOpenCommission`/`onOpenBoq`, owned by `ContractsList` per
 * ADR-0004 — Selector portals stay inside their dialog layers). The BOQ
 * card only renders for a caller with `logistics:secret`, gating both the
 * query and the summary the same way the old tab did — never just the UI.
 * @param {object} props
 * @param {import('../types/index.js').Contract} props.contract
 * @param {Map<string, import('../types/index.js').Customer>} props.customersById
 * @param {Map<string, import('../types/index.js').ShipmentCostCategory>} props.costCategoriesById
 * @param {ExpandedTab} props.activeTab
 * @param {() => void} props.onAddAnnex
 * @param {(annex: import('../types/index.js').ContractAnnex) => void} props.onEditAnnex
 * @param {() => void} props.onAddPaymentSchedule
 * @param {(schedule: import('../types/index.js').PaymentSchedule) => void} props.onEditPaymentSchedule
 * @param {() => void} props.onAddShipment
 * @param {(shipment: import('../types/index.js').Shipment) => void} props.onEditShipment
 * @param {(payload: { contractId: string, shipmentId: string }) => void} props.onAddVgm
 * @param {(payload: { contractId: string, shipmentId: string, vgm: import('../types/index.js').ShipmentVgm }) => void} props.onEditVgm
 * @param {(commission: (import('../types/index.js').Commission & { contractNumber?: string, projectName?: string }) | null) => void} props.onOpenCommission
 * @param {() => void} props.onOpenBoq
 */
export function ContractExpandedDetails({
  contract,
  customersById,
  costCategoriesById,
  activeTab,
  onAddAnnex,
  onEditAnnex,
  onAddPaymentSchedule,
  onEditPaymentSchedule,
  onAddShipment,
  onEditShipment,
  onAddVgm,
  onEditVgm,
  onOpenCommission,
  onOpenBoq,
}) {
  const [expandedShipmentId, setExpandedShipmentId] = useState(
    /** @type {string | null} */ (null),
  );

  // Gates the query itself, not just the BOQ card — a caller who can't see
  // it shouldn't fire a request that only ever 403s.
  const hasLogisticsSecret = useSessionPermissions().includes(
    LOGISTICS_SECRET_PERMISSION,
  );

  const isFullySigned = contract.sellerSigned && contract.buyerSigned;
  const shipmentIneligibleReason = reasonContractIneligibleForShipment(contract);
  const paymentSchedulesQuery = usePaymentSchedulesQuery(contract.id);
  const paymentSchedules = paymentSchedulesQuery.data?.success
    ? paymentSchedulesQuery.data.schedules
    : [];

  const paymentSchedulesTotal = paymentSchedules.reduce(
    (total, schedule) => total + schedule.amount,
    0,
  );
  const paymentSchedulesPaidTotal = paymentSchedules.reduce(
    (total, schedule) =>
      isPaymentSchedulePaid(schedule.paymentDate) ? total + schedule.amount : total,
    0,
  );

  const annexesQuery = useContractAnnexesQuery(contract.id);
  const annexes = annexesQuery.data?.success ? annexesQuery.data.annexes : [];
  const annexesTotal = annexes.reduce((total, annex) => {
    if (annex.type === 'AmountIncrease') return total + annex.amount;
    if (annex.type === 'AmountDecrease') return total - annex.amount;
    return total;
  }, 0);
  const contractGrandTotal = (contract.contractValue ?? 0) + annexesTotal;

  const shipmentsQuery = useShipmentsQuery(contract.id);
  const shipments = shipmentsQuery.data?.success
    ? shipmentsQuery.data.shipments
    : [];

  const commissionQuery = useCommissionQuery(contract.id);
  const commissionResult = commissionQuery.data;
  const commission =
    commissionResult?.success && commissionResult.exists
      ? commissionResult.commission
      : null;

  const privateInfoQuery = useContractPrivateInfoQuery(
    hasLogisticsSecret ? contract.id : undefined,
  );
  const privateInfo = privateInfoQuery.data?.success
    ? privateInfoQuery.data.privateInfo
    : null;

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').PaymentSchedule & Record<string, unknown>>[]} */
  const paymentScheduleColumns = [
    {
      key: 'paymentCode',
      header: 'Mã đợt',
      width: pixel(100),
      renderCell: (schedule) => schedule.paymentCode,
    },
    {
      key: 'amount',
      header: 'Số tiền',
      width: pixel(140),
      renderCell: (schedule) => formatMoney(schedule.amount, contract.currency),
    },
    {
      key: 'type',
      header: 'Hình thức / Điều kiện',
      width: proportional(1),
      renderCell: (schedule) => labelForPaymentType(schedule.type),
    },
    {
      key: 'paymentDate',
      header: 'Ngày thanh toán',
      width: pixel(130),
      renderCell: (schedule) => formatDisplayDate(schedule.paymentDate),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: pixel(130),
      renderCell: (schedule) =>
        isPaymentSchedulePaid(schedule.paymentDate) ? (
          <Badge
            icon={<StatusDot variant="success" label="Đã thu" />}
            label="Đã thu"
            variant="success"
          />
        ) : (
          <Badge label="Chưa đến hạn" variant="neutral" />
        ),
    },
    {
      key: 'note',
      header: 'Ghi chú',
      width: proportional(1),
      renderCell: (schedule) => orDash(schedule.note),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: pixel(90),
      align: 'end',
      renderCell: (schedule) => (
        <IconButton
          label={`Sửa ${schedule.paymentCode}`}
          tooltip="Sửa đợt thanh toán"
          icon={<Icon icon={Pencil} size="sm" />}
          variant="ghost"
          size="sm"
          onClick={() => onEditPaymentSchedule(schedule)}
        />
      ),
    },
  ];

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').Shipment & Record<string, unknown>>[]} */
  const shipmentColumns = [
    {
      key: 'shipmentCode',
      header: 'Mã',
      width: pixel(160),
      renderCell: (shipment) => shipment.shipmentCode,
    },
    {
      key: 'name',
      header: 'Tên lô hàng',
      width: proportional(1.2),
      renderCell: (shipment) => shipment.name,
    },
    {
      key: 'type',
      header: 'Loại hình',
      width: pixel(90),
      renderCell: (shipment) => labelForShipmentType(shipment.type),
    },
    {
      key: 'status',
      header: 'Tình trạng',
      width: pixel(150),
      renderCell: (shipment) => labelForShipmentStatus(shipment.status),
    },
    {
      key: 'quantity',
      header: 'Số lượng',
      width: pixel(110),
      renderCell: (shipment) =>
        `${shipment.quantityAmount} ${labelForShipmentQuantityUnit(shipment.quantityUnit)}`,
    },
    {
      key: 'bookingNumber',
      header: 'Booking',
      width: pixel(140),
      renderCell: (shipment) => shipment.bookingNumber,
    },
    {
      key: 'supplier',
      header: 'Forwarder',
      width: proportional(1.2),
      renderCell: (shipment) =>
        orDash(customersById.get(shipment.supplierCustomerId)?.companyName),
    },
    {
      key: 'invoiceValue',
      header: 'Giá trị invoice',
      width: pixel(140),
      align: 'end',
      renderCell: (shipment) =>
        formatMoney(shipment.invoiceValue, shipment.invoiceCurrency),
    },
    {
      key: 'actions',
      header: '',
      width: pixel(60),
      renderCell: (shipment) => (
        <IconButton
          label={`Sửa ${shipment.shipmentCode}`}
          tooltip="Sửa Shipment"
          icon={<Icon icon={Pencil} size="sm" />}
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onEditShipment(shipment);
          }}
        />
      ),
    },
  ];

  const shipmentExpandedKeys = useMemo(
    () => new Set(expandedShipmentId ? [expandedShipmentId] : []),
    [expandedShipmentId],
  );
  const shipmentExpansionPlugin =
    /** @type {import('@astryxdesign/core/Table').TablePlugin<import('../types/index.js').Shipment & Record<string, unknown>>} */ (
      useTableRowExpansion({
        expandedKeys: shipmentExpandedKeys,
        onToggle: (shipmentId) =>
          setExpandedShipmentId((current) =>
            current === shipmentId ? null : shipmentId,
          ),
        getRowKey: (shipment) => shipment.id,
        renderExpanded: (shipment) => (
          <ShipmentExpandedDetails
            contractId={contract.id}
            shipment={shipment}
            supplierName={
              customersById.get(shipment.supplierCustomerId)?.companyName ?? ''
            }
            customersById={customersById}
            costCategoriesById={costCategoriesById}
            onAddVgm={() =>
              onAddVgm({ contractId: contract.id, shipmentId: shipment.id })
            }
            onEditVgm={(vgm) =>
              onEditVgm({
                contractId: contract.id,
                shipmentId: shipment.id,
                vgm,
              })
            }
          />
        ),
      })
    );
  const shipmentRowInteractionPlugin = useMemo(
    /** @returns {import('@astryxdesign/core/Table').TablePlugin<import('../types/index.js').Shipment & Record<string, unknown>>} */
    () =>
      createRowExpansionInteractionPlugin({
        expandedId: expandedShipmentId,
        onToggle: (shipmentId) =>
          setExpandedShipmentId((current) =>
            current === shipmentId ? null : shipmentId,
          ),
      }),
    [expandedShipmentId],
  );

  return (
    <VStack gap={4} hAlign="stretch">
      {activeTab === 'annexes' && (
        <ContractAnnexesPanel
          contract={contract}
          onAddAnnex={onAddAnnex}
          onEditAnnex={onEditAnnex}
        />
      )}

      {activeTab === 'payments' && (
        <VStack gap={4} hAlign="stretch">
          {/* 3 KPI cards (Figma "3 Thẻ KPI lớn") — tổng giá trị quyết
              toán / đã thực thu / còn phải thu, all derived from the same
              `contractGrandTotal` + `paymentSchedulesPaidTotal` the table
              footer below uses, so the header and footer numbers can
              never disagree. */}
          <Grid columns={{ minWidth: 260, max: 3, repeat: 'fill' }} gap={3}>
            <Card padding={4} xstyle={kpiStyles.card}>
              <VStack gap={2} hAlign="stretch">
                <Text type="label" size="sm" color="secondary">
                  Tổng giá trị quyết toán
                </Text>
                <Text weight="bold" size="2xl">
                  {formatMoney(contractGrandTotal, contract.currency)}
                </Text>
              </VStack>
            </Card>
            <Card padding={4} xstyle={kpiStyles.card}>
              <VStack gap={2} hAlign="stretch">
                <HStack gap={1.5} vAlign="center">
                  <StatusDot variant="success" label="Đã thực thu" />
                  <Text type="label" size="sm" color="secondary">
                    Đã thực thu
                  </Text>
                </HStack>
                <Text weight="bold" size="2xl" xstyle={kpiStyles.valueSuccess}>
                  {formatMoney(paymentSchedulesPaidTotal, contract.currency)}
                </Text>
              </VStack>
            </Card>
            <Card padding={4} xstyle={kpiStyles.card}>
              <VStack gap={2} hAlign="stretch">
                <HStack gap={1.5} vAlign="center">
                  <StatusDot variant="accent" label="Còn phải thu" />
                  <Text type="label" size="sm" color="secondary">
                    Còn phải thu
                  </Text>
                </HStack>
                <Text weight="bold" size="2xl" xstyle={kpiStyles.valueAccent}>
                  {formatMoney(
                    Math.max(
                      0,
                      contractGrandTotal - paymentSchedulesPaidTotal,
                    ),
                    contract.currency,
                  )}
                </Text>
              </VStack>
            </Card>
          </Grid>

          {/* Requires the contract to be fully signed to create; the
              backend also enforces this (`400` otherwise), the disabled
              button + tooltip here is just the UX-level mirror of that
              rule. */}
          <HStack hAlign="between" vAlign="center">
            <Heading level={2}>Tiến độ thanh toán</Heading>
            <Button
              label="Thêm đợt thanh toán"
              variant="secondary"
              size="sm"
              icon={<Icon icon={Plus} />}
              isDisabled={!isFullySigned}
              tooltip={
                isFullySigned
                  ? undefined
                  : 'Hợp đồng phải được cả 2 bên ký trước khi thêm đợt thanh toán'
              }
              onClick={onAddPaymentSchedule}
            />
          </HStack>

          {paymentSchedules.length === 0 ? (
            <Text color="secondary">Chưa có đợt thanh toán</Text>
          ) : (
            <>
              <Table
                columns={paymentScheduleColumns}
                data={paymentSchedules}
                idKey="id"
                dividers="rows"
                density="compact"
              />
              <HStack hAlign="between" vAlign="center">
                <Text color="secondary">
                  Tổng số {paymentSchedules.length} đợt thanh toán chính
                </Text>
                <Text weight="semibold">
                  TỔNG ĐÃ THU:{' '}
                  {formatMoney(paymentSchedulesPaidTotal, contract.currency)}
                </Text>
              </HStack>
              <HStack hAlign="between" vAlign="center">
                <Text weight="semibold">Tổng cộng thanh toán:</Text>
                <Text weight="semibold">
                  {formatMoney(paymentSchedulesTotal, contract.currency)}
                </Text>
              </HStack>
              <HStack hAlign="between" vAlign="center">
                <Text weight="semibold">Tổng cộng giá trị:</Text>
                <Text weight="semibold">
                  {formatMoney(contractGrandTotal, contract.currency)}
                </Text>
              </HStack>
            </>
          )}
        </VStack>
      )}

      {activeTab === 'related' && (
        <VStack gap={4} hAlign="stretch">
          <VStack gap={4} hAlign="stretch">
            <HStack hAlign="between" vAlign="center">
              <Text weight="semibold">Shipment</Text>
              {/* Requires the contract to be Official, fully signed, and
                  not cancelled to create; the backend also enforces this
                  (`400` otherwise) — the disabled button + tooltip here is
                  just the UX-level mirror of that rule. */}
              <Button
                label="Thêm Shipment"
                variant="secondary"
                size="sm"
                icon={<Icon icon={Plus} />}
                isDisabled={shipmentIneligibleReason != null}
                tooltip={shipmentIneligibleReason ?? undefined}
                onClick={onAddShipment}
              />
            </HStack>

            {shipments.length === 0 ? (
              <Text color="secondary">Chưa có Shipment nào</Text>
            ) : (
              <Table
                columns={shipmentColumns}
                data={shipments}
                idKey="id"
                dividers="rows"
                density="compact"
                plugins={{
                  expansion: shipmentExpansionPlugin,
                  rowInteraction: shipmentRowInteractionPlugin,
                }}
              />
            )}
          </VStack>

          <Card>
            <HStack hAlign="between" vAlign="center" gap={3}>
              <VStack gap={1}>
                <Text weight="semibold">Commission</Text>
                {commissionQuery.isLoading ? (
                  <Text color="secondary">Đang tải...</Text>
                ) : commission ? (
                  <Text color="secondary">
                    {commission.code} ·{' '}
                    {formatMoney(commission.value, contract.currency)} ·{' '}
                    {commission.sellerSigned && commission.partySigned
                      ? 'Đã ký đủ'
                      : 'Chưa ký đủ'}
                  </Text>
                ) : (
                  <Text color="secondary">Chưa có Commission</Text>
                )}
              </VStack>
              <Button
                label={commission ? 'Mở Commission' : 'Tạo Commission'}
                variant="secondary"
                size="sm"
                onClick={() =>
                  onOpenCommission(
                    // `useCommissionQuery` returns the raw entity with no
                    // denormalized contract context (unlike a commissions
                    // *list* row) — inject it the same way the old embedded
                    // panel did, so the standalone dialog's header shows
                    // the contract number/project name instead of "—".
                    commission && {
                      ...commission,
                      contractNumber: contract.contractNumber,
                      projectName: contract.projectName,
                    },
                  )
                }
              />
            </HStack>
          </Card>

          {hasLogisticsSecret ? (
            <Card>
              <HStack hAlign="between" vAlign="center" gap={3}>
                <VStack gap={1}>
                  <Text weight="semibold">BOQ</Text>
                  {privateInfoQuery.isLoading ? (
                    <Text color="secondary">Đang tải...</Text>
                  ) : privateInfo ? (
                    <Text color="secondary">
                      {isPrivateInfoEntirelyEmpty(privateInfo)
                        ? 'Chưa nhập dữ liệu'
                        : `Lợi nhuận: ${formatMoney(privateInfo.profit ?? 0, 'VND')}`}
                    </Text>
                  ) : null}
                </VStack>
                <Button
                  label="Mở BOQ"
                  variant="secondary"
                  size="sm"
                  onClick={onOpenBoq}
                />
              </HStack>
            </Card>
          ) : null}
        </VStack>
      )}

      {activeTab === 'fullView' && (
        <ContractFullViewPanel
          contract={contract}
          shipments={shipments}
          customersById={customersById}
          costCategoriesById={costCategoriesById}
        />
      )}
    </VStack>
  );
}
