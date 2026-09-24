/**
 * "Meta" custom component folder (user request, 2026-09-23) — the
 * "Optimistic VF Commerce & Hardware" design system (`DESIGN.md`, this same
 * folder) mapped onto a custom Astryx theme (`theme.js`). Screen-specific
 * wrapper components are added here as mockups arrive; wrap the subtree
 * that should use it in `MetaThemeProvider`. Every component here is
 * composed from Astryx components only (golden rule #15).
 *
 * Rebuild after editing `theme.js`:
 *   pnpm exec astryx theme build src/shared/components/custom/meta/theme.js --out src/shared/components/custom/meta/theme.built.css
 *
 * @example
 * import { MetaThemeProvider } from '@/shared/components/custom/meta/index.js';
 *
 * <MetaThemeProvider>{children}</MetaThemeProvider>
 */
export { MetaAnnexListPanel } from './annex-list-panel.jsx';
export { MetaBoqPanel } from './boq-panel.jsx';
export { MetaCommissionPanel } from './commission-panel.jsx';
export { MetaContractDetailSkeleton } from './contract-detail-skeleton.jsx';
export {
  MetaContractBreadcrumb,
  MetaContractHeaderCard,
} from './contract-header-card.jsx';
export { MetaContractInfoGrid } from './contract-info-grid.jsx';
export { MetaCostPanel } from './cost-panel.jsx';
export { MetaCountBadge } from './count-badge.jsx';
export { MetaDrawerHeader } from './drawer-header.jsx';
export {
  MetaFormCard,
  MetaFormSection,
  MetaTintButton,
} from './form-section.jsx';
export { MetaOverviewSummaryCard } from './overview-summary-card.jsx';
export { MetaPagination } from './pagination.jsx';
export { MetaBankAccountCard, MetaPartySummary } from './party-summary.jsx';
export { MetaPaymentProgressPanel } from './payment-progress-panel.jsx';
export {
  MetaPaymentSplitBar,
  metaPaymentStepTone,
  MetaPaymentTermRow,
} from './payment-term-row.jsx';
export { MetaPill } from './pill.jsx';
export { MetaShipmentDetailSkeleton } from './shipment-detail-skeleton.jsx';
export {
  MetaJourneySkeleton,
  MetaShipmentHeaderCard,
} from './shipment-header-card.jsx';
export { MetaShipmentListPanel } from './shipment-list-panel.jsx';
export {
  MetaContainerCard,
  MetaShipmentField,
  MetaShipmentKpiCard,
  MetaShipmentSection,
} from './shipment-overview-blocks.jsx';
export { MetaStatusBadge } from './status-badge.jsx';
export { MetaTabNav } from './tab-nav.jsx';
export { MetaThemeProvider } from './theme-provider.jsx';
export { MetaVgmPanel } from './vgm-panel.jsx';
// The *built* theme (`meta.js`), same object `MetaThemeProvider` applies.
export { metaTheme } from './meta.js';
