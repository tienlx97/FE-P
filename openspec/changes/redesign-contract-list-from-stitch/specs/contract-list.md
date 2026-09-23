# Contract list

## Requirement: Stitch-aligned list hierarchy

The Contract list SHALL present a descriptive page heading, a server-backed
status switcher, and explicit Basic and Value & Cash Flow table modes.

### Scenario: Switch status without losing advanced search

- **WHEN** a user selects a contract status
- **THEN** the status is applied through the same server filter conditions used
  by the advanced-search dialog
- **AND** the advanced-search trigger and condition builder remain available

### Scenario: Switch table mode

- **WHEN** a user chooses `Cơ bản` or `Giá trị & Dòng tiền`
- **THEN** the corresponding configured Contract columns are shown
