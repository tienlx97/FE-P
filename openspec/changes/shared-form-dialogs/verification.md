# Dialog review and verification

## Integration inventory

- Fullscreen shared forms: Shipment, Commission, User (create/edit).
- Compact shared forms: Customer, Country, Place, Shipment VGM, payment
  schedule, contract annex, commission annex, commission quick payment;
  quick-create Bank, Customer, Seller, Country, Place, Shipment cost category;
  organization item and reset password. Total: 19 dialog components.
- Contract retains the previously completed unified create/view/edit workspace.
- Advanced table filter uses CommonDialog for responsive geometry. Filters
  have reversible state and do not require a form discard confirmation.
- Existing alert confirmations, home video and design-system demos retain
  purpose-specific behavior. Legacy v1 User forms are not active entrypoints.

## Evidence

`harness/checks/dialog-browser.mjs` uses synthetic fixtures only. Its screenshots,
geometry JSON and checks.log are under `harness/runs/20260906-dialog-audit/`.
Representative browser coverage: mobile Country quick create inside Contract,
Shipment creation and tab validation, mobile User creation, desktop User edit,
load retry, clean initialization, pending deduplication/dismissal and failed save.
Other migrated forms were reviewed through their controller wiring and the full
static/unit/build gate; their individual backend round trips were not exercised.

## Discovered

User bank persistence spans multiple API operations. Existing create/edit hooks
can close after partial bank failures, hiding their partial-success message.
A separate persistence task should reconcile successful rows before offering
retry (blindly retrying the full batch risks duplicate new accounts). This audit
preserves that API workflow and adds a pending guard for the whole promise.

Full gate passed: `harness/runs/20260906-220221-601009/` (120 unit tests,
lint, typecheck, structure, harness, build, shared gzip 168.7 kB).
All 14 browser assertions passed in the final run.
