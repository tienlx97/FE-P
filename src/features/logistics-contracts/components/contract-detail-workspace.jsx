'use client';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { useClipboard } from '@astryxdesign/core/hooks';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { Spinner } from '@astryxdesign/core/Spinner';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { InfoTip } from '@astryxdesign/lab';
import * as stylex from '@stylexjs/stylex';
import {
  CalendarDays,
  Check,
  Copy,
  Download,
  FileText,
  FolderOpen,
  Hourglass,
  Package,
  Pencil,
  Percent,
  Plus,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useId, useMemo, useState } from 'react';

import { CommonDialog } from '@/shared/components/common-dialog.jsx';
import { IbmPlexCorporateThemeProvider } from '@/shared/components/custom/ibm-plex-corporate/index.js';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import {
  badgeVariantForContractStatus,
  englishLabelForContractStatus,
  labelForContractStatus,
  statusDotVariantForContractStatus,
} from '../config/contract-status.js';
import {
  badgeVariantForContractType,
  labelForContractType,
} from '../config/contract-types.js';
import { formatMoney } from '../config/currencies.js';
import { reasonContractIneligibleForShipment } from '../config/shipment-contract-eligibility.js';
import { useCommissionQuery } from '../hooks/use-commission-query.js';
import { useContractEditingState } from '../hooks/use-contract-editing-state.js';
import { useContractQuery } from '../hooks/use-contracts-query.js';
import { useShipmentCostCategoriesQuery } from '../hooks/use-shipment-cost-categories-query.js';
import { useSuppliersQuery } from '../hooks/use-suppliers-query.js';
import { CommissionFormDialog } from './commission-form-dialog.jsx';
import { ContractAnnexFormDialog } from './contract-annex-form-dialog.jsx';
import { ContractOverviewPanel } from './contract-overview-panel.jsx';
import { ContractProfileFields } from './contract-profile-fields.jsx';
import { ContractRelatedEntitiesPanel } from './contract-related-entities-panel.jsx';
import { ShipmentFormDialog } from './shipment-form-dialog.jsx';

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
    <IbmPlexCorporateThemeProvider>
      <PageContentShell isFullWidth fillHeight>
        <VStack gap={4} hAlign="stretch" height="100%">
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
              suppliersById={suppliersById}
              costCategoriesById={costCategoriesById}
              activeTab={activeTab}
              onActiveTabChange={setActiveTab}
              initialMode={initialMode}
            />
          )}
        </VStack>
      </PageContentShell>
    </IbmPlexCorporateThemeProvider>
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
  const { copy, isCopied } = useClipboard({
    announce: 'Đã sao chép số hợp đồng',
  });

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

  const isRelatedTabActive =
    activeTab === 'annexes' ||
    activeTab === 'payments' ||
    activeTab === 'related' ||
    activeTab === 'fullView';

  return (
    <>
      <VStack gap={3} hAlign="stretch" height="100%">
        <Card elevation="low">
          <VStack gap={2} hAlign="stretch">
            <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap">
              <HStack gap={2} vAlign="center" wrap="wrap">
                <Heading level={1}>{contract.contractNumber}</Heading>
                <IconButton
                  label="Sao chép số hợp đồng"
                  tooltip={isCopied ? 'Đã sao chép' : 'Sao chép'}
                  icon={<Icon icon={isCopied ? Check : Copy} size="sm" />}
                  variant="ghost"
                  size="sm"
                  onClick={() => copy(contract.contractNumber)}
                />
                <Badge
                  icon={
                    <StatusDot
                      variant={statusDotVariantForContractStatus(
                        contract.status,
                      )}
                      label={labelForContractStatus(contract.status)}
                    />
                  }
                  label={`${labelForContractStatus(contract.status)} (${englishLabelForContractStatus(contract.status)})`}
                  variant={badgeVariantForContractStatus(contract.status)}
                />
                <Badge
                  icon={<Icon icon={ShieldCheck} size="sm" />}
                  label={labelForContractType(contract.contractType)}
                  variant={badgeVariantForContractType(contract.contractType)}
                />
              </HStack>
              <HStack gap={2} wrap="wrap">
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
                  <>
                    <Button
                      label="Xuất PDF / In"
                      variant="secondary"
                      size="sm"
                      icon={<Icon icon={Printer} size="sm" />}
                      onClick={() => window.print()}
                    />
                    <Button
                      label="Chỉnh sửa"
                      variant="secondary"
                      size="sm"
                      icon={<Icon icon={Pencil} size="sm" />}
                      onClick={() => {
                        onActiveTabChange('profile');
                        setIsEditing(true);
                      }}
                    />
                    <DropdownMenu
                      button={{
                        label: 'Thao tác nghiệp vụ',
                        variant: 'primary',
                        size: 'sm',
                        icon: <Icon icon={Plus} size="sm" />,
                      }}
                      items={[
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
                  </>
                )}
              </HStack>
            </HStack>
            {isEditing ? (
              <Text color="secondary">
                {isDirty ? 'Có thay đổi chưa lưu' : 'Đang chỉnh sửa'}
              </Text>
            ) : (
              <HStack gap={3} vAlign="center" wrap="wrap">
                <HStack gap={1.5} vAlign="center">
                  <Icon icon={FolderOpen} size="sm" color="secondary" />
                  <Text color="secondary">
                    Dự án: <Text weight="semibold">{contract.projectName}</Text>
                  </Text>
                </HStack>
                <Text color="secondary">•</Text>
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
            )}
          </VStack>
        </Card>

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
            <ContractOverviewPanel
              contract={contract}
              onViewAllAnnexes={() => onActiveTabChange('annexes')}
            />
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
