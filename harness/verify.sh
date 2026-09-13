#!/usr/bin/env bash
# Verification gate — the ONLY definition of "done".
# Evidence is written to harness/runs/<timestamp>/ for reviewers to replay.
# Customize commands for your stack; keep the gate structure.
set -uo pipefail
cd "$(dirname "$0")/.."

RUN_DIR="harness/runs/$(date +%Y%m%d-%H%M%S)-$$"
mkdir -p "$RUN_DIR"

fail=0
step() {
  local name="$1"; shift
  echo "──► $name"
  if "$@" >"$RUN_DIR/$name.log" 2>&1; then
    echo "    ✔ $name"
  else
    echo "    ✘ $name FAILED — see $RUN_DIR/$name.log"
    tail -n 20 "$RUN_DIR/$name.log" | sed 's/^/      /'
    fail=1
  fi
}

has_pkg_script() {
  node -e 'const p=require("./package.json"); process.exit(p.scripts?.[process.argv[1]] ? 0 : 1)' "$1"
}

require_step() {
  local name="$1" script="$2"
  if has_pkg_script "$script"; then
    step "$name" pnpm run "$script"
  else
    echo "──► $name"
    echo "    ✘ required package script '$script' is missing"
    fail=1
  fi
}

SRC_FILE_COUNT=$(find src -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \) 2>/dev/null | wc -l)

step "project-readiness" ./harness/checks/project-readiness.sh
step "memory-secrets" ./harness/checks/memory-secrets.sh
step "tanstack-table-only" ./harness/checks/tanstack-table-only.sh

# ── 0. Generated sources ──────────────────────────────────────────
# src/shared/components/kt-xnk.{js,d.ts} + theme.built.css are `astryx theme
# build` output (gitignored — regenerated from src/shared/components/theme.js).
# lint/typecheck/structure
# below all resolve imports of these files, so they must exist first.
if has_pkg_script theme:build; then
  step "theme-build" pnpm run theme:build
fi

# ── 1. Static checks ─────────────────────────────────────────────
if [ "$SRC_FILE_COUNT" -gt 0 ]; then
  require_step "lint" lint
  require_step "typecheck" typecheck
else
  echo "──► app-checks"
  echo "    ℹ no application source found; running harness self-tests only"
fi

# ── 2. Structural tests (dependency hierarchy: types → config → repo → service → runtime → ui)
if [ -d src ] && [ "$SRC_FILE_COUNT" -gt 0 ]; then
  if pnpm exec depcruise --version >/dev/null 2>&1; then
    step "structure" pnpm exec depcruise src --config harness/structure.rules.cjs
    # depcruise exits 0 on "0 modules cruised" (e.g. missing `typescript` dep for
    # .ts parsing) which would silently pass without checking anything — catch it.
    if [ "$fail" -eq 0 ] && grep -q '(0 modules,' "$RUN_DIR/structure.log"; then
      echo "    ✘ structure FAILED — 0 modules cruised despite $SRC_FILE_COUNT source file(s) present (check devDependencies, e.g. typescript)"
      fail=1
    fi
  else
    echo "──► structure"
    echo "    ✘ dependency-cruiser not installed — run: pnpm add -D dependency-cruiser"
    fail=1
  fi
fi

# ── 3. Tests ─────────────────────────────────────────────────────
step "harness-tests" pnpm run test:harness
if [ "$SRC_FILE_COUNT" -gt 0 ]; then
  require_step "unit-tests" test
fi

# ── 4. Build ─────────────────────────────────────────────────────
if [ "$SRC_FILE_COUNT" -gt 0 ]; then
  require_step "build" build
fi

# ── 5. Measurable thresholds (from openspec/project.md) ──────────
if [ "$SRC_FILE_COUNT" -gt 0 ]; then
  require_step "quality-thresholds" verify:quality
fi

# ── 6. E2E / UI evidence (screenshots into $RUN_DIR) ─────────────
# Add `require_step "e2e" test:e2e` here when the project has a UI.

echo
if [ "$fail" -ne 0 ]; then
  echo "VERIFICATION FAILED — the task is NOT done. Evidence: $RUN_DIR/"
  exit 1
fi
echo "VERIFICATION PASSED — task may be marked done. Evidence: $RUN_DIR/"
