# Tasks: Apply Maritime components to Contract detail page

Workflow per step: implement -> lint + typecheck -> browser check -> user approves -> next.

- [x] 1 Theme swap (IbmPlexCorporate -> `MaritimeThemeProvider`) + header
      card -> `MaritimeContractOverviewCard` (real contract data; added
      `meta` slot for signing/completion dates; edit mode keeps its own
      Hủy/Lưu bar). Approved by user.
- [x] 2 `MaritimeTabNav` replaces the page `TabList` (6 real tabs + icons,
      `?tab=` sync unchanged; no count chips yet). Approved by user.
- [x] 3 `MaritimePaymentSummaryCard` on "Tổng quan" (real data in
      `contract-overview-panel.jsx`: 5 stat cards, paid/current/remaining bar,
      installment carousel; old 4 KPI cards removed). Approved by user (with
      follow-ups: payment rule, tooltip, fonts, USD unit).
- [x] 4 `MaritimeContractFoundationGrid` on "Tổng quan": now props-driven
      (defaults = demo data for the preview); real parties/consignee/notify,
      transport + signing status, cargo metrics, bank, payment terms, annexes.
      Commission card is hidden here (`commission={null}`) — wired in step 8.
      Approved by user (with many follow-ups: Commission/cargo/consignee
      cards, bank layout, fonts, sizes).
- [x] 5 `MaritimePaymentProgressPanel` on "Thanh toán" via new
      `contract-payments-panel.jsx` (real schedules/annexes, create/edit via
      `PaymentScheduleFormDialog`). Also: `MaritimeTabNav` now sticks under the
      app's 64px top bar (`stickyOffset`). Approved by user.
- [x] 6 `MaritimeShipmentListPanel` (+ table view) as a NEW "Lô hàng" tab
      (`?tab=shipments`) via `contract-shipments-panel.jsx`. Approved by user.
- [x] 7 `MaritimeAnnexListPanel` on "Phụ lục" via new
      `contract-maritime-annexes-panel.jsx` (real annexes, create/edit via
      `ContractAnnexFormDialog`); font sizes tuned across the Maritime panels.
      Approved by user.
- [x] 8 `MaritimeCommissionPanel` as a NEW "Hoa hồng" tab (`?tab=commission`) via
      `contract-commission-panel.jsx`. Approved when the user moved work to
      step 9.
- [x] 9 Cleanup: removed the obsolete overview KPI CSS selectors and the
      Astryx-header-only contract badge helpers; `./harness/verify.sh` passed
      (`harness/runs/20260919-122709-870/`).
