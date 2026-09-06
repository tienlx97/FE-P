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

import { labelForContractAnnexType } from '../config/contract-annex-types.js';
import { formatMoney } from '../config/currencies.js';
import { labelForPaymentType } from '../config/payment-schedule-types.js';
import { labelForShipmentQuantityUnit } from '../config/shipment-quantity-units.js';
import { labelForShipmentType } from '../config/shipment-types.js';
import { useCommissionAnnexesQuery } from '../hooks/use-commission-annexes-query.js';
import { useCommissionQuery } from '../hooks/use-commission-query.js';
import { useContractAnnexesQuery } from '../hooks/use-contract-annexes-query.js';
import { usePaymentSchedulesQuery } from '../hooks/use-payment-schedules-query.js';
import { useShipmentsQuery } from '../hooks/use-shipments-query.js';
import { ContractCommissionTab } from './contract-commission-tab.jsx';
import { ContractInfoTab } from './contract-info-tab.jsx';
import { ShipmentExpandedDetails } from './shipment-expanded-details.jsx';

/** @typedef {'info' | 'paymentSchedule' | 'shipment' | 'commission'} ExpandedTab */

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/**
 * Signed amount label for one contract-annex row — `ValueChange` never
 * represents an amount change, so it gets no sign (same sign convention as
 * `commissions-list.jsx`'s `annexAmountLabel`).
 * @param {import('../types/index.js').ContractAnnex} annex
 * @param {string} currency
 */
function contractAnnexAmountLabel(annex, currency) {
  const formatted = formatMoney(annex.amount, currency);
  if (annex.type === 'AmountIncrease') return `+ ${formatted}`;
  if (annex.type === 'AmountDecrease') return `− ${formatted}`;
  return formatted;
}

/**
 * All dialogs opened from within this component's own tabs (Shipment,
 * Payment Schedule, Annex, Commission, VGM) are deliberately owned
 * and rendered by `ContractsList`, not here — see the "Selector popover
 * stacking" note above `ContractsList` for why. This component only
 * forwards trigger callbacks (`onAddShipment`, `onEditShipment`, ...) up to
 * whichever entity the click was about; it never opens a `*FormDialog`
 * itself.
 * @param {object} props
 * @param {import('../types/index.js').Contract} props.contract
 * @param {Map<string, import('../types/index.js').ContractBank>} props.banksById
 * @param {Map<string, import('../types/index.js').Country>} props.countriesById
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
 * @param {(payload: { contractId: string, currency: string, commission: import('../types/index.js').Commission | null }) => void} props.onOpenCommission
 * @param {() => void} props.onAddCommissionAnnex
 * @param {(annex: import('../types/index.js').CommissionAnnex) => void} props.onEditCommissionAnnex
 * @param {(commission: import('../types/index.js').Commission) => void} props.onAddCommissionPayment
 */
export function ContractExpandedDetails({
  contract,
  banksById,
  countriesById,
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
  onAddCommissionAnnex,
  onEditCommissionAnnex,
  onAddCommissionPayment,
}) {
  const [expandedShipmentId, setExpandedShipmentId] = useState(
    /** @type {string | null} */ (null),
  );

  const annexesQuery = useContractAnnexesQuery(contract.id);
  const annexes = annexesQuery.data?.success ? annexesQuery.data.annexes : [];

  // "Tổng cộng" = the contract's own `contractValue` plus every annex's
  // `amount`, signed by its `type` — same rollup as the Commission
  // tab's `commissionGrandTotal` below.
  const contractAnnexesTotal = annexes.reduce((total, annex) => {
    if (annex.type === 'AmountIncrease') return total + annex.amount;
    if (annex.type === 'AmountDecrease') return total - annex.amount;
    return total;
  }, 0);
  const contractGrandTotal = contract.contractValue + contractAnnexesTotal;

  const isFullySigned = contract.sellerSigned && contract.buyerSigned;
  const paymentSchedulesQuery = usePaymentSchedulesQuery(contract.id);
  const paymentSchedules = paymentSchedulesQuery.data?.success
    ? paymentSchedulesQuery.data.schedules
    : [];

  const shipmentsQuery = useShipmentsQuery(contract.id);
  const shipments = shipmentsQuery.data?.success
    ? shipmentsQuery.data.shipments
    : [];

  const paymentTermRows = contract.paymentTerms.map((term, index) => ({
    ...term,
    orderLabel: `Đợt ${index + 1}`,
  }));

  /** @type {import('@astryxdesign/core/Table').TableColumn<(typeof paymentTermRows)[number]>[]} */
  const paymentTermColumns = [
    {
      key: 'orderLabel',
      header: 'Đợt',
      width: pixel(80),
      renderCell: (term) => term.orderLabel,
    },
    {
      key: 'paymentRatioPercent',
      header: 'Tỷ lệ',
      width: pixel(100),
      align: 'end',
      renderCell: (term) => `${term.paymentRatioPercent}%`,
    },
    {
      key: 'paymentCondition',
      header: 'Điều kiện thanh toán',
      width: proportional(1),
      renderCell: (term) => orDash(term.paymentCondition),
    },
  ];

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').ContractAnnex & Record<string, unknown>>[]} */
  const annexColumns = [
    {
      key: 'annexCode',
      header: 'Mã phụ lục',
      width: proportional(1.2),
      renderCell: (annex) =>
        `${annex.annexCode} · ${labelForContractAnnexType(annex.type)}`,
    },
    {
      key: 'signedDate',
      header: 'Ngày ký',
      width: pixel(120),
      renderCell: (annex) => annex.signedDate,
    },
    {
      key: 'buyerSigned',
      header: 'Mua ký',
      width: pixel(90),
      renderCell: (annex) => (annex.buyerSigned ? 'Đã ký' : 'Chưa ký'),
    },
    {
      key: 'sellerSigned',
      header: 'Bán ký',
      width: pixel(90),
      renderCell: (annex) => (annex.sellerSigned ? 'Đã ký' : 'Chưa ký'),
    },
    {
      key: 'amount',
      header: 'Số tiền',
      width: pixel(140),
      align: 'end',
      renderCell: (annex) => contractAnnexAmountLabel(annex, contract.currency),
    },
    {
      key: 'actions',
      header: '',
      width: pixel(60),
      renderCell: (annex) => (
        <IconButton
          label={`Sửa ${annex.annexCode}`}
          tooltip="Sửa phụ lục"
          icon={<Icon icon={Pencil} size="sm" />}
          variant="ghost"
          size="sm"
          onClick={() => onEditAnnex(annex)}
        />
      ),
    },
  ];

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
      renderCell: (schedule) => schedule.paymentDate,
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

  const commissionQuery = useCommissionQuery(contract.id);
  const commissionResult = commissionQuery.data;
  const commission =
    commissionResult?.success && commissionResult.exists
      ? commissionResult.commission
      : null;
  const hasCommission = commission !== null;

  const commissionAnnexesQuery = useCommissionAnnexesQuery(
    hasCommission ? contract.id : undefined,
  );
  const commissionAnnexes = commissionAnnexesQuery.data?.success
    ? commissionAnnexesQuery.data.annexes
    : [];

  // "Tổng cộng" = the commission's own `value` plus every annex's `amount`,
  // signed by its `type` — same rollup as `commissions-list.jsx`'s
  // `grandTotal`.
  const commissionAnnexesTotal = commissionAnnexes.reduce((total, annex) => {
    if (annex.type === 'AmountIncrease') return total + annex.amount;
    if (annex.type === 'AmountDecrease') return total - annex.amount;
    return total;
  }, 0);
  const commissionGrandTotal = commission
    ? commission.value + commissionAnnexesTotal
    : 0;

  return (
    <VStack gap={4} hAlign="stretch">
      {activeTab === 'info' && (
        <ContractInfoTab
          contract={contract}
          banksById={banksById}
          countriesById={countriesById}
          onAddAnnex={onAddAnnex}
          annexes={annexes}
          contractGrandTotal={contractGrandTotal}
          paymentTermRows={paymentTermRows}
          paymentTermColumns={paymentTermColumns}
          annexColumns={annexColumns}
        />
      )}

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
            <Table
              columns={paymentScheduleColumns}
              data={paymentSchedules}
              idKey="id"
              dividers="rows"
              density="compact"
            />
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

      {activeTab === 'commission' && !commission && (
        <VStack gap={4} hAlign="stretch" vAlign="center">
          <Text color="secondary">Hợp đồng chưa có Commission</Text>
          <Button
            label="Tạo Commission"
            variant="secondary"
            size="sm"
            icon={<Icon icon={Plus} />}
            onClick={() =>
              onOpenCommission({
                contractId: contract.id,
                currency: contract.currency,
                commission: null,
              })
            }
          />
        </VStack>
      )}

      {activeTab === 'commission' && commission && (
        <VStack gap={4} hAlign="stretch">
          <Button
            label="Sửa Commission"
            variant="secondary"
            onClick={() =>
              onOpenCommission({
                contractId: contract.id,
                currency: contract.currency,
                commission,
              })
            }
          />
          <ContractCommissionTab
            contract={contract}
            customersById={customersById}
            onAddCommissionAnnex={onAddCommissionAnnex}
            onEditCommissionAnnex={onEditCommissionAnnex}
            onAddCommissionPayment={onAddCommissionPayment}
            commission={commission}
            commissionAnnexes={commissionAnnexes}
            commissionGrandTotal={commissionGrandTotal}
          />
        </VStack>
      )}
    </VStack>
  );
}
