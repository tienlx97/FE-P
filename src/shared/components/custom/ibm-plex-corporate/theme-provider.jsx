'use client';

import './theme.built.css';

import { Theme } from '@astryxdesign/core/theme';

import { ibmPlexCorporateTheme } from './ibm-plex-corporate.js';

/**
 * Scopes the "IBM Plex Corporate" theme (`theme.js`, this same folder) to
 * whatever subtree wraps it — nesting a second `<Theme>` re-themes just
 * that region without touching the app's own Stone theme
 * (`astryx docs theme`; `theme-provider.jsx` at the app root does the
 * same nesting trick for portaled dialogs). Not wired into any page yet
 * — user asked to create the folder first and apply it later
 * (2026-09-17).
 *
 * Astryx only sets the `--font-family-*` tokens; it never loads a font
 * file (confirmed by `astryx theme build`'s own warning when this theme
 * was built: `Theme "ibm-plex-corporate" names fonts it does not load`).
 * The `<link>` below loads IBM Plex Sans — React 19 hoists `<link>`
 * rendered anywhere in the tree into `<head>`, deduped by `href`, so this
 * is safe to mount more than once.
 * @param {{ children: import('react').ReactNode, mode?: 'system' | 'light' | 'dark' }} props
 */
export function IbmPlexCorporateThemeProvider({ children, mode = 'light' }) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
      />
      <Theme theme={ibmPlexCorporateTheme} mode={mode}>
        {children}
      </Theme>
    </>
  );
}
