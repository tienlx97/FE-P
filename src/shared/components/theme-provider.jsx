'use client';

import './theme.built.css';

import { InternationalizationProvider } from '@astryxdesign/core/i18n';
import { LayerProvider } from '@astryxdesign/core/Layer';
import { LinkProvider } from '@astryxdesign/core/Link';
import viVN from '@astryxdesign/core/locales/vi-VN.json';
import { Theme } from '@astryxdesign/core/theme';
import NextLink from 'next/link';

import { ktXnkTheme } from './kt-xnk.js';

/**
 * Wraps both the app root and every portaled dialog (`FormDialog` reuses
 * this same provider for content rendered into `document.body`), so
 * `vi-VN` locale strings — including Calendar's month/weekday names, which
 * astryx otherwise defaults to `en` with no provider present — apply
 * everywhere, not just in the main tree. `LayerProvider` mounts one shared
 * toast viewport at the root instead of each `useToast()` caller lazily
 * self-mounting its own fallback (harmless, but per-caller viewports can't
 * share stacking/position config) — nested instances from each portaled
 * dialog's own `ThemeProvider` pass through as no-ops (see LayerProvider.tsx).
 * @param {{ children: import('react').ReactNode }} props
 */
export function ThemeProvider({ children }) {
  return (
    <LinkProvider component={NextLink}>
      <InternationalizationProvider locale="vi-VN" messages={{ 'vi-VN': viVN }}>
        <Theme theme={ktXnkTheme} mode="light">
          <LayerProvider toast={{ position: 'topEnd' }}>
            {children}
          </LayerProvider>
        </Theme>
      </InternationalizationProvider>
    </LinkProvider>
  );
}
