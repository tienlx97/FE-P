'use client';
/** @typedef {'info' | 'paymentSchedule' | 'shipment' | 'commission' | 'privateInfo'} ExpandedTab */
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
import { createRowExpansionInteractionPlugin } from '@/shared/components/expandable-row-styles.jsx';
import { useFullscreenToggle } from '@/shared/components/fullscreen-panel.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

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
import { CommissionPaymentQuickAddDialog } from './commission-payment-quick-add-dialog.jsx';
import { ContractAnnexFormDialog } from './contract-annex-form-dialog.jsx';
import { ContractExpandedDetails } from './contract-expanded-details.jsx';
import { ContractFormDialog } from './contract-form-dialog.jsx';
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

/** Contract workspace and related editors are siblings of the table so
 * Selector portals remain inside their dialog layers (ADR-0004). */
export function ContractsList() {
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreenToggle();
  const [workspace, setWorkspace] = useState(
    /** @type {{ mode?: 'view' | 'edit', contract: import('../types/index.js').Contract | null, revision: number } | null} */ (
      null
    ),
  );
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(1);
  const [filterConditions, setFilterConditions] = useState(
    /** @type {import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]} */ ([]),
  );
  const [expandedTab, setExpandedTab] = useState(
    /** @type {ExpandedTab} */ ('info'),
  );
  // Bridges "Thông tin private"/"Commission" tabs' own edit state up to
  // `ContractFormDialog`'s footer (see `ContractPrivateInfoPanel`'s doc
  // comment) — each ref triggers start/cancel/submit on its panel, each
  // status state mirrors it back down for the footer's label/loading/
  // disabled props. Neither status is reset on tab change — harmless
  // staleness: `ContractFormDialog` only ever reads one of these through
  // `activeTabEditController`, computed below from `expandedTab`.
  const privateInfoPanelRef = useRef(
    /** @type {{ startEditing: () => void, cancelEditing: () => void, submit: () => void } | null} */ (
      null
    ),
  );
  const [privateInfoStatus, setPrivateInfoStatus] = useState(
    /** @type {{ isEditing: boolean, isSubmitting: boolean, submitLabel: string } | null} */ (
      null
    ),
  );
  const commissionPanelRef = useRef(
    /** @type {{ startEditing: () => void, cancelEditing: () => void, submit: () => void } | null} */ (
      null
    ),
  );
  const [commissionStatus, setCommissionStatus] = useState(
    /** @type {{ isEditing: boolean, isSubmitting: boolean, submitLabel: string } | null} */ (
      null
    ),
  );
  /** @type {{ status: { isEditing: boolean, isSubmitting: boolean, submitLabel: string } | null, startEditing: () => void, cancelEditing: () => void, submit: () => void } | null} */
  const activeTabEditController =
    expandedTab === 'privateInfo'
      ? {
          status: privateInfoStatus,
          startEditing: () => privateInfoPanelRef.current?.startEditing(),
          cancelEditing: () => privateInfoPanelRef.current?.cancelEditing(),
          submit: () => privateInfoPanelRef.current?.submit(),
        }
      : expandedTab === 'commission'
        ? {
            status: commissionStatus,
            startEditing: () => commissionPanelRef.current?.startEditing(),
            cancelEditing: () => commissionPanelRef.current?.cancelEditing(),
            submit: () => commissionPanelRef.current?.submit(),
          }
        : null;
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
      renderCell: (contract) => (
        <Button
          label={contract.contractNumber}
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            setExpandedTab('info');
            setWorkspace({ contract, revision: 0 });
          }}
        />
      ),
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
      // Fixed width, not proportional — a money value is compact and
      // doesn't need to flex; letting `projectName`/`buyer` (both
      // `proportional(1.4)`) be the only two columns sharing the table's
      // leftover width keeps every column's width intentional instead of
      // one absorbing slack it doesn't need (see the "Harness gaps" note
      // in `harness/PROGRESS.md` about mixing `pixel()`/`proportional()`).
      header: 'Giá trị',
      width: proportional(1),
      // align: 'end',
      filter: 'contractValue',
      renderCell: (contract) =>
        formatMoney(contract.contractValue, contract.currency),
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
      header: 'Ngày tạo',
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
            setExpandedTab('info');
            setWorkspace({ contract: row, revision: 0, mode: 'view' });
          }}
          onEdit={() => {
            setExpandedTab('info');
            setWorkspace({ contract: row, revision: 0, mode: 'edit' });
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
  const rowInteractionPlugin = useMemo(
    /** @returns {import('@astryxdesign/core/Table').TablePlugin<import('../types/index.js').Contract & Record<string, unknown>>} */
    () => {
      /** @type {import('@astryxdesign/core/Table').TablePlugin<import('../types/index.js').Contract & Record<string, unknown>>} */
      const interaction = createRowExpansionInteractionPlugin({
        expandedId: null,
        onToggle: (id) => {
          const selected = contracts.find((item) => item.id === id);
          if (selected) {
            setExpandedTab('info');
            setWorkspace({ contract: selected, revision: 0 });
          }
        },
        isExpandable: (item) => !item.id.startsWith('skeleton-'),
      });
      return {
        ...interaction,
        transformBodyRow: (props, row, context) => {
          const result =
            interaction.transformBodyRow?.(props, row, context) ?? props;
          return {
            ...result,
            htmlProps: {
              ...result.htmlProps,
              'aria-expanded': undefined,
              'aria-haspopup': 'dialog',
            },
          };
        },
      };
    },
    [contracts],
  );

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
              setExpandedTab('info');
              setWorkspace({ contract: null, revision: 0 });
            }}
          />
        </HStack>
      </HStack>

      {listResult && !listResult.success ? (
        <AdvanceTableErrorBanner message={listResult.message} />
      ) : null}

      <AdvanceTable
        toolbarLabel="Thao tác danh sách hợp đồng"
        searchFieldDefs={SEARCH_FIELD_DEFS}
        entityLabel="Hợp đồng"
        contentSearchFieldKey="contractNumber"
        searchPlaceholder="Tìm số HĐ, dự án..."
        filterFieldDefs={FILTER_FIELD_DEFS}
        advancedFilterConditions={filterConditions}
        onAdvancedFilterChange={setFilterConditions}
        columnOptions={COLUMN_OPTIONS}
        initialColumnKeys={DEFAULT_COLUMN_KEYS}
        defaultColumnKeys={DEFAULT_COLUMN_KEYS}
        fixedEndColumnKeys={['actions']}
        tableColumns={columns}
        data={searchableContracts}
        idKey="id"
        isLoading={isLoadingContracts}
        skeletonRows={skeletonRows}
        extraPlugins={{
          rowInteraction: rowInteractionPlugin,
        }}
        onRefresh={() => contractsQuery.refetch()}
        isRefreshing={contractsQuery.isFetching}
        summary={
          valueTotals.length > 0 ? (
            <HStack gap={2} vAlign="center" wrap="wrap">
              <Text weight="semibold">Tổng giá trị:</Text>
              {valueTotals.map((total) => (
                <Text key={total.currency} weight="semibold" hasTabularNumbers>
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

      {workspace ? (
        <ContractFormDialog
          key={`${workspace.contract?.id ?? 'create'}-${workspace.revision}`}
          isOpen
          onOpenChange={(open) => {
            if (!open) setWorkspace(null);
          }}
          contract={workspace.contract}
          initialMode={workspace.mode}
          activeTab={expandedTab}
          onActiveTabChange={setExpandedTab}
          onAddAnnex={() =>
            contract && setAnnexDialog({ contractId: contract.id })
          }
          onEditAnnex={(annex) =>
            contract && setAnnexDialog({ contractId: contract.id, annex })
          }
          onSuccess={(saved) => {
            setExpandedTab('info');
            setWorkspace({ contract: saved, revision: workspace.revision + 1 });
          }}
          activeTabEditController={activeTabEditController}
        >
          {contract ? (
            <ContractExpandedDetails
              contract={contract}
              customersById={customersById}
              costCategoriesById={costCategoriesById}
              activeTab={expandedTab}
              privateInfoPanelRef={privateInfoPanelRef}
              onPrivateInfoStatusChange={setPrivateInfoStatus}
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
              commissionPanelRef={commissionPanelRef}
              onCommissionStatusChange={setCommissionStatus}
              onAddCommissionAnnex={() =>
                setCommissionAnnexDialog({ contractId: contract.id })
              }
              onEditCommissionAnnex={(annex) =>
                setCommissionAnnexDialog({ contractId: contract.id, annex })
              }
              onAddCommissionPayment={(commission) =>
                setCommissionPaymentDialog({
                  contractId: contract.id,
                  currency: contract.currency,
                  commission,
                })
              }
            />
          ) : null}
        </ContractFormDialog>
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
          onSuccess={() => setShipmentDialog(null)}
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
