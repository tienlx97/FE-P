// Run manually against local `pnpm dev`: node harness/checks/dialog-browser.mjs.
// API calls are all mocked; this suite never writes a real business record.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const session = 'dialog-audit';
const origin = process.env.DIALOG_TEST_ORIGIN || 'http://localhost:3000';
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
  throw Error('Local server only');
const run = 'harness/runs/20260906-dialog-audit';
mkdirSync(run, { recursive: true });
const { contract, shipment, user, customer } = JSON.parse(
  readFileSync('harness/fixtures/dialogs.json', 'utf8'),
);
const log = [];
function browser(...args) {
  const output = execFileSync(
    'agent-browser',
    ['--session', session, ...args],
    { encoding: 'utf8', timeout: 35000 },
  );
  if (output.includes('✗')) throw Error(output);
  return output.trim();
}
function evaluate(code) {
  return browser('eval', `{ ${code} }`);
}
function wait(code) {
  browser('wait', '--fn', code);
}
function check(code, label) {
  evaluate(`if (!(${code})) throw Error(${JSON.stringify(label)}); true`);
  log.push(`PASS ${label}`);
  console.log(log.at(-1));
  writeFileSync(`${run}/checks.log`, log.join('\n') + '\n');
}
function button(label) {
  evaluate(
    `document.querySelectorAll('[data-audit-click]').forEach(e=>e.removeAttribute('data-audit-click')); const buttons=[...document.querySelectorAll('button')].filter(b=>b.checkVisibility() && (b.textContent.trim()===${JSON.stringify(label)} || b.getAttribute('aria-label')===${JSON.stringify(label)})); if(!buttons.length)throw Error('Missing button: '+${JSON.stringify(label)});buttons.at(-1).setAttribute('data-audit-click','true');`,
  );
  browser('click', '[data-audit-click]');
}
function field(label, value) {
  evaluate(
    `document.querySelectorAll('[data-audit-field]').forEach(e=>e.removeAttribute('data-audit-field'));const controls=[...document.querySelectorAll('dialog[open] input,dialog[open] textarea')];const input=controls.find(e=>e.checkVisibility() && [...(e.labels||[])].some(l=>l.textContent.includes(${JSON.stringify(label)})));if(!input)throw Error('Missing field: '+${JSON.stringify(label)});input.setAttribute('data-audit-field','true');`,
  );
  browser('fill', '[data-audit-field]', value);
}
function opened(title) {
  wait(
    `[...document.querySelectorAll('dialog[open]')].some(d=>d.querySelector('h2')?.textContent===${JSON.stringify(title)})`,
  );
  wait(
    `[...document.querySelectorAll('dialog[open]')].every(d=>getComputedStyle(d).opacity==='1')`,
  );
}
function geometry(name) {
  const result = evaluate(
    `(()=>{const d=[...document.querySelectorAll('dialog[open]')].at(-1);const r=d.getBoundingClientRect();const b=d.querySelector('button[type=submit]')?.getBoundingClientRect();if(r.left<0||r.right>innerWidth+1||r.bottom>innerHeight+1||!b||b.bottom>innerHeight+1)throw Error('Geometry '+JSON.stringify({r,b}));if(!getComputedStyle(d.querySelector('button[type=submit]')).getPropertyValue('--color-accent').trim())throw Error('Missing portal theme');if(document.querySelector('form form'))throw Error('Nested native forms');return {viewport:[innerWidth,innerHeight],dialog:r.toJSON(),submit:b.toJSON()};})()`,
  );
  writeFileSync(`${run}/${name}.json`, result);
  browser('screenshot', `${run}/${name}.png`);
  log.push(`PASS ${name} geometry and independent forms`);
}
function route(path, data) {
  browser(
    'network',
    'route',
    `**/api/backend/api/v1/${path}`,
    '--body',
    JSON.stringify(data),
  );
}
function navigate(path) {
  browser('open', origin + path);
  wait('document.readyState === "complete"');
}

browser('open', origin + '/login');
browser('set', 'viewport', '1440', '900');
browser('cookies', 'set', 'kt-xnk-access-token', 'synthetic-dialog-test');
browser(
  'cookies',
  'set',
  'kt-xnk-session-permissions',
  '["users:manage","logistics:contracts:view","logistics:view"]',
);
browser('network', 'unroute');
route('contracts/search', {
  items: [contract],
  totalCount: 1,
  totalPages: 1,
  page: 1,
  pageSize: 25,
});
route(`contracts/${contract.id}/shipments`, [shipment]);
route(`contracts/${contract.id}/commission`, null);
route('customers', [customer]);
route('countries', [{ id: 'country-1', name: 'Việt Nam' }]);
route('companies', [{ id: 'company-1', name: 'Công ty kiểm thử' }]);
route('users?*', {
  items: [user],
  totalCount: 1,
  totalPages: 1,
  page: 1,
  pageSize: 25,
});
route('users/user-1', user);
browser('network', 'route', '**/api/backend/**', '--body', '[]');

navigate('/logistics/contracts');
wait('document.querySelector("tbody")?.textContent.includes("HD-UI-001")');
button('Tạo hợp đồng');
opened('Tạo hợp đồng');
field('Tên dự án', 'Bản nháp cha');
button('Thêm nước');
opened('Thêm nước');
browser('set', 'viewport', '390', '844');
geometry('country-mobile');
evaluate(
  `window.auditWrites=[];const savedFetch=window.fetch;window.fetch=async(url,options)=>{if(options?.method==='POST'&&!String(url).endsWith('/search')){window.auditWrites.push(String(url));if(String(url).endsWith('/countries'))return Response.json({id:'country-new',name:'Nước kiểm thử'});}return savedFetch(url,options);};`,
);
field('Tên nước', 'Nước kiểm thử');
browser('press', 'Enter');
wait('document.querySelectorAll("dialog[open]").length===1');
check(
  'window.auditWrites.length===1 && window.auditWrites[0].endsWith("/countries")',
  'Enter in quick-create submits only child',
);
check(
  '[...document.querySelectorAll("input")].some(e=>e.value==="Bản nháp cha")',
  'Parent draft survives child save',
);
button('Hủy');
opened('Bỏ thay đổi chưa lưu?');
button('Bỏ thay đổi');
wait('document.querySelectorAll("dialog[open]").length===0');

button(contract.contractNumber);
opened(`Hợp đồng · ${contract.contractNumber}`);
browser('focus', '[role=tab][data-tab-value=shipment]');
browser('press', 'Enter');
wait(
  'document.querySelector("[role=tab][data-tab-value=shipment]").getAttribute("aria-selected")==="true"',
);
button('Thêm Shipment');
opened('Thêm Shipment');
geometry('shipment-create-mobile');
check(
  'document.querySelector("[role=tab][data-tab-value=vgm]").getAttribute("aria-disabled")==="true"',
  'VGM disabled before saving Shipment',
);
field('Số booking', 'BOOK-DRAFT');
browser('focus', '[role=tab][data-tab-value=costs]');
browser('press', 'Enter');
browser('click', 'dialog[open] button[type=submit]');
wait(
  '[...document.querySelectorAll("[role=tab][data-tab-value=info]")].at(-1).getAttribute("aria-selected")==="true"',
);
check(
  '[...document.querySelectorAll("input")].some(e=>e.value==="BOOK-DRAFT")',
  'Shipment validation reveals Information and retains draft',
);
button('Hủy');
opened('Bỏ thay đổi chưa lưu?');
browser('press', 'Escape');
wait('!document.querySelector("dialog[open][role=alertdialog]")');
check(
  '[...document.querySelectorAll("input")].some(e=>e.value==="BOOK-DRAFT")',
  'Escape on discard confirmation keeps Shipment draft',
);
button('Hủy');
opened('Bỏ thay đổi chưa lưu?');
button('Bỏ thay đổi');
wait('document.querySelectorAll("dialog[open]").length===1');
button('Đóng');
wait('document.querySelectorAll("dialog[open]").length===0');

navigate('/admin/users');
wait('document.querySelector("tbody")?.textContent.includes("NV-TEST")');
button('Thêm');
opened('TẠO NGƯỜI DÙNG');
geometry('user-create-mobile');
field('Tên', 'Bản nháp');
browser('click', 'dialog[open] button[type=submit]');
check(
  '[...document.querySelectorAll("button")].some(b=>b.textContent.includes("Thông tin nhân viên")&&b.getAttribute("aria-expanded")==="true")',
  'User validation expands hidden sections',
);
button('Hủy');
opened('Bỏ thay đổi chưa lưu?');
button('Bỏ thay đổi');
wait('document.querySelectorAll("dialog[open]").length===0');
browser('set', 'viewport', '1440', '900');
evaluate(
  `window.auditFailLoad=true;window.auditWrites=[];const originalFetch=window.fetch;window.fetch=async(url,options)=>{if(String(url).endsWith('/users/user-1')&&(!options?.method||options.method==='GET')&&window.auditFailLoad)return Response.json({message:'Fixture load failure'},{status:500});if(String(url).endsWith('/users/user-1')&&options?.method==='PUT'){window.auditWrites.push(String(url));return new Promise(resolve=>{window.auditReleaseSave=()=>resolve(Response.json({message:'Fixture save failure'},{status:500}));});}return originalFetch(url,options);};`,
);
button('Thao tác');
wait('document.querySelector("[role=menuitem]")?.textContent==="Sửa"');
browser('click', '[role=menuitem]');
opened('CẬP NHẬT NHÂN VIÊN');
wait(
  '[...document.querySelectorAll("button")].some(b=>b.textContent.trim()==="Thử tải lại")',
);
check(
  'document.querySelector("dialog[open] button[type=submit]").disabled',
  'User load failure blocks save and offers retry',
);
evaluate('window.auditFailLoad=false');
button('Thử tải lại');
wait(
  '[...document.querySelectorAll("dialog[open] input")].some(e=>e.value==="An")',
);
geometry('user-edit-desktop');
button('Hủy');
wait('document.querySelectorAll("dialog[open]").length===0');
check(
  'window.auditWrites.length===0',
  'Loaded User defaults are clean and opening edit makes no writes',
);
button('Thao tác');
wait('document.querySelector("[role=menuitem]")?.textContent==="Sửa"');
browser('click', '[role=menuitem]');
opened('CẬP NHẬT NHÂN VIÊN');
wait(
  '[...document.querySelectorAll("dialog[open] input")].some(e=>e.value==="An")',
);
field('Tên', 'Tên đã sửa');
browser('click', 'dialog[open] button[type=submit]');
wait('window.auditWrites.length===1');
evaluate('document.querySelector("dialog[open] form").requestSubmit()');
browser('press', 'Escape');
check(
  'window.auditWrites.length===1 && document.querySelectorAll("dialog[open]").length===1 && [...document.querySelectorAll("dialog[open] button")].find(b=>b.textContent.trim()==="Hủy").disabled',
  'Pending save blocks duplicate submit and dismissal',
);
evaluate('window.auditReleaseSave()');
wait(
  'document.querySelector("dialog[open]")?.textContent.includes("Không thể cập nhật người dùng")',
);
check(
  '[...document.querySelectorAll("dialog[open] input")].some(e=>e.value==="Tên đã sửa")',
  'Failed save retains User draft and displays error',
);
button('Hủy');
opened('Bỏ thay đổi chưa lưu?');
button('Bỏ thay đổi');
wait('document.querySelectorAll("dialog[open]").length===0');
console.log('Core dialog regression complete');
writeFileSync(`${run}/checks.log`, log.join('\n') + '\n');
