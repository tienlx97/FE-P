# Architecture

<!--
Versioned source of truth for system structure. AGENTS.md points here.
Keep the diagram current — stale docs are a bug (see harness/ENTROPY.md).
-->

## Front-end only

This project is the **front-end only**. Data access and business logic
(the old repo/service concepts) live in a separate backend project, not
here. Nothing under `src/` talks to a database or ORM directly — if a
feature needs server data, it calls out to the backend project's API from
that feature's `api/` layer (fetch/react-query/etc.), the same way any
browser client would.

## System diagram

```
[src/app (routing/wiring)] → [feature or shared public index.js]
                                      ↓
                    types → config → api → hooks → components

[content/docs (company-authored MDX)] → [docs feature loader] → [src/app routes]
                                     ↘ [remark MaxWidth grouping] → [MDX registry]
```

The layer order applies **twice, nested**: once inside each
`src/features/<feature>/`, and once inside `src/shared/`. A feature and
`src/shared/` do not share layer instances — `src/features/home/hooks/`
and `src/shared/hooks/` are independent trees, each obeying the same order
internally.

## Layer responsibilities

| Layer | Owns | May import (same tree only) |
|---|---|---|
| `types/` | Domain types, contracts | — |
| `config/` | Constants, feature flags, static site content | types |
| `api/` | Calls to the external backend project (fetch/react-query/etc.) | types, config |
| `hooks/` | Client-side state/logic (custom hooks) | types, config, api |
| `components/` | UI, presentation | types, config, api, hooks |

`src/app/` holds Next.js App Router entrypoints (pages, layouts). It plays
the role of the routing/wiring surface: it imports feature/shared public
surfaces and renders them; it is not itself one of the layers above, so
layer-order rules do not restrict it — but the deep-import rule (below)
still applies to it.

## Feature vs. shared

- `src/features/<feature>/` — a vertical slice of one product area. Owns
  its own `{types,config,api,hooks,components}` (only the ones it needs —
  empty layers are not scaffolded ahead of need). Exposes a public surface
  via `src/features/<feature>/index.js`; nothing outside the feature may
  import a deeper path.
- `src/shared/` — cross-cutting code used by more than one feature (site
  chrome, theme, site-wide config, shared domain types). Same layer
  ordering as a feature, no public `index.js` requirement since it isn't
  isolated the way a feature is.
- `content/docs/` — company-authored MDX, organized by documentation domain
  rather than by React implementation layer. The Docs feature recursively
  discovers and compiles these trusted files, then owns metadata loading, TOC
  extraction, and presentation logic.

## Module boundaries (mechanically enforced)

Enforced by `harness/structure.rules.cjs` (dependency-cruiser), run via
`pnpm run structure` / `./harness/verify.sh`:

- Layer order within `src/shared/<layer>` and within
  `src/features/<feature>/<layer>` — no upward imports, per the table above.
- **Feature isolation**: `src/features/<a>` must never import
  `src/features/<b>` directly. Fix: promote the shared piece to
  `src/shared/`, or compose both features together in `src/app/`.
- **Shared cannot depend on a feature**: `src/shared/` must never import
  `src/features/`. Shared is the foundation layer.
- **Deep-import rule**: anything outside `src/features/<feature>/` (i.e.
  `src/app/`, `src/shared/`) may only import that feature's `index.js`,
  never a path inside it.
- `no-circular` — no dependency cycles anywhere.

## Current inventory

- `src/features/auth/` — login, session handling, and access-aware UI.
- `src/features/admin-users/` — users, organization/employee fields, permissions,
  and session administration.
- `src/features/logistics-contracts/` — contracts, shipments/VGM, commissions,
  customers, countries, places, and related payment/catalog UI. List metadata
  lives in `config/*-table.js`; components are grouped by responsibility.
  See `docs/ui-components.md` and ADR-0005 for the current component map.

- `src/features/home/` — internal portal: featured news, notices, published
  holiday dates within one monthly calendar/agenda, compact news rows, videos
  and an ecosystem logo strip. Editorial
  fixtures live in `config/`; date/calendar helpers live in `api/`.
- `src/features/design-system/` — `components/{showcase-section.jsx,sections/*.jsx}`,
  the internal component showcase at `/design-system`.
- `src/features/docs/` — filesystem discovery, trusted build-time MDX
  compilation, frontmatter/heading/TOC extraction, react.dev-compatible
  `MaxWidth` grouping, and presentation for company documentation stored under
  `content/docs/{noi-quy,it}/`.
- `src/shared/components/` — semantic StyleX documentation shell
  (`header.jsx`, `side-nav.jsx`, `protected-app-shell.jsx`, `footer.jsx`), MDX
  registry/layout primitives, and theme wiring (`theme.js` — no JSX, hence
  `.js` — plus `theme-provider.jsx` and `astryx theme build` output).
- `src/shared/hooks/` — cross-cutting browser behavior, currently the
  React Docs-style active-section tracking used by the MDX table of contents.
- `src/shared/config/` — `site.js` (site name, nav links).
- `src/shared/types/` — shared domain types (`NavLink`).
- `src/shared/api/` and any feature's missing `api/`/`hooks/` layers — add only
  when a feature actually needs to call the backend project or hold client-side
  state beyond component-local `useState`.

## Data flow

`src/app/*` (Next.js routes) → feature/shared public index → each tree's
own `components → hooks → api → config → types` chain. Operational features
call the separate backend through the authenticated Next API proxy; React
Query hooks own client fetching and invalidation. Documentation is compiled
from trusted repository MDX. The frontend does not access a database directly.

## Documentation shell

The protected Docs surface follows the rendered behavior of the local
`../react.dev` reference while retaining Next.js App Router, JavaScript,
StyleX, KT-XNK authentication, brand, routes, and Vietnamese content. Its
canonical geometry is a 64px sticky header, a 20rem SideNav from 1024px, a
20rem TOC from 1536px, a 56rem prose axis inside an 80rem body, and 20/48px
content insets at the 640px boundary. The complete contract and acceptance
record live in `openspec/changes/react-dev-docs-shell/`.

This surface is an explicit exception to the Astryx component-selection rule:
semantic elements and local controls are preferred where required for
reference parity. Astryx theme variables remain the source for design tokens;
StyleX remains the only styling runtime. Source-contract tests under
`src/shared/components/` protect geometry, responsive thresholds, semantic
markup, and the absence of direct Astryx UI imports.

## Non-goals

- No dark theme — light only, by explicit product decision
  (`openspec/project.md`).
- No CSS-in-JS other than StyleX; no Tailwind, no styled-components.
- No `repo/`/`service/`/`runtime` layers — those are backend concepts and
  belong to the separate backend project, not this front-end repo.
