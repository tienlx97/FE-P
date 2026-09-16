# Proposal: Redesign theme on Astryx Stone

**Status:** in-progress
**Created:** 2026-09-16

## Why

The app's look currently comes from a from-scratch `defineTheme` (no shipped
Astryx theme as a base) layered on top of `@astryxdesign/theme-neutral`'s
global CSS import, plus a raw-CSS cascade-layer hack in `globals.css`. The
user wants to stop maintaining a bespoke theme and instead build on a shipped
Astryx theme (`astryx theme add`/`extends`), while keeping the DN Group brand
identity (logo teal primary, logo red for dangerous actions) that
`refresh-workspace-colors` established.

## What changes

- Base theme becomes Astryx's shipped **Stone** theme (earthy neutral, pill
  radius, Montserrat/Figtree, richer component coverage — badge, banner,
  switch, progressbar, field-status, per-input status borders) via
  `extends: stoneTheme` from the installed `@astryxdesign/theme-stone`
  package, not a from-scratch `defineTheme`.
- Brand recolor on top of Stone: `--color-accent` family (`--color-accent`,
  `--color-accent-muted`, `--color-text-accent`, `--color-icon-accent`,
  `--color-on-accent`) → logo teal `#247768`, sampled from
  `public/images/logo-dn-group.png` (same source used previously).
- `components.button['variant:destructive']` → solid logo red `#c2252a`
  (was Stone's default soft red-tint pill). This is the new, semantically
  correct home for the second brand color — previously it lived on
  `variant:secondary`, which is actually Cancel/Hủy (~46 call sites) and had
  no business being brand-red.
- `components.button['variant:secondary']` reverts to Stone's own neutral
  outline treatment (no override) — Cancel/Hủy buttons stop being solid red.
- Typography: keep Montserrat for headings (Stone default — has a Vietnamese
  subset) but override `--font-family-body` back to `Optimistic Text
  Vietnamese` instead of Stone's Figtree. Figtree ships no Vietnamese subset,
  so using it verbatim would silently mix it with a fallback system font for
  every diacritic — the exact bug `vietnamese-font-coverage` fixed for
  Optimistic. Confirmed via Google Fonts metadata (Montserrat: includes
  `vietnamese`; Figtree: no `vi` in its subset list).
- Keep the app-specific, non-brand component overrides that fix real bugs
  regardless of base theme: `table-scroll-wrapper` sticky-height fix,
  `table-header`/`table-header-cell` mint background + sticky z-index,
  `table-body`/`table-footer` surface, `tab` selected accent tint, `toast`
  `type:success` color (Astryx ships no themed success toast).
- Drop the now-redundant `@astryxdesign/theme-neutral/theme.css` global
  import in `globals.css` — `extends` makes the compiled `theme.built.css`
  self-contained (Stone's own docs: "the base theme's CSS does not need to
  be loaded next to it").
- Remove the `.astryx-button.secondary { color: #ffffff }` cascade-layer
  hack in `globals.css` (it exists only because secondary used to be forced
  solid red with white text); re-add the equivalent unlayered escape hatch
  scoped to `.astryx-button.destructive` only if the same
  layer-ordering bug reproduces for the new destructive override.
- Remove the unused `@astryxdesign/theme-neutral` dependency once nothing
  references it.

## Out of scope

- Dark mode — site stays light-only (`<Theme mode="light">` unchanged).
- Any layout, spacing, or information-architecture changes.
- The `react-dev-docs-shell` exception's own local/native styling.
- Backend changes.
- Re-litigating which theme to use — user picked Stone explicitly (see
  decision log) after previewing Matcha.

## Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-09-16 | Base theme: Astryx Stone, not Matcha | User initially asked for Matcha; after seeing Matcha's aesthetic (Playwrite/DM Sans, pill radius) asked to use Stone instead. |
| 2026-09-16 | Adopt Stone's full aesthetic (fonts, radius, component overrides), only recolor accent | User's explicit choice over "colors only" or "colors + radius only" options. |
| 2026-09-16 | Keep body font as Optimistic Text Vietnamese, not Stone's Figtree | Figtree has no Vietnamese subset (verified via Google Fonts metadata) — would reintroduce the mixed-font bug `vietnamese-font-coverage` fixed. Montserrat (headings) does support Vietnamese, kept as-is. |
| 2026-09-16 | `variant:secondary` uses Stone's neutral outline (not brand red); logo red moves to `variant:destructive` | Secondary is used app-wide (~46 files) for Cancel/Hủy, not a second-brand CTA — red-for-destructive is the more correct and conventional semantic Stone already ships. User confirmed after tradeoff was explained. |
