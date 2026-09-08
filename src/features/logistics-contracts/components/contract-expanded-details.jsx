'use client';
import { Button } from '@astryxdesign/core/Button';
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
import { useContractPrivateInfoQuery } from '../hooks/use-contract-private-info-query.js';
import { usePaymentSchedulesQuery } from '../hooks/use-payment-schedules-query.js';
import { useShipmentsQuery } from '../hooks/use-shipments-query.js';
import { ContractCommissionPanel } from './contract-commission-panel.jsx';
import { ContractPrivateInfoPanel } from './contract-private-info-panel.jsx';
import { ShipmentExpandedDetails } from './shipment-expanded-details.jsx';

/** @typedef {'info' | 'paymentSchedule' | 'shipment' | 'commission' | 'privateInfo'} ExpandedTab */

const LOGISTICS_SECRET_PERMISSION = 'logistics:secret';

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/**
 * Dialogs opened from within this component's own tabs for entities with
 * their own list-level `*FormDialog` (Shipment, Payment Schedule, Annex,
 * VGM) are deliberately owned and rendered by `ContractsList`, not here —
 * see the "Selector popover stacking" note above `ContractsList` (ADR-0004)
 * for why. This component only forwards trigger callbacks
 * (`onAddShipment`, `onEditShipment`, ...) up to whichever entity the
 * click was about for those.
 * "Thông tin private" and "Commission" are the exception: both edit in
 * place via `ContractPrivateInfoPanel`/`ContractCommissionPanel` — no
 * `*FormDialog`, no ADR-0004 concern (neither panel is ever reached
 * through a `renderExpanded` table row, only through this component's own
 * tabs, which live inside `ContractFormDialog`'s own `<dialog>`, not a
 * `<table>`) — driven by `ContractFormDialog`'s footer via the forwarded
 * `*PanelRef`/`on*StatusChange` pairs below.
 * @param {object} props
 * @param {import('../types/index.js').Contract} props.contract
 * @param {Map<string, import('../types/index.js').Customer>} props.customersById
 * @param {Map<string, import('../types/index.js').ShipmentCostCategory>} props.costCategoriesById
 * @param {ExpandedTab} props.activeTab
 * @param {() => void} props.onAddPaymentSchedule
 * @param {(schedule: import('../types/index.js').PaymentSchedule) => void} props.onEditPaymentSchedule
 * @param {() => void} props.onAddShipment
 * @param {(shipment: import('../types/index.js').Shipment) => void} props.onEditShipment
 * @param {(payload: { contractId: string, shipmentId: string }) => void} props.onAddVgm
 * @param {(payload: { contractId: string, shipmentId: string, vgm: import('../types/index.js').ShipmentVgm }) => void} props.onEditVgm
 * @param {() => void} props.onAddCommissionAnnex
 * @param {(annex: import('../types/index.js').CommissionAnnex) => void} props.onEditCommissionAnnex
 * @param {(commission: import('../types/index.js').Commission) => void} props.onAddCommissionPayment
 * @param {import('react').Ref<{ startEditing: () => void, cancelEditing: () => void, submit: () => void }>} [props.privateInfoPanelRef]
 *   Forwarded to `ContractPrivateInfoPanel` — lets the Contract dialog's own
 *   footer (`contract-form-dialog.jsx`) drive editing for this tab instead of
 *   a second, tab-local edit button (see that panel's own doc comment).
 * @param {(status: { isEditing: boolean, isSubmitting: boolean, submitLabel: string }) => void} [props.onPrivateInfoStatusChange]
 * @param {import('react').Ref<{ startEditing: () => void, cancelEditing: () => void, submit: () => void }>} [props.commissionPanelRef]
 *   Same idea as `privateInfoPanelRef`, for `ContractCommissionPanel`.
 * @param {(status: { isEditing: boolean, isSubmitting: boolean, submitLabel: string }) => void} [props.onCommissionStatusChange]
 */
export function ContractExpandedDetails({
  contract,
  customersById,
  costCategoriesById,
  activeTab,
  onAddPaymentSchedule,
  onEditPaymentSchedule,
  onAddShipment,
  onEditShipment,
  onAddVgm,
  onEditVgm,
  onAddCommissionAnnex,
  onEditCommissionAnnex,
  onAddCommissionPayment,
  privateInfoPanelRef,
  onPrivateInfoStatusChange,
  commissionPanelRef,
  onCommissionStatusChange,
}) {
  const [expandedShipmentId, setExpandedShipmentId] = useState(
    /** @type {string | null} */ (null),
  );

  // Gates the query itself, not just the tab button (`contract-form-
  // dialog.jsx` hides the tab entirely without this permission) — a caller
  // who can't see the tab shouldn't fire a request that only ever 403s.
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

  const shipmentsQuery = useShipmentsQuery(contract.id);
  const shipments = shipmentsQuery.data?.success
    ? shipmentsQuery.data.shipments
    : [];

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

  const privateInfoQuery = useContractPrivateInfoQuery(
    hasLogisticsSecret ? contract.id : undefined,
  );
  const privateInfo = privateInfoQuery.data?.success
    ? privateInfoQuery.data.privateInfo
    : null;

  // `CommissionFields` (via `ContractCommissionPanel`) fetches its own
  // annexes/grand-total off `commission.contractId` — no need to duplicate
  // that query/rollup here the way the old read-only `ContractCommissionTab`
  // required.
  const commissionQuery = useCommissionQuery(contract.id);
  const commissionResult = commissionQuery.data;
  const commission =
    commissionResult?.success && commissionResult.exists
      ? commissionResult.commission
      : null;

  return (
    <VStack gap={4} hAlign="stretch">
      {activeTab === 'paymentSchedule' && (
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
                <Text weight="semibold">Tổng cộng:</Text>
                <Text weight="semibold">
                  {formatMoney(paymentSchedulesTotal, contract.currency)}
                </Text>
              </HStack>
            </>
          )}
        </VStack>
      )}

      {activeTab === 'shipment' && (
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
      )}

      {activeTab === 'commission' &&
        (commissionQuery.isLoading ? (
          <Text color="secondary">Đang tải Commission...</Text>
        ) : (
          <ContractCommissionPanel
            // `commission` is `null` both "still loading" and "confirmed
            // none exists" — gating the mount above on `isLoading` (not
            // just `commission`) means the panel's own `useState(!commission)`
            // (initial editing mode) only ever runs once the real value is
            // known, instead of transiently seeing `null` and getting
            // stuck in editing mode even once a real Commission loads in.
            key={commission?.id ?? 'create'}
            controllerRef={commissionPanelRef}
            contractId={contract.id}
            currency={contract.currency}
            commission={
              commission
                ? {
                    ...commission,
                    contractNumber: contract.contractNumber,
                    projectName: contract.projectName,
                  }
                : null
            }
            onAddAnnex={onAddCommissionAnnex}
            onEditAnnex={onEditCommissionAnnex}
            onAddPayment={onAddCommissionPayment}
            hideOwnActions
            onStatusChange={onCommissionStatusChange}
          />
        ))}

      {activeTab === 'privateInfo' && privateInfo && (
        <ContractPrivateInfoPanel
          controllerRef={privateInfoPanelRef}
          contractId={contract.id}
          privateInfo={privateInfo}
          hideOwnActions
          onStatusChange={onPrivateInfoStatusChange}
        />
      )}
    </VStack>
  );
}
