import { defineTheme } from '@astryxdesign/core/theme';

const OPTIMISTIC_TEXT =
  '"Optimistic Text Vietnamese", "Optimistic Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const OPTIMISTIC_DISPLAY =
  '"Optimistic Display Vietnamese", "Optimistic Display", "Optimistic Text Vietnamese", "Optimistic Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/**
 * "Meta" — a custom Astryx theme built from the "Optimistic VF Commerce &
 * Hardware" design system (user request, 2026-09-23; spec copied verbatim
 * into `DESIGN.md`, this same folder) plus the first screen mockup built
 * on it (`.stitch/designs/meta-contracts-list.html`, Stitch project
 * 6957224641630765183). Same rule as Maritime: the mockup's own Tailwind
 * `colors`/`borderRadius` config is the source of truth, the prose is only
 * a summary of it.
 *
 * Mockup/spec token → Astryx token:
 * - `primary-container` (`#0064E0`, "vibrant cobalt") → `accent`; every
 *   interactive surface in the mockup uses it. `fb-blue` (`#1876F2`) is its
 *   hover shade → `--meta-accent-hover`.
 * - `ink` (`#1C1E21`) → text/icon primary; `muted-text` (`#65676B`) →
 *   text/icon secondary. `outline-border` (`#DEE3E9`) → `--color-border`.
 * - `background`/`surface-bright` (`#FAF8FF`) → body + muted bands
 *   (filter band, table header); `surface-container-lowest` (`#FFFFFF`) →
 *   card/surface/popover.
 * - `success`/`success-container` (`#1F883D`/`#DAFBE1`) → success role;
 *   `error`/`error-container` map directly.
 * - Everything else (tints, pill backgrounds, tertiary promo orange, ink
 *   button) lives as `--meta-*` local tokens for the wrapper components.
 * - One palette, no dark values: every token uses the same value in both
 *   modes.
 *
 * Typography: "Optimistic VF" → the app's already-loaded Optimistic Text
 * (body) and Optimistic Display (headings) Vietnamese builds, stylistic
 * sets ss01/ss02 on.
 *
 * Shape: the mockup is pill-shaped (buttons, filters, tabs, badges =
 * `rounded-full`) inside a `rounded-2xl` (16px) workspace card; form
 * controls keep the spec's 8px (`--radius-element`). Elevation: flat,
 * hairline borders; `--meta-shadow-float` only for sticky summary bars.
 */
export const metaTheme = defineTheme({
  name: 'meta',

  color: {
    accent: '#0064e0',
    neutralStyle: 'cool',
    contrast: 'standard',
  },

  typography: {
    scale: { base: 14, ratio: 1.2 },
    body: {
      family: 'Optimistic Text',
      fallbacks: '-apple-system, system-ui, sans-serif',
    },
    heading: {
      family: 'Optimistic Display',
      fallbacks: '-apple-system, system-ui, sans-serif',
      weight: 'bold',
    },
  },

  radius: { base: 4, multiplier: 1 },

  tokens: {
    '--font-family-body': OPTIMISTIC_TEXT,
    '--font-family-heading': OPTIMISTIC_DISPLAY,
    '--font-family-code': OPTIMISTIC_TEXT,

    // Pinned: the `color.accent` seed alone resolves to a contrast-adjusted
    // rgb(0, 88, 210), not the mockup's exact cobalt.
    '--color-accent': '#0064e0', // spec: primary-container
    '--color-on-accent': '#ffffff', // spec: on-primary
    '--color-background-body': '#faf8ff', // spec: background / surface
    '--color-background-surface': '#ffffff', // spec: surface-container-lowest
    '--color-background-card': '#ffffff',
    '--color-background-popover': '#ffffff',
    '--color-background-muted': '#faf8ff', // mockup: surface-bright (filter band, table header)
    '--color-background-inverted': '#2e3038', // spec: inverse-surface
    '--color-text-primary': '#1c1e21', // mockup: ink
    '--color-text-secondary': '#65676b', // mockup: muted-text
    '--color-icon-primary': '#1c1e21',
    '--color-icon-secondary': '#65676b',
    '--color-border': '#dee3e9', // mockup: outline-border (hairline)
    '--color-border-emphasized': '#c2c6d6', // spec: outline-variant
    '--color-error': '#ba1a1a', // spec: error
    '--color-on-error': '#ffffff', // spec: on-error
    '--color-error-muted': '#ffdad6', // spec: error-container
    '--color-success': '#1f883d', // mockup: success
    '--color-on-success': '#ffffff',
    '--color-success-muted': '#dafbe1', // mockup: success-container
    '--radius-container': '16px', // mockup: rounded-2xl workspace card
  },

  localTokens: {
    // Interactive blues
    '--meta-primary-strong': '#004db0', // spec: primary (pressed cobalt)
    '--meta-accent-hover': '#1876f2', // mockup: fb-blue (link / button hover)
    '--meta-accent-tint': '#f0f5ff', // mockup: blue wash (count pill, totals row)
    '--meta-accent-tint-strong': '#e8f1ff', // mockup: "Đang thực hiện" pill bg
    '--meta-accent-tint-border': 'rgba(0, 100, 224, 0.2)', // mockup: border-[#0064e0]/20
    '--meta-primary-fixed': '#d9e2ff', // spec: primary-fixed
    '--meta-on-primary-fixed': '#001944', // spec: on-primary-fixed

    // Marketing "ink" button (solid black)
    '--meta-ink-button': '#000000',
    '--meta-on-ink-button': '#ffffff',

    // Neutrals
    '--meta-charcoal': '#444950', // mockup: charcoal (resting tab text)
    '--meta-outline-light': '#e4e6eb', // mockup: outline-light (inner dividers)
    '--meta-neutral-pill-bg': '#f1f3f6', // mockup: "Bản nháp" pill bg
    '--meta-success-pill-bg': '#e8f5e9', // mockup: "Hoàn thành" pill bg
    '--meta-success-pill-border': 'rgba(31, 136, 61, 0.2)', // mockup: border-success/20
    '--meta-on-accent-pill-bg': 'rgba(255, 255, 255, 0.2)', // mockup: bg-white/20 (count on active tab)
    '--meta-row-hover': '#f8faff', // mockup: table row hover

    // Tertiary — limited-time promo / highlight orange
    '--meta-tertiary': '#913400', // spec: tertiary
    '--meta-tertiary-container': '#b94500', // spec: tertiary-container
    '--meta-on-tertiary-container': '#ffe7df', // spec: on-tertiary-container

    '--meta-on-error-container': '#93000a', // spec: on-error-container

    // Surface ladder
    '--meta-surface-container-low': '#f2f3fe', // spec: surface-container-low
    '--meta-surface-container': '#ecedf8', // spec: surface-container
    '--meta-surface-container-high': '#e6e7f2', // spec: surface-container-high

    // Elevation — only sticky checkout bars / summary panels
    '--meta-shadow-float': 'rgba(20, 22, 26, 0.3) 0px 1px 4px 0px',

    '--meta-font-features': '"ss01", "ss02"',

    // Framed list table (`AdvanceTable isFramed`) bands — theme-neutral
    // names read by `tanstack-data-table.jsx`.
    '--table-framed-total-bg': '#f0f5ff', // mockup: Σ totals row
    '--table-framed-group-bg': '#f4f7fc', // mockup: header group band
  },

  components: {
    heading: {
      base: {
        fontFeatureSettings: 'var(--meta-font-features)',
        letterSpacing: '-0.01em',
      },
    },
    text: {
      base: {
        fontFeatureSettings: 'var(--meta-font-features)',
      },
    },
    button: {
      base: {
        borderRadius: 'var(--radius-full)',
        fontWeight: 'var(--font-weight-semibold)',
      },
      // Figma node 83:523: bold label + a faint cobalt drop shadow.
      'variant:primary': {
        boxShadow: '0 1px 2px 0 rgba(0, 100, 224, 0.25)',
        fontWeight: 'var(--font-weight-bold)',
      },
      // Mockup "Xuất Excel" / "Đặt lại": white pill with a hairline border.
      'variant:secondary': {
        backgroundColor: 'var(--color-background-surface)',
        borderColor: 'var(--color-border)',
        borderStyle: 'solid',
        borderWidth: 'var(--border-width)',
      },
    },
    badge: {
      base: {
        borderRadius: 'var(--radius-full)',
      },
    },
    'input-group': {
      base: {
        backgroundColor: 'var(--color-background-surface)',
        borderColor: 'var(--color-border)',
        borderRadius: 'var(--radius-full)',
      },
    },
    'text-input': {
      base: {
        backgroundColor: 'var(--color-background-surface)',
        borderColor: 'var(--color-border)',
        borderRadius: 'var(--radius-element)',
      },
    },
    selector: {
      base: {
        backgroundColor: 'var(--color-background-surface)',
        borderColor: 'var(--color-border)',
        borderRadius: 'var(--radius-full)',
      },
    },
    tab: {
      base: {
        // Tab's hover wash is an inner absolutely-positioned span rounded
        // with `--radius-element` (8px) and no theming key of its own —
        // re-pointing the token on the tab makes that span a pill too.
        '--radius-element': 'var(--radius-full)',
        backgroundColor: 'var(--meta-surface-container-low)',
        borderRadius: 'var(--radius-full)',
        color: 'var(--meta-charcoal)',
        fontWeight: 'var(--font-weight-semibold)',
        paddingInline: 'var(--spacing-4)',
      },
      selected: {
        backgroundColor: 'var(--color-accent)',
        color: 'var(--color-on-accent)',
        fontWeight: 'var(--font-weight-bold)',
      },
    },
    'tab-indicator': {
      base: {
        display: 'none',
      },
    },
    'segmented-control': {
      base: {
        backgroundColor: 'var(--meta-surface-container)',
        borderRadius: 'var(--radius-full)',
      },
    },
    'segmented-control-item': {
      base: {
        borderRadius: 'var(--radius-full)',
        color: 'var(--color-text-secondary)',
      },
      selected: {
        backgroundColor: 'var(--color-background-surface)',
        color: 'var(--color-accent)',
        fontWeight: 'var(--font-weight-semibold)',
      },
    },
    // The framed list card clips its overflow, so the table's own scroller
    // must fill the card's content area to scroll (same as Maritime);
    // header cells stay pinned while the body scrolls under them.
    'table-scroll-wrapper': {
      base: {
        height: '100%',
      },
    },
    'table-header-cell': {
      base: {
        position: 'sticky',
        top: '0',
        zIndex: '2',
        backgroundColor: 'var(--color-background-muted)',
        color: 'var(--color-text-secondary)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-bold)',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      },
    },
    // Thin payment-progress bars (user request: longer, flatter than the
    // default 8px track).
    'progress-bar-track': {
      base: {
        backgroundColor: 'var(--meta-surface-container-high)',
        height: 'var(--spacing-1)',
      },
    },
    card: {
      base: {
        borderRadius: 'var(--radius-container)',
        borderWidth: 'var(--border-width)',
        borderStyle: 'solid',
        borderColor: 'var(--color-border)',
        boxShadow: 'none',
      },
    },
  },
});
