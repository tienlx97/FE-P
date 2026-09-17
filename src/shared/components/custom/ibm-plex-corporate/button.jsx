'use client';

import { Button } from '@astryxdesign/core/Button';

/**
 * "IBM Plex Corporate" button — per the spec: "Buttons feature solid
 * primary fills ... clear typographic labels" as the default affordance.
 * Everything else (the `0.25rem` soft radius, semibold label weight) is
 * theme-level (`theme.js`'s `components.button` override) and applies
 * automatically once this subtree is wrapped in
 * `IbmPlexCorporateThemeProvider` — this wrapper only changes the
 * default `variant`, not the visual styling itself.
 * @param {import('@astryxdesign/core/Button').ButtonProps} props
 */
export function IbmPlexButton({ variant = 'primary', ...props }) {
  return <Button variant={variant} {...props} />;
}
