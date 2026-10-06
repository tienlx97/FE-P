'use client';

import {
  colorVars,
  fontWeightVars,
  spacingVars,
} from '@astryxdesign/core/theme/tokens.stylex';
import * as stylex from '@stylexjs/stylex';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, useState } from 'react';

import {
  getActiveSidebarGroupKey,
  getSidebarRouteKey,
  isNavLinkActive,
  toggleSidebarGroup,
} from '../api/nav.js';
import { IconChevron } from './icon/icon-chevron.jsx';

/** @typedef {import('../types/index.js').SidebarRouteItem} SidebarRouteItem */

const styles = stylex.create({
  nav: {
    backgroundColor: colorVars['--color-background-surface'],
    color: colorVars['--color-text-secondary'],
    fontFamily: 'var(--font-family-body)',
    minHeight: '100%',
    paddingBlock: spacingVars['--spacing-4'],
    paddingInlineEnd: {
      default: 0,
      '@media (min-width: 1024px)': '20px',
    },
    width: '15rem',
  },
  mobileNav: {
    minHeight: '100%',
    paddingInlineEnd: 0,
    width: '100%',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacingVars['--spacing-0-5'],
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  nestedList: {
    paddingBlockStart: spacingVars['--spacing-0-5'],
  },
  item: {
    margin: 0,
    padding: 0,
  },
  row: {
    alignItems: 'center',
    backgroundColor: {
      default: 'transparent',
      ':hover': colorVars['--color-background-muted'],
    },
    borderRadius: {
      default: 0,
      '@media (min-width: 1024px)': '0 16px 16px 0',
    },
    borderWidth: 0,
    color: colorVars['--color-text-primary'],
    cursor: 'pointer',
    display: 'flex',
    fontFamily: 'inherit',
    fontSize: '0.9375rem',
    fontWeight: fontWeightVars['--font-weight-bold'],
    justifyContent: 'space-between',
    lineHeight: '30px',
    outline: {
      default: 'none',
      ':focus-visible': `2px solid ${colorVars['--color-accent']}`,
    },
    outlineOffset: '-2px',
    paddingBlock: spacingVars['--spacing-2'],
    paddingInlineEnd: spacingVars['--spacing-2'],
    paddingInlineStart: spacingVars['--spacing-5'],
    textAlign: 'start',
    textDecoration: 'none',
    width: '100%',
  },
  childRow: {
    color: colorVars['--color-text-secondary'],
    fontSize: '0.8125rem',
    fontWeight: fontWeightVars['--font-weight-medium'],
    lineHeight: '30px',
    paddingInlineStart: spacingVars['--spacing-6'],
  },
  selected: {
    backgroundColor: {
      default: colorVars['--color-accent-muted'],
      ':hover': colorVars['--color-accent-muted'],
    },
    color: colorVars['--color-text-accent'],
    fontWeight: fontWeightVars['--font-weight-bold'],
  },
  label: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  chevron: {
    color: colorVars['--color-text-secondary'],
    flexShrink: 0,
    // height: '16px',
    // width: '16px',
  },
  chevronExpanded: {
    color: colorVars['--color-text-accent'],
  },
  collapse: {
    display: 'grid',
    gridTemplateRows: '0fr',
    opacity: 0.5,
    transitionDuration: '250ms',
    transitionProperty: 'grid-template-rows, opacity',
    transitionTimingFunction: 'ease-in-out',
  },
  collapseExpanded: {
    gridTemplateRows: '1fr',
    opacity: 1,
  },
  collapseInner: {
    minHeight: 0,
    overflow: 'hidden',
  },
  sectionDivider: {
    borderBlockEndColor: colorVars['--color-border'],
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: '1px',
    marginBlockEnd: spacingVars['--spacing-2'],
    marginBlockStart: spacingVars['--spacing-4'],
    marginInlineStart: spacingVars['--spacing-5'],
  },
  sectionHeader: {
    color: colorVars['--color-text-secondary'],
    fontSize: '0.8125rem',
    fontWeight: fontWeightVars['--font-weight-bold'],
    lineHeight: '30px',
    marginBlockEnd: spacingVars['--spacing-1'],
    marginBlockStart: 0,
    marginInlineEnd: 0,
    marginInlineStart: spacingVars['--spacing-5'],
  },
});

/** @param {{ isExpanded: boolean }} props */
function SideNavChevron({ isExpanded }) {
  return (
    <IconChevron
      aria-hidden="true"
      displayDirection={isExpanded ? 'down' : 'end'}
      xstyle={[styles.chevron, isExpanded && styles.chevronExpanded]}
    />
  );
}

/**
 * React Docs-style route group. Groups with an overview `path` keep the parent
 * row as a navigable link. Pure category groups omit `path` and use the full
 * row as a disclosure button.
 * @param {{ route: SidebarRouteItem, pathname: string, isExpanded: boolean, onToggle: () => void, onNavigate: () => void }} props
 */
function SideNavGroup({ route, pathname, isExpanded, onToggle, onNavigate }) {
  const routePath = route.path;
  const isSelected = routePath ? pathname === routePath : false;
  const groupKey = getSidebarRouteKey(route);
  const childrenKey = routePath?.slice(1) ?? groupKey;
  const childrenId = `side-nav-${childrenKey.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}-children`;

  const label = (
    <>
      <span {...stylex.props(styles.label)}>{route.title}</span>
      <SideNavChevron isExpanded={isExpanded} />
    </>
  );

  return (
    <li {...stylex.props(styles.item)}>
      {routePath ? (
        <Link
          href={routePath}
          aria-current={isSelected ? 'page' : undefined}
          aria-controls={childrenId}
          aria-expanded={isExpanded}
          onClick={onNavigate}
          {...stylex.props(styles.row, isSelected && styles.selected)}
        >
          {label}
        </Link>
      ) : (
        <button
          type="button"
          aria-controls={childrenId}
          aria-expanded={isExpanded}
          onClick={onToggle}
          {...stylex.props(styles.row)}
        >
          {label}
        </button>
      )}
      <div
        aria-hidden={!isExpanded}
        inert={isExpanded ? undefined : true}
        {...stylex.props(
          styles.collapse,
          isExpanded && styles.collapseExpanded,
        )}
      >
        <div {...stylex.props(styles.collapseInner)}>
          <ul id={childrenId} {...stylex.props(styles.list, styles.nestedList)}>
            {route.routes?.map((child) => (
              <SideNavLink
                key={child.path}
                route={child}
                pathname={pathname}
                isChild
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}

/**
 * @param {{ route: SidebarRouteItem, pathname: string, isChild?: boolean, onNavigate: () => void }} props
 */
function SideNavLink({ route, pathname, isChild = false, onNavigate }) {
  const routePath = route.path ?? '/';
  const isSelected = pathname === routePath;

  return (
    <li {...stylex.props(styles.item)}>
      <Link
        href={routePath}
        aria-current={isSelected ? 'page' : undefined}
        onClick={onNavigate}
        {...stylex.props(
          styles.row,
          isChild && styles.childRow,
          isSelected && styles.selected,
        )}
      >
        <span {...stylex.props(styles.label)}>{route.title}</span>
      </Link>
    </li>
  );
}

/**
 * Custom documentation sidebar based on react.dev's SidebarRouteTree and
 * SidebarLink structure, without Astryx SideNav components.
 * The registry schema intentionally matches react.dev's `sidebar*.json`
 * files: a root route tree containing links, nested `routes`, and optional
 * section-header records.
 * @param {{
 *   routeTrees: import('../types/index.js').SidebarRouteTree[],
 *   titles?: string[],
 *   isMobile?: boolean,
 *   onNavigate?: () => void,
 * }} props
 */
export function AppSideNav({
  routeTrees,
  titles = [],
  isMobile = false,
  onNavigate = () => {},
}) {
  const pathname = usePathname();
  const [expandedSelection, setExpandedSelection] = useState(
    /** @type {{ pathname: string, groupKey: string | null } | null} */ (null),
  );
  const activeRouteTree = routeTrees.find((routeTree) =>
    isNavLinkActive(pathname, routeTree.path),
  );

  if (!activeRouteTree) return null;

  const activeGroupKey = getActiveSidebarGroupKey(
    activeRouteTree.routes,
    pathname,
  );
  const expandedGroupKey =
    expandedSelection?.pathname === pathname
      ? expandedSelection.groupKey
      : activeGroupKey;

  return (
    <nav
      aria-label="Điều hướng tài liệu"
      {...stylex.props(styles.nav, isMobile && styles.mobileNav)}
    >
      <ul {...stylex.props(styles.list)}>
        {activeRouteTree.routes.map((route, index) => {
          const routeKey = getSidebarRouteKey(route, index);

          return (
            <Fragment key={`${routeKey}-${index}`}>
              {route.hasSectionHeader === true ? (
                <Fragment>
                  {index > 0 ? (
                    <li
                      role="separator"
                      {...stylex.props(styles.sectionDivider)}
                    />
                  ) : null}
                  <li role="presentation">
                    <h3 {...stylex.props(styles.sectionHeader)}>
                      {route.sectionHeader}
                    </h3>
                  </li>
                </Fragment>
              ) : route.routes ? (
                <SideNavGroup
                  route={route}
                  pathname={pathname}
                  isExpanded={expandedGroupKey === routeKey}
                  onToggle={() =>
                    setExpandedSelection((selection) =>
                      toggleSidebarGroup(
                        selection,
                        pathname,
                        activeGroupKey,
                        routeKey,
                      ),
                    )
                  }
                  onNavigate={onNavigate}
                />
              ) : !route.path ? null : (
                <SideNavLink
                  route={route}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              )}
            </Fragment>
          );
        })}
      </ul>
      {titles.map((title) => (
        <p key={title} {...stylex.props(styles.sectionHeader)}>
          {title}
        </p>
      ))}
    </nav>
  );
}
