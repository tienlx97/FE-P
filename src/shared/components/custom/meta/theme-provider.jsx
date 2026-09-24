'use client';

import './scrollbar.css';
import './theme.built.css';

import { Theme } from '@astryxdesign/core/theme';

import { metaTheme } from './meta.js';

/**
 * Scopes the "Meta" theme (`theme.js`, this same folder) to whatever
 * subtree wraps it — a nested `<Theme>` re-themes just that region without
 * touching the app's own theme.
 *
 * @param {{ children: import('react').ReactNode, mode?: 'system' | 'light' | 'dark' }} props
 */
export function MetaThemeProvider({ children, mode = 'light' }) {
  return (
    <Theme theme={metaTheme} mode={mode}>
      {children}
    </Theme>
  );
}
