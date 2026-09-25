'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Icon } from '@astryxdesign/core/Icon';
import { VStack } from '@astryxdesign/core/VStack';
import {
  CirclePlus,
  FileText,
  HandCoins,
  LayoutGrid,
  ListChecks,
  Paperclip,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useId, useState } from 'react';

import {
  MetaCommissionEmptyState,
  MetaCommissionParties,
  MetaCommissionTrackingCard,
  MetaContractBreadcrumb,
  MetaContractDetailSkeleton,
  MetaContractHeaderCard,
  MetaMetricsCard,
  MetaTabNav,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';
import { commissionTrail } from '@/shared/config/breadcrumbs.js';

import { useCommissionView } from '../hooks/use-commission-view.js';
import { useContractQuery } from '../hooks/use-contracts-query.js';
import { CommissionAnnexesSection } from './commission-annexes-section.jsx';
import { CommissionFormDrawer } from './commission-form-drawer.jsx';
import { CommissionPaymentHistoryCard } from './commission-payment-history-card.jsx';
import { CommissionPaymentQuickAddDialog } from './commission-payment-quick-add-dialog.jsx';

/** @typedef {'overview' | 'payments' | 'annexes'} CommissionDetailTab */

const TAB_LABELS = {
  overview: 'Tổng quan',
  payments: 'Tiến độ thanh toán',
  annexes: 'Phụ lục',
};

const TAB_ICONS = {
  overview: LayoutGrid,
  payments: ListChecks,
  annexes: Paperclip,
};

const TAB_VALUES = /** @type {CommissionDetailTab[]} */ (
  Object.keys(TAB_LABELS)
);

/**
 * Commission detail page (`/logistics/contract/[id]/commission` — one
 * commission per contract): breadcrumb back to the contract's "Hoa hồng"
 * tab, a header card (code, broker, signing, "Chỉnh sửa" → the Meta
 * drawer, "+ Thao tác": Thêm lần chi / Thêm phụ lục / Mở hợp đồng) and
 * three tabs — Tổng quan (KPI cards, broker and bank), Tiến độ thanh toán
 * ("Đợt chi hoa hồng" + "Lịch sử thanh toán"), Phụ lục (inline-editable
 * annex list). `?tab=` keeps the tab across reloads, like the contract and
 * shipment detail pages.
 * @param {{ contractId: string }} props
 */
export function CommissionDetailWorkspace({ contractId }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedTab = searchParams.get('tab');
  const [activeTab, setActiveTabState] = useState(
    /** @type {CommissionDetailTab} */ (
      TAB_VALUES.includes(/** @type {CommissionDetailTab} */ (requestedTab))
        ? requestedTab
        : 'overview'
    ),
  );
  /** @param {CommissionDetailTab} tab */
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
          {contractQuery.isLoading ? (
            <MetaContractDetailSkeleton
              label="Đang tải Commission"
              tab={activeTab}
            />
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
            <CommissionDetailBody
              contract={contract}
              activeTab={activeTab}
              onActiveTabChange={setActiveTab}
            />
          )}
        </VStack>
      </PageContentShell>
    </MetaThemeProvider>
  );
}

/**
 * @param {{
 *   contract: import('../types/index.js').Contract,
 *   activeTab: CommissionDetailTab,
 *   onActiveTabChange: (tab: CommissionDetailTab) => void,
 * }} props
 */
function CommissionDetailBody({ contract, activeTab, onActiveTabChange }) {
  const router = useRouter();
  const panelId = useId();
  const [dialog, setDialog] = useState(
    /** @type {'create' | 'edit' | 'view' | 'payment' | null} */ (null),
  );
  const { commissionQuery, commission, currency, isLoading, view } =
    useCommissionView(contract);
  const contractHref = `/logistics/contract/${contract.id}`;

  const breadcrumb = (
    <MetaContractBreadcrumb
      trail={commissionTrail({
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        commissionCode: commission?.code,
      })}
    />
  );

  if (!commission || !view) {
    return (
      <>
        {breadcrumb}
        <MetaCommissionEmptyState
          isLoading={commissionQuery.isLoading}
          onCreate={() => setDialog('create')}
        />
        {dialog === 'create' ? (
          <CommissionFormDrawer
            contract={contract}
            onClose={() => setDialog(null)}
          />
        ) : null}
      </>
    );
  }

  const tabs = TAB_VALUES.map((id) => ({
    id,
    label: TAB_LABELS[id],
    icon: TAB_ICONS[id],
    count:
      id === 'payments'
        ? `${commission.paymentHistory.length} lần chi`
        : id === 'annexes' && view.annexCount > 0
          ? String(view.annexCount)
          : undefined,
  }));

  return (
    <>
      {breadcrumb}

      <MetaContractHeaderCard
        contractCode={commission.code}
        projectName={view.broker.name}
        projectIcon={HandCoins}
        typeLabel="Commission"
        statusLabel={view.broker.signedLabel}
        statusTone={view.bothSigned ? 'success' : 'neutral'}
        incotermLabel={`HĐ ${contract.contractNumber}`}
        copyAriaLabel="Sao chép mã Commission"
        copyAnnounce="Đã sao chép mã Commission"
        onEdit={() => setDialog('edit')}
        actionItems={[
          {
            id: 'payment',
            label: 'Thêm lần chi',
            icon: <Icon icon={CirclePlus} size="sm" />,
            onClick: () => setDialog('payment'),
          },
          {
            id: 'annex',
            label: 'Thêm phụ lục',
            icon: <Icon icon={Paperclip} size="sm" />,
            onClick: () => onActiveTabChange('annexes'),
          },
          {
            id: 'contract',
            label: `Mở hợp đồng ${contract.contractNumber}`,
            icon: <Icon icon={FileText} size="sm" />,
            onClick: () => router.push(contractHref),
          },
        ]}
      />

      <MetaTabNav
        tabs={tabs}
        activeId={activeTab}
        panelId={panelId}
        onChange={(tab) =>
          onActiveTabChange(/** @type {CommissionDetailTab} */ (tab))
        }
      />

      <section id={panelId} role="tabpanel" aria-label={TAB_LABELS[activeTab]}>
        {activeTab === 'overview' ? (
          <VStack gap={5} hAlign="stretch">
            <MetaMetricsCard
              title="GIÁ TRỊ & TIẾN ĐỘ HOA HỒNG"
              metrics={view.metrics}
              maxColumns={3}
              isLoading={isLoading}
            />
            <MetaCommissionParties
              broker={view.broker}
              bank={view.bank}
              isLoading={isLoading}
            />
          </VStack>
        ) : null}
        {activeTab === 'payments' ? (
          <VStack gap={5} hAlign="stretch">
            <MetaCommissionTrackingCard
              currency={currency}
              payments={view.rows}
              totals={view.totals}
              hasReceiptDownload={false}
              isLoading={isLoading}
              onView={() => setDialog('view')}
              onAction={() => setDialog('edit')}
            />
            <CommissionPaymentHistoryCard
              payments={commission.paymentHistory}
              currency={currency}
              onCreate={() => setDialog('payment')}
            />
          </VStack>
        ) : null}
        {activeTab === 'annexes' ? (
          <CommissionAnnexesSection
            variant="card"
            contractId={contract.id}
            commissionValue={commission.value}
            currency={currency}
          />
        ) : null}
      </section>

      {dialog === 'edit' || dialog === 'view' ? (
        <CommissionFormDrawer
          key={commission.id}
          contract={contract}
          commission={commission}
          initialMode={dialog}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog === 'payment' ? (
        <CommissionPaymentQuickAddDialog
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setDialog(null);
          }}
          contractId={contract.id}
          commission={commission}
          currency={currency}
          onSuccess={() => setDialog(null)}
        />
      ) : null}
    </>
  );
}
