import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Covers the follow-up work on top of the TanStack table rollout: the
// "Xuất" export dropdown (Excel/CSV/In, current page + "toàn bộ dữ liệu"),
// the header's "Cài đặt giao diện" popover (hide side nav / focus mode,
// persisted), the mobile nav toggle only rendering when there's a side nav
// to open, and the sticky totals bar no longer duplicating a real totals
// row that's already fully on screen.
const origin = process.env.TABLE_TEST_ORIGIN || 'http://localhost:3001';
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) throw Error('Local server only');
const run = `harness/runs/${new Date().toISOString().replace(/[:.]/g, '-')}-table-export-layout`;
mkdirSync(run, { recursive: true });
const exe = process.platform === 'win32' ? join(process.env.APPDATA, 'npm/node_modules/agent-browser/bin/agent-browser-win32-x64.exe') : 'agent-browser';
const session = 'table-export-layout';
const b = (...args) => execFileSync(exe, ['--session', session, ...args], { encoding: 'utf8', timeout: 45000 }).trim();
const evaluate = (code) => JSON.parse(b('eval', '-b', Buffer.from(code).toString('base64')));
const { contract, customer } = JSON.parse(readFileSync('harness/fixtures/dialogs.json', 'utf8'));
const route = (path, data) => b('network', 'route', '**/api/backend/api/v1/' + path, '--body', JSON.stringify(data));
// Routes are matched in registration order (first match wins) — changing
// a fixture mid-run means clearing every route and re-registering all of
// them (specific ones before the broad catch-all), not just re-adding the
// one that changed, or the catch-all (registered earlier) would still
// intercept it first and every list would render empty.
const setupRoutes = (contractsFixture) => {
  b('network', 'unroute');
  route('contracts/search', contractsFixture);
  route('customers', [customer]);
  b('network', 'route', '**/api/backend/**', '--body', '[]');
};

/** @param {number} count */
function contractsPage(count) {
  const items = Array.from({ length: count }, (_, i) => ({ ...contract, status: 'InProgress', id: `fixture-${i}`, contractNumber: `TT-${String(i + 1).padStart(3, '0')}` }));
  return { page: { items, totalCount: count, totalPages: 1, page: 1, pageSize: Math.max(count, 25) }, totals: [{ currency: contract.currency, contractValue: 100000 * count, settlementValue: 110000 * count, paidValue: 50000 * count, unpaidValue: 60000 * count }], settlements: items.map((row) => ({ contractId: row.id, settlementValue: 110000, paidValue: 50000, unpaidValue: 60000 })) };
}

execFileSync(exe, ['--session', session, 'open', origin + '/login'], { stdio: 'inherit', timeout: 45000 });
b('cookies', 'set', 'kt-xnk-access-token', 'synthetic-table-test');
b('cookies', 'set', 'kt-xnk-session-permissions', '["users:manage","logistics:contracts:view","logistics:view"]');
// A re-run of this same script reuses the browser's localStorage (this is
// a real persisted preference, by design) — start from a known state.
evaluate(`(() => { localStorage.removeItem('kt-xnk.layout-preferences'); return true; })()`);
setupRoutes(contractsPage(2));
const checks = [];

// 1. Short list (fits on screen, no scroll needed): the real totals row
// and the fixed sticky bar must NOT both be visible at once.
b('set', 'viewport', '1440', '900');
b('open', origin + '/logistics/contracts');
b('wait', '--text', 'TT-001');
b('wait', '--text', 'Tổng cộng');
checks.push(evaluate(`(() => {
  const bar = document.querySelector('[data-testid="sticky-totals-bar"]');
  if (bar) throw Error('Sticky totals bar duplicated a totals row already fully on screen');
  const totalsCount = [...document.querySelectorAll('td')].filter(td => td.textContent.trim() === 'Tổng cộng').length;
  if (totalsCount !== 1) throw Error('Expected exactly one "Tổng cộng" label, found ' + totalsCount);
  return { totalsCount };
})()`));
b('screenshot', `${run}/no-duplicate-totals-short-list.png`);

// 2. Long list (taller than viewport): the sticky bar SHOULD appear while
// the real totals row is scrolled out of view, then disappear again once
// the user scrolls all the way down to it. A fresh navigation (not just a
// refetch) so the new fixture size is guaranteed to be what's on screen.
setupRoutes(contractsPage(20));
b('open', origin + '/logistics/contracts');
b('wait', '--text', 'TT-020');
evaluate(`(() => { document.querySelector('[data-table-engine="tanstack"]').parentElement.scrollTop = 0; return true; })()`);
checks.push(evaluate(`(() => {
  const bar = document.querySelector('[data-testid="sticky-totals-bar"]');
  if (!bar) throw Error('Sticky totals bar should pin while the real totals row is off-screen');
  return { pinnedWhileScrolledUp: true };
})()`));
evaluate(`(() => { const s = document.querySelector('[data-table-engine="tanstack"]').parentElement; s.scrollTop = s.scrollHeight; return true; })()`);
b('wait', '--fn', `!document.querySelector('[data-testid="sticky-totals-bar"]')`);
checks.push({ unpinnedAtBottom: true });
b('screenshot', `${run}/pinned-then-unpinned.png`);
evaluate(`(() => { document.querySelector('[data-table-engine="tanstack"]').parentElement.scrollTop = 0; return true; })()`);
setupRoutes(contractsPage(2));
b('open', origin + '/logistics/contracts');
b('wait', '--fn', `document.querySelector('[data-table-engine="tanstack"]').tBodies[0].rows.length === 3`);

// 3. Export dropdown: current-page Excel/CSV, and "toàn bộ dữ liệu"
// (contracts wires fetchAllRows). Intercepts URL.createObjectURL so both
// the CSV text and the Excel blob's bytes can be inspected without a real
// filesystem download.
evaluate(`(() => {
  window.__blobs = [];
  const original = URL.createObjectURL;
  URL.createObjectURL = (blob) => {
    blob.arrayBuffer().then((buf) => window.__blobs.push({ type: blob.type, bytes: [...new Uint8Array(buf.slice(0, 4))] }));
    return original(blob);
  };
  return true;
})()`);
b('find', 'role', 'button', 'click', '--name', 'Xuất', '--exact');
b('wait', '--text', 'Toàn bộ dữ liệu (đã lọc)');
b('screenshot', `${run}/export-dropdown.png`);
b('find', 'role', 'menuitem', 'click', '--name', 'Xuất Excel (trang hiện tại)');
b('wait', '--fn', 'window.__blobs.length === 1');
b('find', 'role', 'button', 'click', '--name', 'Xuất', '--exact');
b('find', 'role', 'menuitem', 'click', '--name', 'Xuất Excel (toàn bộ dữ liệu)');
b('wait', '--fn', 'window.__blobs.length === 2');
checks.push(evaluate(`(() => {
  const isZipMagic = (bytes) => bytes[0] === 0x50 && bytes[1] === 0x4b; // 'PK'
  if (!window.__blobs.every((b) => isZipMagic(b.bytes))) throw Error('Excel export is not a real .xlsx (missing PK zip signature)');
  return { excelExports: window.__blobs.length };
})()`));

// 4. Settings popover: hide side nav (persists across reload), focus mode
// (hides header too, always recoverable via the floating exit button).
b('find', 'role', 'button', 'click', '--name', 'Cài đặt giao diện');
b('wait', '--text', 'Chế độ tập trung');
b('screenshot', `${run}/settings-popover.png`);
b('find', 'role', 'switch', 'click', '--name', 'Ẩn thanh điều hướng');
b('wait', '--fn', `!document.querySelector('aside[aria-label="Điều hướng tài liệu trên máy tính"]')`);
b('open', origin + '/logistics/contracts');
b('wait', '--text', 'TT-001');
checks.push(evaluate(`(() => {
  if (document.querySelector('aside[aria-label="Điều hướng tài liệu trên máy tính"]')) throw Error('hideSideNav did not persist across reload');
  return { hideSideNavPersisted: true };
})()`));
b('find', 'role', 'button', 'click', '--name', 'Cài đặt giao diện');
b('wait', '--text', 'Chế độ tập trung');
b('find', 'role', 'switch', 'click', '--name', 'Chế độ tập trung');
b('wait', '--fn', `!document.querySelector('nav[aria-label="Điều hướng chính"]')`);
b('screenshot', `${run}/focus-mode.png`);
b('find', 'role', 'button', 'click', '--name', 'Thoát chế độ tập trung');
b('wait', '--fn', `!!document.querySelector('nav[aria-label="Điều hướng chính"]')`);
checks.push({ focusModeExitWorks: true });
// Reset both toggles so this check leaves no lingering preference behind.
b('find', 'role', 'button', 'click', '--name', 'Cài đặt giao diện');
b('wait', '--text', 'Chế độ tập trung');
b('find', 'role', 'switch', 'click', '--name', 'Ẩn thanh điều hướng');
b('press', 'Escape');

// 5. Mobile nav toggle only renders when there's actually a side nav to
// open (was previously always rendered, even with nothing to toggle).
b('set', 'viewport', '390', '844');
b('wait', '--fn', `!!document.querySelector('button[aria-controls="mobile-docs-navigation"]')`);
checks.push({ mobileToggleVisibleWithSideNav: true });
b('find', 'role', 'button', 'click', '--name', 'Cài đặt giao diện');
b('wait', '--text', 'Chế độ tập trung');
b('find', 'role', 'switch', 'click', '--name', 'Ẩn thanh điều hướng');
b('wait', '--fn', `!document.querySelector('button[aria-controls="mobile-docs-navigation"]')`);
checks.push({ mobileToggleHiddenWithoutSideNav: true });
// The popover stays open after toggling a switch inside it — close it
// before reopening, or this next click would just close it instead.
b('press', 'Escape');
b('find', 'role', 'button', 'click', '--name', 'Cài đặt giao diện');
b('wait', '--text', 'Chế độ tập trung');
b('find', 'role', 'switch', 'click', '--name', 'Ẩn thanh điều hướng');
b('press', 'Escape');
b('set', 'viewport', '1440', '900');

console.log(JSON.stringify({ run }));
writeFileSync(`${run}/checks.json`, JSON.stringify(checks, null, 2));
