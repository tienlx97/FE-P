'use client';

import { Card } from '@astryxdesign/core/Card';

/**
 * "IBM Plex Corporate" card — per the spec: "Elevation is achieved
 * through low-contrast outlines ... rather than heavy drop shadows."
 * Defaults `elevation` to `'none'` (Astryx's own default already, made
 * explicit here so a caller can't accidentally reach for a shadow this
 * theme doesn't want) — the visible border/soft-corner look itself comes
 * from the theme's `components.card` override (`theme.js`), which applies
 * once this subtree is wrapped in `IbmPlexCorporateThemeProvider`.
 * @param {import('@astryxdesign/core/Card').CardProps} props
 */
export function IbmPlexCard({ elevation = 'none', ...props }) {
  return <Card elevation={elevation} {...props} />;
}
