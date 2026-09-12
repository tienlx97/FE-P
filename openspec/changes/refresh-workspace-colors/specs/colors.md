# Workspace color requirements

- All Astryx tables, including nested Shipment tables, have mint headers and
  white bodies; header labels and controls remain readable (text >= 4.5:1).
- Main surfaces have a subtle teal tint; cards/popovers remain white. Selected
  tabs use the brand tint and teal text without changing keyboard behavior.
- Desktop and mobile retain navigation, sorting, filtering and dialog behavior.
  Evidence is captured against local fixture data; no business records change.

- Pinned body cells match the white table body, including the row hover overlay; horizontal scrolling keeps both pinned edges opaque. Regression check: harness/checks/pinned-table-colors-browser.mjs.
