# Theme requirements

- The site's theme is defined as `extends: stoneTheme` from the installed
  `@astryxdesign/theme-stone` package, not a from-scratch `defineTheme`.
  `pnpm theme:build` (`astryx theme build src/shared/components/theme.js`)
  succeeds and produces a self-contained `theme.built.css` — no separate
  `@astryxdesign/theme-neutral` (or any other theme package) CSS import is
  needed anywhere in the app for full component styling.
- Primary actions, focus rings, links, and accent-colored icons render in
  logo teal `#247768` (the app's `--color-accent` family), matching
  `public/images/logo-dn-group.png`.
- Dangerous/destructive actions (`Button variant="destructive"`) render
  solid logo red `#c2252a` with visible hover/active feedback (a color-mix
  step), not Stone's default soft red-tint pill.
- Secondary/Cancel actions (`Button variant="secondary"`, e.g. every dialog's
  "Hủy") are NOT brand-colored — they use Stone's neutral outline treatment
  and stay legible (text/border >= 3:1 against the surface behind them) in
  default, hover, and active states.
- All Vietnamese body text (`--font-family-body`) renders in a single face
  with complete Vietnamese diacritic coverage — no visible mixed-font seam
  between base letters and combining marks. Headings may use Stone's
  Montserrat (has a Vietnamese subset).
- Table sticky header, sticky-column stacking (header above pinned body
  cells), the table scroll wrapper's internal-scroll height fix,
  `toast type="success"`, and the selected-tab accent tint keep behaving
  exactly as before this change — this is a base-theme swap, not a redesign
  of those fixes.
- No raw hex or px literal exists outside `src/shared/components/theme.js`
  (existing `no-restricted-syntax` eslint rule) — enforced mechanically,
  unaffected by this change.
- Status colors (success/warning/error) keep conventional hues (Stone's own
  semantic tokens already are conventional green/amber/red) and remain
  AA-contrast-checked.
