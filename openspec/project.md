# Project Context

<!-- Project-wide truth that outlives individual changes. Keep current. -->

## Purpose

KT-XNK is the company's Next.js frontend for internal documentation, logistics
operations, and user administration. **Front-end only** — backend data and
business logic live in a separate project; this repo never talks to a database
directly. Target users are company staff managing contracts, shipments,
commissions, customers, users, and internal reference material. The interface
uses a light theme and feature-based `src/` architecture.

## Tech stack

- Language/runtime: JavaScript
- Framework: Next.js (latest, App Router) — UI normally uses real
  `@astryxdesign/core` components; the protected Docs shell and its MDX
  authoring surface are the documented react.dev-parity exception below
- Style: Astryx theme tokens (`src/shared/components/theme.js`) drive all
  color/spacing. StyleX is the sanctioned styling runtime for local semantic
  components and the `xstyle` escape hatch on Astryx components — see
  `docs/stylex-installation.md` and `docs/stylex-authoring.md`
- Theme: light only (no dark mode)
- Database: none in this repository; authenticated API calls use the separate backend
- Data fetching: `@tanstack/react-query` for any client-side fetching/caching
  against the separate backend project; provider goes in
  `src/shared/components` per the layer rules, hooks live in each feature's
  `hooks/` (never call `fetch`/`useQuery` directly from `components/`)
- Testing: Node's built-in test runner (`node --test`)

## Architecture

Feature-based, front-end only — see `docs/architecture.md` for the full map:

```
src/features/<feature>/{types,config,api,hooks,components}
src/shared/{types,config,api,hooks,components}
```

Layer order inside each tree: `types → config → api → hooks → components`.
Features are isolated (may not import each other directly) and are only
reachable from outside via their `index.js`; `src/shared/` cannot depend on
a feature. Enforced mechanically by structural tests in `./harness/verify.sh`
(dependency-cruiser config: `harness/structure.rules.cjs`). Violations fail the
build with messages that explain the fix.

## Conventions (linted, not aspirational)

- Naming: kebab-case files, camelCase functions, PascalCase React components.
  File extension: `.jsx` for any file containing JSX, plain `.js` for logic
  with none (hooks without JSX, `config`/`api`/`types`) — enforced by
  `eslint.config.mjs`'s `react/jsx-filename-extension` rule. `page.js`/
  `layout.js` are Next.js routing-convention names (resolved by
  `next.config.mjs`'s `pageExtensions`, not this rule) — use `.jsx` for
  those too since they render JSX, just don't rename the base filename.
- Module boundaries: features only via their `index.js`; no cross-feature
  imports; `src/shared/` may not depend on a feature
- Errors: handled at boundaries (`src/app`, each tree's `api`/`hooks`); no empty catch
- Components: build UI from `@astryxdesign/core` primitives (`Section`,
  `TopNav`, `Text`, `Heading`, ...) — no hand-rolled `<div>`/`<nav>` markup
  where an Astryx component covers the case. Look up props/examples via the
  `xds` MCP server before writing a component from scratch.
- React.dev copycat exception: in the protected documentation experience,
  TopNav, SideNav, Content, TOC, and
  components exposed through `useMDXComponents` copy or adapt the semantic
  structure, behavior, and local controls of
  [react.dev](https://github.com/reactjs/react.dev) without replacing them with
  Astryx equivalents solely for design-system compliance. The MDX registry and
  its complete rendered component tree MUST NOT import Astryx; native semantic
  elements, local components, StyleX, and the app theme's public CSS variables
  are used instead. This exception relaxes only Astryx component selection and
  exact reference geometry values; accessibility, Server/Client Component
  boundaries, and the feature-layer architecture remain mandatory.
- Styling: no inline `style`/`className`, no top-level media
  queries/pseudo-classes. Use StyleX (`xstyle` prop, see
  `docs/stylex-authoring.md` antipatterns) only for layout overrides Astryx
  props don't cover — never to re-implement colors or component chrome.
- Color: all colors come from Astryx theme tokens in
  `src/shared/components/theme.js` (`defineTheme` — `--color-accent`,
  `--color-text-primary`, etc.) — no hardcoded hex outside that file
  (enforced by the `no-restricted-syntax` hex rule in `eslint.config.mjs`).
  `src/shared/components/theme.js` is the editable source; `pnpm theme:build`
  (runs automatically before `dev`/`build`/`verify`) compiles it via
  `astryx theme build` into gitignored, do-not-edit artifacts
  (`src/shared/components/kt-xnk.js`, `src/shared/components/kt-xnk.d.ts`,
  `src/shared/components/kt-xnk.variants.d.ts`,
  `src/shared/components/theme.built.css`) for static, non-runtime-injected
  CSS — see `theme-provider.jsx` for how they're wired into `<Theme>`.
  The theme is `extends: stoneTheme` from the installed
  `@astryxdesign/theme-stone` package (redesign-theme-stone), not a
  from-scratch `defineTheme` — Stone's own aesthetic (pill radius,
  Montserrat headings, categorical colors, badge/banner/switch/progressbar/
  field-status/input-status component coverage) passes through untouched;
  `theme.js` only layers the DN Group brand and a handful of app-specific
  functional fixes on top:
  (1) the accent token family (`--color-accent`, `--color-accent-muted`,
  `--color-text-accent`, `--color-icon-accent`, `--color-on-accent`) is the
  logo teal `#247768`, not a darkened variant, sampled from
  `public/images/logo-dn-group.png`; (2) `button['variant:destructive']`
  (Xóa and other dangerous actions) is the logo red `#c2252a`, solid, not
  Stone's default soft red-tint pill — `variant:secondary` (Cancel/Hủy,
  used app-wide) is left as Stone's own neutral outline, since it's a
  de-emphasized action, not a second brand color; (3) `--font-family-body`
  stays `Optimistic Text Vietnamese` rather than Stone's Figtree, which
  ships no Vietnamese subset (would reintroduce the mixed-font bug
  `vietnamese-font-coverage` fixed); `--font-family-heading`/
  `--font-family-code` point at Montserrat/JetBrains Mono (both do carry a
  Vietnamese subset) self-hosted via `next/font/google`
  (`src/shared/config/fonts.js`, applied in `layout.jsx`) since next/font
  never exposes a literal family name a CSS-var token override can key off;
  (4) a few table/toast/tab overrides fix real bugs unrelated to branding
  (sticky header/columns, internal scroll height, an unthemed success
  toast) and are unaffected by which base theme is in use. Status hues
  (green/amber/red) stay Stone's own conventional tokens. Adding a new hue
  or component override means updating `src/shared/components/theme.js`,
  not inlining one.
- Every convention here must map to a lint/structural rule. A convention that
  cannot be checked mechanically goes to `harness/GOLDEN_RULES.md` with a plan
  to make it checkable.

## Measurable quality constraints (numbers, not adjectives)

<!-- Agents verify against these; "feels fast" is not a criterion. -->
| Constraint | Threshold | How measured |
|---|---|---|
| Test coverage on changed lines | ≥ 80% | coverage report |
| Shared JS bundle (gzip) | < 250 kB | `harness/checks/quality.mjs` (verify:quality) |
