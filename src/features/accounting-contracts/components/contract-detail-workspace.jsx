'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Icon } from '@astryxdesign/core/Icon';
import { VStack } from '@astryxdesign/core/VStack';
import {
  Banknote,
  CircleCheck,
  CirclePlus,
  ClipboardClock,
  FileCheck2,
  FileText,
  LayoutGrid,
  ListChecks,
  Paperclip,
  ReceiptText,
  Trash2,
  TrendingDown,
  TrendingUp,
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
import { accountingContractTrail } from '@/shared/config/breadcrumbs.js';

import { contractMetrics, contractStatus } from '../config/contract-view.js';
import {
  useContractQuery,
  useDeleteContractMutation,
} from '../hooks/use-contracts.js';
import { AppendicesPanel } from './appendices-panel.jsx';
import { ConfirmDeleteDialog } from './confirm-delete-dialog.jsx';
import { ContractFormDialog } from './contract-form-dialog.jsx';
import { ContractOverviewPanel } from './contract-overview-panel.jsx';
import { InstallmentsPanel } from './installments-panel.jsx';
import { InvoicesPanel } from './invoices-panel.jsx';

/** @typedef {'overview' | 'installments' | 'invoices' | 'appendices'} DetailTab */

const TAB_LABELS = {
  overview: 'Tổng quan',
  installments: 'Đợt thanh toán',
  invoices: 'Hoá đơn',
  appendices: 'Phụ lục',
};

const TAB_ICONS = {
  overview: LayoutGrid,
  installments: ListChecks,
  invoices: ReceiptText,
  appendices: Paperclip,
};

const TAB_VALUES = /** @type {DetailTab[]} */ (Object.keys(TAB_LABELS));

const METRIC_ICONS = {
  settlement: FileCheck2,
  invoice: ReceiptText,
  paid: CircleCheck,
  unpaid: ClipboardClock,
  base: Banknote,
  up: TrendingUp,
  down: TrendingDown,
};

/**
 * Kế toán contract page, laid out like the Logistics contract page:
 * breadcrumb with "Quay lại", header card (number, status pill, project,
 * "Chỉnh sửa" and "+ Thao tác"), pill tabs — Tổng quan (KPI cards +
 * contract information), Đợt thanh toán, Hoá đơn, Phụ lục. `?tab=` keeps
 * the tab across reloads.
 * @param {{ contractId: string }} props
 */
export function AccountingContractDetailWorkspace({ contractId }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const panelId = useId();

  const requestedTab = /** @type {DetailTab} */ (searchParams.get('tab'));
  const activeTab = TAB_VALUES.includes(requestedTab)
    ? requestedTab
    : 'overview';
  /** Opens a tab's create dialog from "+ Thao tác". */
  const [createRequest, setCreateRequest] = useState(
    /** @type {{ tab: DetailTab, key: number } | null} */ (null),
  );
  /** @param {DetailTab} tab */
  function setActiveTab(tab) {
    // A pending "+ Thao tác" create belongs to the click that asked for it.
    setCreateRequest(null);
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  }

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const contractQuery = useContractQuery(contractId);
  const deleteMutation = useDeleteContractMutation();
  const result = contractQuery.data;
  const detail = result?.success ? result.data : null;
  const contract = detail?.contract ?? null;

  /** @param {DetailTab} tab */
  function requestCreate(tab) {
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
    setCreateRequest({ tab, key: Date.now() });
  }

  return (
    <MetaThemeProvider>
      <PageContentShell isFullWidth>
        <VStack gap={3} hAlign="stretch">
          <MetaContractBreadcrumb
            trail={accountingContractTrail({
              contractNumber: contract?.contractNumber,
            })}
          />

          {contractQuery.isLoading ? (
            <MetaContractDetailSkeleton label="Đang tải hợp đồng" tab="other" />
          ) : null}
          {result && !result.success ? (
            <Banner status="error" title={result.message} container="card" />
          ) : null}

          {detail && contract ? (
            <>
              <MetaContractHeaderCard
                contractCode={contract.contractNumber}
                projectName={`${contract.projectCode} · ${contract.projectName}`}
                projectIcon={FileText}
                typeLabel="KẾ TOÁN"
                typeTone="neutral"
                statusLabel={contractStatus(contract).label}
                statusTone={contractStatus(contract).tone}
                incotermLabel={`Thuế ${contract.taxRatePercent}%`}
                copyAriaLabel="Sao chép số hợp đồng"
                copyAnnounce="Đã sao chép số hợp đồng"
                onExportPdf={() => window.print()}
                onEdit={() => setIsEditOpen(true)}
                actionItems={[
                  {
                    id: 'installment',
                    label: 'Thêm đợt thanh toán',
                    icon: <Icon icon={CirclePlus} size="sm" />,
                    onClick: () => requestCreate('installments'),
                  },
                  {
                    id: 'invoice',
                    label: 'Thêm hoá đơn',
                    icon: <Icon icon={ReceiptText} size="sm" />,
                    onClick: () => requestCreate('invoices'),
                  },
                  {
                    id: 'appendix',
                    label: 'Thêm phụ lục',
                    icon: <Icon icon={Paperclip} size="sm" />,
                    onClick: () => requestCreate('appendices'),
                  },
                  {
                    id: 'delete',
                    label: 'Xoá hợp đồng',
                    icon: <Icon icon={Trash2} size="sm" />,
                    onClick: () => setIsDeleting(true),
                  },
                ]}
              />

              <MetaTabNav
                tabs={TAB_VALUES.map((id) => ({
                  id,
                  label: TAB_LABELS[id],
                  icon: TAB_ICONS[id],
                }))}
                activeId={activeTab}
                panelId={panelId}
                onChange={(tab) => setActiveTab(/** @type {DetailTab} */ (tab))}
              />

              <section
                id={panelId}
                role="tabpanel"
                aria-label={TAB_LABELS[activeTab]}
              >
                {(() => {
                  const metrics = contractMetrics(detail, METRIC_ICONS);
                  const createKey =
                    createRequest?.tab === activeTab ? createRequest.key : null;
                  switch (activeTab) {
                    case 'overview':
                      return (
                        <ContractOverviewPanel
                          detail={detail}
                          metrics={metrics}
                          onOpenTab={setActiveTab}
                        />
                      );
                    case 'installments':
                      return (
                        <InstallmentsPanel
                          detail={detail}
                          metrics={metrics}
                          createKey={createKey}
                        />
                      );
                    case 'invoices':
                      return (
                        <InvoicesPanel
                          detail={detail}
                          metrics={metrics}
                          createKey={createKey}
                        />
                      );
                    case 'appendices':
                      return (
                        <AppendicesPanel
                          detail={detail}
                          metrics={metrics}
                          createKey={createKey}
                        />
                      );
                  }
                })()}
              </section>

              <ContractFormDialog
                isOpen={isEditOpen}
                onOpenChange={setIsEditOpen}
                contract={contract}
              />
              <ConfirmDeleteDialog
                title={
                  isDeleting
                    ? `Xoá hợp đồng ${contract.contractNumber} cùng phụ lục, hoá đơn và đợt thanh toán?`
                    : null
                }
                onClose={() => setIsDeleting(false)}
                onConfirm={async () => {
                  const deleted = await deleteMutation.mutateAsync(contract.id);
                  if (deleted.success) router.push('/accounting/contracts');
                  return deleted;
                }}
              />
            </>
          ) : null}
        </VStack>
      </PageContentShell>
    </MetaThemeProvider>
  );
}
