# Tasks: Meta contract Shipment tab

- [x] 1. Implement the Figma Shipment content in Meta with live KPIs, card/table views, XLSX export, responsive layout and existing create/edit dialogs. Verify with `./harness/verify.sh`, plus desktop/mobile screenshots from a preview fixture.

Evidence: final gate `harness/runs/20260923-133531-8118/`; desktop/mobile preview screenshots in `harness/runs/20260923-123254-7648/`. The preview fixture route was removed. Authenticated Contract `26KCT03` was checked in the dev browser; live desktop, table, and mobile screenshots are in `harness/runs/20260923-124422-7788/`. The table's edit action opened the existing prefilled Shipment form and was closed without saving.

- [x] 2. Match the selected Figma table frame `99:3843`: ten ordered columns, actual declaration/VGM values, status badges, per-column totals, and view/edit actions. Preserve internal horizontal scrolling on narrow screens.

Evidence: desktop left/right and mobile screenshots for authenticated Contract `26KCT03` in `harness/runs/20260923-134742-8319/`; page width equalled viewport at 390px while the table scrolled internally. The edit action opened the prefilled Shipment dialog and was closed without saving. Final gate: `harness/runs/20260923-135706-8750/`.

- [ ] 3. Increase Shipment table typography to the Astryx medium-equivalent (`base`, 14px) for headers, cells, totals and pills. The UI is implemented and visually checked; close this task after the full gate passes. Current gate failure is limited to unrelated `Text size="md"` errors in `src/shared/components/custom/meta/contract-info-grid.jsx`.

Evidence: `harness/runs/20260923-141125-9189/` (desktop/mobile screenshots, lint/build/test pass, unrelated typecheck failure).
