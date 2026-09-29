# Meta theme only, InterVariable only

## Why

User request (2026-09-29): use only the Meta theme and only the InterVariable
font. The app root still used the `kt-xnk` Stone theme with Optimistic,
Montserrat and JetBrains Mono.

## What changes

- Root `<Theme>` is `metaTheme`; `kt-xnk` theme, Stone package, `next/font`
  and Optimistic font files removed. See ADR-0011.
