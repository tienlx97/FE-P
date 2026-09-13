# Requirements

- Every `AdvanceTable` shows an "Xuất" dropdown with, at minimum, Excel,
  CSV and Print for the currently visible (filtered) page.
- Where a list is server-paginated, the dropdown also offers exporting the
  full filtered dataset (not just the current page) as Excel or CSV.
- Excel exports are real `.xlsx` files (valid OOXML/zip), not a renamed
  CSV.
- A single "Cài đặt giao diện" entry in the header lets the user hide the
  side nav and/or enter a chromeless focus mode; both choices persist
  across reloads (localStorage) and apply immediately without a page
  refresh.
- Focus mode always has a visible way back (Esc key or a floating exit
  button) — never strands the user with no way to restore the header.
