'use client';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import {
  pixel,
  proportional,
  Table,
  useTableRowExpansion,
} from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Pencil, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { createRowExpansionInteractionPlugin } from '@/shared/components/expandable-row-styles.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';
import { useSessionPermissions } from '@/shared/hooks/use-session-permissions.js';

import { formatMoney } from '../config/currencies.js';
import { labelForPaymentType } from '../config/payment-schedule-types.js';
import { labelForShipmentQuantityUnit } from '../config/shipment-quantity-units.js';
import { labelForShipmentStatus } from '../config/shipment-status.js';
import { labelForShipmentType } from '../config/shipment-types.js';
import { useCommissionQuery } from '../hooks/use-commission-query.js';
import { useContractAnnexesQuery } from '../hooks/use-contract-annexes-query.js';
import { useContractPrivateInfoQuery } from '../hooks/use-contract-private-info-query.js';
import { usePaymentSchedulesQuery } from '../hooks/use-payment-schedules-query.js';
import { useShipmentsQuery } from '../hooks/use-shipments-query.js';
import { ContractAnnexesPanel } from './contract-annexes-panel.jsx';
import { isPrivateInfoEntirelyEmpty } from './contract-private-info-fields.jsx';
import { ShipmentExpandedDetails } from './shipment-expanded-details.jsx';

/** @typedef {'profile' | 'annexes' | 'payments' | 'related'} ExpandedTab */

const LOGISTICS_SECRET_PERMISSION = 'logistics:secret';

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/**
 * Renders the "Phụ lục"/"Thanh toán"/"Liên quan" tab bodies for the
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
  const paymentSchedulesQuery = usePaymentSchedulesQuery(contract.id);
  const paymentSchedules = paymentSchedulesQuery.data?.success
    ? paymentSchedulesQuery.data.schedules
    : [];

  const paymentSchedulesTotal = paymentSchedules.reduce(
    (total, schedule) => total + schedule.amount,
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
      header: 'Mã',
      width: proportional(1),
      renderCell: (schedule) =>
        `${schedule.paymentCode} · ${labelForPaymentType(schedule.type)}`,
    },
    {
      key: 'paymentDate',
      header: 'Ngày',
      width: pixel(120),
      renderCell: (schedule) => formatDisplayDate(schedule.paymentDate),
    },
    {
      key: 'note',
      header: 'Ghi chú',
      width: proportional(1),
      renderCell: (schedule) => orDash(schedule.note),
    },
    {
      key: 'amount',
      header: 'Số tiền',
      width: pixel(140),
      align: 'end',
      renderCell: (schedule) => formatMoney(schedule.amount, contract.currency),
    },
    {
      key: 'actions',
      header: '',
      width: pixel(60),
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
          {/* Requires the contract to be fully signed to create; the
              backend also enforces this (`400` otherwise), the disabled
              button + tooltip here is just the UX-level mirror of that
              rule. */}
          <HStack hAlign="between" vAlign="center">
            <Text weight="semibold">Lịch sử thanh toán</Text>
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
              <Button
                label="Thêm Shipment"
                variant="secondary"
                size="sm"
                icon={<Icon icon={Plus} />}
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
    </VStack>
  );
}
