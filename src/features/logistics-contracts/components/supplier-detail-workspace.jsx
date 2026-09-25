'use client';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Banner } from '@astryxdesign/core/Banner';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Grid } from '@astryxdesign/core/Grid';
import { Icon } from '@astryxdesign/core/Icon';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  Banknote,
  Building2,
  NotebookText,
  Trash2,
  User,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useId, useState } from 'react';

import { partyBankAccountEndpoint } from '@/shared/api/bank-accounts.js';
import { BankAccountsPanel } from '@/shared/components/bank-accounts/bank-accounts-panel.jsx';
import {
  MetaContractBreadcrumb,
  MetaPartyHeaderCard,
  MetaShipmentField,
  MetaShipmentSection,
  MetaTabNav,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';
import { supplierTrail } from '@/shared/config/breadcrumbs.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { usePartyLookupsQuery } from '../hooks/use-party-lookups-query.js';
import {
  useDeleteSupplierMutation,
  useSupplierBankAccountsChanged,
  useSupplierQuery,
  useSupplierRelatedCounts,
} from '../hooks/use-suppliers-query.js';
import { SupplierFormDrawer } from './supplier-form-drawer.jsx';
import { SupplierOverviewPanel } from './supplier-overview-panel.jsx';
import { SupplierShipmentsPanel } from './supplier-shipments-panel.jsx';

/** @typedef {'overview' | 'banks' | 'shipments' | 'commissions' | 'notes'} SupplierTab */

// Order and labels follow Figma 141:56 ("TAB BAR").
const TAB_LABELS = {
  overview: 'Tổng quan',
  banks: 'Tài khoản ngân hàng',
  shipments: 'Shipment',
  commissions: 'Commission',
  notes: 'Ghi chú & bổ sung',
};
const TAB_VALUES = /** @type {SupplierTab[]} */ (Object.keys(TAB_LABELS));

/**
 * `/logistics/suppliers/[id]` — supplier detail page (Figma "CHI TIẾT NHÀ
 * CUNG CẤP", node 141:4). "Tổng quan" and "Tài khoản ngân hàng" follow
 * their Figma frames, as does Shipment (node 145:740); Ghi chú lists the
 * supplier's own data; Commission shows its count until its list is
 * designed.
 * @param {{ supplierId: string }} props
 */
export function SupplierDetailWorkspace({ supplierId }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedTab = /** @type {SupplierTab} */ (searchParams.get('tab'));
  const [activeTab, setActiveTabState] = useState(
    /** @type {SupplierTab} */ (
      TAB_VALUES.includes(requestedTab) ? requestedTab : 'overview'
    ),
  );
  /** @param {SupplierTab} tab */
  function setActiveTab(tab) {
    setActiveTabState(tab);
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  }

  const supplierQuery = useSupplierQuery(supplierId);
  const supplier = supplierQuery.data?.success
    ? supplierQuery.data.supplier
    : null;

  return (
    <MetaThemeProvider>
      <PageContentShell isFullWidth>
        <VStack gap={4} hAlign="stretch">
          <MetaContractBreadcrumb
            trail={supplierTrail({ supplierCode: supplier?.profile?.code })}
          />

          {supplierQuery.isLoading ? (
            <VStack gap={4} hAlign="stretch">
              <Skeleton height={96} />
              <Skeleton height={48} />
              <Skeleton height={360} />
            </VStack>
          ) : !supplier ? (
            <Banner
              status="error"
              title={
                supplierQuery.data && !supplierQuery.data.success
                  ? supplierQuery.data.message
                  : 'Không tìm thấy nhà cung cấp.'
              }
              container="card"
            />
          ) : (
            <SupplierDetailBody
              supplier={supplier}
              activeTab={activeTab}
              onActiveTabChange={setActiveTab}
              onDeleted={() => router.push('/logistics/suppliers')}
            />
          )}
        </VStack>
      </PageContentShell>
    </MetaThemeProvider>
  );
}

/**
 * @param {{
 *   supplier: import('../types/index.js').Supplier,
 *   activeTab: SupplierTab,
 *   onActiveTabChange: (tab: SupplierTab) => void,
 *   onDeleted: () => void,
 * }} props
 */
function SupplierDetailBody({
  supplier,
  activeTab,
  onActiveTabChange,
  onDeleted,
}) {
  const panelId = useId();
  const toast = useAppToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteMutation = useDeleteSupplierMutation();
  const onBankAccountsChanged = useSupplierBankAccountsChanged(supplier.id);
  const { groups, paymentTerms } = usePartyLookupsQuery('supplier');
  const { shipmentCount, commissionCount } = useSupplierRelatedCounts(
    supplier.id,
  );

  const profile = supplier.profile;
  const bankAccounts = supplier.bankAccounts ?? [];
  const groupNames = (supplier.groupIds ?? [])
    .map((id) => groups.find((group) => group.id === id)?.name)
    .filter((name) => typeof name === 'string');
  const paymentTermName = paymentTerms.find(
    (term) => term.id === profile?.paymentTermId,
  )?.name;
  const isOrganization = profile?.isOrganization ?? true;

  /** @type {Record<SupplierTab, number | undefined>} */
  const counts = {
    overview: undefined,
    banks: bankAccounts.length,
    shipments: shipmentCount,
    commissions: commissionCount,
    notes: undefined,
  };
  const tabs = TAB_VALUES.map((id) => ({
    id,
    label: TAB_LABELS[id],
    count: counts[id] == null ? undefined : String(counts[id]),
  }));

  async function handleConfirmDelete() {
    const result = await deleteMutation.mutateAsync(supplier.id);
    setIsDeleting(false);
    if (result.success) {
      toast({ body: `Đã xoá nhà cung cấp "${supplier.companyName}".` });
      onDeleted();
    } else {
      toast({ body: result.message, type: 'error' });
    }
  }

  return (
    <>
      <VStack gap={3} hAlign="stretch">
        <MetaPartyHeaderCard
          name={supplier.companyName}
          icon={isOrganization ? Building2 : User}
          pills={[
            {
              label: isOrganization ? 'Tổ chức' : 'Cá nhân',
              tone: 'neutral',
            },
            ...groupNames.map((name) => ({
              label: name,
              tone: /** @type {const} */ ('accent'),
            })),
          ]}
          metaItems={[
            profile?.code ?? '',
            profile?.taxCode ? `MST ${profile.taxCode}` : '',
          ].filter(Boolean)}
          onPrint={() => window.print()}
          onEdit={() => setIsEditing(true)}
          menuItems={[
            {
              id: 'delete',
              label: 'Xoá nhà cung cấp',
              icon: <Icon icon={Trash2} size="sm" />,
              onClick: () => setIsDeleting(true),
            },
          ]}
        />

        <MetaTabNav
          tabs={tabs}
          activeId={activeTab}
          panelId={panelId}
          onChange={(tab) => onActiveTabChange(/** @type {SupplierTab} */ (tab))}
        />

        <section id={panelId} role="tabpanel" aria-label={TAB_LABELS[activeTab]}>
          {activeTab === 'overview' ? (
            <SupplierOverviewPanel
              supplier={supplier}
              groupNames={groupNames}
              paymentTermName={paymentTermName}
              onViewBankAccounts={() => onActiveTabChange('banks')}
            />
          ) : null}
          {activeTab === 'banks' ? (
            <BankAccountsPanel
              accounts={bankAccounts}
              endpoint={partyBankAccountEndpoint('suppliers', supplier.id)}
              onChanged={onBankAccountsChanged}
              holderDefault={supplier.companyName}
            />
          ) : null}
          {activeTab === 'shipments' ? (
            <SupplierShipmentsPanel
              supplierId={supplier.id}
              supplierName={supplier.companyName}
            />
          ) : null}
          {activeTab === 'commissions' ? (
            <RelatedPlaceholder
              icon={Banknote}
              title="Commission"
              count={commissionCount}
              unit="commission nhận hoa hồng"
            />
          ) : null}
          {activeTab === 'notes' ? (
            <VStack gap={4} hAlign="stretch">
              <MetaShipmentSection icon={NotebookText} title="Ghi chú">
                <Text color={profile?.notes ? 'primary' : 'secondary'} xstyle={styles.preWrap}>
                  {profile?.notes || 'Chưa có ghi chú.'}
                </Text>
              </MetaShipmentSection>
              <MetaShipmentSection icon={NotebookText} title="Thông tin bổ sung">
                {supplier.extraFields.length === 0 &&
                (supplier.deliveryAddresses ?? []).length === 0 ? (
                  <Text color="secondary">Chưa có thông tin bổ sung.</Text>
                ) : (
                  <Grid columns={{ minWidth: 220, max: 3 }} gap={3}>
                    {supplier.extraFields.map((field) => (
                      <MetaShipmentField
                        key={field.key}
                        label={field.key}
                        value={field.value}
                      />
                    ))}
                    {(supplier.deliveryAddresses ?? []).map((row, index) => (
                      <MetaShipmentField
                        key={`delivery-${index}`}
                        label={`Địa chỉ giao hàng ${index + 1}`}
                        value={row.address}
                      />
                    ))}
                  </Grid>
                )}
              </MetaShipmentSection>
            </VStack>
          ) : null}
        </section>
      </VStack>

      {/* Dialogs portal out of the page tree, so they re-apply Meta. */}
      <MetaThemeProvider>
        {isEditing ? (
          <SupplierFormDrawer
            isOpen
            onOpenChange={(isOpen) => {
              if (!isOpen) setIsEditing(false);
            }}
            supplier={supplier}
            onSuccess={() => setIsEditing(false)}
          />
        ) : null}
        <AlertDialog
          isOpen={isDeleting}
          onOpenChange={setIsDeleting}
          title={`Xoá "${supplier.companyName}" khỏi danh mục nhà cung cấp?`}
          description="Nhà cung cấp đang được dùng làm forwarder, đơn vị chi phí, hãng vận chuyển VGM hoặc bên nhận hoa hồng sẽ không xoá được. Hành động này không thể hoàn tác."
          actionLabel="Xoá"
          isActionLoading={deleteMutation.isPending}
          onAction={handleConfirmDelete}
        />
      </MetaThemeProvider>
    </>
  );
}

/**
 * Commission tab until its supplier-scoped list exists.
 * @param {{ icon: import('react').ComponentType, title: string, count?: number, unit: string }} props
 */
function RelatedPlaceholder({ icon, title, count, unit }) {
  return (
    <MetaShipmentSection icon={icon} title={title}>
      <EmptyState
        isCompact
        title={count == null ? 'Đang tải…' : `${count} ${unit}`}
        description="Danh sách chi tiết theo nhà cung cấp sẽ được bổ sung."
      />
    </MetaShipmentSection>
  );
}

const styles = stylex.create({
  preWrap: {
    whiteSpace: 'pre-wrap',
  },
});
