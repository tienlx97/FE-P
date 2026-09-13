# Tasks

## 1. Export dropdown

- [x] 1.1 `AdvanceTable`: replace the CSV icon button with a "Xuất" `DropdownMenu` (Excel/CSV/In for the current page) — verify: lint/typecheck/build green, browser-checked (countries list: menu renders, Excel download is a valid .xlsx)
- [x] 1.2 Add `fetchAllRows` prop + "Toàn bộ dữ liệu (đã lọc)" section, reusing the same filter pipeline as the current page — verify: browser-checked (contracts: section appears, Excel download valid, no console errors)
- [x] 1.3 Wire `fetchAllRows` into the 6 server-paginated lists (contracts, shipments, commissions, contract-private-infos, customers, users)

## 2. Layout settings

- [x] 2.1 `use-layout-preferences.js` — persisted, cross-component store (hideSideNav, focusMode) — verify: survives reload
- [x] 2.2 `LayoutSettingsMenu` popover in the header — verify: browser-checked, both switches work
- [x] 2.3 `ProtectedAppShell` applies both preferences (hide aside; focus mode hides header too, with Esc + floating exit button) — verify: browser-checked, exit button restores header

## 3. Housekeeping

- [x] 3.1 `.pnpm-store/` added to `.gitignore`
- [x] 3.2 `./harness/verify.sh` full green

## 4. Follow-ups (from user review)

- [x] 4.1 Fix duplicate "Tổng cộng": `TableStickyTotalsBar` no longer renders when the real totals row is already fully on screen (short lists showed both at once) — verify: `harness/checks/table-export-and-layout-browser.mjs`
- [x] 4.2 Mobile hamburger nav toggle only renders when there's an actual side nav to open (`Header` takes a `hasSideNav` prop) — verify: same script
- [x] 4.3 "Xuất toàn bộ dữ liệu" always exports every column, ignoring the View-options hidden-columns setting (current-page export still respects it) — verify: same script (magic-byte check on both current-page and toàn-bộ exports)
- [x] 4.4 Customer detail panel's "In" button (previously permanently disabled) now opens a print-ready window for that one customer's profile
- [x] 4.5 New automated browser check `harness/checks/table-export-and-layout-browser.mjs` covering all of the above; `tanstack-contracts-browser.mjs` updated for the new "Xuất" dropdown (its CSV button no longer exists as a bare icon button)
