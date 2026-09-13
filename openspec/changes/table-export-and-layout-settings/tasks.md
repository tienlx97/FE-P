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
