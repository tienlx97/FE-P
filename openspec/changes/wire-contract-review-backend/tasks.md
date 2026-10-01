# Tasks

- [x] 1.1 Contract form: send parties + PaymentType (fix data loss),
      Consignee / Notify cards with kinds, T/T | L/C per term, overview
      displayName, company-scoped number check, contract-scoped commission
      code check. `./harness/verify.sh` PASSED:
      `harness/runs/20260930-221756-945/`.
- [x] 1.2 Contract goods lines: form table, detail shipped / remaining.
      `./harness/verify.sh` PASSED: `harness/runs/20261001-082939-947/`.
      Browser QA on `[DRAFT] 11.09.26` (hidden tab: values set through the
      inputs' native setter + input events): added 10 t × 1,000 → amount and
      "thấp hơn giá trị hợp đồng" shown, saved (PUT 200), overview listed
      the line with Đã xuất 0 / Còn lại 10; removed it again → lines [].
- [ ] 1.3 Shipment form: goods lines and Consignee / Notify override.
