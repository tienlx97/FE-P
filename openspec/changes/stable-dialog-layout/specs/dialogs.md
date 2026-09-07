# Stable dialog geometry

## Shared fields

Contract, Shipment and Commission render one ordered field grid in create,
view and edit. Text/number inputs use read-only behavior; native Astryx
Selector, DateInput and CheckboxList use disabled behavior where no read-only
API exists. All modes retain currency and action slots. Existing-record titles
remain identical between view/edit. Creation retains explanatory content and
Commission metadata slots with placeholders for unassigned values.

Scenario: at 1440×900 and 390×844, switch a saved record from view to edit.
Matching control rectangles and footer buttons move at most 2 CSS pixels;
content scroll and the current editable tab remain unchanged. Opening edit
does not submit a request. Test: stable-dialog-layout-browser.mjs.

## Tables and related workflows

Payment terms, history, extra fields, logistics costs and VGM retain action
columns and toolbar space in view. Parent mutations are disabled. Commission
quick payment uses the same Add slot but still opens its independent dialog.
VGM keeps its existing edit-only mutation policy. Seller/buyer disclosure
state is independent of view/edit, and stored party fields remain visible
even when a catalog record is unavailable.

Scenario: compare populated and empty payment history, costs and VGM tabs.
Geometry remains stable; view controls cannot change parent data. Tests:
stable-dialog-layout-browser.mjs and logistics-actions-browser.mjs.

Scenario: open a quick payment, save it, then edit its Commission. Only the
child save writes once; the subsequent parent edit retains that payment.
Test: logistics-actions-browser.mjs.

## Existing form guards

Scenario: create a Contract/Shipment, enter a draft and use a quick-create
child, invalid submit and discard confirmation. Keep independent submits,
draft retention and validation navigation. Test: dialog-browser.mjs.
