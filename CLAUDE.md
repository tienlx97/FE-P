# CLAUDE.md

Read and follow `AGENTS.md`. It is the single operating manual for this repository, shared by every agent (Claude Code, Codex, humans).

Claude-specific notes:
- Use the session lifecycle in `AGENTS.md` exactly; start every session by reading `harness/PROGRESS.md`.
- When context runs long, finish the current task, update state files, and hand off via `harness/PROGRESS.md` — state on disk survives context resets, your conversation does not.
- For recalling past work, use the memsearch plugin (`/memory-recall <query>`) — it searches the shared `.memsearch/memory/` markdown that Codex sessions also feed. Do NOT rely on any Claude-only memory store for project knowledge; everything durable goes to `harness/PROGRESS.md`, `docs/adr/`, or `openspec/` per `AGENTS.md` and ADR-0002.
- **`@astryxdesign/lab`** ("astryx-lab", https://github.com/facebook/astryx/tree/main/packages/lab) holds Astryx's canary/experimental components — ones not yet stable enough for `@astryxdesign/core`'s 155. It is published `@canary`-only (never a stable `latest`), so install it with `pnpm add @astryxdesign/lab@canary`, import components from the package root (`@astryxdesign/lab`, no per-component subpath like core has), and import `@astryxdesign/lab/lab.css` once alongside `reset.css`/`astryx.css` in `src/app/globals.css` — without it, lab components render unstyled. `astryx search`/`astryx component` (the CLI in the block below) only know about core's 155; they will not find a lab component by name, so check the lab package's own `dist/<Name>/*.d.ts` directly instead of assuming one doesn't exist. Example already wired in this repo: `InfoTip` (contract-detail-workspace.jsx's "Thêm mới" dropdown, `add-contract-detail-page`).

<!-- ASTRYX:START -->
Astryx v0.3.0 · 155 components
CLI: run every command as `pnpm exec astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in your app entry e.g. main.tsx) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — discover, don't guess. Before writing UI:
1. `astryx build "<idea>"` — START HERE: returns a kit (closest [page] + [block]s + [component]s). No args = full playbook.
2. `astryx template <name> [--skeleton]` — scaffold the [page]/[block]s it named, or study their layout. Templates are reference code.
3. `astryx component <Name>` — props + examples for every component you use.

RULES:
- No <div> — components do all layout/spacing. Full page → AppShell; sidebar nav → SideNav.
- Frame first: pick the shell (AppShell / Layout+LayoutPanel) and budget regions in px BEFORE writing content (`astryx docs layout`).
- Dense data = rows (Table, List/Item) edge-to-edge — never Card-wrapped list items. Card = dashboard widgets, galleries, settings groups only.
- Status → StatusDot/Token; Badge only for counts and enumerated states, never decoration.
- Custom styling: component props first; else the xstyle prop / StyleX tokens (@astryxdesign/core/theme/tokens.stylex). No raw hex/px.
- Tokens for every value (`astryx docs tokens`). Brand/accent via `astryx theme` — never override --color-* in :root.
- SELF-CHECK before you finish: re-read the file and replace any className=, style={{…}}, raw <div>/<span> layout, imported .css/@apply, or hardcoded #hex/px with the component or the xstyle prop + a token. If unsure a component/prop exists, run `astryx component <Name>` / `astryx search "<thing>"`; don't hand-roll CSS.

MORE CLI:
  search "<query>"   find any component / hook / doc / template / block
  component --list   155 components by category
  template --list    page + block recipes
  docs <topic>       color, elevation, icons, illustrations, internationalization, layout, migration, motion, principles, shape, spacing, styling, theme, tokens, typography
  swizzle <Name>     eject component source for deep customization
  upgrade --apply    run after any @astryxdesign/core bump
<!-- ASTRYX:END -->
