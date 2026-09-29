# ADR-0011: Meta is the only theme, InterVariable the only font

Date: 2026-09-29
Status: accepted (supersedes the route scoping in ADR-0010)

## Context

The app root used the `kt-xnk` theme (Stone + DN Group teal, Optimistic Text
Vietnamese body, Montserrat / JetBrains Mono through `next/font`), while the
Meta theme wrapped only `/logistics/**` and `/admin/backups`. Building
`kt-xnk` warned that it named fonts it did not load (Figtree, Optimistic).
The user asked for the Meta theme only and the InterVariable font only.

## Decision

- `ThemeProvider` wraps the whole app in `<Theme theme={metaTheme}>`
  (plus the Meta scrollbar stylesheet). `pnpm theme:build` builds
  `custom/meta/theme.js`. `MetaThemeProvider` stays as a no-op nested
  re-application so existing pages need no change.
- Deleted: `src/shared/components/theme.js` and its build output,
  `@astryxdesign/theme-stone`, `src/shared/config/fonts.js` (next/font),
  `public/fonts/react-docs/` (Optimistic), the `data-app-font` scoping and
  the `.astryx-button.destructive` white-label escape hatch (it only
  served kt-xnk's solid red destructive button).
- The Meta theme gained kt-xnk's success-toast fix; its font stack is
  `InterVariable` then system fallbacks.

## Consequences

Every route (`/`, `/docs`, `/design-system`…) now renders in Meta colors and
Inter. `src/app/fonts.test.js` fails if another `@font-face`, font folder,
`next/font`, or non-Meta root theme comes back.
