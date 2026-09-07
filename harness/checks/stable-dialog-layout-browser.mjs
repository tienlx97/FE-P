// Local-only mocked regression: node harness/checks/stable-dialog-layout-browser.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const session = 'stable-dialog-layout';
const origin = process.env.DIALOG_TEST_ORIGIN || 'http://localhost:3000';
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
  throw Error('Local server only');
const run = `harness/runs/${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-stable-dialog-layout`;
mkdirSync(run, { recursive: true });
const { contract, shipment, customer } = JSON.parse(
  readFileSync('harness/fixtures/dialogs.json', 'utf8'),
);
const commission = {
  id: 'commission-1',
  contractId: contract.id,
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
  paymentHistory: [
    {
      id: 'payment-1',
      paymentDate: '2026-09-01',
      amount: 25,
      note: 'Ghi chú thanh toán dài để kiểm tra chiều cao dòng.',
    },
  ],
};
shipment.costs = [
  {
    id: 'cost-1',
    costCategoryId: 'category-1',
    name: 'Phí vận chuyển',
    amount: 1234,
    note: 'Ghi chú chi phí',
    providerCustomerId: customer.id,
  },
];
function browser(...args) {
  return execFileSync('agent-browser', ['--session', session, ...args], {
    encoding: 'utf8',
    timeout: 35000,
  }).trim();
}
function evaluate(code) {
  return browser('eval', code);
}
function json(code) {
  const value = JSON.parse(evaluate(code));
  return typeof value === 'string' ? JSON.parse(value) : value;
}
function wait(code) {
  browser('wait', '--fn', `Boolean(${code})`);
}
function button(label) {
  wait(
    `[...document.querySelectorAll('button')].some(e=>e.checkVisibility()&&e.textContent.trim()===${JSON.stringify(label)})`,
  );
  evaluate(
    `{document.querySelectorAll('[data-layout-click]').forEach(e=>e.removeAttribute('data-layout-click'));[...document.querySelectorAll('button')].filter(e=>e.checkVisibility()&&e.textContent.trim()===${JSON.stringify(label)}).at(-1).setAttribute('data-layout-click','true')}`,
  );
  browser('click', '[data-layout-click]');
}
function route(path, data) {
  browser('network', 'unroute', '**/api/backend/**');
  browser('network', 'unroute', `**/api/backend/api/v1/${path}`);
  browser(
    'network',
    'route',
    `**/api/backend/api/v1/${path}`,
    '--body',
    JSON.stringify(data),
  );
  browser('network', 'route', '**/api/backend/**', '--body', '[]');
}
const page = (record) => ({
  items: [record],
  totalCount: 1,
  totalPages: 1,
  page: 1,
  pageSize: 25,
});
browser('open', origin + '/login');
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
route(`contracts/${contract.id}/shipments`, [shipment]);
route(`contracts/${contract.id}/commission`, commission);
route('customers', [customer]);
route('sellers', [{ ...customer, id: 'seller-1' }]);
route('countries', [{ id: 'country-1', name: 'Việt Nam' }]);
route('companies', [{ id: 'company-1', name: 'Công ty kiểm thử' }]);
route('contract-banks', [
  { id: 'bank-1', bankName: 'Ngân hàng kiểm thử', bankAccountNumber: '123456' },
]);
route('shipment-cost-categories', [{ id: 'category-1', name: 'Vận chuyển' }]);
browser('network', 'route', '**/api/backend/**', '--body', '[]');
const results = [];
const probe = `(()=>{const d=document.querySelector('dialog[open]');return [...d.querySelectorAll('input:not([type=hidden]),textarea,[role=combobox],th')].filter(e=>e.checkVisibility()).map(e=>({tag:e.tagName,label:e.getAttribute('aria-label')||[...(e.labels||[])].map(l=>l.textContent).join(' ')||e.textContent.trim(),rect:((r)=>[r.x,r.y,r.width,r.height])(e.getBoundingClientRect())}))})()`;
function openView(path) {
  browser('open', origin + '/logistics/' + path);
  wait(
    `document.querySelector('tbody')?.textContent.includes(${JSON.stringify(path === 'contracts' ? contract.contractNumber : path === 'shipments' ? shipment.shipmentCode : commission.code)})`,
  );
  evaluate(
    `{window.layoutWrites=[];const original=window.fetch;window.fetch=(url,options)=>{if(options?.method&&!['GET','HEAD'].includes(options.method)&&!String(url).endsWith('/search')){window.layoutWrites.push({url:String(url),method:options.method});return Promise.resolve(Response.json({}));}return original(url,options)}}`,
  );
  button('Chức năng');
  wait(`document.querySelector('[role=menuitem]')`);
  browser('click', '[role=menuitem]');
  wait(
    `document.querySelector('dialog[open]')&&getComputedStyle(document.querySelector('dialog[open]')).opacity==='1'`,
  );
  // Wait for lookup query initialization before comparing controls.
  wait(
    `![...document.querySelectorAll('dialog[open] [aria-busy=true]')].length`,
  );
}
function compare(name, edit) {
  evaluate(
    `{const d=document.querySelector('dialog[open]');const s=[...d.querySelectorAll('*')].find(e=>e.scrollHeight>e.clientHeight+200&&['auto','scroll'].includes(getComputedStyle(e).overflowY));if(s){s.setAttribute('data-layout-scroll','true');s.scrollTop=200}}`,
  );
  const scrollBefore = json(
    `document.querySelector('[data-layout-scroll]')?.scrollTop||0`,
  );
  const before = JSON.parse(evaluate(probe));
  const footerBefore = json(
    `JSON.stringify([...document.querySelectorAll('dialog[open] button')].slice(-2).map(e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height]}))`,
  );
  const editable = json(
    `JSON.stringify([...document.querySelectorAll('dialog[open] input:not([type=hidden]),dialog[open] textarea')].filter(e=>e.checkVisibility()&&!e.readOnly&&!e.disabled&&!e.closest('[aria-disabled=true]')).map(e=>e.outerHTML))`,
  );
  if (editable.length)
    throw Error(name + ' editable view fields: ' + JSON.stringify(editable));
  browser('screenshot', `${run}/${name}-view.png`);
  button(edit);
  wait(`document.querySelector('dialog[open] button[type=submit]')`);
  const after = JSON.parse(evaluate(probe));
  const footerAfter = json(
    `JSON.stringify([...document.querySelectorAll('dialog[open] button')].slice(-2).map(e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height]}))`,
  );
  const shifts = before.flatMap((e, i) => {
    const a = after[i];
    return !a ||
      e.tag !== a.tag ||
      e.label !== a.label ||
      e.rect.some((n, j) => Math.abs(n - a.rect[j]) > 2)
      ? [{ index: i, before: e, after: a }]
      : [];
  });
  const maxDelta = Math.max(
    0,
    ...before.flatMap((e, i) =>
      e.rect.map((n, j) => Math.abs(n - (after[i]?.rect[j] ?? Infinity))),
    ),
  );
  const scrollAfter = json(
    `document.querySelector('[data-layout-scroll]')?.scrollTop||0`,
  );
  const footerShift = footerBefore.some((r, i) =>
    r.some((n, j) => Math.abs(n - footerAfter[i][j]) > 2),
  );
  const writes = json('JSON.stringify(window.layoutWrites)');
  browser('screenshot', `${run}/${name}-edit.png`);
  const result = {
    name,
    controls: before.length,
    afterControls: after.length,
    maxDelta,
    scrollBefore,
    scrollAfter,
    shifts,
    footerShift,
    writes,
  };
  results.push(result);
  writeFileSync(`${run}/geometry.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(result));
  if (
    shifts.length ||
    before.length !== after.length ||
    footerShift ||
    writes.length ||
    scrollBefore !== scrollAfter
  )
    throw Error(name + ' layout/read-only regression');
}
for (const width of [1440, 390]) {
  browser('set', 'viewport', String(width), width === 1440 ? '900' : '844');
  for (const [name, path, edit] of [
    ['shipment', 'shipments', 'Sửa'],
    ['commission', 'commissions', 'Sửa'],
    ['contract', 'contracts', 'Sửa hợp đồng'],
  ]) {
    openView(path);
    compare(`${name}-${width}`, edit);
  }
  openView('shipments');
  browser('focus', '[role=tab][data-tab-value=costs]');
  browser('press', 'Enter');
  compare(`costs-${width}`, 'Sửa');
  openView('shipments');
  browser('focus', '[role=tab][data-tab-value=vgm]');
  browser('press', 'Enter');
  compare(`vgm-${width}`, 'Sửa');
  route('commissions/search', page({ ...commission, paymentHistory: [] }));
  route(`contracts/${contract.id}/commission`, {
    ...commission,
    paymentHistory: [],
  });
  openView('commissions');
  compare(`commission-empty-${width}`, 'Sửa');
  route('commissions/search', page(commission));
  route(`contracts/${contract.id}/commission`, commission);
}
browser('close');
