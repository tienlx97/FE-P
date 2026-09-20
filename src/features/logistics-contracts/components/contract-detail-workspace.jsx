'use client';
import { Banner } from '@astryxdesign/core/Banner';
import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { InfoTip } from '@astryxdesign/lab';
import {
  CalendarDays,
  CircleDollarSign,
  Download,
  FileText,
  Hourglass,
  LayoutDashboard,
  Package,
  Paperclip,
  Percent,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useId, useState } from 'react';

import {
  MaritimeContractOverviewCard,
  MaritimeTabNav,
  MaritimeThemeProvider,
} from '@/shared/components/custom/maritime/index.js';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import {
  labelForContractStatus,
  statusDotVariantForContractStatus,
} from '../config/contract-status.js';
import { labelForContractType } from '../config/contract-types.js';
import { formatMoney } from '../config/currencies.js';
import { reasonContractIneligibleForShipment } from '../config/shipment-contract-eligibility.js';
import { useCommissionQuery } from '../hooks/use-commission-query.js';
import { useContractQuery } from '../hooks/use-contracts-query.js';
import { CommissionFormDialog } from './commission-form-dialog.jsx';
import { ContractAnnexFormDialog } from './contract-annex-form-dialog.jsx';
import { ContractCommissionPanel } from './contract-commission-panel.jsx';
import { ContractFormDialog } from './contract-form-dialog.jsx';
import { ContractMaritimeAnnexesPanel } from './contract-maritime-annexes-panel.jsx';
import { ContractOverviewPanel } from './contract-overview-panel.jsx';
import { ContractPaymentsPanel } from './contract-payments-panel.jsx';
import { ContractShipmentsPanel } from './contract-shipments-panel.jsx';
import { ShipmentFormDialog } from './shipment-form-dialog.jsx';

/** @param {string} status */
function maritimeToneForContractStatus(status) {
  if (status === 'Completed') return 'blue';
  if (status === 'InProgress') return 'success';
  if (status === 'Cancelled') return 'error';
  return 'neutral';
}

/** @typedef {'overview' | 'annexes' | 'payments' | 'shipments' | 'commission'} DetailTab */

const TAB_LABELS = {
  overview: 'Tổng quan & Tiến độ',
  annexes: 'Phụ lục',
  payments: 'Thanh toán',
  shipments: 'Lô hàng',
  commission: 'Hoa hồng',
};

const TAB_ICONS = {
  overview: LayoutDashboard,
  annexes: Paperclip,
  payments: CircleDollarSign,
  shipments: Package,
  commission: Percent,
};

const TAB_VALUES = /** @type {DetailTab[]} */ (Object.keys(TAB_LABELS));

const DETAIL_TABS = TAB_VALUES.map((id) => ({
  id,
  label: TAB_LABELS[id],
  icon: TAB_ICONS[id],
}));

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
    <MaritimeThemeProvider>
      <PageContentShell isFullWidth>
        <VStack gap={4} hAlign="stretch">
          <Breadcrumbs>
            <BreadcrumbItem href="/logistics">Logistics</BreadcrumbItem>
            <BreadcrumbItem href="/logistics/contracts">
              Hợp đồng
            </BreadcrumbItem>
            <BreadcrumbItem isCurrent>
              {contract?.contractNumber ?? '…'}
            </BreadcrumbItem>
          </Breadcrumbs>

          {contractQuery.isLoading ? (
            <HStack hAlign="center" paddingBlock={6}>
              <Spinner label="Đang tải hợp đồng" />
            </HStack>
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
    </MaritimeThemeProvider>
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

  return (
    <>
      <VStack gap={3} hAlign="stretch">
        <MaritimeContractOverviewCard
          contractCode={contract.contractNumber}
          projectName={contract.projectName}
          typeLabel={labelForContractType(contract.contractType)}
          typeTone={contract.contractType === 'Official' ? 'blue' : 'neutral'}
          statusLabel={labelForContractStatus(contract.status)}
          statusTone={maritimeToneForContractStatus(contract.status)}
          statusDotVariant={statusDotVariantForContractStatus(contract.status)}
          incotermLabel={`${contract.incoterm} ${contract.incotermYear}`}
          onExportPdf={() => window.print()}
          onEdit={() => setIsEditDrawerOpen(true)}
          actionsLabel="Thao tác nghiệp vụ"
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
          meta={
            <HStack gap={3} vAlign="center" wrap="wrap">
              <HStack gap={1.5} vAlign="center">
                <Icon icon={CalendarDays} size="sm" color="secondary" />
                <Text color="secondary">
                  Ngày ký:{' '}
                  <Text weight="semibold">
                    {formatDisplayDate(contract.createdDate)}
                  </Text>
                </Text>
              </HStack>
              <Text color="secondary">•</Text>
              <HStack gap={1.5} vAlign="center">
                <Icon icon={Hourglass} size="sm" color="secondary" />
                <Text color="secondary">
                  Ngày hoàn thành dự án:{' '}
                  <Text weight="semibold">
                    {contract.projectCompletionDate
                      ? formatDisplayDate(contract.projectCompletionDate)
                      : 'Chưa hoàn thành'}
                  </Text>
                </Text>
              </HStack>
            </HStack>
          }
        />

        <MaritimeTabNav
          tabs={DETAIL_TABS}
          // Sticks just under the app's fixed 64px top bar.
          stickyOffset={64}
          activeId={activeTab}
          onChange={(tab) => onActiveTabChange(/** @type {DetailTab} */ (tab))}
        />

        <section
          id={panelId}
          role="tabpanel"
          aria-label={TAB_LABELS[activeTab]}
        >
          {activeTab === 'overview' ? (
            <ContractOverviewPanel
              contract={contract}
              onViewAllAnnexes={() => onActiveTabChange('annexes')}
              onViewPayments={() => onActiveTabChange('payments')}
              onViewCommission={() => onActiveTabChange('commission')}
              onCreateCommission={() => setIsAddingCommission(true)}
            />
          ) : null}
          {activeTab === 'annexes' ? (
            <ContractMaritimeAnnexesPanel contract={contract} />
          ) : null}
          {activeTab === 'payments' ? (
            <ContractPaymentsPanel contract={contract} />
          ) : null}
          {activeTab === 'commission' ? (
            <ContractCommissionPanel contract={contract} />
          ) : null}
          {activeTab === 'shipments' ? (
            <ContractShipmentsPanel contract={contract} />
          ) : null}
        </section>
      </VStack>

      {isEditDrawerOpen ? (
        <ContractFormDialog
          isOpen
          onOpenChange={(open) => setIsEditDrawerOpen(open)}
          contract={contract}
          activeTab="profile"
          onActiveTabChange={() => {}}
          initialMode="edit"
          onSuccess={() => setIsEditDrawerOpen(false)}
        />
      ) : null}

      {isAddingShipment ? (
        <ShipmentFormDialog
          isOpen
          onOpenChange={(open) => {
            if (!open) setIsAddingShipment(false);
          }}
          contractId={contract.id}
          contract={contract}
          closeLabel="Quay lại Contract"
          onSuccess={() => setIsAddingShipment(false)}
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
        <CommissionFormDialog
          isOpen
          onOpenChange={(open) => {
            if (!open) setIsAddingCommission(false);
          }}
          contractId={contract.id}
          contractNumber={contract.contractNumber}
          projectName={contract.projectName}
          currency={contract.currency}
          closeLabel="Quay lại Contract"
          onSuccess={() => setIsAddingCommission(false)}
        />
      ) : null}
    </>
  );
}
