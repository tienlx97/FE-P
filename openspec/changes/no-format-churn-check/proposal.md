# Proposal: Gate check against format-only churn

**Status:** done
**Created:** 2026-10-07

## Why

Twice (2026-10-05: 47 untouched files; 2026-10-07: 3 task files) a broad
`prettier --write` rewrote files that are not formatted to the repo config,
burying the real edit. Logged as a harness gap both times; user approved
fixing it (2026-10-07, "làm 1 2 3").

## What changes

- `harness/checks/no-format-churn.mjs` (step `no-format-churn` in
  `verify.sh`): for each modified js/jsx/mjs/cjs/ts/tsx/css/json file vs
  HEAD, counts changed lines as is and after running both sides through
  prettier. Fails on format-only changes, and on a real edit with ≥ 20 extra
  reformatted lines making up ≥ ⅔ of the diff; the message says how to fix.
- `harness/tests/no-format-churn.test.cjs` for the line diff and the rule.

## Out of scope

- Formatting the whole repo to a baseline (large churn of its own).
