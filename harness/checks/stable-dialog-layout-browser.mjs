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
const isWindows = process.platform === 'win32';
// Manual MSVCRT-style argv quoting (the same rules CreateProcess/Node's own
// auto-quoting rely on) for use under `windowsVerbatimArguments: true`.
// Needed because Node's automatic Windows quoting only kicks in for args
// containing whitespace — an eval expression like `e=>e>1` has none, so it
// reaches `cmd.exe` unquoted and its bare `>` gets parsed as output
// redirection (reproduced live: `[1,2,3].some(e=>e>1)` truncated at the
// `>` and agent-browser saw incomplete JS — "Unexpected end of input").
// Always quoting every arg sidesteps that and every other cmd.exe
// metacharacter (`&`, `|`, `<`, `^`) the eval/selector/JSON payloads below
// can contain.
function winQuoteArg(arg) {
  let result = '"';
  let backslashes = 0;
  for (const ch of String(arg)) {
    if (ch === '\\') {
      backslashes += 1;
      continue;
    }
    if (ch === '"') {
      result += '\\'.repeat(backslashes * 2 + 1) + '"';
      backslashes = 0;
      continue;
    }
    result += '\\'.repeat(backslashes) + ch;
    backslashes = 0;
  }
  return result + '\\'.repeat(backslashes * 2) + '"';
}
function browser(...args) {
  // On Windows, `agent-browser` resolves to `agent-browser.cmd` — invoking
  // it via `cmd.exe /c` with the command kept as separate argv entries
  // (not `shell: true`, which concatenates everything into one quoted
  // string cmd.exe re-parses, and previously hung waiting on the CLI's own
  // background browser process). POSIX runs the shebang script directly,
  // as before.
  const [file, fileArgs] = isWindows
    ? // `agent-browser` itself must stay unquoted — cmd.exe's PATHEXT/`.cmd`
      // lookup for `/c`'s command token breaks if that first token is
      // quoted (reproduced live: quoting it produced "'agent-browser" ...'
      // is not recognized"). Every argument after it is quoted.
      [
        'cmd.exe',
        ['/c', 'agent-browser', ...['--session', session, ...args].map(winQuoteArg)],
      ]
    : ['agent-browser', ['--session', session, ...args]];
  try {
    return execFileSync(file, fileArgs, {
      encoding: 'utf8',
      timeout: 35000,
      windowsVerbatimArguments: isWindows,
    }).trim();
  } catch (error) {
    // Windows-only: launching a session's *first* command spawns the
    // actual browser as a detached grandchild of `cmd.exe /c` — it
    // inherits the stdout/stderr pipes, so they never see EOF and
    // `execFileSync` waits for the full timeout even though the CLI
    // command itself already completed and printed its normal "✓ ..."
    // success line (visible on `error.stdout` when this happens). Treat
    // that specific shape — timed out, but a successful-looking line was
    // already captured — as success instead of failing the whole run on
    // a one-time cold-start artifact; any other error still throws.
    if (
      isWindows &&
      error.code === 'ETIMEDOUT' &&
      typeof error.stdout === 'string' &&
      error.stdout.trim().startsWith('✓')
    ) {
      return error.stdout.trim();
    }
    throw error;
  }
}
function evaluate(code) {
  return browser('eval', code);
}
function json(code) {
  const value = JSON.parse(evaluate(code));
  return typeof value === 'string' ? JSON.parse(value) : value;
}
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
// `agent-browser wait --fn` itself is unreliable on this Windows box — it
// timed out repeatedly in a prior session even while a parallel `eval`
// against the exact same session and condition independently confirmed
// true (reproduced again live this session: a `wait --fn` on the "Xem"
// menuitem's visibility timed out, then `eval` against that same open
// session showed the menu already open with "Xem" visible). Polling via
// `eval` (which does work) from this side instead of trusting the CLI's
// own wait sidesteps that bug — filed as tool feedback, not fixable here.
function wait(code) {
  const deadline = Date.now() + 25000;
  for (;;) {
    if (json(`Boolean(${code})`)) return;
    if (Date.now() >= deadline)
      throw new Error(`wait timed out after 25000ms: ${code}`);
    sleepSync(250);
  }
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
// `searchContracts` (`api/contracts.js`) is the one search endpoint that
// nests its paging envelope under `page` alongside sibling `valueTotals`/
// `settlements` — every other list's `search` endpoint (shipments,
// commissions) returns the flat shape `page()` above already matches.
const contractsSearchPage = (record) => ({
  page: page(record),
  valueTotals: [{ currency: record.currency, total: record.contractValue }],
  settlements: [
    {
      contractId: record.id,
      settlementValue: record.contractValue,
      paidValue: 0,
      unpaidValue: record.contractValue,
    },
  ],
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
route('contracts/search', contractsSearchPage(contract));
route('contracts?*', page(contract));
route('shipments/search', page(shipment));
route('commissions/search', page(commission));
route(`contracts/${contract.id}/shipments`, [shipment]);
route(`contracts/${contract.id}/commission`, commission);
// A real VGM record, not the empty state — an empty "vgm" tab has zero
// probe-matched controls, which used to let `compare()` "pass" a tab it
// never actually inspected (task 2.2's "không chấp nhận ca 0 controls").
route(`contracts/${contract.id}/shipments/${shipment.id}/vgm`, shipment.vgms);
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
  // Every row's "Xem"/"Sửa" menu items are in the DOM at once (only the
  // open row's is visible) — a bare `[role=menuitem]` selector can hit a
  // hidden one from another row and silently fail to open anything, so
  // scope to the visible "Xem" item the same way `button()` scopes to a
  // visible, exact-text button.
  wait(
    `[...document.querySelectorAll('[role=menuitem]')].some(e=>e.checkVisibility()&&e.textContent.trim()==='Xem')`,
  );
  evaluate(
    `{document.querySelectorAll('[data-layout-click]').forEach(e=>e.removeAttribute('data-layout-click'));[...document.querySelectorAll('[role=menuitem]')].filter(e=>e.checkVisibility()&&e.textContent.trim()==='Xem').at(-1).setAttribute('data-layout-click','true')}`,
  );
  browser('click', '[data-layout-click]');
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
  // A tab whose probe matches nothing "passes" the diff below by
  // vacuous truth (0 === 0, no shifts to find) without ever having
  // inspected a real field — task 2.2's "không chấp nhận ca 0 controls
  // như chứng minh field geometry". Fail loudly instead of silently
  // certifying an empty tab.
  if (before.length === 0)
    throw Error(name + ' probe matched 0 controls in Xem — nothing was verified');
  const footerBefore = json(
    `JSON.stringify([...document.querySelectorAll('dialog[open] button')].slice(-2).map(e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height]}))`,
  );
  // `ReadOnlyLock`-wrapped controls (DatePicker/Selector — Astryx exposes
  // no native `isReadOnly` for those, only `isDisabled`, which is the wrong
  // visual/tab-order for Xem — see its own doc comment) have none of
  // `readOnly`/`disabled`/`aria-disabled`; they're inert via a capture-
  // phase event wrapper instead, marked with `data-readonly-lock`.
  const editable = json(
    `JSON.stringify([...document.querySelectorAll('dialog[open] input:not([type=hidden]),dialog[open] textarea')].filter(e=>e.checkVisibility()&&!e.readOnly&&!e.disabled&&!e.closest('[aria-disabled=true]')&&!e.closest('[data-readonly-lock=true]')).map(e=>e.outerHTML))`,
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

  // Reverse transition (design.md's own callout: "reverse transitions,
  // draft safety") — Hủy with no actual edits made must land back on
  // exactly the Xem geometry captured in `before`, not just get there via
  // some other unrelated route. Confirms Hủy doesn't drop back into a
  // dirty/half-reset state and doesn't itself introduce a layout shift.
  button('Hủy');
  wait(`!document.querySelector('dialog[open] button[type=submit]')`);
  const afterCancel = JSON.parse(evaluate(probe));
  const cancelShifts = before.flatMap((e, i) => {
    const a = afterCancel[i];
    return !a ||
      e.tag !== a.tag ||
      e.label !== a.label ||
      e.rect.some((n, j) => Math.abs(n - a.rect[j]) > 2)
      ? [{ index: i, before: e, afterCancel: a }]
      : [];
  });
  browser('screenshot', `${run}/${name}-cancel.png`);

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
    cancelControls: afterCancel.length,
    cancelShifts,
  };
  results.push(result);
  writeFileSync(`${run}/geometry.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(result));
  if (
    shifts.length ||
    before.length !== after.length ||
    footerShift ||
    writes.length ||
    scrollBefore !== scrollAfter ||
    cancelShifts.length ||
    afterCancel.length !== before.length
  )
    throw Error(name + ' layout/read-only regression');
}

// Validation and network-failure scenarios (design.md: "mạng chậm/thất
// bại, dữ liệu dài/rỗng" must be exercised, not just the happy view/edit
// toggle). Both must keep the dialog open, in edit mode, with the user's
// draft intact and no layout shift around the error banner.
function errorScenarios() {
  openView('contracts');
  button('Sửa hợp đồng');
  wait(`document.querySelector('dialog[open] button[type=submit]')`);
  evaluate(
    `{const d=document.querySelector('dialog[open]');const s=[...d.querySelectorAll('*')].find(e=>e.scrollHeight>e.clientHeight+200&&['auto','scroll'].includes(getComputedStyle(e).overflowY));if(s){s.setAttribute('data-layout-scroll','true')}}`,
  );

  // Client-side validation: clear a required field, submit, expect the
  // dialog to stay open/editable with the draft (the other fields the
  // user didn't touch) intact, and no shift in the fields around the
  // error banner.
  const draftField = evaluate(
    `(()=>{const l=[...document.querySelectorAll('.astryx-field-label')].find(e=>e.textContent.trim().startsWith('Tên dự án'));const i=l.closest('.astryx-field').querySelector('input');const v=i.value;const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;setter.call(i,'');i.dispatchEvent(new Event('input',{bubbles:true}));return v})()`,
  );
  const beforeValidation = JSON.parse(evaluate(probe));
  const scrollBeforeValidation = json(
    `document.querySelector('[data-layout-scroll]')?.scrollTop||0`,
  );
  browser('click', 'button[type=submit]');
  wait(`document.querySelector('dialog[open] [role=alert],dialog[open] .astryx-banner')`);
  // The submit handler deliberately `scrollIntoView`s the first invalid
  // field so the user sees why it failed — a real, wanted scroll, not a
  // layout regression. Undo it before re-probing so this only flags an
  // actual reflow (fields moving relative to the dialog shell/each other),
  // not every field's viewport Y shifting together because the container
  // scrolled.
  evaluate(
    `{const s=document.querySelector('[data-layout-scroll]');if(s)s.scrollTop=${scrollBeforeValidation}}`,
  );
  const afterValidation = JSON.parse(evaluate(probe));
  const stillEditing = json(
    `Boolean(document.querySelector('dialog[open] button[type=submit]'))`,
  );
  // The error `Banner` reserving its own space above the fields pushes
  // every field down by the same amount — legitimate, not a regression
  // (design.md's 0px-landmark rule targets Xem↔Sửa toggling, not an error
  // banner appearing). Tolerate that one common vertical offset; still
  // flag any x/width/height drift, or a field whose own y delta diverges
  // from the common offset (real reflow, not the banner's push) — except
  // the invalidated field itself, whose width may narrow for its own
  // error decoration (icon/outline).
  const commonDy = afterValidation[0]
    ? afterValidation[0].rect[1] - beforeValidation[0].rect[1]
    : 0;
  const validationShifts = beforeValidation.flatMap((e, i) => {
    const a = afterValidation[i];
    if (!a) return [{ index: i, before: e, after: a }];
    const isInvalidField = e.label.startsWith('Tên dự án');
    const [dx, dy, dw, dh] = e.rect.map((n, j) => a.rect[j] - n);
    return e.tag !== a.tag ||
      Math.abs(dx) > 2 ||
      Math.abs(dy - commonDy) > 2 ||
      Math.abs(dh) > 2 ||
      (Math.abs(dw) > 2 && !isInvalidField)
      ? [{ index: i, before: e, after: a }]
      : [];
  });
  browser('screenshot', `${run}/contract-validation-error.png`);
  if (!stillEditing)
    throw Error('validation error dropped out of edit mode');
  if (validationShifts.length)
    throw Error(
      'validation error shifted fields: ' + JSON.stringify(validationShifts),
    );

  // Restore the field, then simulate a network failure on the actual
  // update call — the draft (restored value + everything else) must
  // survive, the dialog must stay open/editable, and an error must
  // surface without a layout shift either.
  evaluate(
    `(()=>{const l=[...document.querySelectorAll('.astryx-field-label')].find(e=>e.textContent.trim().startsWith('Tên dự án'));const i=l.closest('.astryx-field').querySelector('input');const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;setter.call(i,${JSON.stringify(draftField)});i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
  );
  browser('network', 'route', `**/api/backend/api/v1/contracts/${contract.id}`, '--abort');
  const beforeNetworkError = JSON.parse(evaluate(probe));
  const scrollBeforeNetworkError = json(
    `document.querySelector('[data-layout-scroll]')?.scrollTop||0`,
  );
  browser('click', 'button[type=submit]');
  wait(
    `document.querySelectorAll('dialog[open] [role=alert],dialog[open] .astryx-banner').length>0`,
  );
  // Same deliberate `scrollIntoView` as the validation case above — this
  // time the submit error `Banner` itself, since every field is valid.
  evaluate(
    `{const s=document.querySelector('[data-layout-scroll]');if(s)s.scrollTop=${scrollBeforeNetworkError}}`,
  );
  const afterNetworkError = JSON.parse(evaluate(probe));
  const stillEditingAfterNetworkError = json(
    `Boolean(document.querySelector('dialog[open] button[type=submit]'))`,
  );
  const restoredValue = json(
    `(()=>{const l=[...document.querySelectorAll('.astryx-field-label')].find(e=>e.textContent.trim().startsWith('Tên dự án'));return JSON.stringify(l.closest('.astryx-field').querySelector('input').value)})()`,
  );
  // Same tolerance as `validationShifts` above: the error `Banner`
  // reserving space pushes every field down by one common offset
  // (legitimate), and "Tên dự án" itself may change width as it clears
  // the previous validation pass's error decoration now that it's valid
  // again — everything else must land exactly where it started.
  const networkCommonDy = afterNetworkError[0]
    ? afterNetworkError[0].rect[1] - beforeNetworkError[0].rect[1]
    : 0;
  const networkErrorShifts = beforeNetworkError.flatMap((e, i) => {
    const a = afterNetworkError[i];
    if (!a) return [{ index: i, before: e, after: a }];
    const isInvalidField = e.label.startsWith('Tên dự án');
    const [dx, dy, dw, dh] = e.rect.map((n, j) => a.rect[j] - n);
    return e.tag !== a.tag ||
      Math.abs(dx) > 2 ||
      Math.abs(dy - networkCommonDy) > 2 ||
      Math.abs(dh) > 2 ||
      (Math.abs(dw) > 2 && !isInvalidField)
      ? [{ index: i, before: e, after: a }]
      : [];
  });
  browser('screenshot', `${run}/contract-network-error.png`);
  route(`contracts/${contract.id}`, contract);
  if (!stillEditingAfterNetworkError)
    throw Error('network error dropped out of edit mode');
  if (restoredValue !== draftField)
    throw Error(
      `network error lost the draft: expected ${JSON.stringify(draftField)}, got ${restoredValue}`,
    );
  if (networkErrorShifts.length)
    throw Error(
      'network error shifted fields: ' + JSON.stringify(networkErrorShifts),
    );
  button('Hủy');
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
browser('set', 'viewport', '1440', '900');
errorScenarios();
browser('close');
