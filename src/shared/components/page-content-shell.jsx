import { spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import * as stylex from '@stylexjs/stylex';

// Padding/width contract for routes that self-manage their own `<main>`
// padding instead of `ProtectedAppShell`'s flat `paddedMain` — currently
// `/admin/*`. Shares the /docs MDX shell's inset scale (react.dev's
// Page.tsx/Tailwind defaults: <640px 20px inset, >=640px 48px inset) but
// caps content wider, at 110rem instead of docs' 80rem — /admin's data
// tables (e.g. the users list) need the extra columns' worth of room that
// prose content doesn't.
//
// The inset values are deliberately a duplicate of `mdx-article.jsx`'s
// `bodyOuter`/`bodyInner` values, not a shared import from there:
// `docs-shell-contract.test.js` pins those exact literal strings ('20px',
// '48px') as living inside the docs-shell file set itself
// (`assert.match(combinedSource, ...)` over `mdx-article.jsx` et al.), so
// moving them out would fail that test. Keep both in sync by hand if
// react.dev's own inset scale ever changes (the max-width is intentionally
// independent, see above).
export const pageContentShellStyles = stylex.create({
  outer: {
    paddingBlockEnd: spacingVars['--spacing-12'],
    paddingInline: {
      default: '20px',
      '@media (min-width: 640px)': '48px',
    },
  },
  inner: {
    marginInline: 'auto',
    maxWidth: '110rem',
    width: '100%',
  },
  // /logistics/*'s data tables (contracts, shipments, etc.) routinely need
  // more columns' worth of room than even /admin's 110rem cap gives them —
  // this drops the cap entirely instead of just raising it, since there's
  // no natural next number that stays right as monitors get wider.
  innerFullWidth: {
    maxWidth: 'none',
  },
  // A page that wants its list to fill the remaining viewport height
  // (`AdvanceTable`'s `Layout height="fill"`, 2026-09-14 — matching MISA's
  // report grid: rows fill the screen, header/totals/pagination pinned)
  // needs a real, bounded height somewhere in its ancestor chain — `100%`
  // of an auto-height box is a no-op. `64px` is the same header height
  // `protected-app-shell.jsx` already reserves in three places
  // (`.layout`/`.desktopSideNavInner`'s `calc(100vh - 64px)`); duplicated
  // here rather than shared since none of those were extracted to a
  // constant either. Drops `outer`'s own bottom padding — a fill-height
  // page's last visible thing is the list's own pinned footer, which
  // already carries its own padding, so the outer gutter would just be
  // dead space pushed below the fold instead of trailing whitespace.
  fillHeightOuter: {
    height: 'calc(100vh - 64px)',
    overflow: 'hidden',
    paddingBlockEnd: 0,
  },
  fillHeightInner: {
    height: '100%',
  },
});

/**
 * Convenience wrapper for non-MDX pages that want the same padding/width
 * contract as `/docs` (see `pageContentShellStyles` above) — `/admin/*`'s
 * standard page shell.
 * @param {{ children: import('react').ReactNode, isFullWidth?: boolean, fillHeight?: boolean }} props
 */
export function PageContentShell({
  children,
  isFullWidth = false,
  fillHeight = false,
}) {
  return (
    <div
      {...stylex.props(
        pageContentShellStyles.outer,
        fillHeight && pageContentShellStyles.fillHeightOuter,
      )}
    >
      <div
        {...stylex.props(
          pageContentShellStyles.inner,
          isFullWidth && pageContentShellStyles.innerFullWidth,
          fillHeight && pageContentShellStyles.fillHeightInner,
        )}
      >
        {children}
      </div>
    </div>
  );
}
