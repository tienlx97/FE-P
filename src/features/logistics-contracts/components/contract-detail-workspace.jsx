'use client';
import { Banner } from '@astryxdesign/core/Banner';
import { Icon } from '@astryxdesign/core/Icon';
import { VStack } from '@astryxdesign/core/VStack';
import { InfoTip } from '@astryxdesign/lab';
import {
  Banknote,
  ClipboardList,
  Download,
  FilePen,
  FileText,
  Landmark,
  LayoutGrid,
  Package,
  Percent,
  Ship,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useId, useState } from 'react';

import {
  MetaContractBreadcrumb,
  MetaContractDetailSkeleton,
  MetaContractHeaderCard,
  MetaTabNav,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';
import { useSessionPermissions } from '@/shared/hooks/use-session-permissions.js';

import {
  labelForContractStatus,
  metaToneForContractStatus,
} from '../config/contract-status.js';
import { labelForContractType } from '../config/contract-types.js';
import { formatMoney } from '../config/currencies.js';
import { reasonContractIneligibleForShipment } from '../config/shipment-contract-eligibility.js';
import { useCommissionQuery } from '../hooks/use-commission-query.js';
import { useContractQuery } from '../hooks/use-contracts-query.js';
import { CommissionFormDrawer } from './commission-form-drawer.jsx';
import { ContractAnnexFormDialog } from './contract-annex-form-dialog.jsx';
import { ContractBoqPanel } from './contract-boq-panel.jsx';
import { ContractCommissionPanel } from './contract-commission-panel.jsx';
import { ContractDetailAnnexesPanel } from './contract-detail-annexes-panel.jsx';
import { ContractFormDialog } from './contract-form-dialog.jsx';
import { ContractOverviewPanel } from './contract-overview-panel.jsx';
import { ContractPaymentsPanel } from './contract-payments-panel.jsx';
import { ContractShipmentsPanel } from './contract-shipments-panel.jsx';
import { ShipmentFormDrawer } from './shipment-form-drawer.jsx';

/** @typedef {'overview' | 'payments' | 'shipments' | 'annexes' | 'commission' | 'boq'} DetailTab */

// BOQ is the contract's private info — only for `logistics:secret`.
const LOGISTICS_SECRET_PERMISSION = 'logistics:secret';

// Order and labels follow the Meta Figma tab bar (node 89:1064).
const TAB_LABELS = {
  overview: 'Tổng quan & Tiến độ',
  payments: 'Tiến độ thanh toán',
  shipments: 'Lô hàng (Shipment)',
  annexes: 'Phụ lục (Annex)',
  commission: 'Hoa hồng (Commission)',
  boq: 'BOQ',
};

const TAB_ICONS = {
  overview: LayoutGrid,
  payments: Landmark,
  shipments: Ship,
  annexes: FilePen,
  commission: Banknote,
  boq: ClipboardList,
};

const TAB_VALUES = /** @type {DetailTab[]} */ (Object.keys(TAB_LABELS));

const CSV_BOM = String.fromCharCode(0xfeff);

/** @param {string} value */
function escapeCsvCell(value) {
  const needsQuoting = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}

/**
 * "Xuất" for one Contract — a single-row CSV of its summary fields, same
 * BOM/escaping approach as `customer-contract-history.jsx`'s own export
 * (no shared helper module exists for this one-off shape yet).
 * @param {import('../types/index.js').Contract} contract
 */
function exportContractCsv(contract) {
  const headerRow = [
    'Số hợp đồng',
    'Dự án',
    'Trạng thái',
    'Loại hợp đồng',
    'Giá trị',
    'Incoterm',
  ];
  const dataRow = [
    contract.contractNumber,
    contract.projectName,
    labelForContractStatus(contract.status),
    labelForContractType(contract.contractType),
    formatMoney(contract.contractValue, contract.currency),
    `${contract.incoterm} ${contract.incotermYear}`,
  ];
  const csv = [headerRow, dataRow]
    .map((cells) =>
      cells.map((value) => escapeCsvCell(String(value))).join(','),
    )
    .join('\r\n');
  const blob = new Blob([CSV_BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hop-dong-${contract.contractNumber}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * `/logistics/contract/[id]` — the Contract detail page
 * (`openspec/changes/add-contract-detail-page/`), replacing the dialog
 * cross-links that used to render broken (bug 1: tabs with no `children`)
 * and giving every Contract a real, shareable URL (bug 2). Renders the
 * same operational tabs as the old detail dialog, plus a new "Tổng quan"
 * tab, under page chrome instead of dialog chrome.
 * @param {{ contractId: string }} props
 */
export function ContractDetailWorkspace({ contractId }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialMode = searchParams.get('mode') === 'edit' ? 'edit' : 'view';
  const requestedTab = searchParams.get('tab');
  const [activeTab, setActiveTabState] = useState(
    /** @type {DetailTab} */ (
      TAB_VALUES.includes(/** @type {DetailTab} */ (requestedTab))
        ? requestedTab
        : 'overview'
    ),
  );
  /** @param {DetailTab} tab */
  function setActiveTab(tab) {
    setActiveTabState(tab);
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  }

  const contractQuery = useContractQuery(contractId);

  const contract =
    contractQuery.data?.success && contractQuery.data.contract.id === contractId
      ? contractQuery.data.contract
      : null;

  return (
    <MetaThemeProvider>
      <PageContentShell isFullWidth>
        <VStack gap={4} hAlign="stretch">
          <MetaContractBreadcrumb
            backHref="/logistics/contracts"
            onBack={() => router.back()}
            currentLabel={contract?.contractNumber ?? '…'}
          />

          {contractQuery.isLoading ? (
            <MetaContractDetailSkeleton tab={activeTab} />
          ) : !contract ? (
            <Banner
              status="error"
              title={
                contractQuery.data && !contractQuery.data.success
                  ? contractQuery.data.message
                  : 'Không tìm thấy hợp đồng.'
              }
              container="card"
            />
          ) : (
            <ContractDetailBody
              contract={contract}
              activeTab={activeTab}
              onActiveTabChange={setActiveTab}
              initialMode={initialMode}
            />
          )}
        </VStack>
      </PageContentShell>
    </MetaThemeProvider>
  );
}

/**
 * Split out from `ContractDetailWorkspace` so the edit drawer only mounts
 * after the requested contract has loaded.
 * @param {{
 *   contract: import('../types/index.js').Contract,
 *   activeTab: DetailTab,
 *   onActiveTabChange: (tab: DetailTab) => void,
 *   initialMode: 'view' | 'edit',
 * }} props
 */
function ContractDetailBody({
  contract,
  activeTab,
  onActiveTabChange,
  initialMode,
}) {
  const panelId = useId();
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(
    initialMode === 'edit',
  );

  // Backs the "Thêm mới" dropdown's 3 quick-create entrypoints — separate,
  // lightweight dialog state from `ContractRelatedEntitiesPanel`'s own
  // (which back the "Liên quan" tab's per-row add/edit instead).
  const [isAddingShipment, setIsAddingShipment] = useState(false);
  const [isAddingAnnex, setIsAddingAnnex] = useState(false);
  const [isAddingCommission, setIsAddingCommission] = useState(false);

  const shipmentIneligibleReason =
    reasonContractIneligibleForShipment(contract);
  const commissionQuery = useCommissionQuery(contract.id);
  const hasCommission = Boolean(
    commissionQuery.data?.success && commissionQuery.data.exists,
  );
  const hasLogisticsSecret = useSessionPermissions().includes(
    LOGISTICS_SECRET_PERMISSION,
  );
  const detailTabs = useDetailTabs(hasLogisticsSecret);
  // A `?tab=boq` link opened without the permission falls back to overview.
  const visibleTab =
    activeTab === 'boq' && !hasLogisticsSecret ? 'overview' : activeTab;

  return (
    <>
      <VStack gap={3} hAlign="stretch">
        <MetaContractHeaderCard
          contractCode={contract.contractNumber}
          projectName={contract.projectName}
          typeLabel={labelForContractType(contract.contractType).toUpperCase()}
          typeTone={contract.contractType === 'Official' ? 'accent' : 'neutral'}
          statusLabel={labelForContractStatus(contract.status).toUpperCase()}
          statusTone={metaToneForContractStatus(contract.status)}
          incotermLabel={`${contract.incoterm} ${contract.incotermYear}`}
          onExportPdf={() => window.print()}
          onEdit={() => setIsEditDrawerOpen(true)}
          actionItems={[
            {
              id: 'shipment',
              label: 'Thêm Shipment',
              icon: <Icon icon={Package} size="sm" />,
              isDisabled: Boolean(shipmentIneligibleReason),
              endContent: shipmentIneligibleReason ? (
                <InfoTip content={shipmentIneligibleReason} />
              ) : undefined,
              onClick: () => setIsAddingShipment(true),
            },
            {
              id: 'annex',
              label: 'Thêm Phụ lục',
              icon: <Icon icon={FileText} size="sm" />,
              onClick: () => setIsAddingAnnex(true),
            },
            {
              id: 'commission',
              label: 'Tạo Commission',
              icon: <Icon icon={Percent} size="sm" />,
              isDisabled: hasCommission,
              endContent: hasCommission ? (
                <InfoTip content="Hợp đồng đã có Commission" />
              ) : undefined,
              onClick: () => setIsAddingCommission(true),
            },
            {
              id: 'export-csv',
              label: 'Xuất CSV',
              icon: <Icon icon={Download} size="sm" />,
              onClick: () => exportContractCsv(contract),
            },
          ]}
        />

        <MetaTabNav
          tabs={detailTabs}
          activeId={visibleTab}
          panelId={panelId}
          onChange={(tab) => onActiveTabChange(/** @type {DetailTab} */ (tab))}
        />

        <section
          id={panelId}
          role="tabpanel"
          aria-label={TAB_LABELS[visibleTab]}
        >
          {visibleTab === 'overview' ? (
            <ContractOverviewPanel
              contract={contract}
              onViewAllAnnexes={() => onActiveTabChange('annexes')}
              onViewPayments={() => onActiveTabChange('payments')}
              onViewCommission={() => onActiveTabChange('commission')}
              onCreateCommission={() => setIsAddingCommission(true)}
            />
          ) : null}
          {visibleTab === 'payments' ? (
            <ContractPaymentsPanel contract={contract} />
          ) : null}
          {visibleTab === 'shipments' ? (
            <ContractShipmentsPanel contract={contract} />
          ) : null}
          {visibleTab === 'commission' ? (
            <ContractCommissionPanel contract={contract} />
          ) : null}
          {visibleTab === 'annexes' ? (
            <ContractDetailAnnexesPanel contract={contract} />
          ) : null}
          {visibleTab === 'boq' ? (
            <ContractBoqPanel contract={contract} />
          ) : null}
        </section>
      </VStack>

      {/* Dialogs portal out of the page tree, so they re-apply Meta. */}
      <MetaThemeProvider>
        {isEditDrawerOpen ? (
          <ContractFormDialog
            isOpen
            onOpenChange={(open) => setIsEditDrawerOpen(open)}
            contract={contract}
            activeTab="profile"
            onActiveTabChange={() => {}}
            initialMode="edit"
            closeOnCancel
            onSuccess={() => setIsEditDrawerOpen(false)}
          />
        ) : null}

        {isAddingShipment ? (
          <ShipmentFormDrawer
            contract={contract}
            onClose={() => setIsAddingShipment(false)}
          />
        ) : null}

        {isAddingAnnex ? (
          <ContractAnnexFormDialog
            isOpen
            onOpenChange={(open) => {
              if (!open) setIsAddingAnnex(false);
            }}
            contractId={contract.id}
            onSuccess={() => setIsAddingAnnex(false)}
          />
        ) : null}

        {isAddingCommission ? (
          <CommissionFormDrawer
            contract={contract}
            onClose={() => setIsAddingCommission(false)}
          />
        ) : null}
      </MetaThemeProvider>
    </>
  );
}

/**
 * Tab bar entries — plain labels + icons, no count pills.
 * @param {boolean} hasLogisticsSecret shows the BOQ tab
 */
function useDetailTabs(hasLogisticsSecret) {
  return TAB_VALUES.filter((id) => id !== 'boq' || hasLogisticsSecret).map(
    (id) => ({ id, label: TAB_LABELS[id], icon: TAB_ICONS[id] }),
  );
}
