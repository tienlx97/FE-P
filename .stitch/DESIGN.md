# Maritime theme

---
name: Maritime & Trade Operations System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002114'
  on-tertiary-container: '#069669'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
  numeric-metric:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system serves cross-border logistics managers, trade compliance officers, and freight operations teams handling global supply chains across Vietnam and international trade lanes. The visual language conveys institutional trust, precision engineering, and high operational velocity.

The aesthetic follows **Corporate / Modern** optimized for high-density enterprise workflows:
- **Atmosphere:** Rigorous, modern, reliable, and unencumbered by unnecessary decoration.
- **Visual Weight:** Data forward with thin, crisp structural keylines, compact layouts, and deliberate color-coded operational signals.
- **Focus:** Low cognitive friction during multi-hour operational shifts, instant status recognition across hundreds of active shipments, and reliable numeric legibility.

## Colors

The palette balances deep naval structure with distinct operational semantics:

- **Primary (`#0F172A`, `#1E293B`):** Deep Navy Slate serves as the institutional foundation, used for structural navigation, primary text, prominent header bars, and major interactive touchpoints.
- **Secondary / Accent (`#2563EB`, `#1D4ED8`):** Maritime Blue indicates active interactive workflows, links, selected tabs, progress bars, and focus indicators.
- **Semantic Feedback:**
  - **Success / Completed / Cleared (`#059669`):** Emerald Teal for customs clearance, finalized payments, on-time arrivals, and positive balance differentials.
  - **Warning / In-Transit / Pending (`#D97706`):** Amber for processing customs, port demurrage risks, and pending signatures.
  - **Critical / Exception / Rejected (`#DC2626`):** Soft Crimson for shipment delays, compliance holds, overdue invoices, and system alerts.
- **Canvas & Card Architecture:**
  - App Canvas: Cool Light Gray (`#F8FAFC`).
  - Active Section Canvas / Secondary Wells: `#F1F5F9`.
  - Component Surfaces: Pure White (`#FFFFFF`).
  - Dividers & Structural Borders: Crisp Slate Outlines (`#E2E8F0`).

## Typography

The typography scale utilizes **Be Vietnam Pro** to ensure native, refined rendering of Vietnamese diacritics alongside English international trade manifests.

- **Scale Rationale:** Scaled tightly for high data density. The default reading level is `body-md` (13px) to maximize visible data points without compromising legibility.
- **Numbers & Identifiers:** Bill of Lading numbers, container IDs (e.g., `MSKU0928374`), HS codes, and financial amounts utilize tabular figures (`font-variant-numeric: tabular-nums`) with `data-mono` (JetBrains Mono) for raw identification strings.
- **Labels:** Uppercase styling is strictly reserved for `label-sm` (11px) with `0.02em` letter spacing for column headers, badge text, and table grouping bands.

## Layout & Spacing

The layout is built on a high-density, flexible 12-column layout designed for modern 1080p, 1440p, and ultra-wide operations screens:

- **Desktop (1280px+):** Fluid container with max-width bounding at 1920px. 1.5rem (`margin`) screen edges, persistent collapsible sidebar (240px expanded, 64px collapsed), and a multi-pane split layout for master-detail views.
- **Tablet (768px - 1279px):** 1rem (`gutter`), collapsible drawer navigation, single-column table cards or horizontal scroll regions for dense tables.
- **Mobile (< 768px):** Reflows to single-column stacking with sticky horizontal action bars, stacked form controls, and condensed operational summary cards.
- **Density Rules:** Standard padding inside table cells is 8px vertical by 12px horizontal. Compact mode reduces this to 6px vertical by 8px horizontal for high-volume customs clearing tables.

## Elevation & Depth

To preserve focus on data density, this system prioritizes structural flat surfaces and micro-borders over heavy drop shadows.

- **Primary Structure (Flat & Outlined):** Surfaces rely on `#FFFFFF` against `#F8FAFC` backgrounds bounded by 1px solid `#E2E8F0` borders.
- **Layer 0 (Canvas Base):** `#F8FAFC` — un-elevated page backing.
- **Layer 1 (Cards, KPI Wells, Table Surfaces):** `#FFFFFF`, bounded by `1px solid #E2E8F0`, with an ambient micro-shadow: `0 1px 2px 0 rgba(15, 23, 42, 0.04)`.
- **Layer 2 (Filter Panels, Hover Tooltips, Popovers):** `#FFFFFF` with `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Layer 3 (Modals, Slide-over Manifest Drawers):** High-priority overlays with `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)` coupled with a `#0F172A` backdrop mask at 40% opacity.

## Shapes

The design uses a restrained **Soft (`1`)** roundedness scale to convey technical rigor and conserve screen real estate:

- **Controls & Form Elements:** 4px (`rounded-sm` / 0.25rem) corner radii across input fields, select boxes, buttons, and segmented controls.
- **Containers & KPI Cards:** 8px (`rounded-lg` / 0.5rem) corner radii for main data cards, table wrappers, and charts.
- **Badges & Tags:** 4px for shipment status badges, preventing an overly playful pill aesthetic and maintaining high data readability.

## Components

### Buttons
- **Primary:** Deep slate background (`#0F172A`) or maritime blue (`#2563EB`) with crisp white text, 4px border radius, 32px height (compact) or 38px height (standard). Hover: `#1E293B` or `#1D4ED8`. Active state pressed down by 0.5px.
- **Secondary / Outline:** White background with 1px border `#CBD5E1`, text `#1E293B`. Hover: `#F1F5F9`.
- **Ghost:** Transparent background, text `#475569`. Hover: `#F1F5F9`.

### Status Badges & Chips
- Semantically tinted background (8% to 12% opacity) paired with high-contrast text:
  - *Completed / Paid:* `#ECFDF5` background, `#047857` text, `#A7F3D0` subtle border.
  - *In-Transit / Pending:* `#FFFBEB` background, `#B45309` text, `#FDE68A` subtle border.
  - *Exception / Delayed:* `#FEF2F2` background, `#B91C1C` text, `#FECACA` subtle border.
  - *Draft / Neutral:* `#F1F5F9` background, `#475569` text, `#CBD5E1` subtle border.

### Data Tables & Tabular Presentation
- Header row with `#F8FAFC` background, 32px height, 1px solid `#E2E8F0` border bottom, text styled with `label-sm` in `#64748B`.
- Row height: 40px standard, 32px high-density. Hover state highlights entire row in `#F8FAFC`. Selected row in `#EFF6FF`.
- Right-aligned numeric data columns, left-aligned text descriptions, centered status badges.

### KPI Metric Cards
- White surface, 1px border `#E2E8F0`, padding 16px.
- Top row: Metric label (`label-md` in `#64748B`) with an operational category icon in `#2563EB`.
- Value: Large bold numeric figure (`numeric-metric` in `#0F172A`).
- Subtext: Micro-indicator with trending indicator (`+4.2% vs last week`) in Emerald Teal or Soft Crimson.

### Input Fields & Filter Bars
- 36px height, white background, 1px solid border `#CBD5E1`, inset placeholder in `#94A3B8`.
- Focus state: Outline `#2563EB` with subtle 2px maritime blue focus ring (`rgba(37, 99, 235, 0.2)`).
- Filter bar groups: Integrated comboboxes, date-range pickers with quick presets ("Last 7 Days", "QTD", "Custom"), and tag search inputs.
