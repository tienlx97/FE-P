# Golden Rules

<!--
Versioned quality standards (OpenAI harness style). Agents replicate patterns
they see — these rules define which patterns are allowed to exist.
Each rule states its ENFORCEMENT: the mechanical check that catches violations.
A rule with enforcement "manual" is a harness gap — plan to automate it.
Raising the version creates cleanup work: see harness/ENTROPY.md.
-->

## v7 — 2026-09-23

| # | Rule | Enforcement |
|---|---|---|
| 1 | No task is done without passing `./harness/verify.sh` | verify.sh exit code |
| 2 | Front-end only (backend is a separate project); within each of `src/features/<feature>/` and `src/shared/`, dependencies flow types → config → api → hooks → components; no upward imports, no cycles | structural test (dependency-cruiser) |
| 3 | Features are isolated (no direct cross-feature imports) and reachable from outside only via their `index.js`; `src/shared/` must not import a feature | structural test |
| 4 | No dead or commented-out code; delete it, git remembers | lint |
| 5 | Every spec scenario has a corresponding test | manual → TODO: coverage-map script |
| 6 | Errors handled at boundaries; no empty catch | lint |
| 7 | One task per commit; diffs stay small and single-concern | review + PR size check |
| 8 | Copy patterns only from A-graded code (`harness/quality-grades.json`) | manual → cleanup agent scans |
| 9 | Quality claims are measurements against `openspec/project.md` thresholds, not adjectives | verify.sh perf steps |
| 10 | Stale docs are bugs; updating `docs/`/`openspec/` is part of the task that made them stale | cleanup agent scan |
| 11 | Shared memory must not contain credentials or private keys | `harness/checks/memory-secrets.sh` |
| 12 | A `*FormDialog` never renders inside a table's `renderExpanded` callback (a `Selector` field inside it would portal underneath the dialog instead of above it — see ADR-0004) | `harness/tests/selector-dialog-stacking.test.cjs` |
| 13 | Every list/data table in the system renders through TanStack Table v8 (`AdvanceTable` → `TanStackDataTable`, `src/shared/components/tanstack-data-table.jsx`); no feature builds a bespoke table renderer or drops down to Astryx `Table` row/body primitives directly | `harness/checks/tanstack-table-only.sh` |
| 14 | A field added to a form schema (`config/*-schema.js`) that a user would plausibly want in the matching list view gets BOTH a `COLUMN_OPTIONS` entry (`config/*-table.js`) AND a matching column definition (`renderCell`) in that list's `*-list.jsx` — a `COLUMN_OPTIONS` entry with no column definition silently does nothing when toggled on in "Tuỳ chọn hiển thị" (found live on `note` in `contracts-list.jsx`, 2026-09-16) | manual → TODO: schema/`COLUMN_OPTIONS`/column-def diff script |
| 15 | Custom components (`src/shared/components/custom/<theme>/`, e.g. Meta) are composed from Astryx components (`@astryxdesign/core`, `@astryxdesign/lab`) only: no raw DOM elements (`<div>`, `<span>`, `<button>`, `<table>`…), no `className`/`style`; styling goes through component props, `xstyle` + tokens, or the theme's own `components` overrides in `theme.js`. If Astryx lacks a behavior, swizzle the Astryx component into `custom/<theme>/astryx/` instead of hand-rolling one | lint (`react/forbid-elements` + `react/forbid-dom-props` on `src/shared/components/custom/**/*.jsx`, `eslint.config.mjs`) |
| 16 | A Figma/Stitch mockup is the reference for **layout, UI and UX** (structure, order, hierarchy, colors, states, behavior) — **not** for exact font sizes and dimensions. Sizes come from Astryx's own scales, picking the nearest step: component `size` props (`sm`/`md`/`lg`), `Text` `type`/`size`, and tokens (`--font-size-xs|sm|base|lg…`, `--spacing-*`, `--size-element-*`, `--radius-*`). Never copy mockup px (e.g. 13px text, 33px tab, a `size:md` override forced to 36px); px only appears where a theme defines a token's own value | lint (`no-restricted-syntax` on `'NNpx'` literals in `src/shared/components/custom/**/*.jsx`; Maritime exempt, graded C) + manual review of `theme.js` overrides |

## Changelog

- v8 (2026-09-25): the Maritime theme (`custom/maritime`) was deleted
  (user request), so its rule #15 / #16 lint exemptions and C grade are gone.
- v7 (2026-09-23): rule #16 — mockups define layout/UI/UX, Astryx scales
  define sizes (user request after the Meta contract list had copied
  Figma px: 13px cells, 33px tabs, 36px `md` buttons). Meta already
  complies; `custom/maritime` (C) still has px literals and is exempt from
  the lint until cleaned up.
- v6 (2026-09-23): rule #15 — custom theme components must be built from
  Astryx (user request while adding the "Meta" theme,
  `src/shared/components/custom/meta/`). Enforced by lint; five pre-existing
  Maritime files with raw `<span>`/`<button>` are listed as explicit
  exemptions in `eslint.config.mjs` and `custom/maritime` is graded C in
  `harness/quality-grades.json` until they are fixed.
- v5 (2026-09-16): rule #14 — a Contract field (`sellerSigned`,
  `buyerSigned`, `projectCompletionDate`) shipped in an earlier change
  without ever reaching the contracts list's "Tuỳ chọn hiển thị" column
  picker; fixed in `contracts-list.jsx`/`contracts-table.js`, along with a
  pre-existing instance of the *inverse* drift found in the same pass
  (`note` had a `COLUMN_OPTIONS` entry but no column definition — toggling
  it on did nothing). No automated check yet — recorded as a harness gap in
  `harness/PROGRESS.md`.
- v4 (2026-09-13): rule #13 — TanStack Table is now the single engine for
  every list in the system (`openspec/changes/tanstack-table-system-rollout/`),
  not just contracts. `AdvanceTable` no longer has a legacy non-TanStack
  renderer branch, so there is nothing left to grade C on this axis.
- v3 (2026-09-04): rule #12 — the Selector-in-dialog portal-stacking bug had
  already been found and fixed once (`contracts-list.jsx`), then found again
  independently in `commissions-list.jsx` (per
  `harness/ENTROPY.md`'s "caught twice → mechanical rule" policy). Both
  known offenders were fixed in the same change that added the rule, so
  nothing needed to be graded C. See
  `docs/adr/0004-selector-dialog-portal-stacking.md`.
- v2 (2026-08-07): dropped the backend-oriented repo/service/runtime layers
  (backend now lives in a separate project) in favor of a feature-based
  front-end structure — `src/features/<feature>/` and `src/shared/`, each
  with `types → config → api → hooks → components`, plus feature isolation
  (rule #3). See `docs/adr/0003-feature-based-architecture.md`. All existing
  code migrated in the same change, so nothing was graded C.
- v1 (2026-07-24): initial rules.
