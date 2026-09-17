'use client';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import { Button } from '@astryxdesign/core/Button';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { HStack } from '@astryxdesign/core/HStack';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useId, useMemo, useState } from 'react';

import { CommonDialog } from '@/shared/components/common-dialog.jsx';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';

import {
  badgeVariantForContractStatus,
  labelForContractStatus,
} from '../config/contract-status.js';
import { labelForContractType } from '../config/contract-types.js';
import { useContractEditingState } from '../hooks/use-contract-editing-state.js';
import { useContractQuery } from '../hooks/use-contracts-query.js';
import { useShipmentCostCategoriesQuery } from '../hooks/use-shipment-cost-categories-query.js';
import { useSuppliersQuery } from '../hooks/use-suppliers-query.js';
import { ContractOverviewPanel } from './contract-overview-panel.jsx';
import { ContractProfileFields } from './contract-profile-fields.jsx';
import { ContractRelatedEntitiesPanel } from './contract-related-entities-panel.jsx';

/** @typedef {'overview' | 'profile' | 'annexes' | 'payments' | 'related' | 'fullView'} DetailTab */

const TAB_LABELS = {
  overview: 'Tổng quan & Tiến độ',
  profile: 'Hồ sơ',
  annexes: 'Phụ lục',
  payments: 'Thanh toán',
  related: 'Liên quan',
  fullView: 'Xem đầy đủ',
};

const TAB_VALUES = /** @type {DetailTab[]} */ (Object.keys(TAB_LABELS));

const styles = stylex.create({
  // The native `hidden` attribute alone does NOT hide a `VStack`/`section`
  // — its own compiled `display: flex` class always wins the cascade (see
  // `ContractFormDialog`'s identical note). "Hồ sơ" and the related-entity
  // tabs stay mounted while hidden instead of unmounting — they own live
  // queries/dialog state that would otherwise refetch or reset on every
  // tab switch.
  hidden: { display: 'none' },
});

/**
 * `/logistics/contract/[id]` — the Contract detail page
 * (`openspec/changes/add-contract-detail-page/`), replacing the dialog
 * cross-links that used to render broken (bug 1: tabs with no `children`)
 * and giving every Contract a real, shareable URL (bug 2). Renders the
 * same tab bodies the old `ContractFormDialog` did
 * (`ContractProfileFields`/`ContractRelatedEntitiesPanel`), plus a new
 * "Tổng quan" tab, under page chrome instead of dialog chrome.
 * @param {{ contractId: string }} props
 */
export function ContractDetailWorkspace({ contractId }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialMode = searchParams.get('mode') === 'edit' ? 'edit' : 'view';
  const requestedTab = searchParams.get('tab');
  // "Sửa" (`?mode=edit`, no explicit `?tab=`) should land straight on the
  // editable "Hồ sơ" tab, not "Tổng quan" — matches the old dialog, which
  // always jumped to "profile" the moment editing started.
  const [activeTab, setActiveTabState] = useState(
    /** @type {DetailTab} */ (
      TAB_VALUES.includes(/** @type {DetailTab} */ (requestedTab))
        ? requestedTab
        : initialMode === 'edit'
          ? 'profile'
          : 'overview'
    ),
  );
  /** @param {DetailTab} tab */
  function setActiveTab(tab) {
    setActiveTabState(tab);
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  }

  const contractQuery = useContractQuery(contractId);
  const suppliersQuery = useSuppliersQuery();
  const costCategoriesQuery = useShipmentCostCategoriesQuery();

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

  const contract =
    contractQuery.data?.success && contractQuery.data.contract.id === contractId
      ? contractQuery.data.contract
      : null;

  return (
    <PageContentShell isFullWidth fillHeight>
      <VStack gap={4} hAlign="stretch" height="100%">
        <Breadcrumbs>
          <BreadcrumbItem href="/logistics">Logistics</BreadcrumbItem>
          <BreadcrumbItem href="/logistics/contracts">Hợp đồng</BreadcrumbItem>
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
            suppliersById={suppliersById}
            costCategoriesById={costCategoriesById}
            activeTab={activeTab}
            onActiveTabChange={setActiveTab}
            initialMode={initialMode}
          />
        )}
      </VStack>
    </PageContentShell>
  );
}

/**
 * Split out from `ContractDetailWorkspace` so `useContractEditingState`
 * only ever mounts once `contract` is loaded — the hook's
 * `useContractForm` seeds its draft from `contract` on first render only
 * (see `use-contract-form.js`), same constraint `ContractFormDialog`
 * always had (it only ever mounted with a resolved `contract` too).
 * @param {{
 *   contract: import('../types/index.js').Contract,
 *   suppliersById: Map<string, import('../types/index.js').Supplier>,
 *   costCategoriesById: Map<string, import('../types/index.js').ShipmentCostCategory>,
 *   activeTab: DetailTab,
 *   onActiveTabChange: (tab: DetailTab) => void,
 *   initialMode: 'view' | 'edit',
 * }} props
 */
function ContractDetailBody({
  contract,
  suppliersById,
  costCategoriesById,
  activeTab,
  onActiveTabChange,
  initialMode,
}) {
  const {
    form,
    formId,
    isEditing,
    setIsEditing,
    discardAction,
    setDiscardAction,
    finish,
    requestExit,
  } = useContractEditingState({ contract, initialMode, onSuccess: () => {} });
  const { submitLabel, isSubmitting, handleSubmit, isDirty } = form;
  const panelId = useId();

  const isRelatedTabActive =
    activeTab === 'annexes' ||
    activeTab === 'payments' ||
    activeTab === 'related' ||
    activeTab === 'fullView';

  return (
    <>
      <VStack gap={3} hAlign="stretch" height="100%">
        <HStack hAlign="between" vAlign="start" gap={3}>
          <VStack gap={1}>
            <HStack gap={2} vAlign="center">
              <Heading level={1}>{contract.contractNumber}</Heading>
              <Badge
                label={labelForContractStatus(contract.status)}
                variant={badgeVariantForContractStatus(contract.status)}
              />
              <Badge
                label={labelForContractType(contract.contractType)}
                variant="neutral"
              />
            </HStack>
            <Text color="secondary">
              {isEditing
                ? isDirty
                  ? 'Có thay đổi chưa lưu'
                  : 'Đang chỉnh sửa'
                : contract.projectName}
            </Text>
          </VStack>
          <HStack gap={2}>
            {isEditing ? (
              <>
                <Button
                  width={80}
                  label="Hủy"
                  variant="secondary"
                  isDisabled={isSubmitting}
                  onClick={() => requestExit('cancel')}
                />
                <Button
                  width={144}
                  label={submitLabel}
                  type="submit"
                  form={formId}
                  variant="primary"
                  isLoading={isSubmitting}
                  onClick={() => onActiveTabChange('profile')}
                />
              </>
            ) : (
              <Button
                width={144}
                type="button"
                label="Sửa hợp đồng"
                variant="primary"
                onClick={() => {
                  onActiveTabChange('profile');
                  setIsEditing(true);
                }}
              />
            )}
          </HStack>
        </HStack>

        <TabList
          value={activeTab}
          onChange={(tab) => onActiveTabChange(/** @type {DetailTab} */ (tab))}
          role="tablist"
          hasDivider
        >
          {TAB_VALUES.map((tab) => (
            <Tab
              key={tab}
              value={tab}
              label={TAB_LABELS[tab]}
              panelId={panelId}
            />
          ))}
        </TabList>

        <section
          id={panelId}
          role="tabpanel"
          aria-label={TAB_LABELS[activeTab]}
        >
          {activeTab === 'overview' ? (
            <ContractOverviewPanel contract={contract} />
          ) : null}
          <ContractProfileFields
            form={form}
            formId={formId}
            isEditing={isEditing}
            isActive={activeTab === 'profile'}
            onSubmit={handleSubmit}
          />
          <VStack
            gap={4}
            hAlign="stretch"
            xstyle={!isRelatedTabActive && styles.hidden}
          >
            <ContractRelatedEntitiesPanel
              contract={contract}
              customersById={suppliersById}
              costCategoriesById={costCategoriesById}
              // `ContractExpandedDetails` only renders a section for
              // 'annexes'/'payments'/'related'/'fullView' — 'overview'/
              // 'profile' fall through to nothing, same as the old
              // dialog passing its own `activeTab` straight through.
              activeTab={
                /** @type {import('./contract-expanded-details.jsx').ExpandedTab} */ (
                  activeTab
                )
              }
            />
          </VStack>
        </section>
      </VStack>

      <CommonDialog
        isOpen={discardAction !== null}
        onOpenChange={(open) => {
          if (!open) setDiscardAction(null);
        }}
        purpose="required"
      >
        <Layout
          header={
            <DialogHeader
              title="Bỏ thay đổi chưa lưu?"
              onOpenChange={() => setDiscardAction(null)}
            />
          }
          content={
            <LayoutContent padding={4}>
              <Text>Những thay đổi của bạn sẽ mất nếu rời khỏi biểu mẫu.</Text>
            </LayoutContent>
          }
          footer={
            <LayoutFooter>
              <HStack hAlign="end" gap={2}>
                <Button
                  label="Tiếp tục nhập"
                  variant="primary"
                  onClick={() => setDiscardAction(null)}
                />
                <Button
                  label="Bỏ thay đổi"
                  variant="destructive"
                  onClick={() => {
                    if (discardAction) finish(discardAction);
                    setDiscardAction(null);
                  }}
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </CommonDialog>
    </>
  );
}
