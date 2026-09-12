import { defineTheme } from '@astryxdesign/core/theme';

// Light-only DN Group palette: logo teal anchors actions, mint identifies
// table headings and selection, and pale teal surfaces frame white data.
// Keep business statuses on their conventional green/amber/red hues.
export const ktxnkTheme = defineTheme({
  name: 'kt-xnk',
  // Astryx's neutral default (14px base / 1.2 ratio) is the site-wide
  // scale — normal UI density for nav chrome, forms, buttons, etc. The
  // larger react.dev-matched scale (body 17px) that used to live here is
  // now scoped to just `/` and `/docs*` via
  // `protected-app-shell.jsx`'s `largeTypography` style (that reading
  // density makes sense for long-form doc content, not for a page like
  // `/admin`'s create-user form) — see the comment there for the ported
  // react.dev values.
  typography: {
    body: {
      family: 'Optimistic Text Vietnamese',
      fallbacks:
        '"Optimistic Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    heading: {
      family: 'Optimistic Display Vietnamese',
      fallbacks:
        '"Optimistic Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    code: {
      family: 'Source Code Pro',
      fallbacks:
        '"SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
  },
  tokens: {
    // Brand teal, exactly as it appears in the logo — drives primary buttons,
    // focus rings, links, and accent-colored icons.
    '--color-accent': '#247768',
    // Shared selection/callout tint, deliberately softer than table headers.
    '--color-accent-muted': '#e5f3ed',
    '--color-on-accent': '#ffffff',
    '--color-text-accent': '#247768',
    '--color-icon-accent': '#247768',

    // Per user request (2026-09-12): plain white canvas instead of the
    // teal-tinted one; elevated cards, inputs and data stay white too.
    '--color-background-body': '#ffffff',
    '--color-background-surface': '#ffffff',
    '--color-background-muted': '#edf5f1',
    '--color-background-card': '#ffffff',
    '--color-background-popover': '#ffffff',

    // Text & icons — same ramp, mid/dark end.
    '--color-text-primary': '#1e2a27', // tone 16, chroma 6
    '--color-text-secondary': '#354b46', // tone 30, chroma 10
    '--color-icon-primary': '#1e2a27',
    '--color-icon-secondary': '#354b46',

    // Borders — same ramp. The hairline was previously tone 80 (a visibly
    // heavy gray-teal rule); react.dev's equivalent sits at tone 93.
    '--color-border': '#e7eceb', // tone 93, chroma 2 — decorative hairline
    '--color-border-emphasized': '#6a8a83', // tone 55, chroma 13 — form-control outlines, 3.77:1 on body (WCAG 1.4.11 needs 3:1)

    // Status colors — conventional hues, react.dev's soft tint band.
    // The muted values are what Banner paints as its header background.
    '--color-error': '#b4271f', // 5.68:1 on its own tint
    '--color-on-error': '#ffffff',
    '--color-error-muted': '#fdedea', // tone 95, chroma 6
    '--color-success-muted': '#eaf3e9', // tone 95, chroma 6 — pairs with the default #0d8626 at 4.15:1
    // Astryx's default --color-warning (#e9af08) is tone 74.8: only 1.75:1
    // against its own tint, failing WCAG 1.4.11 for non-text. Dropped to tone
    // 48 — the same move react.dev makes (their yellow solid is #B65700,
    // tone 48) — which lifts it to 4.23:1.
    '--color-warning': '#956b00',
    '--color-on-warning': '#ffffff', // 4.79:1; dark text on the new tone would be 3.09, failing AA
    '--color-warning-muted': '#f7f0e5', // tone 95, chroma 6

    // Deliberately left at Astryx/theme-neutral defaults: --color-success
    // (the solid green already passes on the new tint), the categorical tag
    // colors (--color-*-blue/cyan/gray/green/orange/pink/purple/red/teal/
    // yellow), and structural tokens (--color-neutral, --color-overlay*,
    // --color-skeleton, --color-track, --color-shadow, --color-tint-hover) —
    // these aren't brand identity, changing them would just be surprising.
  },
  components: {
    // Astryx's Button `variant` prop is an emphasis level, not a brand hue —
    // `variant="primary"` already resolves to --color-accent above, but
    // `variant="secondary"` defaults to a neutral gray (--color-neutral), not
    // our brand red. Point it at the logo red instead, so the two brand
    // colors carry equal visual weight where they meet. Red only surfaces
    // here (far less often than primary), so this doesn't make red the
    // dominant surface color.
    button: {
      'variant:secondary': {
        backgroundColor: '#c2252a', // logo red, 5.85:1 against the white label
        color: '#ffffff',
        // Astryx's built-in variants derive :hover/:active automatically via
        // color-mix(base, --color-tint-hover); a flat component override
        // like this one doesn't inherit that, so it must be declared
        // explicitly or the button has no press/hover feedback at all.
        ':hover': {
          backgroundColor:
            'color-mix(in srgb, #c2252a, var(--color-tint-hover) 15%)',
        },
        ':active': {
          backgroundColor:
            'color-mix(in srgb, #c2252a, var(--color-tint-hover) 25%)',
        },
      },
    },
    // Astryx ships a `disabled` state (dimmed/reduced-opacity) for every
    // text-like input, but no default visual at all for `readonly` — a
    // read-only TextInput renders pixel-identical to an empty editable one.
    // Once view-mode forms (Commission/Shipment/Contract) started reusing
    // native `isReadOnly` side-by-side with real `isDisabled` fields (e.g. a
    // locked "Loại hình" Selector next to a read-only "Số booking"
    // TextInput), the two states read as the same thing — per user request
    // (2026-09-07), give `readonly` its own tinted-but-not-dimmed
    // background so it reads as "has a value, just not this field" instead
    // of either plain-editable or grayed-out-disabled.
    //
    // Background only, no borderColor override: inside an InputGroup (e.g.
    // FormattedNumberTextInput's currency suffix), Astryx fakes one
    // continuous border across every segment by overlapping each segment's
    // own left border onto the previous segment's right edge
    // (`margin-inline-start: calc(-1 * var(--border-width))`) — clearing
    // this field's border here would erase that shared seam and leave the
    // adjacent unit box looking borderless on its left edge (2026-09-07).
    'text-input': {
      readonly: { backgroundColor: 'var(--color-background-muted)' },
    },
    'number-input': {
      readonly: { backgroundColor: 'var(--color-background-muted)' },
    },
    textarea: {
      readonly: { backgroundColor: 'var(--color-background-muted)' },
    },
    // astryx's Toast only ships `type: 'info' | 'error'` — every save
    // confirmation in this app fires an unthemed 'success' type (see
    // `useAppToast`), which without this override renders identical to
    // 'info' (same dark inverted surface). Per user request (2026-09-08),
    // give it the conventional green instead.
    // astryx's Toast only ships `type: 'info' | 'error'` — every save
    // confirmation in this app fires an unthemed 'success' type (see
    // `useAppToast`), which without this override renders identical to
    // 'info' (same dark inverted surface). Per user request (2026-09-08),
    // give it the conventional green instead.
    toast: {
      'type:success': {
        backgroundColor: 'var(--color-success)',
        color: 'var(--color-on-success)',
      },
    },
    // Paint cells as well as the section so pinned headers stay opaque.
    // `position: sticky` goes on the header *cells* (`<th>`), not the
    // `<thead>` itself — sticky on a table-header-group isn't reliably
    // supported across browsers, sticky on each cell is (2026-09-12, per
    // user request to keep the header visible while scrolling).
    'table-header': {
      base: { backgroundColor: '#dceee8' },
    },
    'table-header-cell': {
      base: {
        backgroundColor: '#dceee8',
        color: '#18594e',
        position: 'sticky',
        top: '0',
        zIndex: '1',
      },
    },
    'table-body': {
      base: { backgroundColor: 'var(--color-background-card)' },
    },
    'table-footer': {
      base: { backgroundColor: 'var(--color-background-muted)' },
    },
    tab: {
      selected: {
        backgroundColor: 'var(--color-accent-muted)',
        color: 'var(--color-text-accent)',
      },
    },
  },
});
