import { defineTheme } from '@astryxdesign/core/theme';

// Inter 4.1.1 variable, self-hosted in `public/fonts/inter/` and declared
// in `src/app/globals.css` (user request, 2026-09-25).
const INTER =
  'InterVariable, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/**
 * "Meta" — a custom Astryx theme built from the "Optimistic VF Commerce &
 * Hardware" design system (user request, 2026-09-23; spec copied verbatim
 * into `DESIGN.md`, this same folder) plus the first screen mockup built
 * on it (`.stitch/designs/meta-contracts-list.html`, Stitch project
 * 6957224641630765183). The mockup's own Tailwind
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
 * Typography: Inter (variable, optical sizing) for body, headings and
 * code (user request, 2026-09-25 — replaces the spec's "Optimistic VF"),
 * with ligatures and tabular lining numbers on.
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
      family: 'InterVariable',
      fallbacks: '-apple-system, system-ui, sans-serif',
    },
    heading: {
      family: 'InterVariable',
      fallbacks: '-apple-system, system-ui, sans-serif',
      weight: 'bold',
    },
  },

  radius: { base: 4, multiplier: 1 },

  tokens: {
    '--font-family-body': INTER,
    '--font-family-heading': INTER,
    '--font-family-code': INTER,

    // Logistics font-size standard (user request, 2026-09-25; ADR-0009):
    // - base (14px, the default — never write `size="base"`): body text,
    //   data values, table cells, form values, row titles.
    // - sm (13px): notes, hints, captions, meta lines, caps labels, table
    //   headers, pills. The 14 × 1.2 scale puts sm at 12px, too small for
    //   notes, so it is pinned to 13px.
    // - lg (17px) for emphasized totals; Heading levels / display types
    //   for titles and KPI figures.
    // Nothing smaller than 12px: xs (10px on the scale) is pinned to 12px.
    '--font-size-xs': '0.75rem',
    '--font-size-sm': '0.8125rem',
    // 13px × 1.5385 = 20px, back on the 4px grid (the scale's 1.6667 was
    // computed for 12px).
    '--text-supporting-leading': '1.5385',
    '--text-heading-5-leading': '1.5385',

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

    '--meta-font-features': '"liga" 1, "calt" 1, "tnum" 1, "lnum" 1',

    // Framed list table (`AdvanceTable isFramed`) bands — theme-neutral
    // names read by `tanstack-data-table.jsx`.
    '--table-framed-total-bg': '#f0f5ff', // mockup: Σ totals row
    '--table-framed-group-bg': '#f4f7fc', // mockup: header group band
    '--table-framed-group-accent-bg': '#ebf3fe', // figma 109:6632: "GIÁ TRỊ" band

    // Contract detail "Tổng quan & Tiến độ" (Figma node 89:1064) — the
    // Tailwind emerald / blue swatches the screen uses instead of the
    // list's own success/accent pills, plus its neutral inset surfaces.
    '--meta-emerald-text': '#047857', // figma: emerald-700 (paid amounts, success pills)
    '--meta-emerald-deep': '#065f46', // figma: emerald-800 (paid milestone label)
    '--meta-emerald-fill': '#059669', // figma: emerald-600 (bars, check circles)
    '--meta-emerald-dot': '#10b981', // figma: emerald-500 (status dot)
    '--meta-emerald-wash': '#ecfdf5', // figma: emerald-50 (pill / icon bg)
    '--meta-emerald-border': '#a7f3d0', // figma: emerald-200 (pill / paid chip border)
    '--meta-emerald-divider': '#d1fae5', // figma: emerald-100 (paid chip divider)
    '--meta-blue-wash': '#e7f0ff', // figma: accent pill / icon bg
    '--meta-blue-wash-border': '#dbeafe', // figma: blue-100 (accent pill border)
    '--meta-blue-active-bg': '#f0f6ff', // figma: current milestone / term bg
    '--meta-blue-active-border': '#bfdbfe', // figma: blue-200 (current term border)
    '--meta-hairline': '#f0f2f5', // figma: inner dividers, progress track, neutral chip
    '--meta-inset-bg': '#f8f9fa', // figma: key-value inset panels
    '--meta-text-subtle': '#8a8d91', // figma: units, "(3/4 lô hàng)" hints
    '--meta-danger-icon': '#dc2626', // figma: red-600 ("Xuất PDF" icon)
    // Card grid caps (user request, 2026-09-23: card grids keep a min and
    // a max card width instead of stretching across the whole page).
    // Figma 89:1064 KPI card ≈ 394px; 94:1936 KPI / info column ≈ 540px.
    '--meta-kpi-card-max': '25rem',
    '--meta-panel-card-max': '34rem',
    '--meta-amber': '#f59e0b',
    // Figma 102:4272 ("Hoa hồng" tab) uses the FB green, not emerald.
    '--meta-green': '#31a24c', // figma: paid commission text / dot
    '--meta-green-wash': '#e7f6ea', // figma: green pill / icon bg
    '--meta-green-border': '#bbf7d0', // figma: green-200 pill border // figma 94:1936: amber-500 ("Còn thu" dot + bar)
    '--meta-radius-inset': '12px', // figma: inset panel radius
    // Figma 103:4983 ("Chỉnh sửa hợp đồng" drawer): indigo 2nd payment
    // step (Tailwind indigo-600 / indigo-50).
    '--meta-indigo': '#4f46e5',
    '--meta-indigo-wash': '#eef2ff',
    // Figma 104:5399 ("Tạo Commission" payment steps): indigo-100 / -200 /
    // -800 step tile, card border and label; split-bar track.
    '--meta-indigo-soft': '#e0e7ff',
    '--meta-indigo-border': '#c7d2fe',
    '--meta-indigo-deep': '#3730a3',
    '--meta-split-track': '#e1e2ec',
    // Figma 108:5920 ("Danh sách Shipment"): amber-50 / -200 / -700
    // "Đang đóng hàng" / "Khai HQ" status pills and tab counts.
    '--meta-amber-wash': '#fffbeb',
    '--meta-amber-border': '#fde68a',
    '--meta-amber-text': '#b45309',
    '--meta-shadow-card': '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // figma: header / summary card
    '--meta-shadow-drawer': '-10px 0 35px 0 rgba(0, 0, 0, 0.09)', // figma 103:4983: edit drawer
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
      // Custom colors for the contract-detail overview (Figma 89:1064):
      // `Text`'s own color classes out-rank `xstyle`/`inherit` once a
      // `size` is set, so tone colors are registered variants instead.
      'color:meta-success': { color: 'var(--meta-emerald-text)' },
      'color:meta-success-deep': { color: 'var(--meta-emerald-deep)' },
      'color:meta-subtle': { color: 'var(--meta-text-subtle)' },
      // Figma 109:6632: logistics cost totals.
      'color:meta-amber': { color: 'var(--meta-amber-text)' },
      'color:meta-green': { color: 'var(--meta-green)' },
      // Figma 111:7829: "Luồng Đỏ" customs channel text.
      'color:meta-danger': { color: 'var(--color-error)' },
      // Figma 156:2 ("Tiện ích › Giá trị"): installment value figures take
      // the step tone — cobalt-strong, indigo.
      'color:meta-accent-strong': { color: 'var(--meta-primary-strong)' },
      'color:meta-indigo': { color: 'var(--meta-indigo)' },
    },
    icon: {
      'color:meta-success': { color: 'var(--meta-emerald-fill)' },
      'color:meta-subtle': { color: 'var(--meta-text-subtle)' },
      'color:meta-danger': { color: 'var(--meta-danger-icon)' },
      'color:meta-green': { color: 'var(--meta-green)' },
      // Figma 111:7829: SI / VGM cut-off clock, customs tile icon.
      'color:meta-amber': { color: 'var(--meta-amber-text)' },
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
        borderRadius: 'var(--meta-field-radius, var(--radius-full))',
      },
      // md groups are "number + unit" fields (`FormattedNumberTextInput`):
      // the input keeps only its start corners so it joins the unit box.
      // The list search groups are sm / lg and stay as they are.
      'size:md': {
        height: 'var(--meta-field-height, var(--spacing-8))',
        '--meta-input-radius':
          'var(--meta-field-radius, var(--radius-element)) 0 0 var(--meta-field-radius, var(--radius-element))',
      },
    },
    'input-group-text': {
      base: {
        backgroundColor: 'var(--meta-inset-bg)',
        borderColor: 'var(--color-border)',
        borderInlineStartWidth: '0',
        borderRadius:
          '0 var(--meta-field-radius, var(--radius-element)) var(--meta-field-radius, var(--radius-element)) 0',
        color: 'var(--color-text-secondary)',
        height: 'var(--meta-field-height, var(--spacing-8))',
      },
    },
    // `--meta-field-radius` / `--meta-field-height` are unset by default
    // (list filters stay 32px pills); form surfaces such as the edit drawer
    // set them on an ancestor so every md control inside takes the Figma
    // form radius and a roomier height. The fallback is Astryx's own md
    // height (`--spacing-8`).
    'text-input': {
      base: {
        backgroundColor: 'var(--color-background-surface)',
        borderColor: 'var(--color-border)',
        borderRadius:
          'var(--meta-input-radius, var(--meta-field-radius, var(--radius-element)))',
      },
      'size:md': {
        height: 'var(--meta-field-height, var(--spacing-8))',
      },
    },
    // Same corner as `text-input` / `date-input` so form fields line up;
    // only the list-toolbar filters (lg) and pagination (sm) stay pills.
    selector: {
      base: {
        backgroundColor: 'var(--color-background-surface)',
        borderColor: 'var(--color-border)',
        borderRadius: 'var(--meta-field-radius, var(--radius-element))',
      },
      'size:sm': {
        borderRadius: 'var(--radius-full)',
      },
      'size:md': {
        height: 'var(--meta-field-height, var(--spacing-8))',
      },
      'size:lg': {
        borderRadius: 'var(--radius-full)',
      },
    },
    'multi-selector': {
      base: {
        borderRadius: 'var(--meta-field-radius, var(--radius-element))',
      },
      'size:md': {
        height: 'var(--meta-field-height, var(--spacing-8))',
      },
    },
    'date-input': {
      base: {
        backgroundColor: 'var(--color-background-surface)',
        borderColor: 'var(--color-border)',
        borderRadius: 'var(--meta-field-radius, var(--radius-element))',
      },
      'size:md': {
        height: 'var(--meta-field-height, var(--spacing-8))',
      },
    },
    // Paired beside `date-input` for date-time fields (e.g. "Hạn nộp
    // SI / VGM") — must share its surface, corner and height.
    'time-input': {
      base: {
        backgroundColor: 'var(--color-background-surface)',
        borderColor: 'var(--color-border)',
        borderRadius: 'var(--meta-field-radius, var(--radius-element))',
      },
      'size:md': {
        height: 'var(--meta-field-height, var(--spacing-8))',
      },
    },
    'number-input': {
      base: {
        backgroundColor: 'var(--color-background-surface)',
        borderColor: 'var(--color-border)',
        borderRadius: 'var(--meta-field-radius, var(--radius-element))',
      },
      'size:md': {
        height: 'var(--meta-field-height, var(--spacing-8))',
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
      // Filled cobalt by default (list status tabs); `MetaTabNav` flips it
      // to a white pill through these two vars (user request, 2026-09-23).
      selected: {
        backgroundColor: 'var(--meta-tab-selected-bg, var(--color-accent))',
        color: 'var(--meta-tab-selected-text, var(--color-on-accent))',
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
    // must fill the card's content area to scroll;
    // header cells stay pinned while the body scrolls under them.
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
