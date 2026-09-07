// Local UI evidence: HOME_TEST_ORIGIN=http://localhost:3001 node harness/checks/home-portal-browser.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const origin = process.env.HOME_TEST_ORIGIN || 'http://localhost:3001';
assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/);
const executable = process.platform === 'win32'
  ? join(process.env.APPDATA, 'npm/node_modules/agent-browser/bin/agent-browser-win32-x64.exe')
  : 'agent-browser';
const run = 'harness/runs/20260907-home-portal';
mkdirSync(run, { recursive: true });
function browser(...args) {
  return execFileSync(executable, ['--session', 'home-portal-check', ...args], {
    encoding: 'utf8', timeout: 45000,
  }).trim();
}
function evaluate(code) {
  return JSON.parse(browser('eval', '-b', Buffer.from(code).toString('base64')));
}
const results = [];
// The Windows daemon can inherit captured pipes on first launch. Bootstrap
// with inherited stdio so a successful navigation cannot hold execFileSync open.
execFileSync(executable, ['--session', 'home-portal-check', 'open', origin + '/login'], {
  stdio: 'inherit', timeout: 45000,
});
browser('cookies', 'set', 'kt-xnk-access-token', 'synthetic-home-test');
browser('network', 'route', '**/api/backend/**', '--body', '{}');
browser('open', origin);
browser('wait', '--text', 'Thông báo nội bộ');
for (const width of [1440, 768, 390, 320]) {
  browser('set', 'viewport', String(width), '900');
  const geometry = evaluate(`(() => {
    const rect = selector => {
      const r = document.querySelector(selector).getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, bottom: r.bottom };
    };
    const notices = document.querySelector('[data-testid="home-notices"]');
    return {
      viewport: innerWidth, pageWidth: document.documentElement.scrollWidth,
      notices: rect('#thong-bao'), hero: rect('.swiper'), holiday: rect('#lich-nghi'),
      noticeCount: notices.querySelectorAll('li').length,
      noticeLabel: document.getElementById(notices.getAttribute('aria-labelledby'))?.textContent,
      titlesFit: [...notices.querySelectorAll('a')].every(e => e.scrollWidth <= e.clientWidth + 1),
      holidayBackground: getComputedStyle(document.querySelector('[aria-labelledby="lich-nghi"]')).backgroundColor,
    };
  })()`);
  assert.ok(geometry.pageWidth <= width + 1, `Overflow at ${width}`);
  assert.equal(geometry.noticeCount, 5);
  assert.equal(geometry.noticeLabel, 'Thông báo nội bộ');
  assert.ok(geometry.titlesFit);
  if (width >= 1100) {
    assert.ok(geometry.notices.x > geometry.hero.x + geometry.hero.width);
    assert.ok(Math.abs(geometry.notices.y - geometry.hero.y) < 20);
  } else {
    assert.ok(geometry.notices.y >= geometry.hero.bottom);
  }
  assert.notEqual(geometry.holidayBackground, 'rgba(0, 0, 0, 0)');
  browser('eval', 'scrollTo(0,0)');
  browser('screenshot', `${run}/${width}-top.png`);
  browser('scrollintoview', '#lich-nghi');
  browser('screenshot', `${run}/${width}-calendar.png`);
  results.push({ scenario: `layout-${width}`, ...geometry });
}
const current = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
const [year, month] = current.split('-').map(Number);
const agendaText = () => evaluate(`document.querySelector('[data-testid="home-agenda"]').textContent`);
assert.ok(agendaText().includes(`Trong tháng ${month}/${year}`));
// Navigate to a known fixture month, then exercise empty and cross-year months.
let offset = (2026 - year) * 12 + 9 - month;
assert.ok(Math.abs(offset) < 120, 'Refresh the dated UI fixture');
while (offset !== 0) {
  browser('find', 'role', 'button', 'click', '--name', offset > 0 ? 'Tháng sau' : 'Tháng trước');
  offset += offset > 0 ? -1 : 1;
}
assert.ok(agendaText().includes('Tổng kết hoạt động quý 3'));
assert.ok(agendaText().includes('Nghỉ lễ Quốc khánh'));
browser('find', 'role', 'button', 'click', '--name', 'Tháng trước');
assert.ok(agendaText().includes('Họp giao ban đầu tháng'));
assert.ok(!agendaText().includes('Tổng kết hoạt động quý 3'));
for (let i = 0; i < 5; i++) browser('find', 'role', 'button', 'click', '--name', 'Tháng sau');
assert.ok(agendaText().includes('Trong tháng 1/2027'));
assert.ok(agendaText().includes('Chưa có lịch được đăng'));
browser('focus', '[aria-label="Tháng trước"]');
browser('press', 'Enter');
assert.ok(agendaText().includes('Trong tháng 12/2026'));
results.push({ scenario: 'month-navigation-empty-year-boundary-keyboard', passed: true });
browser('find', 'role', 'link', 'click', '--name', 'Quy định nghỉ phép →');
browser('wait', '--url', '**/docs/nghi-phep');
results.push({ scenario: 'holiday-policy-link', passed: true });
writeFileSync(`${run}/results.json`, JSON.stringify(results, null, 2));
browser('close');
console.log(`${results.length} home portal scenarios passed; evidence: ${run}`);
