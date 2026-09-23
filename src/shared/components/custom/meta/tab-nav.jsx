'use client';

import { Icon } from '@astryxdesign/core/Icon';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import * as stylex from '@stylexjs/stylex';

import { MetaPill } from './pill.jsx';

/**
 * "Meta" contract-detail section switcher — Figma node 89:1064's "3. TAB
 * NAVIGATION (Pill-shaped)": white pills with a hairline border and an
 * optional count pill ("4 đợt", "3 FCL", "3%"). The selected tab stays
 * white too (user request, 2026-09-23 — not the Figma's filled cobalt),
 * marked by a cobalt border + cobalt bold label instead.
 * Built on Astryx `TabList`/`Tab` in the WAI-ARIA tabs pattern; each tab
 * points at `panelId`. Same `tabs` shape as `MaritimeTabNav`.
 *
 * @param {{
 *   tabs: Array<{
 *     id: string,
 *     label: string,
 *     icon?: import('react').ComponentType,
 *     count?: string,
 *     countTone?: 'neutral' | 'accent' | 'success',
 *   }>,
 *   activeId: string,
 *   onChange?: (id: string) => void,
 *   panelId?: string,
 *   isSticky?: boolean,
 * }} props
 */
export function MetaTabNav({
  tabs,
  activeId,
  onChange,
  panelId,
  isSticky = true,
}) {
  return (
    <TabList
      role="tablist"
      size="md"
      value={activeId}
      onChange={(value) => onChange?.(value)}
      overflow="scroll"
      xstyle={[styles.nav, isSticky && styles.sticky]}
    >
      {tabs.map((tab) => {
        const isSelected = tab.id === activeId;
        return (
          <Tab
            key={tab.id}
            value={tab.id}
            label={tab.label}
            panelId={panelId}
            icon={
              tab.icon ? (
                <Icon icon={tab.icon} size="sm" color="inherit" />
              ) : undefined
            }
            endContent={
              tab.count ? (
                <MetaPill
                  label={tab.count}
                  tone={isSelected ? 'accent' : (tab.countTone ?? 'neutral')}
                  hasBorder={tab.countTone === 'success'}
                  size="sm"
                />
              ) : undefined
            }
            xstyle={[styles.tab, isSelected && styles.selectedTab]}
          />
        );
      })}
    </TabList>
  );
}

const styles = stylex.create({
  nav: {
    // Read by the Meta theme's selected-tab rule: white pill, cobalt text.
    // StyleX compiles custom-property keys; its lint rule just doesn't know
    // them.
    // eslint-disable-next-line @stylexjs/valid-styles
    '--meta-tab-selected-bg': 'var(--color-background-surface)',
    // eslint-disable-next-line @stylexjs/valid-styles
    '--meta-tab-selected-text': 'var(--color-accent)',
    backgroundColor: 'var(--color-background-surface)',
    gap: 'var(--spacing-1-5)',
    paddingBlock: 'var(--spacing-1)',
  },
  // Sticks just under the app's fixed top bar (4rem high).
  sticky: {
    position: 'sticky',
    top: '4rem',
    zIndex: 10,
  },
  tab: {
    backgroundColor: 'var(--color-background-surface)',
    borderColor: 'var(--color-border)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    color: 'var(--color-text-secondary)',
  },
  selectedTab: {
    borderColor: 'var(--color-accent)',
    boxShadow: 'var(--meta-shadow-card)',
    color: 'var(--color-accent)',
  },
});
