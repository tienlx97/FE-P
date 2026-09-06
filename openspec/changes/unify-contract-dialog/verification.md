# Verification — 2026-09-06

Browser: agent-browser session `contract-workspace`, local Next.js at
`http://localhost:3000/logistics/contracts`. All `/api/backend/**` calls were
intercepted with synthetic fixtures; no real contract was created or changed.
Artifacts: `harness/runs/20260906-contract-dialog/` (gitignored run evidence).

| Scenario | Observed result |
| --- | --- |
| Open existing contract | Fullscreen Information view; same workspace exposes Edit |
| Enter edit mode | Instrumented `window.fetch`: zero writes from clicking Edit |
| Switch tabs while editing | Changed project name survives Shipment → Information and opening/closing the Shipment child dialog |
| Invalid save | Missing-bank fixture stays in editor, shows field error and validation summary, sends no PUT |
| Save edit | Instrumentation asserts exactly one PUT, expected `ProjectName`, then returns to view with the returned record |
| Create | Four visible tabs; exactly three `aria-disabled=true`; ArrowRight keeps Information selected |
| Cancel dirty create | Discard confirmation offers Continue entering / Discard changes; discard returns to list |
| Save create | Filled required inputs and selected Incoterm, country, port, company, seller, buyer and bank using UI; mocked POST returns `HD-UI-NEW`; workspace stays open in view and related tabs are enabled |
| Related data | Shipment child dialog opens above the parent; Commission empty state offers Create; payment creation still requires both signatures |
| Mobile | 390×844 dialog at x=0/y=0, document width 390; metadata columns measured 171px + 171px; form dates stack below header fields |
| Desktop | Create at 1440×900; view/edit at 1280×577; screenshots inspected; opaque surface. Footer submit button stays at y=852…884 after scrolling content by 413px (`footer-geometry.log`) |
| Console | `agent-browser errors` returned no errors after final create/save flow |

Screenshots: `create-desktop.png`, `create-mobile.png`, `view-desktop.png`,
`view-mobile.png`, `edit-desktop.png`, `saved-desktop.png`,
`created-mobile.png`. `setup-fixtures.sh` records the catalog and create
response mocks; `contract.json`, `list.json`, `saved.json` record the view/edit
fixtures. Screenshots must be captured after the opening animation settles.

Limitations: real backend round trips, exhaustive permission matrices and
changed-line coverage were not measured. Browser assertions were run manually,
not added as a mandatory CI browser job.

Final gate: `./harness/verify.sh` passed in
`harness/runs/20260906-131752-565150/`: lint, typecheck, architecture,
harness tests, 120 unit tests, production build and quality thresholds.
