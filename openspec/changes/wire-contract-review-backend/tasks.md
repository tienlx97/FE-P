# Tasks

- [x] 1.1 Contract form: send parties + PaymentType (fix data loss),
      Consignee / Notify cards with kinds, T/T | L/C per term, overview
      displayName, company-scoped number check, contract-scoped commission
      code check. `./harness/verify.sh` PASSED:
      `harness/runs/20260930-221756-945/`.
- [ ] 1.2 Contract goods lines: form table, detail shipped / remaining.
      Code + tests committed; `./harness/verify.sh` PASSED:
      `harness/runs/20261001-082939-947/`. Browser QA pending — the Chrome
      tab was hidden (`visibilityState: hidden`), so login typing and
      screenshots failed.
- [ ] 1.3 Shipment form: goods lines and Consignee / Notify override.
