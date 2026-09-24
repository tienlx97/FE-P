# Tasks: Shipment journey tracking

- [x] 1. Connect the shipment detail journey to the backend response, add milestone and empty-return actions, update the business documentation, and verify the page and full gate.

Evidence: `harness/runs/20260924-103650-1568/` (full gate passed). Desktop and mobile preview screenshots: `harness/runs/20260924-103114-380/shipment-journey-preview-desktop.png` and `shipment-journey-preview-mobile.png`. The temporary preview route was removed. The protected live page redirected the isolated browser session to `/login`, so a backend save was not exercised in the browser.
