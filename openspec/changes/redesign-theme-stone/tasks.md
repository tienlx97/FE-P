# Tasks: Redesign theme on Astryx Stone

## 1. Theme foundation

- [x] 1.1 Add `@astryxdesign/theme-stone` as a dependency (same version line
      as `@astryxdesign/core`), update `pnpm-workspace.yaml`'s
      `onlyBuiltDependencies` list if the new package needs a postinstall
      build approval — verify: `pnpm install` completes clean, `pnpm exec
      astryx theme add stone --list` (or equivalent) resolves the package.
      Done — no build-approval entry needed; removed the stale
      `theme-neutral@0.3.0` `minimumReleaseAgeExclude` entry instead (task
      2.3 dropped the package).
- [x] 1.2 Rewrite `src/shared/components/theme.js` to `extends: stoneTheme`:
      recolor the accent token family to logo teal `#247768` (`--color-accent`,
      `--color-accent-muted`, `--color-text-accent`, `--color-icon-accent`,
      `--color-on-accent`), override `button['variant:destructive']` to solid
      logo red `#c2252a` with hover/active color-mix steps, override
      `--font-family-body` to `Optimistic Text Vietnamese` (keep its existing
      fallback stack), and carry forward the existing app-specific component
      overrides (`table-scroll-wrapper`, `table-header`, `table-header-cell`,
      `table-body`, `table-footer`, `tab` selected, `toast type:success`)
      verbatim — verify: `pnpm theme:build` succeeds with no errors.
      Done — also had to override `--font-family-heading`/
      `--font-family-code` (not scoped in the original plan) to
      `var(--font-montserrat)`/`var(--font-jetbrains-mono)`, self-hosted via
      `next/font/google` (`src/shared/config/fonts.js`, applied in
      `layout.jsx`) — next/font never exposes a literal "Montserrat" family
      name for the theme's literal-string token to key off, and Stone's
      body face (Figtree) has no Vietnamese subset either, ruling out the
      live-Google-Fonts-CDN-link fallback the CLI itself suggested for it.
      Removed the now-dead self-hosted Source Code Pro faces + files
      (nothing referenced the literal family name outside the token that no
      longer points at it).

## 2. Global CSS cleanup

- [x] 2.1 Remove the `@astryxdesign/theme-neutral/theme.css` import from
      `src/app/globals.css` (the extended build is self-contained) — verify:
      grep for `theme-neutral` in `src/app/globals.css` returns nothing.
- [x] 2.2 Remove the `.astryx-button.secondary { color: #ffffff }`
      cascade-layer hack from `globals.css` (secondary is no longer forced
      red/white); re-add the equivalent unlayered escape hatch scoped to
      `.astryx-button.destructive` ONLY if the same layer-ordering bug is
      observed to reproduce for the new destructive override during task 3's
      visual check — verify: documented in this task's notes either way.
      Done — removed the secondary hack, and ported the same escape hatch
      preventatively to `.astryx-button.destructive` (identical override
      shape, same known root cause) since task 3.2 couldn't reach an
      authenticated screen to confirm live either way. Safe if unneeded —
      it just reinforces a color our override already sets. Next session
      with working dev-DB credentials should confirm and note here if it's
      dead weight.
- [x] 2.3 Remove the now-unused `@astryxdesign/theme-neutral` dependency
      (`package.json`, `pnpm-workspace.yaml`) — verify: `grep -r
      theme-neutral src package.json pnpm-workspace.yaml` returns nothing,
      `pnpm install` stays clean.

## 3. Verification

- [x] 3.1 Run `./harness/verify.sh` full green (lint, typecheck, tests,
      structure, build) — verify: exit 0, evidence under `harness/runs/`.
      Done — `harness/runs/20260916-221532-629/` (final run, after the
      destructive-button CSS escape hatch and font wiring were added).
- [~] 3.2 Visual smoke test via dev server/browser: primary buttons teal,
      destructive buttons solid red with hover/active feedback,
      secondary/Hủy buttons Stone's neutral outline and legible, Vietnamese
      diacritics render with no mixed-font seam, sticky table header/columns,
      selected tab tint, and success toast all still correct, no console
      errors — verify: screenshots + console log captured.
      Partial — the unauthenticated `/login` screen confirms the primary
      button (teal) and error Banner (Stone's soft-red status style) render
      correctly. Every other screen in this app sits behind auth
      (`(protected)` route group, including `/docs` and `/design-system`),
      and no working dev-DB credentials were available this session (tried
      the stale creds in `PROGRESS.md`'s login-feature history, and
      `BE-kt-xnk/requests/Authentication/Login.http`'s `100000000001` /
      `Sample@123` — both rejected as invalid by the current dev DB). User
      said to proceed without blocking on this. **Still needs a real
      authenticated visual pass** — destructive/secondary buttons, sticky
      table header/columns, selected tab, success toast, and Vietnamese
      body-text rendering are unverified beyond code review + build/lint/
      typecheck passing. Next session: get working dev-DB credentials
      (check with the user, or reseed
      `BE-kt-xnk/db/sample-data.sql`) and finish this check first.

## 4. Docs & handoff

- [x] 4.1 Update `openspec/project.md`'s "Color" convention paragraph to
      describe the `extends: stoneTheme` approach (still one editable
      source, still token-driven, no raw hex outside `theme.js`) — verify:
      doc matches the actual `theme.js` structure.
- [x] 4.2 Append a `harness/PROGRESS.md` entry summarizing the change and
      mark all tasks above done — verify: entries present, checkboxes ticked.
