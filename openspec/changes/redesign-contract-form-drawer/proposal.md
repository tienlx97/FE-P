# Proposal: Redesign Contract create/edit as a Maritime drawer

**Status:** active
**Created:** 2026-09-20

## Why

The Contract create/edit experience is still presented as a generic fullscreen
workspace. The selected Figma frame defines a focused desktop drawer with a
pinned identity header, grouped business sections, a scrolling form body, and a
pinned action footer. The new surface should use Astryx primitives and the
existing Maritime theme without changing Contract API behavior.

## Scope

- Apply the selected 760px desktop drawer shell to Contract create/edit.
- Recompose the existing Contract fields into the Figma section hierarchy.
- Keep existing validation, lookup, quick-create, dirty-state, and submission
  behavior.
- Preserve the current read-only Contract workspace.
- Verify against the saved Figma reference and the running application.
