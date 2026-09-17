'use client';

import { TextInput } from '@/shared/components/text-input.jsx';

/**
 * "IBM Plex Corporate" text input — per the spec: "Outlined containers
 * with clear focus states anchored by the primary blue hue." `TextInput`
 * already draws an outline and focuses via `--focus-outline-color`
 * (`var(--color-accent)`, which `theme.js`'s `color.accent: '#0f62fe'`
 * already re-points) — this wrapper exists so call sites import from one
 * place alongside the rest of this folder, not because any prop default
 * needs to change.
 *
 * Imports the app's own `shared/components/text-input.jsx` wrapper, not
 * the Astryx core component directly — `readonly-input-wrappers.test.js`
 * enforces that every caller goes through it (it merges a
 * readonly-background tint fix Astryx's own component doesn't have, see
 * that wrapper's doc comment).
 * @param {Parameters<typeof TextInput>[0]} props
 */
export function IbmPlexTextInput(props) {
  return <TextInput {...props} />;
}
