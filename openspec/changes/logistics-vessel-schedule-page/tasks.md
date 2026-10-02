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
- [x] 1.10 "Tải lại từ hãng" button: refetch the visible range from the
  carriers (BE skips and replaces its Redis cache), 60 s cooldown.
- [x] 1.11 Transshipment tag `[HÃNG] - TS - [TÀU / SỐ CHUYẾN]`; transit port(s)
  in the hover card and drawer; a sailing whose vessel stops short of the
  POD (`onCarriage`, Heung-A → Bangkok via Laem Chabang + barge) says so in
  both; calendar ids tell it from the same vessel's direct call.
- [x] 1.12 SI cut-off in the hover card; Sundays blue in `MetaSchedule`
  (red stays for sailings that cannot be booked); Namsung shown once its BE
  adapters landed (no FE change — carriers come from the API).
- [x] 1.13 Search card: POL / POD fixed width (20rem, wrap on narrow
  screens); "Tìm" + "Tải lại từ hãng" on their own row with the route and
  per-carrier result pills in a `Carousel`; "Terminal dỡ" value in accent
  blue (hover card + drawer). SITC shown once its BE schedule adapter
  landed (no FE change for that).
- [x] 1.14 Evergreen and RCL (BE-P `add-carrier-schedules` tasks 6, 7) shown
  with no API change; six carrier tones (`indigo`, new `pink` added to
  `MetaSchedule` / `MetaPill`, `--meta-pink-*` theme tokens) so the six
  connected carriers never share a colour; the sailing id includes the ETA
  (two Evergreen routings via Kaohsiung differ only by it — duplicate React
  keys, a click could open the wrong one).
- [x] 1.15 ONE (BE-P `add-carrier-schedules` task 9) shown with no API change;
  carrier tones now follow the order of the carriers with a connected
  schedule (placeholders take none), plus a 7th tone `teal`
  (`--meta-teal-*`), so ONE — 9th of all carriers — no longer wraps onto
  Namsung's colour.
