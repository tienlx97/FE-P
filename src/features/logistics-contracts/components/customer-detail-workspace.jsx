'use client';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Banner } from '@astryxdesign/core/Banner';
import { Grid } from '@astryxdesign/core/Grid';
import { Icon } from '@astryxdesign/core/Icon';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  Building2,
  FileText,
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
import { customerTrail } from '@/shared/config/breadcrumbs.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { useCustomerContractsQuery } from '../hooks/use-contracts-query.js';
import {
  useCustomerBankAccountsChanged,
  useCustomerQuery,
  useDeleteCustomerMutation,
} from '../hooks/use-customers-query.js';
import { usePartyLookupsQuery } from '../hooks/use-party-lookups-query.js';
import { CustomerContractHistory } from './customer-contract-history.jsx';
import { CustomerFormDrawer } from './customer-form-drawer.jsx';
import { SupplierOverviewPanel } from './supplier-overview-panel.jsx';

/** @typedef {'overview' | 'banks' | 'contracts' | 'notes'} CustomerTab */

// Same tab bar as the supplier detail page; "Hợp đồng" replaces its
// Shipment / Commission tabs (a customer is a contract's buyer).
const TAB_LABELS = {
  overview: 'Tổng quan',
  banks: 'Tài khoản ngân hàng',
  contracts: 'Hợp đồng',
  notes: 'Ghi chú & bổ sung',
};
const TAB_VALUES = /** @type {CustomerTab[]} */ (Object.keys(TAB_LABELS));

/**
 * `/logistics/customers/[id]` — customer detail page, laid out like the
 * supplier detail page (`supplier-detail-workspace.jsx`): header card,
 * tabs Tổng quan / Tài khoản ngân hàng / Hợp đồng / Ghi chú & bổ sung.
 * @param {{ customerId: string }} props
 */
export function CustomerDetailWorkspace({ customerId }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedTab = /** @type {CustomerTab} */ (searchParams.get('tab'));
  const [activeTab, setActiveTabState] = useState(
    /** @type {CustomerTab} */ (
      TAB_VALUES.includes(requestedTab) ? requestedTab : 'overview'
    ),
  );
  /** @param {CustomerTab} tab */
  function setActiveTab(tab) {
    setActiveTabState(tab);
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  }

  const customerQuery = useCustomerQuery(customerId);
  const customer = customerQuery.data?.success
    ? customerQuery.data.customer
    : null;

  return (
    <MetaThemeProvider>
      <PageContentShell isFullWidth>
        <VStack gap={4} hAlign="stretch">
          <MetaContractBreadcrumb
            trail={customerTrail({ customerCode: customer?.profile?.code })}
          />

          {customerQuery.isLoading ? (
            <VStack gap={4} hAlign="stretch">
              <Skeleton height={96} />
              <Skeleton height={48} />
              <Skeleton height={360} />
            </VStack>
          ) : !customer ? (
            <Banner
              status="error"
              title={
                customerQuery.data && !customerQuery.data.success
                  ? customerQuery.data.message
                  : 'Không tìm thấy khách hàng.'
              }
              container="card"
            />
          ) : (
            <CustomerDetailBody
              customer={customer}
              activeTab={activeTab}
              onActiveTabChange={setActiveTab}
              onDeleted={() => router.push('/logistics/customers')}
            />
          )}
        </VStack>
      </PageContentShell>
    </MetaThemeProvider>
  );
}

/**
 * @param {{
 *   customer: import('../types/index.js').Customer,
 *   activeTab: CustomerTab,
 *   onActiveTabChange: (tab: CustomerTab) => void,
 *   onDeleted: () => void,
 * }} props
 */
function CustomerDetailBody({
  customer,
  activeTab,
  onActiveTabChange,
  onDeleted,
}) {
  const panelId = useId();
  const toast = useAppToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteMutation = useDeleteCustomerMutation();
  const onBankAccountsChanged = useCustomerBankAccountsChanged(customer.id);
  const { groups, paymentTerms } = usePartyLookupsQuery('customer');
  const contractsQuery = useCustomerContractsQuery(customer.id);

  const profile = customer.profile;
  const bankAccounts = customer.bankAccounts ?? [];
  const groupName = groups.find((group) => group.id === profile?.groupId)?.name;
  const groupNames = groupName ? [groupName] : [];
  const paymentTermName = paymentTerms.find(
    (term) => term.id === profile?.paymentTermId,
  )?.name;
  const isOrganization = profile?.isOrganization ?? true;
  const contractCount = contractsQuery.data?.success
    ? contractsQuery.data.totalCount
    : undefined;

  /** @type {Record<CustomerTab, number | undefined>} */
  const counts = {
    overview: undefined,
    banks: bankAccounts.length,
    contracts: contractCount,
    notes: undefined,
  };
  const tabs = TAB_VALUES.map((id) => ({
    id,
    label: TAB_LABELS[id],
    count: counts[id] == null ? undefined : String(counts[id]),
  }));

  async function handleConfirmDelete() {
    const result = await deleteMutation.mutateAsync(customer.id);
    setIsDeleting(false);
    if (result.success) {
      toast({ body: `Đã xoá khách hàng "${customer.companyName}".` });
      onDeleted();
    } else {
      toast({ body: result.message, type: 'error' });
    }
  }

  return (
    <>
      <VStack gap={3} hAlign="stretch">
        <MetaPartyHeaderCard
          name={customer.companyName}
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
              label: 'Xoá khách hàng',
              icon: <Icon icon={Trash2} size="sm" />,
              onClick: () => setIsDeleting(true),
            },
          ]}
        />

        <MetaTabNav
          tabs={tabs}
          activeId={activeTab}
          panelId={panelId}
          onChange={(tab) => onActiveTabChange(/** @type {CustomerTab} */ (tab))}
        />

        <section id={panelId} role="tabpanel" aria-label={TAB_LABELS[activeTab]}>
          {activeTab === 'overview' ? (
            <SupplierOverviewPanel
              supplier={customer}
              nameLabel="Tên khách hàng"
              groupLabel="Nhóm khách hàng"
              groupNames={groupNames}
              paymentTermName={paymentTermName}
              onViewBankAccounts={() => onActiveTabChange('banks')}
            />
          ) : null}
          {activeTab === 'banks' ? (
            <BankAccountsPanel
              accounts={bankAccounts}
              endpoint={partyBankAccountEndpoint('customers', customer.id)}
              onChanged={onBankAccountsChanged}
              holderDefault={customer.companyName}
            />
          ) : null}
          {activeTab === 'contracts' ? (
            <MetaShipmentSection
              icon={FileText}
              title="Hợp đồng"
              subtitle="Các hợp đồng khách hàng này là bên mua"
            >
              <CustomerContractHistory
                customerId={customer.id}
                customerName={customer.companyName}
              />
            </MetaShipmentSection>
          ) : null}
          {activeTab === 'notes' ? (
            <VStack gap={4} hAlign="stretch">
              <MetaShipmentSection icon={NotebookText} title="Ghi chú">
                <Text
                  color={profile?.notes ? 'primary' : 'secondary'}
                  xstyle={styles.preWrap}
                >
                  {profile?.notes || 'Chưa có ghi chú.'}
                </Text>
              </MetaShipmentSection>
              <MetaShipmentSection icon={NotebookText} title="Thông tin bổ sung">
                {customer.extraFields.length === 0 &&
                (customer.deliveryAddresses ?? []).length === 0 ? (
                  <Text color="secondary">Chưa có thông tin bổ sung.</Text>
                ) : (
                  <Grid columns={{ minWidth: 220, max: 3 }} gap={3}>
                    {customer.extraFields.map((field) => (
                      <MetaShipmentField
                        key={field.key}
                        label={field.key}
                        value={field.value}
                      />
                    ))}
                    {(customer.deliveryAddresses ?? []).map((row, index) => (
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
          <CustomerFormDrawer
            isOpen
            onOpenChange={(isOpen) => {
              if (!isOpen) setIsEditing(false);
            }}
            customer={customer}
            onSuccess={() => setIsEditing(false)}
          />
        ) : null}
        <AlertDialog
          isOpen={isDeleting}
          onOpenChange={setIsDeleting}
          title={`Xoá "${customer.companyName}" khỏi danh mục khách hàng?`}
          description="Khách hàng đang là bên mua của hợp đồng sẽ không xoá được. Hành động này không thể hoàn tác."
          actionLabel="Xoá"
          isActionLoading={deleteMutation.isPending}
          onAction={handleConfirmDelete}
        />
      </MetaThemeProvider>
    </>
  );
}

const styles = stylex.create({
  preWrap: {
    whiteSpace: 'pre-wrap',
  },
});
