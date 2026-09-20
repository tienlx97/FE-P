'use client';

import './scrollbar.css';
import './theme.built.css';

import { Theme } from '@astryxdesign/core/theme';

import { maritimeTheme } from './maritime.js';

/**
 * Scopes the "Maritime" theme (`theme.js`, this same folder) to whatever
 * subtree wraps it — nesting a second `<Theme>` re-themes just that
 * region without touching the app's own Stone theme (`astryx docs
 * theme`). It is applied to the contract-detail workspace.
 *
 * @param {{ children: import('react').ReactNode, mode?: 'system' | 'light' | 'dark' }} props
 */
export function MaritimeThemeProvider({ children, mode = 'light' }) {
  return (
    <>
      <span hidden data-maritime-scroll />
      <Theme theme={maritimeTheme} mode={mode}>
        {children}
      </Theme>
    </>
  );
}
