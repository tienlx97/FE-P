# Selected list totals

Add a leading selection checkbox to the Contract and Shipment lists. All rows on the current result page start selected. The header checkbox selects or clears the rows currently shown by the table's quick filter. The totals row sums only selected rows on the current page and states that scope explicitly. Changing the result page or server filters starts that page with all rows selected.

Keep status-tab counts and pagination totals as result counts; they are navigation metadata, not selected-row sums. No backend change is needed because both lists already return the row values required for page totals.
