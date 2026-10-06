# Tasks: "Timeline & lịch tàu" read like a carrier tracking page

- [x] 1.1 Route summary + milestone strip on the schedule tab — verify:
  config unit tests, browser (desktop with carrier dates, empty schedule,
  390px iframe without horizontal overflow), gate.
- [x] 1.2 Cut-off tiles: "API" tag when the value is the carrier's last
  reported one (BE-P `tracking-cutoffs-first`), hand-entry hint when blank —
  verify: helper test, browser on a Heung-A shipment after sync, gate.
