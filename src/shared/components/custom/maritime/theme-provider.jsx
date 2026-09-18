'use client';

import './theme.built.css';

import { Theme } from '@astryxdesign/core/theme';

import { maritimeTheme } from './maritime.js';

/**
 * Scopes the "Maritime" theme (`theme.js`, this same folder) to whatever
 * subtree wraps it — nesting a second `<Theme>` re-themes just that
 * region without touching the app's own Stone theme (`astryx docs
 * theme`), same nesting trick `IbmPlexCorporateThemeProvider` uses. Not
 * wired into any page yet (2026-09-18).
 *
 * Astryx only sets the `--font-family-*` tokens; it never loads a font
 * file (confirmed by `astryx theme build`'s own warning when this theme
 * was built: `Theme "maritime" names fonts it does not load`). The
 * `<link>` below loads Be Vietnam Pro — React 19 hoists `<link>` rendered
 * anywhere in the tree into `<head>`, deduped by `href`, so this is safe
 * to mount more than once.
 * @param {{ children: import('react').ReactNode, mode?: 'system' | 'light' | 'dark' }} props
 */
export function MaritimeThemeProvider({ children, mode = 'light' }) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap"
      />
      <Theme theme={maritimeTheme} mode={mode}>
        {children}
      </Theme>
    </>
  );
}
