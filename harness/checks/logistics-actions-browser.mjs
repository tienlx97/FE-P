// Run manually against local `pnpm dev`: node harness/checks/dialog-browser.mjs.
// API calls are all mocked; this suite never writes a real business record.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const session = 'logistics-actions';
const origin = process.env.DIALOG_TEST_ORIGIN || 'http://localhost:3000';
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
  throw Error('Local server only');
const run = 'harness/runs/20260906-logistics-actions';
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
  browser('wait', '--fn', `Boolean(${code})`);
}
function check(code, label) {
  evaluate(`if (!(${code})) throw Error(${JSON.stringify(label)}); true`);
  log.push(`PASS ${label}`);
  console.log(log.at(-1));
  writeFileSync(`${run}/checks.log`, log.join('\n') + '\n');
}
function button(label) {
  wait(
    '[...document.querySelectorAll("dialog[open]")].every(d=>getComputedStyle(d).opacity==="1")',
  );
  evaluate(
    `document.querySelectorAll('[data-audit-click]').forEach(e=>e.removeAttribute('data-audit-click')); const buttons=[...document.querySelectorAll('button')].filter(b=>b.checkVisibility() && (b.textContent.trim()===${JSON.stringify(label)} || b.getAttribute('aria-label')===${JSON.stringify(label)})); if(!buttons.length)throw Error('Missing button: '+${JSON.stringify(label)});buttons.at(-1).setAttribute('data-audit-click','true');`,
  );
  browser('click', '[data-audit-click]');
}
function field(label, value) {
  evaluate(
    `document.querySelectorAll('[data-audit-field]').forEach(e=>e.removeAttribute('data-audit-field'));const controls=[...document.querySelectorAll('dialog[open] input,dialog[open] textarea')];const input=controls.find(e=>e.checkVisibility() && ([...(e.labels||[])].map(l=>l.textContent).join(" ")+" "+(e.getAttribute("aria-labelledby")||"").split(" ").map(id=>document.getElementById(id)?.textContent||"").join(" ")).includes(${JSON.stringify(label)}));if(!input)throw Error('Missing field: '+${JSON.stringify(label)});input.setAttribute('data-audit-field','true');`,
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
    `(()=>{const d=[...document.querySelectorAll('dialog[open]')].at(-1);const r=d.getBoundingClientRect();const b=[...d.querySelectorAll('button')].at(-1)?.getBoundingClientRect();if(r.left<0||r.right>innerWidth+1||r.bottom>innerHeight+1||!b||b.bottom>innerHeight+1)throw Error('Geometry '+JSON.stringify({r,b}));if(!getComputedStyle([...d.querySelectorAll('button')].at(-1)).getPropertyValue('--color-accent').trim())throw Error('Missing portal theme');if(document.querySelector('form form'))throw Error('Nested native forms');return {viewport:[innerWidth,innerHeight],dialog:r.toJSON(),submit:b.toJSON()};})()`,
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

const commission = {
  id: 'commission-1',
  contractId: contract.id,
  year: 2026,
  number: 1,
  code: 'COM-TEST-001',
  signedDate: '2026-09-01',
  partyCustomerId: customer.id,
  value: 100,
  sellerSigned: false,
  partySigned: false,
  paymentTerms: [
    {
      id: 'term-1',
      paymentRatioPercent: 100,
      paymentCondition: 'Sau giao hàng',
    },
  ],
  paymentHistory: [],
};
const page = (record) => ({
  items: [record],
  totalCount: 1,
  totalPages: 1,
  page: 1,
  pageSize: 25,
});
function menu(label) {
  button('Chức năng');
  wait('document.querySelectorAll("[role=menuitem]").length===2');
  check(
    '[...document.querySelectorAll("[role=menuitem]")].map(e=>e.textContent).join(",")==="Xem,Sửa"',
    'Menu contains exactly Xem and Sửa',
  );
  evaluate(
    `document.querySelectorAll('[data-menu-click]').forEach(e=>e.removeAttribute('data-menu-click'));[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent===${JSON.stringify(label)}).setAttribute('data-menu-click','true')`,
  );
  browser('click', '[data-menu-click]');
}
function closed() {
  wait('document.querySelectorAll("dialog[open]").length===0');
}
function instrument() {
  evaluate(
    `window.auditWrites=[];window.auditShipment=${JSON.stringify(shipment)};window.auditCommission=${JSON.stringify(commission)};const originalFetch=window.fetch;window.fetch=async(url,options)=>{const path=String(url);if(path.endsWith('/shipments/search'))return Response.json({items:[window.auditShipment],totalCount:1,totalPages:1});if(path.endsWith('/commissions/search'))return Response.json({items:[window.auditCommission],totalCount:1,totalPages:1});if(options?.method && options.method!=='GET' && !path.endsWith('/search')){const body=JSON.parse(options.body||'{}');window.auditWrites.push({url:path,method:options.method,body});if(options.method==='PUT'){if(path.includes('/shipments/')){window.auditShipment={...window.auditShipment,bookingNumber:body.BookingNumber};return Response.json(window.auditShipment);}window.auditCommission={...window.auditCommission,paymentHistory:body.PaymentHistory.map((p,i)=>({id:'payment-'+i,paymentDate:p.PaymentDate,amount:p.Amount,note:p.Note}))};return Response.json(window.auditCommission);}}return originalFetch(url,options);};`,
  );
}
function pinned(label) {
  check(
    'document.querySelector("thead tr")?.lastElementChild?.textContent==="Chức năng" && getComputedStyle(document.querySelector("tbody tr").lastElementChild).position==="sticky"',
    label + ' actions are final and sticky',
  );
  check(
    '(()=>{const cell=document.querySelector("tbody tr").lastElementChild;let scroller=cell.parentElement;while(scroller&&scroller.scrollWidth<=scroller.clientWidth+1)scroller=scroller.parentElement;const before=cell.getBoundingClientRect().right;if(scroller)scroller.scrollLeft=scroller.scrollWidth;return Math.abs(cell.getBoundingClientRect().right-before)<2 && before<=innerWidth+1;})()',
    label + ' actions remain visible during horizontal scroll',
  );
  browser(
    'screenshot',
    `${run}/${label.replaceAll(' ', '-').toLowerCase()}-table.png`,
  );

  check(
    '![...document.querySelectorAll("button")].some(b=>b.getAttribute("aria-label")==="Expand row")',
    label + ' has no expandable rows',
  );
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
route('contracts/search', page(contract));
route('contracts?*', page(contract));
route('shipments/search', page(shipment));
route('commissions/search', page(commission));
route('commissions?*', page(commission));
route(`contracts/${contract.id}/shipments`, [shipment]);
route(`contracts/${contract.id}/commission`, commission);
route('customers', [customer]);
route('countries', [{ id: 'country-1', name: 'Việt Nam' }]);
browser('network', 'route', '**/api/backend/**', '--body', '[]');

navigate('/logistics/shipments');
wait(
  'document.querySelector("tbody")?.textContent.includes("' +
    shipment.shipmentCode +
    '")',
);
instrument();
pinned('Shipment');
menu('Xem');
opened('Shipment · ' + shipment.shipmentCode);
check(
  '!document.querySelector("dialog[open] input") && !document.querySelector("dialog[open] button[type=submit]")',
  'Shipment view exposes no editable parent fields',
);
geometry('shipment-view-desktop');
browser('focus', '[role=tab][data-tab-value=vgm]');
browser('press', 'Enter');
wait(
  'document.querySelector("dialog[open]")?.textContent.includes("Thêm VGM")',
);
button('Thêm VGM');
wait('document.querySelectorAll("dialog[open]").length===2');
button('Hủy');
wait('document.querySelectorAll("dialog[open]").length===1');
button('Sửa');
wait('document.querySelector("dialog[open] button[type=submit]")');
check(
  'window.auditWrites.length===0',
  'Shipment view-to-edit performs zero writes',
);
browser('focus', '[role=tab][data-tab-value=info]');
browser('press', 'Enter');
field('Số booking', 'BOOK-EDIT');
button('Hủy');
opened('Bỏ thay đổi chưa lưu?');
button('Bỏ thay đổi');
closed();
menu('Sửa');
opened('Sửa Shipment ' + shipment.shipmentCode);
field('Số booking', 'BOOK-SAVED');
browser('click', 'dialog[open] button[type=submit]');
closed();
check(
  'window.auditWrites.length===1 && window.auditWrites[0].method==="PUT"',
  'Shipment direct edit saves exactly once',
);
browser('set', 'viewport', '390', '844');
pinned('Shipment mobile');
menu('Xem');
opened('Shipment · ' + shipment.shipmentCode);
geometry('shipment-view-mobile');
button('Đóng');
closed();

browser('set', 'viewport', '1440', '900');
navigate('/logistics/commission');
wait('location.pathname==="/logistics/commissions"');
wait('document.querySelector("tbody")?.textContent.includes("COM-TEST-001")');
instrument();
pinned('Commission');
menu('Xem');
opened('Commission · ' + commission.code);
geometry('commission-view-desktop');
check(
  '!document.querySelector("dialog[open] input") && !document.querySelector("dialog[open] button[type=submit]")',
  'Commission view exposes no editable parent fields',
);
button('Thêm phụ lục');
wait('document.querySelectorAll("dialog[open]").length===2');
button('Hủy');
wait('document.querySelectorAll("dialog[open]").length===1');
button('Thêm nhanh');
opened('Thêm lần thanh toán');
field('Giá trị', '25');
button('Thêm thanh toán');
wait('document.querySelectorAll("dialog[open]").length===1');
check('window.auditWrites.length===1', 'Quick payment saves only child');
button('Sửa');
wait('document.querySelector("dialog[open] button[type=submit]")');
check(
  'window.auditWrites.length===1',
  'Commission view-to-edit performs no additional writes',
);
button('Hủy');
closed();
menu('Sửa');
wait('document.querySelector("dialog[open] button[type=submit]")');
browser('click', 'dialog[open] button[type=submit]');
closed();
check(
  'window.auditWrites.length===2 && window.auditWrites[1].body.PaymentHistory.length===1 && window.auditWrites[1].body.PaymentHistory[0].Amount===25',
  'Commission edit retains newly added payment and saves once',
);
browser('set', 'viewport', '390', '844');
pinned('Commission mobile');
menu('Xem');
opened('Commission · ' + commission.code);
geometry('commission-view-mobile');
button('Đóng');
closed();

browser('set', 'viewport', '1440', '900');
navigate('/logistics/contracts');
wait('document.querySelector("tbody")?.textContent.includes("HD-UI-001")');
instrument();
pinned('Contract');
menu('Xem');
opened('Hợp đồng · ' + contract.contractNumber);
button('Đóng');
closed();
menu('Sửa');
wait('document.querySelector("dialog[open] input")');
check(
  'window.auditWrites.length===0',
  'Contract menu edit opens fields without writes',
);
button('Hủy');
wait('!document.querySelector("dialog[open] input")');
button('Đóng');
closed();
button('Tuỳ chọn hiển thị');
check(
  '[...document.querySelectorAll("button")].find(b=>b.getAttribute("aria-label")==="Bỏ hiển thị Chức năng").getAttribute("aria-disabled")==="true" && [...document.querySelectorAll("button")].find(b=>b.getAttribute("aria-label")==="Kéo để sắp xếp lại Chức năng").getAttribute("aria-disabled")==="true"',
  'Action column cannot be hidden or dragged',
);
button('Chọn tất cả');
button('Ghim cột');
evaluate(
  'document.querySelectorAll("input[type=radio][value=none]").forEach(e=>e.click()); true',
);
button('Close popover');
pinned('Contract all columns with optional pins off');
console.log('Logistics actions regression complete');
writeFileSync(`${run}/checks.log`, log.join('\n') + '\n');
