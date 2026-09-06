# ADR-0006: Share operational form dialog behavior

Date: 2026-09-06
Status: accepted

## Context

Shipment, User and lookup editors repeated headers, footers, loading banners
and scroll containers. Quick-create dialogs could introduce nested native
forms. Dismissing an editor could silently lose its draft; hidden sections
could conceal validation errors.

## Decision

CommonDialog owns responsive overlay geometry. FormDialog composes the common
header, one content scroll region, footer, validation feedback and save/close
guards. Feature controllers retain validation, values and API operations.
Complex editors use fullscreen; small lookup editors keep a compact width.
Contract retains its specialized create/view/edit workspace on CommonDialog.

Portal the entire form frame to document.body, with a ThemeProvider to supply
inherited CSS variables. Stop React submit propagation as well: a DOM portal
alone does not isolate synthetic events. Keep dialogs outside expanded table
rendering as required by ADR-0004.

Draft snapshots start on opening and rebase after asynchronous initialization.
Block dismissal and duplicate submission throughout the awaited save promise.
Shipment owns tab state above its fields; validation selects the failing tab.
User waits for both detail and bank-row initialization and offers load retry.
Permissions/session controls retain their existing independent operations.

## Consequences

Nineteen operational dialog components share behavior without combining their
business schemas. Discard confirmation is reserved for changed forms, while
reversible filters and media viewers keep their simpler interactions. A manual
mocked browser regression exercises nested submit isolation, theme inheritance,
mobile geometry, hidden validation, loading recovery and pending/failed saves.

This ADR was recorded during final review. The late recording repeats the
process gap noted in ADR-0005; future task checklists should include the ADR
before implementation rather than relying on a final documentation reminder.
