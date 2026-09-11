'use client';
/** @typedef {'profile' | 'annexes' | 'payments' | 'related'} ExpandedTab */
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import {
  AdvanceTable,
  AdvanceTableErrorBanner,
} from '@/shared/components/advance-table.jsx';
import { useFullscreenToggle } from '@/shared/components/fullscreen-panel.jsx';
import {
  TableHeaderGroupBar,
  TableHeaderGroupCaption,
} from '@/shared/components/table-header-group.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';
import { generateRowKey } from '@/shared/config/generate-row-key.js';

import {
  badgeVariantForContractStatus,
  labelForContractStatus,
} from '../config/contract-status.js';
import { labelForContractType } from '../config/contract-types.js';
import {
  COLUMN_OPTIONS,
  DEFAULT_COLUMN_KEYS,
  DEFAULT_PAGE_SIZE,
  FILTER_FIELD_DEFS,
  PAGE_SIZE_OPTIONS,
  SEARCH_FIELD_DEFS,
  skeletonRows,
} from '../config/contracts-table.js';
import { formatMoney } from '../config/currencies.js';
import { useContractBanksQuery } from '../hooks/use-contract-banks-query.js';
import { useContractsQuery } from '../hooks/use-contracts-query.js';
import { useCountriesQuery } from '../hooks/use-countries-query.js';
import { useCustomersQuery } from '../hooks/use-customers-query.js';
import { useShipmentCostCategoriesQuery } from '../hooks/use-shipment-cost-categories-query.js';
import { CommissionAnnexFormDialog } from './commission-annex-form-dialog.jsx';
import { CommissionFormDialog } from './commission-form-dialog.jsx';
import { CommissionPaymentQuickAddDialog } from './commission-payment-quick-add-dialog.jsx';
import { ContractAnnexFormDialog } from './contract-annex-form-dialog.jsx';
import { ContractExpandedDetails } from './contract-expanded-details.jsx';
import { ContractFormDialog } from './contract-form-dialog.jsx';
import { ContractPrivateInfoDetailDialog } from './contract-private-info-detail-dialog.jsx';
import { PaymentScheduleFormDialog } from './payment-schedule-form-dialog.jsx';
import { RecordActionsMenu } from './record-actions-menu.jsx';
import { ShipmentFormDialog } from './shipment-form-dialog.jsx';
import { ShipmentVgmFormDialog } from './shipment-vgm-form-dialog.jsx';

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/** @param {import('../types/index.js').PaymentTerm[]} terms */
function formatPaymentTerms(terms) {
  if (terms.length === 0) {
    return '—';
  }
  if (terms.length === 1) {
    return `${terms[0].paymentRatioPercent}% ${terms[0].paymentCondition}`;
  }
  return `${terms.length} đợt`;
}

const SETTLEMENT_GROUP_KEY = 'settlement-value-group';
const SETTLEMENT_GROUP_COLUMN_KEYS = [
  'contractValue',
  'settlementValue',
  'paidValue',
  'unpaidValue',
];

/**
 * Two-line header — a blank caption line reserved above the specific label
 * — so the three settlement columns line up under one spanning "GIÁ TRỊ"
 * bar drawn by `TableHeaderGroupBar` (see its render site below), since the
 * underlying `Table` has no spanning/grouped-header primitive to merge
 * them under a single cell itself.
 * @param {string} label
 */
function settlementColumnHeader(label) {
  return (
    <VStack gap={0} hAlign="end">
      <TableHeaderGroupCaption groupKey={SETTLEMENT_GROUP_KEY}>
        GIÁ TRỊ
      </TableHeaderGroupCaption>
      <Text weight="semibold">{label}</Text>
    </VStack>
  );
}

/** Contract workspace and related editors are siblings of the table so
 * Selector portals remain inside their dialog layers (ADR-0004). */
export function ContractsList() {
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreenToggle();
  const tableWrapperRef = useRef(null);
  // `sessionKey` identifies one open workspace session — assigned once per
  // open action (row Xem/Sửa, "Tạo hợp đồng") and never touched again for
  // that session, including across a successful create (`contract` moves
  // from `null` to the saved record in place). Unlike keying the dialog off
  // `contract?.id`, this stays stable through that null→id transition, so
  // saving a brand-new Contract doesn't force a remount either — the one
  // thing task 1.2 exists to remove ("bỏ remount chỉ để đổi mode").
  const [workspace, setWorkspace] = useState(
    /** @type {{ mode?: 'view' | 'edit', contract: import('../types/index.js').Contract | null, sessionKey: string } | null} */ (
      null
    ),
  );
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(1);
  const [filterConditions, setFilterConditions] = useState(
    /** @type {import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]} */ ([]),
  );
  const [expandedTab, setExpandedTab] = useState(
    /** @type {ExpandedTab} */ ('profile'),
  );
  // "Commission"/"BOQ" (private info) no longer embed their editors inside
  // the Contract dialog (task 3.1) — "Liên quan" shows a summary card for
  // each and opens the same standalone dialog `commissions-list.jsx`/
  // `contract-private-infos-list.jsx` use, one at a time (ADR-0004: no
  // stacked fullscreen dialogs, this workspace's own `ContractFormDialog`
  // stays open underneath).
  const [relatedCommissionDialog, setRelatedCommissionDialog] = useState(
    /** @type {{ contractId: string, currency: string, commission: import('../types/index.js').Commission | null } | null} */ (
      null
    ),
  );
  const [relatedBoqDialog, setRelatedBoqDialog] = useState(
    /** @type {{ contractId: string, contractNumber: string } | null} */ (
      null
    ),
  );
  const [shipmentDialog, setShipmentDialog] = useState(
    /** @type {{ contractId: string, contract: import('../types/index.js').Contract, shipment?: import('../types/index.js').Shipment } | null} */ (
      null
    ),
  );
  const [annexDialog, setAnnexDialog] = useState(
    /** @type {{ contractId: string, annex?: import('../types/index.js').ContractAnnex } | null} */ (
      null
    ),
  );
  const [paymentScheduleDialog, setPaymentScheduleDialog] = useState(
    /** @type {{ contractId: string, schedule?: import('../types/index.js').PaymentSchedule } | null} */ (
      null
    ),
  );
  const [commissionAnnexDialog, setCommissionAnnexDialog] = useState(
    /** @type {{ contractId: string, annex?: import('../types/index.js').CommissionAnnex } | null} */ (
      null
    ),
  );
  const [commissionPaymentDialog, setCommissionPaymentDialog] = useState(
    /** @type {{ contractId: string, currency: string, commission: import('../types/index.js').Commission } | null} */ (
      null
    ),
  );
  const [vgmDialog, setVgmDialog] = useState(
    /** @type {{ contractId: string, shipmentId: string, vgm?: import('../types/index.js').ShipmentVgm } | null} */ (
      null
    ),
  );

  const contractsQuery = useContractsQuery({
    page: pageIndex,
    pageSize,
    conditions: filterConditions,
  });
  const listResult = contractsQuery.data;
  const contracts = useMemo(
    () => (listResult?.success ? listResult.contracts : []),
    [listResult],
  );
  // Sum of `contractValue` across every contract matching the current
  // filters (not just this page — the backend computes it pre-paging, see
  // `searchContracts`'s doc comment), grouped by currency since contracts
  // can be denominated in more than one.
  const valueTotals = listResult?.success ? listResult.valueTotals : [];
  // Per-contract "Quyết toán / Đã thanh toán / Chưa thanh toán" — one entry
  // per row on this page only (unlike `valueTotals`), keyed by contractId so
  // `renderCell` below can look a row's up in O(1).
  const settlementsByContractId = useMemo(
    () =>
      new Map(
        (listResult?.success ? listResult.settlements : []).map(
          (settlement) => [settlement.contractId, settlement],
        ),
      ),
    [listResult],
  );

  const banksQuery = useContractBanksQuery();
  const banksById = useMemo(
    () =>
      new Map(
        (banksQuery.data?.success ? banksQuery.data.banks : []).map((bank) => [
          bank.id,
          bank,
        ]),
      ),
    [banksQuery.data],
  );

  // `ContractResponse` only carries `countryId`, no denormalized country
  // name (confirmed in `docs/api/Contracts.md`, BE-kt-xnk), so the display
  // name has to be resolved client-side from the Country catalog.
  const countriesQuery = useCountriesQuery();
  const countriesById = useMemo(
    () =>
      new Map(
        (countriesQuery.data?.success ? countriesQuery.data.countries : []).map(
          (country) => [country.id, country],
        ),
      ),
    [countriesQuery.data],
  );

  // `Commission.partyCustomerId` is a live FK into the Customer
  // catalog (`docs/api/Commissions.md`, BE-kt-xnk) — same
  // client-side name resolution as `commissions-list.jsx`'s
  // `customersById`.
  const customersQuery = useCustomersQuery();
  const customersById = useMemo(
    () =>
      new Map(
        (customersQuery.data?.success ? customersQuery.data.customers : []).map(
          (customer) => [customer.id, customer],
        ),
      ),
    [customersQuery.data],
  );

  // "Khách hàng" search/filter is matched against the denormalized
  // `buyerCompanyName` string (see `searchableContracts` below), so the
  // combobox's options are just the distinct customer names — picking one
  // writes an exact-match `buyerCompanyName` clause instead of a freetext
  // substring search.
  const customerNameOptions = useMemo(() => {
    const names = new Set(
      (customersQuery.data?.success ? customersQuery.data.customers : []).map(
        (customer) => customer.companyName,
      ),
    );
    return [...names]
      .sort((a, b) => a.localeCompare(b, 'vi'))
      .map((name) => ({ value: name, label: name }));
  }, [customersQuery.data]);
  const searchFieldDefsWithCustomers = useMemo(
    () =>
      SEARCH_FIELD_DEFS.map((field) =>
        field.key === 'buyerCompanyName'
          ? { ...field, enumValues: customerNameOptions }
          : field,
      ),
    [customerNameOptions],
  );
  const filterFieldDefsWithCustomers = useMemo(
    () =>
      FILTER_FIELD_DEFS.map((field) =>
        field.key === 'buyerCompanyName'
          ? { ...field, options: customerNameOptions }
          : field,
      ),
    [customerNameOptions],
  );

  // `Shipment.costs[].costCategoryId` is a live FK into the
  // `ShipmentCostCategory` catalog — resolved client-side for
  // `ShipmentExpandedDetails`'s cost-lines table, same pattern as
  // `customersById` above.
  const costCategoriesQuery = useShipmentCostCategoriesQuery();
  const costCategoriesById = useMemo(
    () =>
      new Map(
        (costCategoriesQuery.data?.success
          ? costCategoriesQuery.data.costCategories
          : []
        ).map((costCategory) => [costCategory.id, costCategory]),
      ),
    [costCategoriesQuery.data],
  );

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').Contract & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'contractNumber',
      header: 'Số hợp đồng',
      width: pixel(180),
      filter: 'contractNumber',
      // renderCell: (contract) => (
      //   <Button
      //     label={contract.contractNumber}
      //     variant="ghost"
      //     size="sm"
      //     onClick={(event) => {
      //       event.stopPropagation();
      //       setExpandedTab('profile');
      //       setWorkspace({ contract, revision: 0 });
      //     }}
      //   />
      // ),
      renderCell: (contract) => contract.contractNumber,
    },
    {
      key: 'contractType',
      header: 'Loại hợp đồng',
      width: pixel(130),
      filter: 'contractType',
      renderCell: (contract) => labelForContractType(contract.contractType),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: pixel(140),
      filter: 'status',
      renderCell: (contract) => (
        <Badge
          label={labelForContractStatus(contract.status)}
          variant={badgeVariantForContractStatus(contract.status)}
        />
      ),
    },
    {
      key: 'projectName',
      header: 'Dự án',
      width: proportional(1),
      filter: 'projectName',
      renderCell: (contract) => contract.projectName,
    },
    {
      key: 'buyer',
      header: 'Khách hàng',
      width: proportional(1),
      filter: 'buyerCompanyName',
      renderCell: (contract) => contract.buyer.companyName,
    },
    {
      key: 'contractValue',
      // First of the four settlement-group columns (see
      // `SETTLEMENT_GROUP_COLUMN_KEYS`) — the contract's own value, next to
      // its quyết toán / đã thanh toán / chưa thanh toán position.
      header: settlementColumnHeader('HỢP ĐỒNG'),
      width: proportional(1),
      align: 'end',
      filter: 'contractValue',
      renderCell: (contract) =>
        formatMoney(contract.contractValue, contract.currency),
    },
    {
      key: 'settlementValue',
      // No matching backend filter field — these three are computed
      // (contract value + annex adjustments, and the payment position off
      // it), not stored columns `ContractFilterFields` (BE-kt-xnk) knows
      // how to filter on.
      header: settlementColumnHeader('QUYẾT TOÁN'),
      width: proportional(1),
      align: 'end',
      renderCell: (contract) =>
        formatMoney(
          settlementsByContractId.get(contract.id)?.settlementValue,
          contract.currency,
        ),
    },
    {
      key: 'paidValue',
      header: settlementColumnHeader('ĐÃ THANH TOÁN'),
      width: proportional(1),
      align: 'end',
      renderCell: (contract) =>
        formatMoney(
          settlementsByContractId.get(contract.id)?.paidValue,
          contract.currency,
        ),
    },
    {
      key: 'unpaidValue',
      header: settlementColumnHeader('CHƯA THANH TOÁN'),
      width: proportional(1),
      align: 'end',
      renderCell: (contract) =>
        formatMoney(
          settlementsByContractId.get(contract.id)?.unpaidValue,
          contract.currency,
        ),
    },
    {
      key: 'incoterm',
      header: 'Incoterm',
      // Wider than the header text alone needs — the filter plugin appends
      // an icon after it, and header cells always truncate (never wrap).
      width: pixel(140),
      filter: 'incoterm',
      renderCell: (contract) => `${contract.incoterm} ${contract.incotermYear}`,
    },
    {
      key: 'createdDate',
      header: 'Ngày ký',
      width: pixel(150),
      renderCell: (contract) => formatDisplayDate(contract.createdDate),
    },
    {
      key: 'quotationDate',
      header: 'Ngày báo giá',
      // Header cells always truncate (never wrap), so a column whose header
      // is longer than its data needs its own pixel floor rather than
      // proportional() — the 120px proportional minimum fits "2026-08-27"
      // fine but clips the label itself.
      width: pixel(150),
      renderCell: (contract) => formatDisplayDate(contract.quotationDate),
    },
    {
      key: 'category',
      header: 'Hạng mục',
      width: pixel(130),
      renderCell: (contract) => orDash(contract.category),
    },
    {
      key: 'countryName',
      header: 'Nước xuất khẩu',
      width: pixel(160),
      filter: 'countryName',
      renderCell: (contract) =>
        orDash(countriesById.get(contract.countryId)?.name),
    },
    {
      key: 'placeOfLoading',
      header: 'Nơi xếp hàng',
      width: pixel(150),
      renderCell: (contract) => orDash(contract.placeOfLoading),
    },
    {
      key: 'placeOfDischarge',
      header: 'Nơi dỡ hàng',
      width: pixel(140),
      filter: 'placeOfDischarge',
      renderCell: (contract) => orDash(contract.placeOfDischarge),
    },
    {
      key: 'paymentTerms',
      header: 'Đợt thanh toán',
      width: pixel(160),
      renderCell: (contract) => formatPaymentTerms(contract.paymentTerms),
    },
    {
      key: 'bankIds',
      header: 'Ngân hàng thụ hưởng',
      width: pixel(200),
      renderCell: (contract) =>
        contract.bankIds.length === 0
          ? '—'
          : `${contract.bankIds.length} ngân hàng`,
    },
    {
      key: 'actions',
      header: 'Chức năng',
      width: pixel(140),
      align: 'end',
      renderCell: (row) => (
        <RecordActionsMenu
          onView={() => {
            setExpandedTab('profile');
            setWorkspace({
              contract: row,
              sessionKey: generateRowKey(),
              mode: 'view',
            });
          }}
          onEdit={() => {
            setExpandedTab('profile');
            setWorkspace({
              contract: row,
              sessionKey: generateRowKey(),
              mode: 'edit',
            });
          }}
        />
      ),
    },
  ];

  const searchableContracts = contracts.map((contract) => ({
    ...contract,
    buyerCompanyName: contract.buyer.companyName,
    countryName: countriesById.get(contract.countryId)?.name ?? '',
    bankNames: contract.bankIds
      .map((bankId) => banksById.get(bankId)?.bankName)
      .filter(Boolean)
      .join(', '),
  }));

  const contract = workspace?.contract;

  const totalContracts = listResult?.success ? listResult.totalCount : 0;
  const totalPages = Math.max(
    1,
    listResult?.success ? listResult.totalPages : 1,
  );

  const isLoadingContracts = contractsQuery.isLoading;

  return (
    <VStack gap={4} hAlign="stretch">
      <HStack hAlign="between" vAlign="start" wrap="wrap" gap={3}>
        <VStack gap={1}>
          <Heading level={1}>Hợp đồng</Heading>
        </VStack>
        <HStack gap={2}>
          <IconButton
            label={
              isFullscreen
                ? 'Thu nhỏ danh sách hợp đồng'
                : 'Phóng to danh sách hợp đồng'
            }
            tooltip={isFullscreen ? 'Thu nhỏ' : 'Phóng to'}
            icon={
              <Icon icon={isFullscreen ? Minimize2 : Maximize2} size="sm" />
            }
            variant="secondary"
            onClick={toggleFullscreen}
          />
          <Button
            label="Tạo hợp đồng"
            variant="primary"
            onClick={() => {
              setExpandedTab('profile');
              setWorkspace({ contract: null, sessionKey: generateRowKey() });
            }}
          />
        </HStack>
      </HStack>

      {listResult && !listResult.success ? (
        <AdvanceTableErrorBanner message={listResult.message} />
      ) : null}

      <div ref={tableWrapperRef} style={{ position: 'relative' }}>
        <TableHeaderGroupBar
          containerRef={tableWrapperRef}
          groupKey={SETTLEMENT_GROUP_KEY}
          columnKeys={SETTLEMENT_GROUP_COLUMN_KEYS}
          label="GIÁ TRỊ"
        />
        <AdvanceTable
          toolbarLabel="Thao tác danh sách hợp đồng"
          searchFieldDefs={searchFieldDefsWithCustomers}
          entityLabel="Hợp đồng"
          contentSearchFieldKey="contractNumber"
          searchPlaceholder="Tìm số HĐ, dự án..."
          filterFieldDefs={filterFieldDefsWithCustomers}
          advancedFilterConditions={filterConditions}
          onAdvancedFilterChange={setFilterConditions}
          dividers="grid"
          columnOptions={COLUMN_OPTIONS}
          initialColumnKeys={DEFAULT_COLUMN_KEYS}
          defaultColumnKeys={DEFAULT_COLUMN_KEYS}
          fixedEndColumnKeys={['actions']}
          tableColumns={columns}
          data={searchableContracts}
          idKey="id"
          isLoading={isLoadingContracts}
          skeletonRows={skeletonRows}
          onRefresh={() => contractsQuery.refetch()}
          isRefreshing={contractsQuery.isFetching}
          summary={
            valueTotals.length > 0 ? (
              <HStack gap={2} vAlign="center" wrap="wrap">
                <Text weight="semibold">Tổng giá trị:</Text>
                {valueTotals.map((total) => (
                  <Text
                    key={total.currency}
                    weight="semibold"
                    hasTabularNumbers
                  >
                    {formatMoney(total.total, total.currency)}
                  </Text>
                ))}
              </HStack>
            ) : null
          }
          pagination={{
            pageIndex,
            pageSize,
            totalCount: totalContracts,
            totalPages,
            onPageIndexChange: setPageIndex,
            onPageSizeChange: setPageSize,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
          }}
        />
      </div>

      {workspace ? (
        <ContractFormDialog
          key={workspace.sessionKey}
          // Hidden (not unmounted — `CommonDialog`/`Dialog` keep children
          // mounted regardless of `isOpen`, see `ShipmentFormDialog`'s doc
          // comment) while a Shipment/Commission/BOQ opened from "Liên
          // quan" is showing, instead of stacking a second fullscreen
          // dialog (tasks 3.2/3.3). The short quick-add dialogs (annex/
          // payment/VGM) still stack on top — those stay "gọn" per
          // design.md section 3, not full workspaces of their own.
          isOpen={!shipmentDialog && !relatedCommissionDialog && !relatedBoqDialog}
          onOpenChange={(open) => {
            if (!open) setWorkspace(null);
          }}
          contract={workspace.contract}
          initialMode={workspace.mode}
          activeTab={expandedTab}
          onActiveTabChange={setExpandedTab}
          onSuccess={(saved) => {
            // Stays mounted (same `sessionKey`) — updates the Contract in
            // place instead of remounting the workspace just to fall back
            // to Xem; `ContractFormDialog` itself flips out of edit mode.
            setWorkspace((current) =>
              current ? { ...current, contract: saved } : current,
            );
          }}
        >
          {contract ? (
            <ContractExpandedDetails
              contract={contract}
              customersById={customersById}
              costCategoriesById={costCategoriesById}
              activeTab={expandedTab}
              onAddAnnex={() => setAnnexDialog({ contractId: contract.id })}
              onEditAnnex={(annex) =>
                setAnnexDialog({ contractId: contract.id, annex })
              }
              onAddPaymentSchedule={() =>
                setPaymentScheduleDialog({ contractId: contract.id })
              }
              onEditPaymentSchedule={(schedule) =>
                setPaymentScheduleDialog({ contractId: contract.id, schedule })
              }
              onAddShipment={() =>
                setShipmentDialog({ contractId: contract.id, contract })
              }
              onEditShipment={(shipment) =>
                setShipmentDialog({
                  contractId: contract.id,
                  contract,
                  shipment,
                })
              }
              onAddVgm={(payload) => setVgmDialog(payload)}
              onEditVgm={(payload) => setVgmDialog(payload)}
              onOpenCommission={(commission) =>
                setRelatedCommissionDialog({
                  contractId: contract.id,
                  currency: contract.currency,
                  commission,
                })
              }
              onOpenBoq={() =>
                setRelatedBoqDialog({
                  contractId: contract.id,
                  contractNumber: contract.contractNumber,
                })
              }
            />
          ) : null}
        </ContractFormDialog>
      ) : null}

      {relatedCommissionDialog ? (
        <CommissionFormDialog
          key={relatedCommissionDialog.commission?.id ?? 'create'}
          isOpen
          initialMode="view"
          onOpenChange={(isOpen) => {
            if (!isOpen) setRelatedCommissionDialog(null);
          }}
          contractId={relatedCommissionDialog.contractId}
          currency={relatedCommissionDialog.currency}
          commission={relatedCommissionDialog.commission}
          closeLabel="Quay lại Contract"
          onSuccess={(saved) =>
            setRelatedCommissionDialog((current) =>
              current ? { ...current, commission: saved } : current,
            )
          }
          onAddAnnex={() =>
            setCommissionAnnexDialog({
              contractId: relatedCommissionDialog.contractId,
            })
          }
          onEditAnnex={(annex) =>
            setCommissionAnnexDialog({
              contractId: relatedCommissionDialog.contractId,
              annex,
            })
          }
          onAddPayment={() =>
            relatedCommissionDialog.commission &&
            setCommissionPaymentDialog({
              contractId: relatedCommissionDialog.contractId,
              currency: relatedCommissionDialog.currency,
              commission: relatedCommissionDialog.commission,
            })
          }
        />
      ) : null}

      {relatedBoqDialog ? (
        <ContractPrivateInfoDetailDialog
          key={relatedBoqDialog.contractId}
          contractId={relatedBoqDialog.contractId}
          contractNumber={relatedBoqDialog.contractNumber}
          closeLabel="Quay lại Contract"
          onOpenChange={(isOpen) => {
            if (!isOpen) setRelatedBoqDialog(null);
          }}
        />
      ) : null}

      {/* Related editors stay outside tables (ADR-0004). */}

      {shipmentDialog ? (
        <ShipmentFormDialog
          key={shipmentDialog.shipment?.id ?? 'create'}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setShipmentDialog(null);
          }}
          contractId={shipmentDialog.contractId}
          contract={shipmentDialog.contract}
          shipment={shipmentDialog.shipment}
          closeLabel="Quay lại Contract"
          onSuccess={(saved) =>
            setShipmentDialog((current) =>
              current?.shipment ? { ...current, shipment: saved } : null,
            )
          }
        />
      ) : null}

      {annexDialog ? (
        <ContractAnnexFormDialog
          key={annexDialog.annex?.id ?? 'create'}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setAnnexDialog(null);
          }}
          contractId={annexDialog.contractId}
          annex={annexDialog.annex}
          onSuccess={() => setAnnexDialog(null)}
        />
      ) : null}

      {paymentScheduleDialog ? (
        <PaymentScheduleFormDialog
          key={paymentScheduleDialog.schedule?.id ?? 'create'}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setPaymentScheduleDialog(null);
          }}
          contractId={paymentScheduleDialog.contractId}
          schedule={paymentScheduleDialog.schedule}
          onSuccess={() => setPaymentScheduleDialog(null)}
        />
      ) : null}

      {commissionAnnexDialog ? (
        <CommissionAnnexFormDialog
          key={commissionAnnexDialog.annex?.id ?? 'create'}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setCommissionAnnexDialog(null);
          }}
          contractId={commissionAnnexDialog.contractId}
          annex={commissionAnnexDialog.annex}
          onSuccess={() => setCommissionAnnexDialog(null)}
        />
      ) : null}

      {commissionPaymentDialog ? (
        <CommissionPaymentQuickAddDialog
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setCommissionPaymentDialog(null);
          }}
          contractId={commissionPaymentDialog.contractId}
          commission={commissionPaymentDialog.commission}
          currency={commissionPaymentDialog.currency}
          onSuccess={() => setCommissionPaymentDialog(null)}
        />
      ) : null}

      {vgmDialog ? (
        <ShipmentVgmFormDialog
          key={vgmDialog.vgm?.id ?? 'create'}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setVgmDialog(null);
          }}
          contractId={vgmDialog.contractId}
          shipmentId={vgmDialog.shipmentId}
          vgm={vgmDialog.vgm}
          onSuccess={() => setVgmDialog(null)}
        />
      ) : null}
    </VStack>
  );
}
