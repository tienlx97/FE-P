# ADR-0010: Inter for /admin and /logistics; Maritime theme removed

Date: 2026-09-25
Status: accepted

## Context

The user asked for the Inter 4.1.1 font (MISA CDN build) on every
`/logistics/**` and `/admin/**` page, the Meta theme switched to it, and
the unused "Maritime" custom theme (only its scratch `/preview-maritime`
page imported it) deleted outright.

## Decision

- Self-host only `InterVariable.woff2` / `InterVariable-Italic.woff2`
  (`public/fonts/inter/`, OFL 1.1): weights 100–900 plus the `opsz` axis
  that replaces the static InterDisplay files; every supported browser
  handles variable fonts, so the 36 static files are not shipped.
- `ProtectedAppShell` puts `data-app-font="inter"` on its root for
  `/admin*` and `/logistics*`. `globals.css` redefines `--font-family-body`
  / `-heading` / `-code` on `html` and on the `[data-astryx-theme]`
  element that contains the marker (the app `<Theme>` sets those tokens on
  its own element with an unlayered single-class rule, which `[attr]:has()`
  out-ranks), so portalled dialogs / popovers get Inter too. In scope,
  numbers are tabular + lining (`tnum`, `lnum`, plus `liga` / `calt`).
- The Meta theme uses Inter for body, headings and code and its
  `--meta-font-features` became the same `liga calt tnum lnum` set (the
  old `ss01` / `ss02` were Optimistic's; on Inter they would switch to
  open digits / disambiguated glyphs).
- Other routes (`/`, `/docs`, `/tutorial`…) keep the app theme's fonts.
- `custom/maritime/`, `src/app/preview-maritime/`, their lint exemptions and
  their quality grade are deleted. Historical records (`openspec/changes/`,
  `.stitch/`, `harness/PROGRESS.md`) still mention Maritime as history.

## Consequences

`src/app/fonts.test.js` guards the faces, the files and the scope rule.
