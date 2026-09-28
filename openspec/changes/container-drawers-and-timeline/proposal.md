# Container drawers, full Excel import and a readable schedule timeline

**Containers.** The Excel template and import only had number, type, seal and
packing date, so VGM weights, packing / truck times, carrier and note had to be
typed one container at a time. The template, import and "Xuất Excel" export now
share one column list with every field (the export imports back). Carrier names
resolve against the supplier catalog. Rows follow the single-container rules
and invalid cells are shown inline before one atomic save (BE
`bulk-container-full-fields`). "Thêm danh sách container" and the one-container
form move from dialogs to Meta drawers (`MetaFormDrawer`). The bulk drawer edits
identity columns in its table, opens a row's VGM / times / note below it, and
can fill a carrier or packing date into every row.

**Timeline & lịch tàu.** The tab stacked seven equal tables. The physical
timeline listed the estimated and actual date of one event as two rows, with
stretched pills. The new `MetaEventTimeline` merges them into one event with its
delay and a state dot (done / next / overdue / upcoming), one timeline per
container. On wide screens the timeline sits beside a compact schedule (current
value, original when moved, ATD/ATA), the B/L steps and the transshipment legs.
The schedule history is a timeline too. Phones stack everything and move the
date into the event text.
