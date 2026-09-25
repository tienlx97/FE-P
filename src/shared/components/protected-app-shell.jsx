'use client';

import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import {
  colorVars,
  fontWeightVars,
  spacingVars,
} from '@astryxdesign/core/theme/tokens.stylex';
import * as stylex from '@stylexjs/stylex';
import { Minimize2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useNavigationHistoryTracker } from '@/shared/hooks/use-back-navigation.js';
import { useLayoutPreferences } from '@/shared/hooks/use-layout-preferences.js';

import { isNavLinkActive } from '../api/nav.js';
import { Header } from './header.jsx';
import { AppSideNav } from './side-nav.jsx';

/** @typedef {import('../types/index.js').NavLink} NavLink */

const SIDE_NAV_ROUTES = ['/tutorial', '/docs', '/admin', '/logistics'];

// react.dev sets its document body to 17px (text-lg) and sidebar links to
// 15px (text-base) — noticeably larger than Astryx's neutral default
// (14px), which reads better for long-form doc content but is oversized
// for ordinary UI (forms, buttons, nav chrome). Scoped to `/` and `/docs*`
// only (see `hasLargeTypography` below) instead of being the site-wide
// default in `theme.js`, so e.g. `/admin`'s create-user form gets normal
// form-field sizing. Plain CSS custom properties, applied via the `style`
// prop rather than StyleX — `@stylexjs/valid-styles` rejects raw `--*`
// keys in `stylex.create` (Astryx's own tokens are the only sanctioned way
// to reference a CSS variable there), and these need to *redefine* the
// tokens for their subtree, not just reference them. Values ported 1:1
// from react.dev's own scale (open source: github.com/reactjs/react.dev ->
// tailwind.config.js `theme.extend.fontSize`) — mapped by role: astryx
// 2xs/xs/sm/base/lg/xl/2xl/3xl/4xl/5xl == react.dev xs/sm/base/lg/xl/2xl/
// 3xl/4xl/5xl/6xl == 11/13/15/17/20/24/28/32/40/52px. 4xs/3xs have no
// react.dev equivalent (below its smallest step) — extrapolated down for
// Astryx's own micro-text use (badges, etc.).
const LARGE_TYPOGRAPHY_STYLE = {
  fontSize: '17px', // react.dev's document body size (`text-lg`)
  lineHeight: '30px', // react.dev's body line-height at that size
  '--font-size-4xs': '0.5rem', // 8px — extrapolated, not from react.dev
  '--font-size-3xs': '0.5625rem', // 9px — extrapolated, not from react.dev
  '--font-size-2xs': '0.6875rem', // 11px — react.dev `xs`
  '--font-size-xs': '0.8125rem', // 13px — react.dev `sm`
  '--font-size-sm': '0.9375rem', // 15px — react.dev `base`
  '--font-size-base': '1.0625rem', // 17px — react.dev `lg` (body copy)
  '--font-size-lg': '1.25rem', // 20px — react.dev `xl`
  '--font-size-xl': '1.5rem', // 24px — react.dev `2xl`
  '--font-size-2xl': '1.75rem', // 28px — react.dev `3xl`
  '--font-size-3xl': '2rem', // 32px — react.dev `4xl`
  '--font-size-4xl': '2.5rem', // 40px — react.dev `5xl`
  '--font-size-5xl': '3.25rem', // 52px — react.dev `6xl`
};

const styles = stylex.create({
  root: {
    backgroundColor: colorVars['--color-background-surface'],
    color: colorVars['--color-text-primary'],
    fontFamily: 'var(--font-family-body)',
    fontSize: '14px',
    fontWeight: fontWeightVars['--font-weight-medium'],
    lineHeight: '20px',
    minHeight: '100vh',
  },
  // Same typographic/color contract as `root` above, minus `minHeight` —
  // exported for `FullscreenPanel` (`fullscreen-panel.jsx`), which
  // portals into `#fullscreen-portal-root` below (a descendant of `.root`,
  // so this is actually redundant with plain CSS inheritance there — kept
  // explicit anyway as the one place that states this contract, and as a
  // defensive floor if the portal target ever moves outside `.root`
  // again). Also supplies the overlay's own opaque background, since it
  // needs to visually cover the header/side nav stacked beneath it.
  content: {
    backgroundColor: colorVars['--color-background-surface'],
    color: colorVars['--color-text-primary'],
    fontFamily: 'var(--font-family-body)',
    fontSize: '14px',
    fontWeight: fontWeightVars['--font-weight-medium'],
    lineHeight: '20px',
  },
  topNav: {
    insetBlockStart: 0,
    position: 'sticky',
    zIndex: 40,
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    minHeight: 'calc(100vh - 64px)',
  },
  docsLayout: {
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      '@media (min-width: 1024px)': '20rem minmax(0, 1fr)',
    },
  },
  desktopSideNav: {
    display: {
      default: 'none',
      '@media (min-width: 1024px)': 'block',
    },
    minWidth: 0,
    position: 'relative',
    zIndex: 10,
  },
  desktopSideNavInner: {
    height: 'calc(100vh - 64px)',
    insetBlockStart: '64px',
    overflowY: 'auto',
    position: 'sticky',
  },
  main: {
    isolation: 'isolate',
    minWidth: 0,
  },
  paddedMain: {
    padding: spacingVars['--spacing-6'],
  },
  mobileOverlay: {
    backgroundColor: colorVars['--color-background-surface'],
    display: {
      default: 'block',
      '@media (min-width: 1024px)': 'none',
    },
    insetBlockEnd: 0,
    insetBlockStart: '64px',
    insetInline: 0,
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    position: 'fixed',
    zIndex: 30,
  },
  // Focus mode hides the header entirely, so this is the only way back —
  // same z-index convention as `FullscreenPanel`'s overlay, comfortably
  // above ordinary page content.
  exitFocusModeButton: {
    insetBlockStart: spacingVars['--spacing-3'],
    insetInlineEnd: spacingVars['--spacing-3'],
    position: 'fixed',
    zIndex: 500,
  },
});

export const appShellContentStyle = styles.content;

/**
 * Route-aware application frame. AppShell must receive `undefined` for
 * sideNav outside content routes so it removes the desktop column and mobile
 * drawer entirely rather than reserving space for a component that returns
 * null.
 * @param {{
 *   children: import('react').ReactNode,
 *   endContent?: import('react').ReactNode,
 *   navLinks: NavLink[],
 *   sideNavRouteTrees: import('../types/index.js').SidebarRouteTree[],
 *   site: { name: string },
 * }} props
 */
export function ProtectedAppShell({
  children,
  endContent,
  navLinks,
  sideNavRouteTrees,
  site,
}) {
  const pathname = usePathname();
  useNavigationHistoryTracker();
  const [openMobileNavPathname, setOpenMobileNavPathname] = useState(
    /** @type {string | null} */ (null),
  );
  const mobileToggleRef = useRef(
    /** @type {HTMLButtonElement | null} */ (null),
  );
  const mobileOverlayRef = useRef(/** @type {HTMLElement | null} */ (null));
  const wasMobileNavOpenRef = useRef(false);
  const isMobileNavOpen = openMobileNavPathname === pathname;
  const { hideSideNav, focusMode, setFocusMode } = useLayoutPreferences();
  const hasSideNav =
    SIDE_NAV_ROUTES.some((href) => isNavLinkActive(pathname, href)) &&
    !hideSideNav &&
    !focusMode;
  const hasMdxLayout =
    pathname === '/docs' ||
    pathname.startsWith('/docs/') ||
    pathname.startsWith('/tutorial/');
  // Only the home page and the /docs section keep the larger react.dev-
  // matched reading scale (see `styles.largeTypography` above) — every
  // other route (including /tutorial) now renders at Astryx's normal UI
  // density.
  const hasLargeTypography =
    pathname === '/' || pathname === '/docs' || pathname.startsWith('/docs/');
  // /admin/* uses /docs' layout as its standard (see
  // `shared/components/page-content-shell.jsx`): same self-managed
  // padding/max-width contract, so it also opts out of `paddedMain` below
  // — the page itself wraps its content in `PageContentShell` instead.
  const isAdminOrLogistics =
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/logistics' ||
    pathname.startsWith('/logistics/');
  const hasSelfManagedPadding = hasMdxLayout || isAdminOrLogistics;
  // Grid columns follow side-nav presence in general (any side-nav'd
  // section gets the 2-column layout); self-managed-padding content
  // additionally opts out of `main`'s own padding below since it applies
  // its own.
  const hasSideNavLayout = hasSideNav || hasMdxLayout;
  const closeMobileNav = () => setOpenMobileNavPathname(null);

  useEffect(() => {
    if (!focusMode) return undefined;

    /** @param {KeyboardEvent} event */
    const exitOnEscape = (event) => {
      if (event.key === 'Escape') setFocusMode(false);
    };
    document.addEventListener('keydown', exitOnEscape);
    return () => document.removeEventListener('keydown', exitOnEscape);
  }, [focusMode, setFocusMode]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const closeAtDesktop = () => {
      if (!media.matches) setOpenMobileNavPathname(null);
    };

    closeAtDesktop();
    media.addEventListener('change', closeAtDesktop);
    return () => media.removeEventListener('change', closeAtDesktop);
  }, []);

  useEffect(() => {
    if (!isMobileNavOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingInlineEnd = document.body.style.paddingInlineEnd;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingInlineEnd = `${scrollbarWidth}px`;
    }

    /** @param {KeyboardEvent} event */
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpenMobileNavPathname(null);
    };
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingInlineEnd = previousPaddingInlineEnd;
    };
  }, [isMobileNavOpen]);

  useEffect(() => {
    if (isMobileNavOpen) {
      const firstInteractive = mobileOverlayRef.current?.querySelector(
        'a[href], button:not([disabled])',
      );
      if (firstInteractive instanceof HTMLElement) firstInteractive.focus();
    } else if (wasMobileNavOpenRef.current) {
      mobileToggleRef.current?.focus();
    }

    wasMobileNavOpenRef.current = isMobileNavOpen;
  }, [isMobileNavOpen]);

  return (
    <div
      {...stylex.props(styles.root)}
      // `/admin/**` and `/logistics/**` render in Inter: `globals.css` keys
      // the font tokens on <html> off this attribute.
      data-app-font={isAdminOrLogistics ? 'inter' : undefined}
      style={
        /** @type {import('react').CSSProperties} */ ({
          ...stylex.props(styles.root).style,
          ...(hasLargeTypography ? LARGE_TYPOGRAPHY_STYLE : null),
        })
      }
    >
      {focusMode ? (
        <IconButton
          label="Thoát chế độ tập trung"
          tooltip="Thoát chế độ tập trung (Esc)"
          icon={<Icon icon={Minimize2} size="sm" />}
          variant="secondary"
          size="sm"
          xstyle={styles.exitFocusModeButton}
          onClick={() => setFocusMode(false)}
        />
      ) : (
        <header {...stylex.props(styles.topNav)}>
          <Header
            siteName={site.name}
            navLinks={navLinks}
            endContent={endContent}
            hasSideNav={hasSideNav}
            isMobileNavOpen={isMobileNavOpen}
            mobileToggleRef={mobileToggleRef}
            onMobileNavToggle={() =>
              setOpenMobileNavPathname((openPathname) =>
                openPathname === pathname ? null : pathname,
              )
            }
          />
        </header>
      )}

      <div
        {...stylex.props(styles.layout, hasSideNavLayout && styles.docsLayout)}
      >
        {hasSideNav ? (
          <aside
            aria-label="Điều hướng tài liệu trên máy tính"
            {...stylex.props(styles.desktopSideNav)}
          >
            <div {...stylex.props(styles.desktopSideNavInner)}>
              <AppSideNav
                routeTrees={sideNavRouteTrees}
                onNavigate={closeMobileNav}
              />
            </div>
          </aside>
        ) : null}

        <main
          {...stylex.props(
            styles.main,
            !hasSelfManagedPadding && styles.paddedMain,
          )}
        >
          {children}
        </main>
      </div>

      {hasSideNav && isMobileNavOpen ? (
        <aside
          ref={mobileOverlayRef}
          id="mobile-docs-navigation"
          aria-label="Điều hướng tài liệu trên thiết bị di động"
          {...stylex.props(styles.mobileOverlay)}
        >
          <AppSideNav
            routeTrees={sideNavRouteTrees}
            isMobile
            onNavigate={closeMobileNav}
          />
        </aside>
      ) : null}

      {/* `FullscreenPanel` (`fullscreen-panel.jsx`) portals into this — a
          sibling of `.layout` (so, of `<main>`), not a descendant of it.
          Two things this buys over portalling straight to `document.body`:
          (1) it's still inside `<Theme>` (root layout wraps everything
          here in one), so Astryx's component-level theme CSS custom
          properties — which live on `<Theme>`'s own wrapper element, not
          just synced onto `<html>` — keep resolving; portalling past
          `<Theme>` entirely left buttons rendered with a transparent
          background (color survived via `appShellContentStyle`, but
          component theming didn't). (2) since it's NOT inside `<main>`,
          `main`'s `isolation: isolate` can't trap its stacking order
          below `header`'s z-index-40 context — a `position: fixed`
          child here paints above the header purely from normal stacking
          rules (both this div and `header` are non-positioned children
          of the same unstyled `.root` div, so a positioned descendant's
          z-index is compared at that shared level). */}
      <div id="fullscreen-portal-root" />
    </div>
  );
}
