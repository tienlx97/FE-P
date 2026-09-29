# Tasks

- [x] 1.1 `/logistics/schedule` page: POL / POD typeaheads, full-size
  `Schedule` loading every implemented carrier's sailings for the visible
  range, events titled `[HÃNG TÀU] - [TÊN TÀU] / [SỐ CHUYẾN]`; sidebar
  entry and route access; unit tests for the event mapping.
- [x] 1.2 POL / POD by UN/LOCODE only (code sent to the BE), carrier
  selector (default "Tất cả hãng"), "Tìm" button; calendar loads on search.
- [x] 1.3 POL / POD / country selectors, `MetaSchedule` calendar (as on
  `/logistics`), hover card and sailing drawer (ETD, ETA, SI / VGM / CY
  cut-off, terminal, route).
- [x] 1.4 "Hết chỗ" in red (carrier-closed sailing before its cut-off), booking state in hover card / drawer.
- [x] 1.5 POL + POD only: POL selector (Vietnam), POD searched on the server (whole catalog).
- [x] 1.6 Red booking-unavailable sailings (departed, full, cutoff passed, not yet open), red Sundays in both schedule views, and no POL loading indicator on background refetch after focus.
- [x] 1.7 POD as a selector (`ComplexSelector`: search on the server inside
  the popup, recently picked PODs listed when it opens) and a multi-carrier
  "Hãng tàu" (`MultiSelector`; none checked = every connected carrier,
  carriers not connected listed but disabled).
- [x] 1.8 Unavailable sailings red without the reason in the calendar (reason
  in hover card / drawer); bookable sailings first in each day; POD selector
  lists the whole catalog on open (paged on scroll, searched on the server,
  popup as wide as the field); skeletons while sailings / ports load; month
  cells show as many rows as fit before "+n mục" (`MetaSchedule`, shared).
- [x] 1.9 POD terminal ("Terminal dỡ") in the sailing drawer and hover card
  (BE `portOfDischargeTerminal`).
