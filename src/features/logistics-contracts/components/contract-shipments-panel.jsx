'use client';
import { useMemo, useState } from 'react';

import { MetaShipmentListPanel } from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { formatMoney } from '../config/currencies.js';
// import { labelForPaymentType } from '../config/payment-schedule-types.js';
import { labelForShipmentContainerType } from '../config/shipment-container-types.js';
import { reasonContractIneligibleForShipment } from '../config/shipment-contract-eligibility.js';
import { labelForShipmentQuantityUnit } from '../config/shipment-quantity-units.js';
import { labelForShipmentStatus } from '../config/shipment-status.js';
import { useCustomersQuery } from '../hooks/use-customers-query.js';
import { useShipmentCostCategoriesQuery } from '../hooks/use-shipment-cost-categories-query.js';
import { useShipmentsQuery } from '../hooks/use-shipments-query.js';
import { useShipmentsVgmsQueries } from '../hooks/use-shipments-vgms-queries.js';
import { useSuppliersQuery } from '../hooks/use-suppliers-query.js';
import { ContractShipmentsTable } from './contract-shipments-table.jsx';
import { ShipmentFormDrawer } from './shipment-form-drawer.jsx';

// Fields the design calls for always render; a missing value shows this
// placeholder instead of hiding the field or the whole card.
const BLANK = '___';
const COUNT_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

/** @param {string | null | undefined} value */
const orBlank = (value) =>
  value == null || ['', '-', '—'].includes(value.trim()) ? BLANK : value;

/** @param {string | null | undefined} date */
const formatDate = (date) => (date ? formatDisplayDate(date) : BLANK);

/**
 * @param {import('../types/index.js').ShipmentStatus} status
 * @returns {'success' | 'neutral' | 'blue'}
 */
function toneForShipmentStatus(status) {
  if (status === 'Completed') return 'success';
  if (status === 'Booked') return 'neutral';
  return 'blue';
}

/**
 * "Lô hàng" tab body (`openspec/changes/apply-maritime-to-contract-detail/`,
 * step 6): `MetaShipmentListPanel` fed with the contract's real
 * `Shipment`s, plus the create/edit drawer it opens. Only what the Shipment
 * record actually carries is shown — booking/B-L/shipping-line/vessel,
 * customs declaration + C/O, declared value/weight/quantity, ETD/ETA and the
 * cost totals by category. There is no trucking/CFS partner data on a
 * Shipment, so those partner cards from the design are not rendered.
 * @param {{ contract: import('../types/index.js').Contract }} props
 */
export function ContractShipmentsPanel({ contract }) {
  const [dialog, setDialog] = useState(
    /** @type {{ shipment: import('../types/index.js').Shipment | null } | null} */ (
      null
    ),
  );

  const shipmentsQuery = useShipmentsQuery(contract.id);
  const suppliersQuery = useSuppliersQuery();
  const costCategoriesQuery = useShipmentCostCategoriesQuery();
  const costCategories = costCategoriesQuery.data?.success
    ? costCategoriesQuery.data.costCategories
    : [];

  const shipments = useMemo(
    () =>
      (shipmentsQuery.data?.success ? shipmentsQuery.data.shipments : [])
        .slice()
        .sort((a, b) => a.shipmentNumber - b.shipmentNumber),
    [shipmentsQuery.data],
  );
  const suppliersById = useMemo(
    () =>
      new Map(
        (suppliersQuery.data?.success ? suppliersQuery.data.suppliers : []).map(
          (/** @type {import('../types/index.js').Supplier} */ supplier) => [
            supplier.id,
            supplier,
          ],
        ),
      ),
    [suppliersQuery.data],
  );

  const customersQuery = useCustomersQuery();
  const customersById = useMemo(
    () =>
      new Map(
        (customersQuery.data?.success ? customersQuery.data.customers : []).map(
          (/** @type {import('../types/index.js').Customer} */ customer) => [
            customer.id,
            customer,
          ],
        ),
      ),
    [customersQuery.data],
  );
  // One VGM record per container; its `carrierCustomerId` is the trucking
  // company that hauled it, so grouping them gives the "phân bổ xe" bar.
  const vgmsByShipmentId = useShipmentsVgmsQueries(
    contract.id,
    shipments.map((s) => s.id),
  );

  const toTons = (/** @type {number} */ kg) => kg / 1000;
  const totalTons = toTons(
    shipments.reduce((total, s) => total + s.declarationWeightKg, 0),
  );
  const totalVgmKg = [...vgmsByShipmentId.values()].reduce(
    (total, records) =>
      total + records.reduce((sum, record) => sum + record.vgm, 0),
    0,
  );
  const fclCount = shipments.filter((s) => s.type === 'FCL').length;
  const lclCount = shipments.length - fclCount;
  const totalCost = shipments.reduce(
    (total, s) => total + s.costs.reduce((sum, c) => sum + c.amount, 0),
    0,
  );

  const totalContainers = shipments.reduce(
    (total, shipment) =>
      total + (shipment.type === 'FCL' ? shipment.quantityAmount : 0),
    0,
  );
  const exportedValue = shipments.reduce(
    (total, shipment) => total + shipment.invoiceValue,
    0,
  );
  const exportedValueVnd = shipments.reduce(
    (total, shipment) =>
      total + shipment.invoiceValue * shipment.declarationExchangeRate,
    0,
  );
  const stats = [
    {
      label: 'TỔNG SỐ CONT & KHỐI LƯỢNG',
      value: `${COUNT_FORMATTER.format(totalContainers)} Cont /`,
      highlight: `${formatMoney(totalTons)} Tấn`,
      note: `${fclCount} Lô FCL · ${lclCount} Lô LCL${totalVgmKg ? ` · VGM: ${formatMoney(toTons(totalVgmKg))} Tấn` : ''}`,
    },
    {
      label: 'CHI PHÍ LOGISTICS',
      value: formatMoney(totalCost),
      unit: 'VNĐ',
      note: `${shipments.length} lô hàng`,
      color: 'accent',
    },
    {
      label: 'GIÁ TRỊ ĐÃ XUẤT',
      value: formatMoney(exportedValue),
      unit: contract.currency,
      note: `Tiến độ: ${contract.contractValue > 0 ? formatMoney((exportedValue / contract.contractValue) * 100) : '0'}%`,
      color: 'accent',
    },
    {
      label: 'GIÁ TRỊ ĐÃ XUẤT (VNĐ)',
      value: formatMoney(exportedValueVnd),
      unit: 'VNĐ',
      note: `Tương đương ${formatMoney(exportedValue)} ${contract.currency}`,
    },
  ];

  const rows = shipments.map((s) => {
    const unit = labelForShipmentQuantityUnit(s.quantityUnit);
    const quantity = `${s.quantityAmount} ${unit}`;
    const tons = toTons(s.declarationWeightKg);
    const supplier = suppliersById.get(s.supplierCustomerId);

    /** @param {string} label @param {string | null | undefined} value @param {'accent' | 'teal'} [tone] @returns {[string, string, ('accent' | 'teal')?]} */
    const field = (label, value, tone) => {
      const text = orBlank(value);
      return text === BLANK ? [label, text] : [label, text, tone];
    };

    const vgms = vgmsByShipmentId.get(s.id) ?? [];
    const vgmTotal = vgms.reduce((total, vgm) => total + vgm.vgm, 0);
    /** @type {Map<string, number>} */
    const contsByCarrier = new Map();
    for (const vgm of vgms) {
      contsByCarrier.set(
        vgm.carrierCustomerId,
        (contsByCarrier.get(vgm.carrierCustomerId) ?? 0) + 1,
      );
    }
    const carrierTones = /** @type {const} */ ([
      'teal',
      'primary',
      'secondary',
    ]);
    const totalCont =
      s.quantityUnit === 'Cont'
        ? Math.max(s.quantityAmount, vgms.length)
        : vgms.length;
    // Always the design's "phân bổ xe" layout; with no VGM records it is an
    // empty bar and a `___` row that fills in once carriers are recorded.
    const truckingPartner = {
      units: [...contsByCarrier].map(([carrierId, cont], index) => ({
        name: orBlank(
          (suppliersById.get(carrierId) ?? customersById.get(carrierId))
            ?.companyName,
        ),
        cont,
        tone: carrierTones[index % carrierTones.length],
      })),
      totalCont,
      unitLabel: 'Cont',
      restLabel:
        vgms.length > 0 && totalCont > vgms.length
          ? `Còn ${totalCont - vgms.length} Cont chưa phân bổ`
          : undefined,
      rows: /** @type {Array<[string, string, ('accent' | 'teal')?]>} */ ([]),
    };

    const partners = [
      {
        icon: /** @type {const} */ ('booking'),
        title: '1. BOOKING',
        tag: s.type,
        lead: orBlank(supplier?.companyName),
        rows: [
          field('Mã Booking:', s.bookingNumber, 'accent'),
          field('Số Vận đơn:', s.billOfLadingNumber),
          // field('Điều kiện TT:', labelForPaymentType(s.paymentCondition)),
        ],
      },
      {
        icon: /** @type {const} */ ('trucking'),
        title: '2. TRUCKING',
        tag: '',
        ...truckingPartner,
      },
      {
        icon: /** @type {const} */ ('customs'),
        title: '3. HẢI QUAN',
        tag: s.customsInspected ? 'Bị kiểm hoá' : '',
        tagTone: /** @type {const} */ ('neutral'),
        rows: [
          field('Số tờ khai:', s.customsDeclarationNumber, 'accent'),
          field(
            'Ngày khai:',
            s.customsDeclarationDate && formatDate(s.customsDeclarationDate),
          ),
          field('Số C/O:', s.coNumber),
          field(
            'Ngày khai C/O:',
            s.coDeclarationDate && formatDate(s.coDeclarationDate),
          ),
          field('Ngày có C/O:', s.coIssuedDate && formatDate(s.coIssuedDate)),
        ],
      },
      {
        icon: /** @type {const} */ ('shipping'),
        title: '4. SHIPPING (HÃNG TÀU)',
        tag: '',
        rows: [
          field('Hãng tàu:', s.shippingLine),
          field('Tên tàu:', s.vesselName),
        ],
      },
    ];

    // Every catalog category is listed; ones with no cost on this shipment
    // show the placeholder.
    const totalsByCategory = new Map(
      s.costTotalsByCategory.map(
        (/** @type {import('../types/index.js').ShipmentCostTotal} */ c) => [
          c.costCategoryId,
          c.totalAmount,
        ],
      ),
    );
    /** @type {Array<[string, string]>} */
    const costItems =
      costCategories.length > 0
        ? costCategories.map((category) => [
            `${category.name}:`,
            totalsByCategory.has(category.id)
              ? formatMoney(totalsByCategory.get(category.id))
              : BLANK,
          ])
        : s.costTotalsByCategory.map((c) => [
            `${c.costCategoryName}:`,
            formatMoney(c.totalAmount),
          ]);

    return {
      id: s.id,
      table: {
        declDate: formatDate(s.customsDeclarationDate),
        hasDeclaration: Boolean(s.customsDeclarationNumber),
        quantity:
          s.type === 'FCL' && vgms.length
            ? `${quantity} ${labelForShipmentContainerType(vgms[0].containerType)}`
            : quantity,
        quantityAmount: s.quantityAmount,
        quantityUnit: unit,
        status: s.status,
        invoiceValue: s.invoiceValue,
        invoiceValueVnd: s.invoiceValue * s.declarationExchangeRate,
        logisticsCost: s.costs.reduce((sum, cost) => sum + cost.amount, 0),
        vgmKg: vgmTotal,
        vgm: vgms.length ? `${formatMoney(toTons(vgmTotal))} Tấn` : BLANK,
      },
      no: String(s.shipmentNumber).padStart(2, '0'),
      code: s.shipmentCode,
      kind: /** @type {'fcl' | 'lcl'} */ (s.type === 'FCL' ? 'fcl' : 'lcl'),
      kindLabel:
        s.type === 'FCL' && vgms.length
          ? `${s.type} (${labelForShipmentContainerType(vgms[0].containerType)})`
          : s.type,
      status: {
        label: labelForShipmentStatus(s.status),
        tone: toneForShipmentStatus(s.status),
      },
      value: {
        usd: formatMoney(s.invoiceValue),
        vnd: formatMoney(s.invoiceValue * s.declarationExchangeRate),
        rate: formatMoney(s.declarationExchangeRate),
        scaleTag: quantity,
        weight: `${formatMoney(tons)} Tấn`,
        vgm: vgms.length ? `${formatMoney(vgmTotal)} kg` : undefined,
      },
      route: {
        from: orBlank(s.placeOfLoading),
        to: orBlank(s.placeOfDischarge),
        etd: formatDate(s.etd),
        etaLabel: 'Dự kiến đến (ETA):',
        eta: formatDate(s.eta),
      },
      costs: {
        total: formatMoney(s.costs.reduce((sum, c) => sum + c.amount, 0)),
        items: costItems,
      },
      partners,
    };
  });

  const createDisabledReason = reasonContractIneligibleForShipment(contract);

  return (
    <>
      <MetaShipmentListPanel
        stats={stats}
        shipments={rows}
        declarationCurrency={contract.currency}
        createDisabledReason={createDisabledReason ?? undefined}
        onCreateShipment={() => setDialog({ shipment: null })}
        shipmentHref={(id) =>
          `/logistics/contract/${contract.id}/shipment/${id}`
        }
        onShipmentMenu={(id) =>
          setDialog({
            shipment: shipments.find((s) => s.id === id) ?? null,
          })
        }
        onExportExcel={async () => {
          const XLSX = await import('xlsx');
          const sheet = XLSX.utils.json_to_sheet(
            shipments.map((s) => ({
              'Mã lô hàng': s.shipmentCode,
              Loại: s.type,
              'Trạng thái': labelForShipmentStatus(s.status),
              'Số lượng': s.quantityAmount,
              'Đơn vị': labelForShipmentQuantityUnit(s.quantityUnit),
              'Giá trị tờ khai': s.declarationValue,
              'Tiền tệ': s.declarationCurrency,
              'Giá trị tờ khai VNĐ': s.declarationValueVnd,
              'Chi phí logistics VNĐ': s.costs.reduce(
                (sum, cost) => sum + cost.amount,
                0,
              ),
              'Khối lượng kg': s.declarationWeightKg,
            })),
          );
          const book = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(book, sheet, 'Lô hàng');
          XLSX.writeFile(
            book,
            `lo-hang-${contract.contractNumber.replace(/[/\\]/g, '-')}.xlsx`,
          );
        }}
        renderTable={(onViewShipment) => (
          <ContractShipmentsTable
            shipments={rows}
            contractNumber={contract.contractNumber}
            declarationCurrency={contract.currency}
            onView={onViewShipment}
            shipmentHref={(id) =>
              `/logistics/contract/${contract.id}/shipment/${id}`
            }
            onEdit={(id) =>
              setDialog({
                shipment: shipments.find((s) => s.id === id) ?? null,
              })
            }
          />
        )}
      />

      {/* Create and edit both use the Meta drawer; viewing is the
          shipment page (`shipmentHref`). */}
      {dialog ? (
        <ShipmentFormDrawer
          key={dialog.shipment?.id ?? 'create'}
          contract={contract}
          shipment={dialog.shipment}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </>
  );
}
