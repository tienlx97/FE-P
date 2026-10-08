# CLAUDE.md

Read and follow `AGENTS.md`. It is the single operating manual for this repository, shared by every agent (Claude Code, Codex, humans).

Claude-specific notes:
- Use the session lifecycle in `AGENTS.md` exactly; start every session by reading `harness/PROGRESS.md`.
- When context runs long, finish the current task, update state files, and hand off via `harness/PROGRESS.md` — state on disk survives context resets, your conversation does not.
- For recalling past work, use the memsearch plugin (`/memory-recall <query>`) — it searches the shared `.memsearch/memory/` markdown that Codex sessions also feed. Do NOT rely on any Claude-only memory store for project knowledge; everything durable goes to `harness/PROGRESS.md`, `docs/adr/`, or `openspec/` per `AGENTS.md` and ADR-0002.
- **`@astryxdesign/lab`** ("astryx-lab", https://github.com/facebook/astryx/tree/main/packages/lab) holds Astryx's canary/experimental components — ones not yet stable enough for `@astryxdesign/core`'s 168. It is published `@canary`-only (never a stable `latest`), so install it with `pnpm add @astryxdesign/lab@canary`, import components from the package root (`@astryxdesign/lab`, no per-component subpath like core has), and import `@astryxdesign/lab/lab.css` once alongside `reset.css`/`astryx.css` in `src/app/globals.css` — without it, lab components render unstyled. `astryx search`/`astryx component` (the CLI in the block below) only know about core's 168; they will not find a lab component by name, so check the lab package's own `dist/<Name>/*.d.ts` directly instead of assuming one doesn't exist. Example already wired in this repo: `InfoTip` (contract-detail-workspace.jsx's "Thêm mới" dropdown, `add-contract-detail-page`).

<!-- ASTRYX:START -->
Astryx v0.6.6 · 168 components
CLI: run every command as `pnpm exec astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in your app entry e.g. main.tsx) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — start every page from a template. Never lay out a page from scratch:
1. `astryx build "<idea>"` — START HERE: names the [page] template to start from (always one: the closest match, or the app shell), two other templates, and the [block]s + [component]s for parts it lacks. No args = full playbook.
2. `astryx template <name> <path>` — scaffold that template into your project. Keep its frame, gap and padding; replace its data, copy and sections; delete sections you do not need.
3. `astryx template <Block>` for a part the template lacks; `astryx component <Name>` for props + examples before you use or change a component.
Changing a page you already have? Keep it: skip step 2 and add blocks and components inside its sections.

RULES:
- No <div> — components do all layout/spacing, page frame included.
- Frame first: the template you scaffold sets the page frame. Read `astryx docs layout` before you change it — region widths, breakpoint behavior.
- Dense data = rows (Table, List/Item), never Card-wrapped list items; Card is for standalone widgets. Status = StatusDot/Token; Badge = counts only.
- Custom styling: component props first; else the xstyle prop / StyleX tokens (@astryxdesign/core/theme/tokens.stylex). No raw hex/px.
- Tokens for every value (`astryx docs tokens`). Brand/accent belongs in the theme (`astryx theme list` / `theme add <slug>`, or `astryx theme template` for a custom one) — never override --color-* in :root.
- SELF-CHECK before you finish: re-read the file and replace any className=, style={{…}}, raw <div>/<span> layout, imported .css/@apply, or hardcoded #hex/px with the component or the xstyle prop + a token. Confirm the page kept its template's frame, gap and padding. If unsure a component/prop exists, run `astryx component <Name>` / `astryx search "<thing>"`; don't hand-roll CSS.

MORE CLI:
  search "<query>"   find any component / hook / doc / template / block / theme
  discover <words>   integrations you could add, and the ones you have
  component --list   168 components by category
  template --list    page + block recipes
  docs <topic>       authoring, browser-support, color, elevation, getting-started, icons, illustrations, internationalization, layout, migration, motion, principles, shape, spacing, styling-libraries, styling, theme, tokens, typography, working-with-ai
  docs cli           commands, API reference, integration authoring (one level at a time)
  swizzle <Name>     eject component source for deep customization
  upgrade --from <old version> --apply   run after any Astryx or integration dependency bump
<!-- ASTRYX:END -->
