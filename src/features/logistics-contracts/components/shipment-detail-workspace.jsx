'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Icon } from '@astryxdesign/core/Icon';
import { VStack } from '@astryxdesign/core/VStack';
import {
  Anchor,
  Factory,
  FileCheck2,
  FileText,
  Flag,
  LayoutGrid,
  MapPin,
  ReceiptText,
  RotateCcw,
  Sailboat,
  Ship,
  Truck,
  Weight,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useId, useMemo, useState } from 'react';

import {
  MetaContractBreadcrumb,
  MetaShipmentDetailSkeleton,
  MetaShipmentHeaderCard,
  MetaTabNav,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';
import { shipmentTrail } from '@/shared/config/breadcrumbs.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import {
  isConfirmableMilestone,
  packingDateRange,
} from '../config/shipment-journey.js';
import {
  labelForShipmentStatus,
  metaToneForShipmentStatus,
} from '../config/shipment-status.js';
import { labelForShipmentType } from '../config/shipment-types.js';
import { useContractQuery } from '../hooks/use-contracts-query.js';
import { useShipmentCostCategoriesQuery } from '../hooks/use-shipment-cost-categories-query.js';
import { useShipmentJourneyQuery } from '../hooks/use-shipment-journey-query.js';
import { useShipmentVgmsQuery } from '../hooks/use-shipment-vgms-query.js';
import { useShipmentsQuery } from '../hooks/use-shipments-query.js';
import { useSuppliersQuery } from '../hooks/use-suppliers-query.js';
import { ShipmentCostPanel } from './shipment-cost-panel.jsx';
import { ShipmentEmptyReturnDialog } from './shipment-empty-return-dialog.jsx';
import { ShipmentFormDrawer } from './shipment-form-drawer.jsx';
import { ShipmentMilestoneDialog } from './shipment-milestone-dialog.jsx';
import { ShipmentOverviewPanel } from './shipment-overview-panel.jsx';
import { ShipmentVgmPanel } from './shipment-vgm-panel.jsx';

/** @typedef {'overview' | 'vgm' | 'costs'} ShipmentDetailTab */

// Figma 111:7829 tab bar. "Chứng từ đính kèm" is left out: there is no
// document storage for shipments yet.
const TAB_LABELS = {
  overview: 'Tổng quan',
  vgm: 'VGM',
  costs: 'Chi phí logistics',
};

const TAB_ICONS = {
  overview: LayoutGrid,
  vgm: Weight,
  costs: ReceiptText,
};

const TAB_VALUES = /** @type {ShipmentDetailTab[]} */ (Object.keys(TAB_LABELS));

/** @type {Record<import('../types/index.js').ShipmentMilestone, import('react').ComponentType>} */
const MILESTONE_ICONS = {
  CargoReady: Factory,
  OriginInland: Truck,
  OriginPort: Anchor,
  OnBoard: Ship,
  Ocean: Sailboat,
  DestinationPort: MapPin,
  ImportClearance: FileCheck2,
  DestinationInland: Truck,
  Site: Flag,
  EmptyReturn: RotateCcw,
};

const MARKER_TONES = /** @type {const} */ ({
  Risk: 'warning',
  Freight: 'indigo',
  Delivery: 'success',
  Completion: 'success',
});

const MARKER_LABELS = {
  Risk: 'Chuyển rủi ro',
  Freight: 'Hết cước & BH',
  Delivery: 'Điểm giao',
  Completion: 'Hoàn tất lô',
};

/** "Hải Phòng (VNHPH)" → "VNHPH"; falls back to the whole text. */
/** @param {string | null} place */
function portCode(place) {
  if (!place) return '';
  return /\(([A-Z]{5})\)/.exec(place)?.[1] ?? place;
}

/**
 * Journey cards for the header: legs, scopes and markers from the
 * backend journey, filled with this
 * shipment's places, vessel, dates and providers.
 * @param {{
 *   shipment: import('../types/index.js').Shipment,
 *   contract: import('../types/index.js').Contract,
 *   vgms: import('../types/index.js').ShipmentVgm[],
 *   suppliersById: Map<string, import('../types/index.js').Customer>,
 *   journey: import('../types/index.js').ShipmentJourney,
 *   onStepAction: (step: import('../types/index.js').ShipmentJourneyStep) => void,
 *   canEditEmptyReturn: boolean,
 * }} input
 */
function journeyFor({
  shipment,
  contract,
  vgms,
  suppliersById,
  journey,
  onStepAction,
  canEditEmptyReturn,
}) {
  const { summary, steps, emptyReturn } = journey;
  const details = shipment.operationalDetails;
  const packing = packingDateRange(vgms);
  const transitDays =
    shipment.etd && shipment.eta
      ? Math.round(
          (Date.parse(shipment.eta) - Date.parse(shipment.etd)) / 86_400_000,
        )
      : null;
  const truckingNames = (shipment.serviceProviders ?? [])
    .filter((provider) => provider.role === 'Trucking')
    .map((provider) => suppliersById.get(provider.supplierId)?.companyName)
    .filter(Boolean);
  const isSellerImport = contract.incoterm === 'DDP';
  const loadingCode = portCode(shipment.placeOfLoading);
  const dischargeCode = portCode(shipment.placeOfDischarge);

  /**
   * What a tracking card needs: where / which vessel the leg is, and the
   * leg's key date (… + tooltip when long).
   * @param {import('../types/index.js').ShipmentMilestone} milestone
   * @param {string} label
   * @returns {{ title: string, footLabel: string, footValue: string }}
   */
  function content(milestone, label) {
    switch (milestone) {
      case 'CargoReady':
        return {
          title: shipment.name,
          footLabel: 'Đóng hàng',
          // Packing can take several days: first – last container.
          footValue:
            packing && packing.from !== packing.to
              ? `${formatDisplayDate(packing.from)} – ${formatDisplayDate(packing.to)}`
              : formatDisplayDate(packing?.from),
        };
      case 'OriginInland':
        return {
          title: truckingNames.join(', ') || label,
          footLabel: 'Hạn SI / VGM',
          footValue: formatDisplayDate(details?.siCutoff?.slice(0, 10)),
        };
      case 'OriginPort':
        return {
          title: shipment.placeOfLoading || label,
          footLabel: 'Khai hải quan',
          footValue: formatDisplayDate(shipment.customsDeclarationDate),
        };
      case 'OnBoard':
        return {
          title: shipment.vesselName || label,
          footLabel: 'Rời cảng',
          footValue: formatDisplayDate(shipment.etd),
        };
      case 'Ocean':
        return {
          title:
            loadingCode && dischargeCode
              ? `${loadingCode} → ${dischargeCode}`
              : label,
          footLabel: 'Transit',
          footValue: transitDays === null ? '—' : `~ ${transitDays} ngày`,
        };
      case 'DestinationPort':
        return {
          title: shipment.placeOfDischarge || label,
          footLabel: 'Đến cảng',
          footValue: formatDisplayDate(shipment.eta),
        };
      case 'ImportClearance':
        return {
          title: label,
          footLabel: 'Phụ trách',
          footValue: isSellerImport ? 'Seller' : 'Buyer',
        };
      case 'EmptyReturn':
        return {
          title: `Đã trả ${emptyReturn?.returnedCount ?? 0}/${emptyReturn?.containerCount ?? 0} cont`,
          footLabel: emptyReturn?.isComplete ? 'Trả xong' : 'Hạn trả rỗng',
          footValue: formatDisplayDate(
            emptyReturn?.isComplete
              ? emptyReturn.lastReturnedOn
              : emptyReturn?.deadline,
          ),
        };
      default:
        // Ends at the shipment's own "Nơi giao hàng" when it has one
        // (defaulted from the contract, editable per shipment), else at its
        // destination port.
        return {
          title: shipment.placeOfDelivery || shipment.placeOfDischarge || label,
          footLabel: 'Giao hàng',
          footValue: shipment.status === 'Completed' ? 'Hoàn tất' : '—',
        };
    }
  }

  /**
   * The card's action: record empty returns, or confirm by hand the
   * milestones that have no shipment data of their own. The others follow
   * the status / shipment fields and have none.
   * @param {import('../types/index.js').ShipmentJourneyStep} step
   * @returns {{ actionLabel?: string, onAction?: () => void }}
   */
  function stepAction(step) {
    if (step.milestone === 'EmptyReturn') {
      return canEditEmptyReturn
        ? {
            actionLabel: 'Ghi nhận trả cont rỗng',
            onAction: () => onStepAction(step),
          }
        : {};
    }
    if (!isConfirmableMilestone(step.milestone)) return {};
    return {
      actionLabel: step.isConfirmed ? 'Sửa xác nhận mốc' : 'Xác nhận mốc',
      onAction: () => onStepAction(step),
    };
  }

  return {
    summary,
    steps: steps.map((step) => ({
      id: step.milestone,
      icon: MILESTONE_ICONS[step.milestone],
      state: /** @type {'done' | 'current' | 'upcoming'} */ (
        step.state === 'Done'
          ? 'done'
          : step.state === 'Current'
            ? 'current'
            : 'upcoming'
      ),
      scope: /** @type {'seller' | 'buyer'} */ (
        step.scope === 'Seller' ? 'seller' : 'buyer'
      ),
      badge:
        step.milestone === 'EmptyReturn' && emptyReturn?.overdueDays
          ? `Quá hạn ${emptyReturn.overdueDays} ngày`
          : step.state === 'Done'
            ? 'Hoàn thành'
            : step.state === 'Current'
              ? 'Chặng hiện tại'
              : step.scope === 'Buyer'
                ? 'Phạm vi Buyer'
                : 'Kế hoạch',
      badgeTone: /** @type {'danger' | undefined} */ (
        step.milestone === 'EmptyReturn' && emptyReturn?.overdueDays
          ? 'danger'
          : undefined
      ),
      markerLabel: step.marker ? MARKER_LABELS[step.marker] : undefined,
      markerTone: step.marker ? MARKER_TONES[step.marker] : undefined,
      label: step.label,
      liveLabel: step.milestone === 'EmptyReturn' ? 'TRẢ CONT RỖNG' : undefined,
      ...stepAction(step),
      ...content(step.milestone, step.label),
    })),
  };
}

/**
 * `/logistics/contract/[id]/shipment/[shipmentId]` — the Meta shipment
 * detail page (Figma 111:7829). The shipment comes from its contract's
 * shipment list (same cache the contract page and the edit dialog
 * invalidate), so a save in the dialog refreshes this page too.
 * @param {{ contractId: string, shipmentId: string }} props
 */
export function ShipmentDetailWorkspace({ contractId, shipmentId }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedTab = searchParams.get('tab');
  const [activeTab, setActiveTabState] = useState(
    /** @type {ShipmentDetailTab} */ (
      TAB_VALUES.includes(/** @type {ShipmentDetailTab} */ (requestedTab))
        ? requestedTab
        : 'overview'
    ),
  );
  /** @param {ShipmentDetailTab} tab */
  function setActiveTab(tab) {
    setActiveTabState(tab);
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  }

  const contractQuery = useContractQuery(contractId);
  const shipmentsQuery = useShipmentsQuery(contractId);

  const contract =
    contractQuery.data?.success && contractQuery.data.contract.id === contractId
      ? contractQuery.data.contract
      : null;
  const shipment = shipmentsQuery.data?.success
    ? (shipmentsQuery.data.shipments.find((item) => item.id === shipmentId) ??
      null)
    : null;
  const errorMessage =
    shipmentsQuery.data && !shipmentsQuery.data.success
      ? shipmentsQuery.data.message
      : contractQuery.data && !contractQuery.data.success
        ? contractQuery.data.message
        : 'Không tìm thấy lô hàng.';

  return (
    <MetaThemeProvider>
      <PageContentShell isFullWidth>
        <VStack gap={4} hAlign="stretch">
          <MetaContractBreadcrumb
            trail={shipmentTrail({
              contractId,
              contractNumber: contract?.contractNumber,
              shipmentCode: shipment?.shipmentCode,
            })}
          />

          {contractQuery.isLoading || shipmentsQuery.isLoading ? (
            <MetaShipmentDetailSkeleton tab={activeTab} />
          ) : !contract || !shipment ? (
            <Banner status="error" title={errorMessage} container="card" />
          ) : (
            <ShipmentDetailBody
              contract={contract}
              shipment={shipment}
              activeTab={activeTab}
              onActiveTabChange={setActiveTab}
              onOpenContract={() =>
                router.push(`/logistics/contract/${contractId}`)
              }
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
 *   shipment: import('../types/index.js').Shipment,
 *   activeTab: ShipmentDetailTab,
 *   onActiveTabChange: (tab: ShipmentDetailTab) => void,
 *   onOpenContract: () => void,
 * }} props
 */
function ShipmentDetailBody({
  contract,
  shipment,
  activeTab,
  onActiveTabChange,
  onOpenContract,
}) {
  const panelId = useId();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(
    /** @type {import('../types/index.js').ShipmentJourneyStep | null} */ (
      null
    ),
  );
  const [isEmptyReturnOpen, setIsEmptyReturnOpen] = useState(false);

  const vgmsQuery = useShipmentVgmsQuery(contract.id, shipment.id);
  const journeyQuery = useShipmentJourneyQuery(contract.id, shipment.id);
  const suppliersQuery = useSuppliersQuery();
  const costCategoriesQuery = useShipmentCostCategoriesQuery();

  const vgms = useMemo(
    () =>
      vgmsQuery.data?.success
        ? [...vgmsQuery.data.vgms].sort(
            (a, b) => a.sequenceNumber - b.sequenceNumber,
          )
        : [],
    [vgmsQuery.data],
  );
  const customersById = useMemo(
    () =>
      new Map(
        (suppliersQuery.data?.success ? suppliersQuery.data.suppliers : []).map(
          (/** @type {import('../types/index.js').Customer} */ supplier) => [
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
        ).map((category) => [category.id, category]),
      ),
    [costCategoriesQuery.data],
  );

  const journey = journeyQuery.data?.success
    ? journeyFor({
        shipment,
        contract,
        vgms,
        suppliersById: customersById,
        journey: journeyQuery.data.journey,
        canEditEmptyReturn: vgmsQuery.data?.success === true,
        onStepAction: (step) => {
          if (step.milestone === 'EmptyReturn') setIsEmptyReturnOpen(true);
          else setSelectedMilestone(step);
        },
      })
    : null;
  // Plain tabs (no count pills), same as the contract detail tab bar.
  const tabs = TAB_VALUES.map((id) => ({
    id,
    label: TAB_LABELS[id],
    icon: TAB_ICONS[id],
  }));

  return (
    <>
      <VStack gap={4} hAlign="stretch">
        <MetaShipmentHeaderCard
          code={shipment.shipmentCode}
          typeLabel={labelForShipmentType(shipment.type)}
          statusLabel={labelForShipmentStatus(shipment.status)}
          statusTone={metaToneForShipmentStatus(shipment.status)}
          incotermLabel={`${contract.incoterm} ${contract.incotermYear}`}
          steps={journey?.steps ?? []}
          journeySummary={journey?.summary}
          isJourneyLoading={journeyQuery.isLoading}
          onPrint={() => window.print()}
          onEdit={() => setIsEditing(true)}
          moreItems={[
            {
              id: 'contract',
              label: `Mở hợp đồng ${contract.contractNumber}`,
              icon: <Icon icon={FileText} size="sm" />,
              onClick: onOpenContract,
            },
          ]}
        />

        {journeyQuery.data && !journeyQuery.data.success ? (
          <Banner
            status="error"
            title={journeyQuery.data.message}
            container="card"
          />
        ) : null}
        {vgmsQuery.data && !vgmsQuery.data.success ? (
          <Banner
            status="error"
            title={vgmsQuery.data.message}
            container="card"
          />
        ) : null}

        <MetaTabNav
          tabs={tabs}
          activeId={activeTab}
          panelId={panelId}
          onChange={(tab) =>
            onActiveTabChange(/** @type {ShipmentDetailTab} */ (tab))
          }
        />

        <section
          id={panelId}
          role="tabpanel"
          aria-label={TAB_LABELS[activeTab]}
        >
          {activeTab === 'overview' ? (
            <ShipmentOverviewPanel
              shipment={shipment}
              forwarderName={
                customersById.get(shipment.supplierCustomerId)?.companyName ??
                ''
              }
              vgms={vgms}
              isVgmsLoading={vgmsQuery.isLoading}
              onViewVgms={() => onActiveTabChange('vgm')}
            />
          ) : null}
          {activeTab === 'vgm' ? (
            <ShipmentVgmPanel
              contractId={contract.id}
              shipment={shipment}
              vgms={vgms}
              isLoading={vgmsQuery.isLoading}
              customersById={customersById}
            />
          ) : null}
          {activeTab === 'costs' ? (
            <ShipmentCostPanel
              contractId={contract.id}
              shipment={shipment}
              costCategoriesById={costCategoriesById}
              isCategoriesLoading={costCategoriesQuery.isLoading}
              customersById={customersById}
              incotermLabel={`${contract.incoterm} ${contract.incotermYear}`}
            />
          ) : null}
        </section>
      </VStack>

      {/* Dialogs portal out of the page tree, so they re-apply Meta. */}
      <MetaThemeProvider>
        {isEditing ? (
          <ShipmentFormDrawer
            contract={contract}
            shipment={shipment}
            onClose={() => setIsEditing(false)}
          />
        ) : null}
        {selectedMilestone ? (
          <ShipmentMilestoneDialog
            key={`${selectedMilestone.milestone}-${selectedMilestone.completedOn}`}
            isOpen
            onOpenChange={(open) => {
              if (!open) setSelectedMilestone(null);
            }}
            contractId={contract.id}
            shipmentId={shipment.id}
            step={selectedMilestone}
          />
        ) : null}
        {isEmptyReturnOpen ? (
          <ShipmentEmptyReturnDialog
            isOpen
            onOpenChange={setIsEmptyReturnOpen}
            contractId={contract.id}
            shipmentId={shipment.id}
            containers={vgms}
            deadline={
              journeyQuery.data?.success
                ? (journeyQuery.data.journey.emptyReturn?.deadline ?? null)
                : null
            }
          />
        ) : null}
      </MetaThemeProvider>
    </>
  );
}
