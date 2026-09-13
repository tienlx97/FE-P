#!/usr/bin/env bash
# Golden Rule #13: every list/data table renders through TanStack Table
# (AdvanceTable -> TanStackDataTable). Two things must both hold:
#   1. AdvanceTable itself has no legacy non-TanStack renderer branch.
#   2. No feature file imports Astryx Table's row/body render primitives
#      directly (helpers like pixel/proportional/useTableRowExpansion are
#      still fine — they configure columns/expansion, they don't render).
set -euo pipefail
cd "$(dirname "$0")/../.."

fail=0

if ! grep -q "TanStackDataTable" src/shared/components/advance-table.jsx; then
  echo "advance-table.jsx no longer renders via TanStackDataTable"
  fail=1
fi

if grep -nE "headerGroups \? TanStackDataTable : Table|: Table\b" \
    src/shared/components/advance-table.jsx | grep -q "TableRenderer"; then
  echo "advance-table.jsx still has a legacy (non-TanStack) renderer branch"
  fail=1
fi

RENDER_PRIMITIVES='TableHeader|TableBody|TableRow|TableHeaderCell|TableCell'
OFFENDERS=$(grep -lRE "import \{[^}]*($RENDER_PRIMITIVES)[^}]*\} from '@astryxdesign/core/Table'" \
  src/features 2>/dev/null || true)
if [ -n "$OFFENDERS" ]; then
  echo "Feature files import Astryx Table render primitives directly (bypassing TanStackDataTable):"
  echo "$OFFENDERS"
  fail=1
fi

exit $fail
