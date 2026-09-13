# Requirements

- Every `AdvanceTable` consumer in the system renders through TanStack
  Table (`TanStackDataTable`); there is no remaining code path that
  renders a list table through Astryx's own data-driven `Table` renderer.
- Row expansion (`user-list.jsx`, `customers-list.jsx`) keeps working
  under TanStack: expanding a row shows the same detail content, and
  expansion state (open/closed, which row) behaves identically to before.
- No `*FormDialog` renders inside a `renderExpanded` callback (Golden
  Rule #12 / ADR-0004) in the migrated code.
- Column widths, pinning (sticky start/end), density, dividers, filters,
  CSV export and server pagination are unchanged for every migrated list.
- `harness/checks/tanstack-table-only.sh` fails the build if a feature
  file imports Astryx `Table` render primitives directly, or if
  `AdvanceTable` regains a non-TanStack renderer branch.
