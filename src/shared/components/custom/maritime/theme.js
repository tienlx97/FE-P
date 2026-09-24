import { defineTheme } from '@astryxdesign/core/theme';

/**
 * "Maritime" — a custom Astryx theme built from the exact color palette
 * baked into the Stitch mockup's own `<script id="tailwind-config">`
 * block (`.stitch/designs/maritime-contract-shipment-table.html`), not
 * from `.stitch/DESIGN.md`'s prose. First pass (2026-09-18) used the
 * DESIGN.md prose's own hex values and diverged visibly from the mockup
 * (badge tint, button background, accent hue) — the prose is a *summary*
 * of the palette, the mockup's embedded Tailwind `colors` object is what
 * Stitch actually rendered pixel-for-pixel, so it's the source of truth
 * from here on. Not wired into any page yet.
 *
 * Mockup token → Astryx token:
 * - `secondary` (`#0051D5`) → `accent` — this is the color every
 *   interactive surface in the mockup actually uses (`bg-secondary` on
 *   the primary "+ Thao tác" button, `text-secondary` on the "Chính thức"
 *   badge and the copy-icon hover) — NOT `secondary-container` (`#2563EB`,
 *   unused in this screen) and not DESIGN.md prose's `#2563EB` guess.
 * - `on-surface` (`#0B1C30`) → `--color-text-primary`; `on-surface-variant`
 *   (`#475569`) → `--color-text-secondary`.
 * - `surface` (`#F8F9FF`) → `--color-background-body`;
 *   `surface-container-lowest` (`#FFFFFF`) → card/surface background;
 *   `surface-container-low` (`#EFF4FF`) → resting background for
 *   secondary/outline buttons (`bg-surface-container-low` in the mockup —
 *   *not* white, the prose's "Component Surfaces" reading was wrong for
 *   this element); `surface-container` (`#E5EEFF`) → their hover state
 *   and dropdown-menu background; `surface-container-high` (`#DCE9FF`) →
 *   card/button border color.
 * - `error`/`error-container`/`on-error-container` map directly
 *   (`#B91C1C`/`#FEE2E2`/`#7F1D1D`) — named custom tokens in the mockup,
 *   not a Tailwind default swatch.
 * - The status/type badges instead use bare Tailwind default swatches
 *   (`blue-50/200`, `emerald-50/200/800`, `amber` family) that aren't in
 *   the mockup's custom palette at all — those live as `--maritime-badge-*`
 *   tokens below (consumed by `badge.jsx`, this same folder) rather than
 *   forcing them through `success`/`warning`/`error`, since e.g. the
 *   emerald badge text is literally Tailwind `emerald-800` (`#065F46`),
 *   distinct from any semantic role Astryx defines.
 * - The mockup gives one palette with no distinct dark-mode values, so
 *   every token below uses the same value for both modes.
 *
 * Typography: the app's Optimistic Text for body, headings and "code" text
 * alike (user request, 2026-09-19; no JetBrains Mono), set through the
 * `--font-family-*` token overrides below. `typography.*.family` is kept
 * only so the type scale still builds; the token overrides win. The face is
 * already loaded app-wide, so `theme-provider.jsx` loads nothing.
 *
 * Radius: mockup's `borderRadius.DEFAULT` is `4px`, matching Astryx's own
 * `radius.base` default — controls/badges need no override. Cards use the
 * mockup's `rounded-md` (also `4px` in its own scale) plus a hairline
 * border and no elevation shadow (`shadow-xs` in the mockup, a barely
 * visible 1px shadow) — set via the `card` component override below.
 */
export const maritimeTheme = defineTheme({
  name: 'maritime',

  color: {
    accent: '#0051d5',
    neutralStyle: 'cool',
    contrast: 'standard',
  },

  typography: {
    // 14px body text (user request, 2026-09-19); components use the
    // Astryx size scale/types as-is, no per-token overrides.
    scale: { base: 14, ratio: 1.2 },
    body: {
      family: 'Be Vietnam Pro',
      fallbacks: '-apple-system, system-ui, sans-serif',
    },
    heading: {
      family: 'Be Vietnam Pro',
      fallbacks: '-apple-system, system-ui, sans-serif',
      weight: 'semibold',
    },
  },

  radius: { base: 4, multiplier: 1 },

  tokens: {
    // Same font stack as the rest of the app (`src/shared/components/
    // theme.js`) instead of the mockup's Be Vietnam Pro: Optimistic Text
    // (Vietnamese-complete build), loaded once in `globals.css`.
    '--font-family-body':
      '"Optimistic Text Vietnamese", "Optimistic Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    '--font-family-heading':
      '"Optimistic Text Vietnamese", "Optimistic Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    // "Code" text (amounts, Đợt NN, Incoterm chip) also uses Optimistic
    // instead of the app's JetBrains Mono, and headings instead of Montserrat (user request, 2026-09-19).
    '--font-family-code':
      '"Optimistic Text Vietnamese", "Optimistic Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    '--color-background-body': '#f8f9ff', // mockup: surface
    '--color-background-surface': '#ffffff', // mockup: surface-container-lowest
    '--color-background-card': '#ffffff', // mockup: surface-container-lowest
    '--color-background-popover': '#ffffff', // desktop popovers: neutral surface
    // Keep muted containers transparent so their text retains contrast
    // against the surface underneath (user feedback, 2026-09-20).
    '--color-background-muted': 'transparent',
    '--color-text-primary': '#0b1c30', // mockup: on-surface
    '--color-text-secondary': '#475569', // mockup: on-surface-variant
    '--color-icon-primary': '#0b1c30',
    '--color-icon-secondary': '#475569',
    '--color-border': '#dce9ff', // mockup: surface-container-high (card/button border)
    '--color-border-emphasized': '#cbd5e1', // mockup: outline-variant
    '--color-error': '#b91c1c', // mockup: error
    '--color-on-error': '#ffffff',
    '--color-error-muted': '#fee2e2', // mockup: error-container

    // "Đã thu" (collected/paid) semantic — the Figma payment-progress card
    // (`payment-summary-card.jsx`, this same folder; node `fg.card-gia-tri`,
    // https://www.figma.com/design/lPZR4jL1VwX6ICnLiiBinv, 2026-09-18) uses
    // Tailwind teal-600, not Astryx's default green, for every "paid"
    // signal (progress-bar fill, completed installment steps) — repointing
    // the semantic success role keeps `Stepper`'s own `status="success"`
    // coloring correct instead of overriding it per-usage.
    '--color-success': '#0d9488', // figma: teal-600
    '--color-on-success': '#ffffff',
    '--color-success-muted': '#f0fdfa', // figma: teal-50 (paid installment card bg)

    // Payment-progress card text tones not covered by the existing
    // on-surface/on-surface-variant pair above — sourced from the same
    // Figma node tree. Cast to `any`: `TokenName` is a closed union of
    // Astryx's own core/domain tokens with no project-augmentation path,
    // same as every other `--maritime-*` custom token below — this repo's
    // established escape hatch for astryx type gaps (see e.g.
    // `src/shared/components/advance-table.jsx`'s own `@type {any}` casts).
    .../** @type {any} */ ({
      '--maritime-text-muted': '#0B1C30', // figma: stat-card caption label / upcoming step text
      '--maritime-text-subtle': '#45464d', // figma: stat-card footnote text
      '--maritime-teal-value': '#0f766e', // figma: teal-700 (exported-value figure)
      '--maritime-teal-text': '#115e59', // figma: teal-800 (exported-value note, paid step text)
      '--maritime-teal-border': '#99f6e4', // figma: teal-200 (paid installment card border)
      '--maritime-step-active-bg': '#eff6ff', // figma: current installment card bg (blue-50)
      '--maritime-badge-teal-bg': '#ccfbf1', // figma: teal-100 (stat-card icon badge, "teal" tone)
    }),

    // Astryx has no themeable hover-state CSS variable for Button (see
    // `astryx component Button`'s empty "States" column — hover comes from
    // an internal black/white tint overlay, not a swappable token), so
    // literal hover colors from the mockup can't go through
    // `components.button`. Exposed as plain custom properties instead,
    // consumed via `xstyle` from `button.jsx` in this same folder.
    '--maritime-button-primary-hover': '#1d4ed8', // mockup: literal Tailwind `hover:bg-blue-700`
    '--maritime-button-secondary-hover': '#e5eeff', // mockup: surface-container

    // Status/type badge colors — bare Tailwind default swatches in the
    // mockup, not part of its custom palette (see file-header comment).
    // Consumed via `xstyle` from `badge.jsx` in this same folder.
    '--maritime-badge-info-bg': 'rgba(239, 246, 255, 0.5)', // mockup: bg-blue-50/50 (50% opacity)
    '--maritime-badge-info-border': '#bfdbfe', // mockup: border-blue-200
    '--maritime-badge-info-text': '#0051d5', // mockup: text-secondary
    '--maritime-badge-success-bg': '#ecfdf5', // mockup: bg-emerald-50
    '--maritime-badge-success-border': '#a7f3d0', // mockup: border-emerald-200
    '--maritime-badge-success-text': '#065f46', // mockup: text-emerald-800
    '--maritime-badge-success-dot': '#0d9488', // mockup: bg-teal-600
    '--maritime-badge-warning-bg': '#fffbeb', // Tailwind amber-50
    '--maritime-badge-warning-border': '#fde68a', // Tailwind amber-200
    '--maritime-badge-warning-text': '#92400e', // Tailwind amber-800
    '--maritime-badge-error-bg': '#fee2e2', // mockup: error-container
    '--maritime-badge-error-border': '#fecaca', // Tailwind red-200
    '--maritime-badge-error-text': '#7f1d1d', // mockup: on-error-container
    '--maritime-badge-neutral-bg': '#eff4ff', // mockup: surface-container-low
    '--maritime-badge-neutral-border': '#cbd5e1', // mockup: outline-variant
    '--maritime-badge-neutral-text': '#475569', // mockup: on-surface-variant

    // Mono data chip (e.g. "CIF 2020") — mockup: bg-secondary-fixed
    // text-on-secondary-fixed border-blue-200. Consumed via `xstyle` from
    // `chip.jsx` in this same folder.
    // Contract-list table (Figma "Danh sách Hợp đồng", node 72:4): tinted
    // header / group-header / totals bands and the zebra wash.
    '--maritime-table-header-bg': '#f4f3fb',
    '--maritime-table-group-bg': '#eeedf6',
    '--maritime-table-total-bg': '#eeedf6',
    '--maritime-chip-bg': '#dbe1ff', // mockup: secondary-fixed
    '--maritime-chip-text': '#00174b', // mockup: on-secondary-fixed
    '--maritime-chip-border': '#bfdbfe', // mockup: border-blue-200

    // Tab nav (`./astryx/TabList/Tab.jsx`, this same folder; Figma node
    // 7:1182, "3. TAB NAVIGATION", 2026-09-18) — the inactive-tab border
    // is `--color-border` (`#DCE9FF`) at 60% opacity, a value no existing
    // token carries.
    '--maritime-tab-border': 'rgba(220, 233, 255, 0.6)',
    // Same resolved color as `--color-background-surface` (white), under
    // its own name so the `backgroundColor` value string used for a
    // *resting* tab doesn't literally match any of Astryx's own built-in
    // atomic classes. Astryx's compiled CSS auto-boosts the specificity
    // of "the first declaration seen for a given property+value pair" —
    // `var(--color-background-surface)` is common enough elsewhere in
    // Astryx core that it already exists as one of those boosted classes,
    // and our conditional `':hover'` variant of the *same* value doesn't
    // get that same boost (StyleX compiles a conditional object
    // differently than a plain string), so the resting rule kept beating
    // the hover rule regardless of source order (user feedback,
    // 2026-09-18 — tab hover not visibly changing). A value string
    // nothing else in the app uses avoids the collision entirely: this
    // becomes an ordinary unboosted class, same specificity as the hover
    // variant, so normal cascade order (hover declared after default)
    // decides again, like everywhere else `':hover'` is used in this repo.
    '--maritime-tab-resting-bg': 'var(--color-background-surface)',
    '--maritime-contract-code-font':
      '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    '--maritime-field-label-color': '#45464d',
    '--maritime-field-label-size': '13px',
    '--maritime-field-label-leading': '19.5px',
    '--maritime-form-control-text-size': '14px',
    '--maritime-form-control-text-leading': '20px',
    '--maritime-bank-add-background': '#eff4ff',
    '--maritime-bank-add-border': 'rgba(0, 81, 213, 0.6)',
    '--maritime-bank-add-height': '36px',
    '--maritime-bank-add-radius': '6px',
    '--maritime-card-accent-border': 'rgba(0, 81, 213, 0.4)',
    '--maritime-form-section-title-size': '13px',
    '--maritime-form-section-title-leading': '19.5px',
    '--maritime-form-section-title-tracking': '0.4px',
    '--maritime-form-section-meta-size': '12px',
    '--maritime-form-section-status-radius': '12px',
    '--maritime-form-section-status-padding-block': '2px',
    '--maritime-form-section-status-padding-inline': '10px',
    '--maritime-payment-card-padding': '14px',
    '--maritime-payment-card-gap': '10px',
    '--maritime-payment-card-radius': '6px',
    '--maritime-payment-card-header-height': '34px',
    '--maritime-payment-header-padding-bottom': '5px',
    '--maritime-payment-card-divider': 'rgba(220, 233, 255, 0.6)',
    '--maritime-payment-card-active-background': 'rgba(239, 246, 255, 0.2)',
    '--maritime-payment-card-active-border': '#bfdbfe',
    '--maritime-payment-sequence-background': 'rgba(239, 246, 255, 0.5)',
    '--maritime-payment-sequence-border': '#bfdbfe',
    '--maritime-payment-sequence-active-background': '#f0fdfa',
    '--maritime-payment-sequence-active-border': '#5eead4',
    '--maritime-payment-sequence-padding-block': '2px',
    '--maritime-payment-muted': '#76777d',
    '--maritime-payment-label-size': '12px',
    '--maritime-payment-label-leading': '18px',
    '--maritime-payment-label-tracking': '0.5px',
    '--maritime-payment-amount-background': 'rgba(240, 253, 250, 0.5)',
    '--maritime-payment-amount-border': '#5eead4',
    '--maritime-payment-control-height': '28px',
    '--maritime-payment-control-radius': '2px',
    '--maritime-payment-remove-size': '25px',
    '--maritime-payment-ratio-width': '96px',
  },

  components: {
    // Figma ("HEADER TITLE & GLOBAL ACTION BAR" selection, node 7:1145,
    // 2026-09-18): the contract-code `Heading level={1}`
    // (`contract-overview-card.jsx`) is 20px/-0.5px letter-spacing, not
    // Astryx's own level-1 default (22px, no tracking). A plain `xstyle`
    // on the consumer side can't win — `Heading`'s own per-level
    // font-size class is specificity-boosted the same way `Button`'s
    // color class is (see this file's `button` comment below), and
    // (unlike that case) there's no non-conflicting fallback here since
    // every level-1 heading in this theme is this one field — so it's
    // set as a real themed override instead, same mechanism.
    heading: {
      'level:1': {
        fontSize: '20px',
        letterSpacing: '-0.5px',
      },
      'level:2': {
        fontSize: '16px',
        fontWeight: 'var(--font-weight-bold)',
        lineHeight: '20px',
      },
    },
    'field-label': {
      base: {
        '--text-supporting-size': 'var(--maritime-field-label-size)',
        '--text-supporting-leading': 'var(--maritime-field-label-leading)',
        color: 'var(--maritime-field-label-color)',
        fontSize: 'var(--maritime-field-label-size)',
        fontWeight: 'var(--font-weight-semibold)',
        lineHeight: 'var(--maritime-field-label-leading)',
      },
    },
    // Compact form-control system extracted from the Contract editor frame.
    // These are Astryx theme targets, so the published components retain their
    // behavior and future package fixes; no component source is forked.
    'text-input': {
      base: {
        '--text-body-size': 'var(--maritime-form-control-text-size)',
        '--text-body-leading': 'var(--maritime-form-control-text-leading)',
        backgroundColor: 'var(--color-background-surface)',
        borderColor: 'var(--color-border)',
        borderRadius: 'calc(var(--radius-inner) / 2)',
        paddingBlock: '7px',
        paddingInline: '10px',
      },
      'size:md': { height: '32px' },
    },
    selector: {
      base: {
        '--text-label-size': 'var(--maritime-form-control-text-size)',
        '--text-label-leading': 'var(--maritime-form-control-text-leading)',
        backgroundColor: 'var(--color-background-surface)',
        borderColor: 'var(--color-border)',
        borderRadius: 'calc(var(--radius-inner) / 2)',
        paddingInline: '10px',
      },
      'size:md': { minHeight: '36px', paddingBlock: '6px' },
    },
    'date-input': {
      base: {
        '--text-body-size': 'var(--maritime-form-control-text-size)',
        '--text-body-leading': 'var(--maritime-form-control-text-leading)',
        backgroundColor: 'var(--color-background-surface)',
        borderColor: 'var(--color-border)',
        borderRadius: 'calc(var(--radius-inner) / 2)',
        paddingBlock: '7px',
        paddingInline: '10px',
      },
      'size:md': { height: '32px' },
    },
    'date-time-input': {
      base: {
        '--text-body-size': 'var(--maritime-form-control-text-size)',
        '--text-body-leading': 'var(--maritime-form-control-text-leading)',
        backgroundColor: 'var(--color-background-surface)',
        borderColor: 'var(--color-border)',
        borderRadius: 'calc(var(--radius-inner) / 2)',
      },
    },
    'time-input': {
      base: {
        '--text-body-size': 'var(--maritime-form-control-text-size)',
        '--text-body-leading': 'var(--maritime-form-control-text-leading)',
        backgroundColor: 'var(--color-background-surface)',
        borderColor: 'var(--color-border)',
        borderRadius: 'calc(var(--radius-inner) / 2)',
      },
    },
    'number-input': {
      base: {
        '--text-body-size': 'var(--maritime-form-control-text-size)',
        '--text-body-leading': 'var(--maritime-form-control-text-leading)',
        backgroundColor: 'var(--color-background-surface)',
        borderColor: 'var(--color-border)',
        borderRadius: 'calc(var(--radius-inner) / 2)',
        paddingBlock: '7px',
        paddingInline: '10px',
      },
      'size:md': { height: '32px' },
    },
    'input-group': {
      base: {
        '--text-body-size': 'var(--maritime-form-control-text-size)',
        '--text-body-leading': 'var(--maritime-form-control-text-leading)',
        backgroundColor: 'var(--color-background-surface)',
        borderColor: 'var(--color-border)',
        borderRadius: 'calc(var(--radius-inner) / 2)',
      },
      'size:md': { height: '32px' },
    },
    textarea: {
      base: {
        '--text-body-size': 'var(--maritime-form-control-text-size)',
        '--text-body-leading': 'var(--maritime-form-control-text-leading)',
        backgroundColor: 'var(--color-background-surface)',
        borderColor: 'var(--color-border)',
        borderRadius: 'calc(var(--radius-inner) / 2)',
        paddingInline: '10px',
      },
      'size:md': { height: '80.5px' },
    },
    button: {
      base: {
        // Mockup: 4px corner radii across buttons; Astryx's own button
        // default is pill-shaped (`--radius-full`).
        borderRadius: 'var(--radius-inner)',
        fontWeight: 'var(--font-weight-semibold)',
      },
      // A `variant:ghost` color override was tried here (2026-09-18) to
      // turn "Chi tiết thanh toán" accent-blue, but `ghost` is also what
      // `IconButton` wraps (`contract-overview-card.jsx`'s copy-icon
      // button) — the override would have tinted that icon blue too, a
      // component it was never meant to touch. "Chi tiết thanh toán" now
      // renders via `Link` instead (`payment-summary-card.jsx`, colored
      // through its own wrapper `xstyle`), so no button-level override
      // is needed at all — reverted.
    },
    badge: {
      base: {
        // Mockup: 4px (`rounded-sm`) badges — Astryx's own badge default
        // is pill-shaped (`--radius-full`), same override reasoning as
        // `button` above.
        borderRadius: 'var(--radius-inner)',
        fontSize: '16px',
        lineHeight: '22px',
        paddingBlock: '2px',
      },
    },
    card: {
      base: {
        // Mockup: `rounded-md` (4px in its own scale), a hairline border,
        // and `shadow-xs` (a barely-visible 1px shadow) instead of a
        // heavier `elevation` raise.
        borderRadius: 'var(--radius-inner)',
        borderWidth: 'var(--border-width)',
        borderStyle: 'solid',
        borderColor: 'var(--color-border)',
        boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
      },
    },
    icon: {
      // Same custom-variant mechanism as `text` below, so `StatCard`'s
      // note-row icon (`payment-summary-card.jsx`) can match its
      // adjacent `Text`'s tone color exactly.
      'color:maritime-muted': { color: 'var(--maritime-text-muted)' },
      'color:maritime-subtle': { color: 'var(--maritime-text-subtle)' },
      'color:maritime-teal': { color: 'var(--maritime-teal-value)' },
      'color:maritime-teal-text': { color: 'var(--maritime-teal-text)' },
    },
    text: {
      // Astryx's `Text` forces `color: var(--color-text-primary)` on
      // larger `size` overrides (e.g. `size="2xl"`) regardless of a
      // `color="inherit"` prop — confirmed by inspecting the built CSS's
      // `.color-*` rule (a `:not(#\#)`-boosted, maximum-specificity
      // selector, same trick `chip.jsx`'s comment already flagged for
      // `Token`) winning over both plain CSS inheritance and an `xstyle`
      // override (2026-09-18, `payment-summary-card.jsx`'s stat-card
      // values). Registering real custom `color` variants — same fix
      // `chip.jsx` uses for `Token` — sidesteps the guard entirely: these
      // live in the same enforced-specificity layer, so they always win.
      'color:maritime-muted': { color: 'var(--maritime-text-muted)' },
      'color:maritime-subtle': { color: 'var(--maritime-text-subtle)' },
      'color:maritime-teal': { color: 'var(--maritime-teal-value)' },
      'color:maritime-teal-text': { color: 'var(--maritime-teal-text)' },
    },
    // Figma "Payment Schedule Table" (`payment-progress-panel.jsx`): tinted
    // header band with 13px/700 uppercase column titles, body cells at the
    // theme's `base` size (14px, user request 2026-09-19).
    // Themed overrides, not `xstyle` — `Table` cells expose no `xstyle`.
    // Same scroll-box contract as the app theme (`../../theme.js`): a bounded
    // wrapper height plus sticky header cells, so the Contract list's table
    // scrolls inside its card with the header/totals pinned.
    'table-scroll-wrapper': {
      base: {
        // Always reserve the vertical scrollbar's width: otherwise the first
        // frame after a few-row → many-row switch (skeleton → data on load, a
        // status tab) still has columns sized for the wider box, and a
        // horizontal scrollbar flashes until the width is re-measured.
        height: '100%',
        scrollbarGutter: 'stable',
      },
    },
    'table-header': {
      base: { backgroundColor: 'var(--maritime-table-header-bg)' },
    },
    'table-header-cell': {
      base: {
        backgroundColor: 'var(--maritime-table-header-bg)',
        position: 'sticky',
        top: '0',
        zIndex: '2',
        color: 'var(--maritime-text-muted)',
        // Long column titles wrap instead of being clipped by the cell.
        overflow: 'visible',
        textOverflow: 'clip',
        whiteSpace: 'normal',
        fontSize: '13px',
        fontWeight: '700',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      },
    },
    'table-cell': {
      base: { fontSize: 'var(--font-size-base)', lineHeight: '22px' },
    },
    token: {
      // Desktop-readable chip text (`Token`'s own md size is ~12px).
      base: { fontSize: '16px', lineHeight: '24px' },
      // A genuine custom `color` variant (`astryx docs theme`'s "Custom
      // Variants" section) instead of overriding `Token`'s built-in
      // `color` swatches via `xstyle` on `chip.jsx` — `xstyle`'s atomic
      // class lost the specificity fight against Token's own
      // `[data-color]` rule (same bug as `badge.jsx`'s label color, see
      // that file's comment), and a `xstyle` override also can't reach
      // Token's *internal* label color, only whatever property is set on
      // the root. A real variant lives in the same themed layer as
      // Token's other colors, so it always wins and covers the label too.
      'color:maritime': {
        backgroundColor: 'var(--maritime-chip-bg)',
        borderColor: 'var(--maritime-chip-border)',
        color: 'var(--maritime-chip-text)',
      },
    },
  },
});
