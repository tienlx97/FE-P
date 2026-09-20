# Contract form drawer requirements

## Drawer presentation

- **WHEN** a user creates or edits a Contract on desktop
- **THEN** the editor is presented as an end-aligned 760px drawer with a fixed
  header, scrolling body, and fixed action footer.
- **AND** the drawer remains usable at narrow viewport widths.

## Business grouping

- **WHEN** the editor is open
- **THEN** existing Contract controls are grouped into general/legal,
  financial/Incoterm, parties, signing, bank/payment, and notes sections.
- **AND** no existing editable field or quick-create action is removed.

## Behavior preservation

- **WHEN** the user edits, validates, submits, cancels, or closes the form
- **THEN** existing form state, validation, dirty-state confirmation, and API
  payload behavior remain unchanged.
