# ADR-0012: Faster dev compiles — StyleX Babel without `next/babel`

Date: 2026-09-29
Status: accepted

## Context

`pnpm dev` compiled slowly: with a cold `.next/dev` cache the first route
(`/admin/users`) took ~24 s, and every start ran `theme:build` (~3.8 s).
Two places ran Babel with the full `next/babel` preset although only the
StyleX plugin is needed, and only in the 133 of 622 `src/` files that
import `@stylexjs/stylex`:

1. **StyleX PostCSS plugin** (`postcss.config.js`, runs for `globals.css`'s
   `@stylex;`). Its `babelConfig` had `babelrc: false` but no
   `configFile: false`, so Babel also loaded `babel.config.js`: every file
   went through `next/babel` plus StyleX twice. Measured standalone: 4.2–9.3 s
   per cold run; with `configFile: false` 1.1 s, byte-identical CSS.
2. **Turbopack's built-in Babel** (Next 16 uses `babel.config.js`
   automatically) ran `next/babel` on every app file.

## Decision

- `postcss.config.js`: `configFile: false` in the StyleX plugin's
  `babelConfig`.
- `next.config.mjs`: `experimental.turbopackUseBuiltinBabel: false` and a
  `turbopack.rules` entry that runs `stylex-loader.cjs` on non-`node_modules`
  `.js` / `.jsx` files whose content matches `@stylexjs/stylex`. The loader
  runs only `babel.config.js`'s plugins (StyleX) through `@babel/core` (now
  a direct devDependency); SWC compiles everything else.
- `babel.config.js` stays as the single home of the StyleX plugin options
  (read by both PostCSS and the loader).
- `pnpm dev` runs `scripts/theme-build-if-stale.mjs`: `theme:build` only
  when `custom/meta/theme.js` is newer than `theme.built.css` (0.07 s
  otherwise). `pnpm build` and `./harness/verify.sh` always rebuild.

## Measurements (2026-09-29, `pnpm dev`, `.next/dev` deleted before each run)

| Route (in this order)  | Before | Loader only | Loader + PostCSS fix |
|------------------------|-------:|------------:|---------------------:|
| `/admin/users` (first) | 24.6 s |      23.8 s |                9.1 s |
| `/docs`                |  4.5 s |       5.0 s |                2.3 s |
| `/design-system`       |  2.1 s |       2.0 s |                0.8 s |
| `/logistics/schedule`  |  1.6 s |       1.5 s |                0.8 s |

Hot reload after editing a StyleX file: `✓ Compiled in 264ms`.
`next build` compile: 65 s → 31.6 s / 35.6 s (loader only). The loader
alone made no measurable dev difference; the PostCSS fix is what helps dev.
An earlier single baseline run of 15.5 s for `/admin/users` was noise — the
repeat run gave 24.6 s.

## Consequences

- A file that calls `stylex.create` without importing `@stylexjs/stylex`
  is not transformed and throws at runtime; every StyleX file imports it.
- Next warns that `D:\` is a slow filesystem (`.next/dev` benchmark
  420–680 ms); antivirus scanning of the project folder is the usual cause
  and is outside this repo.
