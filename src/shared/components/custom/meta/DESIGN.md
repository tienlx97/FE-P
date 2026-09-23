---
name: Optimistic VF Commerce & Hardware
colors:
  surface: '#faf8ff'
  surface-dim: '#d8d9e4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3fe'
  surface-container: '#ecedf8'
  surface-container-high: '#e6e7f2'
  surface-container-highest: '#e1e2ec'
  on-surface: '#191b23'
  on-surface-variant: '#424754'
  inverse-surface: '#2e3038'
  inverse-on-surface: '#eff0fb'
  outline: '#727786'
  outline-variant: '#c2c6d6'
  surface-tint: '#0059c8'
  primary: '#004db0'
  on-primary: '#ffffff'
  primary-container: '#0064e0'
  on-primary-container: '#e6ebff'
  inverse-primary: '#afc6ff'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2e2e2'
  on-secondary-container: '#646464'
  tertiary: '#913400'
  on-tertiary: '#ffffff'
  tertiary-container: '#b94500'
  on-tertiary-container: '#ffe7df'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#afc6ff'
  on-primary-fixed: '#001944'
  on-primary-fixed-variant: '#004299'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1b1b1b'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb597'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7e2c00'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ec'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 16px
  margin: 24px
  space-xs: 8px
  space-sm: 12px
  space-md: 16px
  space-lg: 24px
  space-xl: 32px
---

## Brand & Style

This design system is engineered for high-end consumer hardware commerce and digital merchandising. It evokes confidence, modern accessibility, and rigorous technical precision. The emotional response is crisp, direct, and premium—balancing the warmth of approachable consumer tech with the authoritative scale of global commerce platforms.

We adopt a **Minimalist-Modern** design movement anchored by a stark white canvas (`#ffffff`), expansive whitespace, and uncompromising photographic framing. Visual hierarchy relies on typography weight and dramatic content pacing rather than heavy shadows or complex surface layering.

## Colors

The color palette is anchored by a stark canvas and a dual-primary interactive model: crisp black (`#000000`) for high-impact marketing surfaces, and vibrant cobalt (`#0064e0`) for active commerce flows and purchase conversions.

Neutrals range from deep near-black ink for readable typography down to soft surface backgrounds and precise hairline dividers. System feedback colors are intentionally saturated for high-visibility status affirmations, limited-time promotions, and critical validations.

## Typography

Typography utilizes the **Optimistic VF** variable font family across all levels, leveraging stylistic sets (`ss01, ss02`) for precise geometric character tuning.

Headlines embrace an editorial tension between bold 500-weight display statements and delicate 300-weight subheadings. Body and interface copy maintain exceptional legibility through tight optical letter-spacing and rigorous line-height scaling.

## Layout & Spacing

We employ a **fluid grid** system built on a strict 4px base increment, with 8px serving as the primary rhythm step. Section spacing scales dramatically from compact 48px layouts to cinematic 120px hero blocks, granting high-end hardware imagery room to breathe.

Breakpoints adapt seamlessly from single-column mobile layouts to multi-column desktop merchandising grids, maintaining consistent outer canvas margins and proportional internal component gaps.

## Elevation & Depth

Depth is treated with extreme restraint. The interface is predominantly flat, relying on stark white backgrounds, photographic framing, and hair-thin borders (`{colors.hairline-soft}`) to delineate structure.

Shadows are strictly functional—reserved exclusively for floating sticky checkout bars and high-priority purchase summary panels (`rgba(20, 22, 26, 0.3) 0px 1px 4px 0px`). Interactive feedback utilizes subtle positional shifts and high-contrast borders rather than deep elevation changes.

## Shapes

The shape language is defined by structured restraint: clean, subtle rounding (`4px` to `8px`) for all interactive elements, buttons, inputs, and cards. This creates a precise, architectural aesthetic that reinforces technical competence and sharp execution.

## Components

- **Buttons:** Built with crisp 6px-8px soft rounding (`{rounded.DEFAULT}`). Marketing primary actions use solid black (`{colors.ink-button}`), while commerce and conversion flows use vibrant cobalt (`{colors.primary}`). Text is set in `button-md`.
- **Chips & Tabs:** Softly rounded interactive elements with hairline borders (`{colors.hairline}`) and `body-sm-bold` text, used for filtering SKUs and switching views.
- **Lists & Accordions:** Structured with clean horizontal dividers (`{colors.hairline-soft}`), generous vertical padding, and steel-colored chevrons for smooth expansion.
- **Checkboxes & Radio Buttons:** Compact 2px/4px corner-radius controls featuring active blue (`{colors.fb-blue}`) selection states and clear label alignment.
- **Input Fields:** Housed in structured 8px-rounded containers with `{colors.hairline}` borders, shifting to focused cobalt or critical red outlines upon state validation.
- **Cards:** Merchandising and feature cards utilize clean, subtle rounding (`8px` to `12px`), often featuring edge-to-edge product photography or soft neutral backgrounds (`{colors.surface-soft}`) without heavy drop shadows.
