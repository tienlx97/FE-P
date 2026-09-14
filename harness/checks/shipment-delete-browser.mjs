// Run manually against a local production/dev server. Every API call is
// mocked; this check never deletes a real business record.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const session = 'shipment-delete';
const origin = process.env.DIALOG_TEST_ORIGIN || 'http://localhost:3001';
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
  throw Error('Local server only');
}
const run = process.env.EVIDENCE_RUN || 'harness/runs/shipment-delete-browser';
mkdirSync(run, { recursive: true });
const { contract, shipment, customer } = JSON.parse(
  readFileSync('harness/fixtures/dialogs.json', 'utf8'),
);

function browser(...args) {
  const executable =
    process.platform === 'win32'
      ? join(
          process.env.APPDATA ?? '',
          'npm/node_modules/agent-browser/bin/agent-browser-win32-x64.exe',
        )
      : 'agent-browser';
  return execFileSync(executable, ['--session', session, ...args], {
    encoding: 'utf8',
    timeout: 35000,
  }).trim();
}

function evaluate(code) {
  return browser('eval', `{ ${code} }`);
}

function wait(code) {
  browser('wait', '--fn', `Boolean(${code})`);
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

const page = (record) => ({
  items: [record],
  totalCount: 1,
  totalPages: 1,
  page: 1,
  pageSize: 25,
});

browser('open', `${origin}/login`);
browser('set', 'viewport', '1440', '900');
browser('cookies', 'set', 'kt-xnk-access-token', 'synthetic-delete-test');
browser(
  'cookies',
  'set',
  'kt-xnk-session-permissions',
  '["logistics:contracts:view","logistics:contracts:manage","logistics:view"]',
);
browser('network', 'unroute');
route('contracts/search', page(contract));
route('contracts?*', page(contract));
route('shipments/search', { page: page(shipment), totals: [] });
route('suppliers', [customer]);
browser('network', 'route', '**/api/backend/**', '--body', '[]');

browser('open', `${origin}/logistics/shipments`);
wait(
  `document.querySelector('tbody')?.textContent.includes(${JSON.stringify(shipment.shipmentCode)})`,
);
evaluate(`window.shipmentDeleteCalls=[];window.hasShipment=true;const originalFetch=window.fetch;window.fetch=async(url,options)=>{const path=String(url);if(path.endsWith('/shipments/search')){const items=window.hasShipment?[${JSON.stringify(shipment)}]:[];return Response.json({page:{items,totalCount:items.length,totalPages:items.length,page:1,pageSize:25},totals:[]});}if(options?.method==='DELETE'&&path.endsWith('/contracts/${contract.id}/shipments/${shipment.id}')){window.shipmentDeleteCalls.push({path,method:options.method});window.hasShipment=false;return new Response(null,{status:204});}return originalFetch(url,options);};true`);

evaluate(`const trigger=[...document.querySelectorAll('button')].find(button=>button.checkVisibility()&&button.textContent.trim()==='Chức năng');if(!trigger)throw Error('Missing Chức năng');trigger.click()`);
wait(`[...document.querySelectorAll('[role=menuitem]')].filter(item=>item.checkVisibility()).length===3`);
evaluate(`const visibleItems=[...document.querySelectorAll('[role=menuitem]')].filter(item=>item.checkVisibility());const labels=visibleItems.map(item=>item.textContent);if(labels.join(',')!=='Xem,Sửa,Xoá')throw Error('Unexpected actions: '+labels.join(','));const item=visibleItems.find(item=>item.textContent==='Xoá');item.click()`);

wait(
  `[...document.querySelectorAll('dialog[open]')].some(dialog=>dialog.textContent.includes('Xoá Shipment')&&dialog.textContent.includes(${JSON.stringify(shipment.shipmentCode)}))`,
);
evaluate(`const text=[...document.querySelectorAll('dialog[open]')].at(-1).textContent;if(!text.includes('chi phí Logistics')||!text.includes('VGM')||!text.includes('không thể hoàn tác'))throw Error('Missing dependent-data warning')`);
browser('screenshot', `${run}/shipment-delete-confirmation.png`);

evaluate(`const dialog=[...document.querySelectorAll('dialog[open]')].at(-1);const action=[...dialog.querySelectorAll('button')].find(button=>button.textContent.trim()==='Xoá');if(!action)throw Error('Missing delete confirmation');action.click()`);
wait('window.shipmentDeleteCalls.length===1');
wait('document.querySelectorAll("dialog[open]").length===0');
wait(
  `!document.querySelector('tbody')?.textContent.includes(${JSON.stringify(shipment.shipmentCode)})`,
);
wait(
  `document.body.textContent.includes(${JSON.stringify(`Đã xoá Shipment "${shipment.shipmentCode}".`)})`,
);

console.log('PASS Shipment delete confirmation, DELETE request, cache refresh and success feedback');
