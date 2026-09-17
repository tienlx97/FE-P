import { defineTheme } from '@astryxdesign/core/theme';

/**
 * "IBM Plex Corporate" — a custom Astryx theme built from a design spec
 * the user supplied (2026-09-17): Material-3-style role names (surface,
 * on-surface, primary/-container, tertiary/-container, error/-container,
 * outline/-variant) mapped onto Astryx's own token vocabulary
 * (`astryx docs tokens`), not invented from scratch. Not wired into any
 * page yet — user explicitly asked to create the folder first and apply
 * it later.
 *
 * Mapping notes (spec role → Astryx token), since the two vocabularies
 * don't line up 1:1:
 * - `primary` (#0f62fe, the "vibrant enterprise blue" the spec's own prose
 *   calls out as the anchor color — the YAML's separate `primary` #004ccd
 *   read as the on-light/pressed variant, not the seed) is passed to
 *   `color.accent`, which auto-derives `--color-on-accent` and every
 *   accent-adjacent tone (hover/pressed/muted) via Astryx's HCT model —
 *   more consistent than hand-writing each one.
 * - `tertiary`/`on-tertiary-container` (green, "success states,
 *   confirmations") map to `--color-success`/`--color-success-muted`,
 *   Astryx's own semantic role for the same concept.
 * - `surface`/`surface-container-lowest`/`on-surface`/`on-surface-variant`/
 *   `outline`/`outline-variant` map to
 *   `--color-background-body`/`-surface`/`-card`, `--color-text-primary`/
 *   `-secondary`, `--color-border`/`-border-emphasized`.
 * - `error`/`on-error`/`error-container` map directly to
 *   `--color-error`/`-on-error`/`-error-muted` — same role, different name.
 * - The spec gives one palette with no distinct dark-mode values ("high
 *   contrast for typography ... in light mode" — it doesn't describe a
 *   dark scheme at all), so every explicit token override below uses the
 *   same value for both modes rather than inventing a dark variant that
 *   was never specified.
 *
 * Radius: the spec's `rounded.DEFAULT` (0.25rem = 4px) already equals
 * Astryx's own default `radius.base` — no scale override needed, only the
 * `components.button`/`card` overrides below (see their own comments).
 *
 * Typography: `astryx theme build` only sets the `--font-family-*`
 * tokens — it never loads a font file (see `theme.template.ts`, section
 * 2). `IbmPlexCorporateThemeProvider` (`theme-provider.jsx`, this same
 * folder) loads the IBM Plex Sans stylesheet.
 */
export const ibmPlexCorporateTheme = defineTheme({
  name: 'ibm-plex-corporate',

  color: {
    accent: '#0f62fe',
    neutralStyle: 'cool',
    contrast: 'standard',
  },

  typography: {
    // body-md is 14px in the spec; no second data point to derive a
    // custom ratio from, so this keeps Astryx's own default step (1.2).
    scale: { base: 14, ratio: 1.2 },
    body: {
      family: 'IBM Plex Sans',
      fallbacks: '-apple-system, system-ui, sans-serif',
    },
    heading: {
      family: 'IBM Plex Sans',
      fallbacks: '-apple-system, system-ui, sans-serif',
      weight: 'semibold',
    },
  },

  radius: { base: 4, multiplier: 1 },

  tokens: {
    '--color-background-body': '#fbf9f8', // spec: surface
    '--color-background-surface': '#ffffff', // spec: surface-container-lowest
    '--color-background-card': '#ffffff', // spec: surface-container-lowest
    '--color-background-popover': '#efeded', // spec: surface-container
    '--color-background-muted': '#eae8e7', // spec: surface-container-high
    '--color-text-primary': '#1b1c1c', // spec: on-surface
    '--color-text-secondary': '#424656', // spec: on-surface-variant
    '--color-icon-primary': '#1b1c1c',
    '--color-icon-secondary': '#424656',
    '--color-border': '#c3c6d8', // spec: outline-variant
    '--color-border-emphasized': '#737687', // spec: outline
    '--color-success': '#198038', // spec: tertiary
    '--color-on-success': '#ffffff', // spec: on-tertiary
    '--color-success-muted': '#d4ffd2', // spec: on-tertiary-container
    '--color-error': '#ba1a1a', // spec: error
    '--color-on-error': '#ffffff', // spec: on-error
    '--color-error-muted': '#ffdad6', // spec: error-container
  },

  components: {
    button: {
      base: {
        // Spec: "soft rounded corners (0.25rem)" — Astryx's own button
        // default is pill-shaped (`--radius-full`); this is the one place
        // the spec explicitly asks for something other than the default.
        borderRadius: 'var(--radius-inner)',
        fontWeight: 'var(--font-weight-semibold)',
      },
    },
    card: {
      base: {
        // Spec: "Elevation ... low-contrast outlines rather than heavy
        // drop shadows" — an explicit border instead of relying on
        // `elevation`, and the spec's "larger containers" radius (0.5rem).
        borderRadius: 'var(--radius-element)',
        borderWidth: 'var(--border-width)',
        borderStyle: 'solid',
        borderColor: 'var(--color-border)',
      },
    },
  },
});
