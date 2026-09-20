'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import * as stylex from '@stylexjs/stylex';
import {
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Package,
  Paperclip,
  Percent,
} from 'lucide-react';

import { Tab, TabList } from './astryx/TabList/index.js';

// `Tab`/`TabList` are the vendored/ejected `astryx/TabList` source
// (`@ts-nocheck`'d there, no JSDoc types) — TS infers an implicit,
// over-strict "every destructured prop is required" shape for their
// destructuring-parameter signatures at this call site with no way to
// mark props optional without adding that JSDoc back. Cast to `any` here
// rather than re-typing a vendored file, same escape hatch this repo
// already uses for Astryx type gaps elsewhere (e.g. `Icon`'s `color`).
const TabListAny = /** @type {any} */ (TabList);
const TabAny = /** @type {any} */ (Tab);

/**
 * "Maritime" tab nav — the contract-detail page's section switcher, built
 * from the Figma file at
 * https://www.figma.com/design/lPZR4jL1VwX6ICnLiiBinv/Untitled?node-id=3-504
 * (frame `fg.header-title-and-global-action-bar`'s sibling "3. TAB
 * NAVIGATION", node 7:1182), read directly via the Figma MCP bridge — no
 * Stitch HTML mockup exists for this screen, so exact colors/copy come
 * from the Figma node tree itself, same "source of truth" principle
 * `theme.js`'s file header applies to the Stitch mockup.
 *
 * Built on Astryx's real `TabList`/`Tab` (`./astryx/TabList`, this same
 * folder) rather than hand-rolled `HStack`/`button` primitives — an
 * earlier pass avoided `TabList` because its default look is an
 * underline/divider-overlay indicator, not the Figma's filled pill
 * buttons. User feedback (2026-09-18) was to start from Astryx's own
 * component and customize it instead of side-stepping it. Reusing it
 * turned out to need `astryx swizzle TabList` (ejecting the source) rather
 * than `xstyle`/theming: the *selected* tab's text color is hard-coded to
 * one of Astryx's specificity-boosted atomic color classes, and unlike
 * `Text` (which swaps in a different class per a `color` prop, letting a
 * *custom* registered variant win cleanly) `Tab` doesn't parameterize
 * that color at all — no themeable hook exists to reach it. Owning the
 * source directly (`./astryx/TabList/Tab.jsx`) sidesteps the fight
 * entirely: the pill background/border/colors are just literal values
 * there now, no cascade contest. That fork also documents two unrelated
 * runtime incompatibilities the ejected source hit against this
 * project's older installed `@stylexjs/stylex` — see its own file header.
 *
 * The small count pill ("4 đợt", "3%", ...) rides in `Tab`'s `endContent`
 * slot as this file's own `TabCountChip` sub-component — visually a
 * tighter, unbordered cousin of `MaritimeBadge` (no border except the
 * "success"-toned one), not `MaritimeBadge` itself. Its label is a plain
 * `<span>`, not `Text` — `Text`'s own per-`type` font-size class is
 * specificity-boosted, so a raw `xstyle` font-size loses to it (same
 * issue `contract-overview-card.jsx`'s heading-size fix hit); a plain
 * span has no competing class at all. Both the tab label (16px) and this
 * chip label (12px, up from the Figma-exact 10px) are sized per user
 * feedback (2026-09-18) rather than the Figma source exactly — desktop
 * readability over pixel parity.
 *
 * All copy below defaults to the Figma mockup's own Vietnamese strings and
 * icons, but `tabs` is an overridable prop — this nav has no fixed section
 * list of its own, it only renders whatever a caller passes.
 * @param {{
 *   tabs?: Array<{
 *     id: string,
 *     label: string,
 *     icon?: import('react').ComponentType,
 *     count?: string,
 *     countTone?: 'neutral' | 'blue' | 'success',
 *     hasTrailingChevron?: boolean,
 *   }>,
 *   activeId: string,
 *   onChange?: (id: string) => void,
 *   stickyOffset?: number,
 * }} props
 */
export function MaritimeTabNav({
  tabs = DEFAULT_TABS,
  activeId,
  onChange,
  stickyOffset = 0,
}) {
  return (
    <TabListAny
      value={activeId}
      onChange={(/** @type {string} */ value) => onChange?.(value)}
      overflow="scroll"
      xstyle={[styles.nav, styles.stickyTop(stickyOffset)]}
    >
      {tabs.map((tab) => (
        <TabAny
          key={tab.id}
          value={tab.id}
          label={tab.label}
          icon={
            tab.icon ? <Icon icon={tab.icon} size="sm" color="inherit" /> : undefined
          }
          endContent={
            tab.count ? (
              <TabCountChip label={tab.count} tone={tab.countTone ?? 'neutral'} />
            ) : tab.hasTrailingChevron ? (
              <Icon
                icon={ChevronDown}
                size="xsm"
                color={/** @type {any} */ ('maritime-muted')}
              />
            ) : undefined
          }
        />
      ))}
    </TabListAny>
  );
}

/**
 * @param {{ label: string, tone: 'neutral' | 'blue' | 'success' }} props
 */
function TabCountChip({ label, tone }) {
  return (
    <HStack
      as="span"
      vAlign="center"
      hAlign="center"
      xstyle={[styles.countChip, countChipToneStyles[tone]]}
    >
      {/* A plain `<span>`, not `Text`, for the same reason `Tab.jsx` owns
          its label as a plain span too: `Text`'s per-`type` font-size
          class is specificity-boosted, so a raw `xstyle` font-size loses
          to it — only the `size` *prop*'s own re-emitted class wins, and
          its scale steps (9px `xsm` / 11px `sm`) don't land on Figma's
          exact 10px either way. A plain span has no competing class at
          all, so the literal value below is exact (user feedback,
          2026-09-18). */}
      <span {...stylex.props(styles.countChipLabel)}>{label}</span>
    </HStack>
  );
}

/** @type {Array<{ id: string, label: string, icon: import('react').ComponentType, count?: string, countTone?: 'neutral' | 'blue' | 'success', hasTrailingChevron?: boolean }>} */
const DEFAULT_TABS = [
  { id: 'overview', label: 'Tổng quan & Tiến độ', icon: LayoutDashboard },
  {
    id: 'payments',
    label: 'Tiến độ thanh toán',
    icon: CircleDollarSign,
    count: '4 đợt',
    countTone: 'neutral',
  },
  {
    id: 'shipment',
    label: 'Lô hàng (Shipment)',
    icon: Package,
    count: '3 FCL',
    countTone: 'blue',
  },
  {
    id: 'annex',
    label: 'Phụ lục (Annex)',
    icon: Paperclip,
    count: '2',
    countTone: 'neutral',
  },
  {
    id: 'commission',
    label: 'Hoa hồng (Commission)',
    icon: Percent,
    count: '3%',
    countTone: 'success',
  },
  {
    id: 'internal',
    label: 'BOQ & Nội bộ',
    icon: ClipboardList,
    hasTrailingChevron: true,
  },
];

const styles = stylex.create({
  nav: {
    backgroundColor: 'var(--color-background-body)',
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    gap: 'var(--spacing-1-5)',
    paddingBottom: 'var(--spacing-1)',
    paddingTop: 'var(--spacing-1)',
    position: 'sticky',
    zIndex: 10,
  },
  // Distance in px from the viewport top the nav sticks at — pages under a
  // fixed app header pass its height so the nav isn't hidden behind it.
  stickyTop: (offset) => ({ top: `${offset}px` }),
  countChip: {
    borderRadius: 'var(--radius-inner)',
    borderStyle: 'solid',
    borderWidth: '1px',
    flexShrink: 0,
    height: '24px',
    paddingInline: 'var(--spacing-1-5)',
  },
  countChipLabel: {
    color: 'inherit',
    fontFamily: 'var(--font-family-code)',
    // 12px, not the Figma-exact 10px — with the tab label bumped to 16px
    // (user feedback, 2026-09-18), the chip stayed at its old 10px and
    // read disproportionately tiny next to it; scaled up to match (user
    // feedback, 2026-09-18, "check tab nav font size fits desktop").
    fontSize: '13px',
    fontWeight: 'var(--font-weight-semibold)',
    lineHeight: '20px',
  },
});

// `neutral`/`blue` chips have no border in Figma — `borderColor:
// 'transparent'` (not omitting the property) so `countChip`'s own 1px
// `borderWidth` doesn't shift the chip's box size between tones.
const countChipToneStyles = stylex.create({
  neutral: {
    backgroundColor: 'var(--color-border)',
    borderColor: 'transparent',
    color: 'var(--color-text-primary)',
  },
  blue: {
    backgroundColor: 'var(--maritime-chip-bg)',
    borderColor: 'transparent',
    color: 'var(--maritime-chip-text)',
  },
  success: {
    backgroundColor: 'var(--maritime-badge-success-bg)',
    borderColor: 'var(--maritime-badge-success-border)',
    color: 'var(--maritime-badge-success-text)',
  },
});
