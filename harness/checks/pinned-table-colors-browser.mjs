import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const origin = process.env.TABLE_TEST_ORIGIN || 'http://localhost:3000';
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) throw Error('Local server only');
const run = `harness/runs/${new Date().toISOString().replace(/[:.]/g, '-')}-pinned-colors`;
mkdirSync(run, {recursive:true});
const exe=process.platform === 'win32' ? join(process.env.APPDATA,'npm/node_modules/agent-browser/bin/agent-browser-win32-x64.exe') : 'agent-browser';
const b=(...args)=>execFileSync(exe,['--session','pinned-colors',...args],{encoding:'utf8',timeout:45000}).trim();
const {contract,shipment,customer}=JSON.parse(readFileSync('harness/fixtures/dialogs.json','utf8'));
const route=(path,data)=>b('network','route','**/api/backend/api/v1/'+path,'--body',JSON.stringify(data));
// Inherit pipes during daemon bootstrap on Windows (see home-portal check).
execFileSync(exe,['--session','pinned-colors','open',origin+'/login'],{stdio:'inherit',timeout:45000});
b('cookies','set','kt-xnk-access-token','synthetic-color-test');
b('cookies','set','kt-xnk-session-permissions','["users:manage","logistics:contracts:view","logistics:view"]');
b('network','unroute');
route('contracts/search',{page:{items:[contract],totalCount:1,totalPages:1,page:1,pageSize:25},valueTotals:[],settlements:[]});
route('contracts?*',{items:[contract],totalCount:1,totalPages:1,page:1,pageSize:25});
route(`contracts/${contract.id}/shipments`,[shipment]);
route('customers',[customer]);
b('network','route','**/api/backend/**','--body','[]');
b('set','viewport','1440','900');
b('open',origin + '/logistics/contracts');


const evaluate = code => JSON.parse(b('eval', '-b', Buffer.from(code).toString('base64')));
b('wait','--text',contract.contractNumber || 'HD-UI-001');
const results=[];
for (const width of [1440,390]) {
  b('set','viewport',String(width),'900');
  for (const hovered of [false,true]) {
    b('hover',hovered ? 'tbody tr:first-child td:last-child' : 'h1');
    const result=evaluate(`(() => {
      const row=document.querySelector('tbody tr');
      if (!row || !row.querySelector('button')) throw Error('Fixture row missing');
      const cells=[...row.querySelectorAll('td')];
      const pinned=cells.filter(e=>getComputedStyle(e).position==='sticky');
      if (!pinned.length) throw Error('No pinned cells exercised');
      const body=getComputedStyle(row.closest('tbody')).backgroundColor;
      for(const cell of pinned) {
        if(getComputedStyle(cell).backgroundColor!==body) throw Error('Pinned body differs from table body');
        const overlay=getComputedStyle(cell,'::before').backgroundColor;
        const rowFill=getComputedStyle(row).backgroundColor;
        if(row.matches(':hover') && overlay!==rowFill) throw Error('Hover overlay differs');
      }
      const headers=[...document.querySelectorAll('thead th')];
      if(new Set(headers.map(e=>getComputedStyle(e).backgroundColor)).size!==1) throw Error('Pinned header differs');
      const scroller=row.closest('table').parentElement;
      scroller.scrollLeft=scroller.scrollWidth;
      return {width:innerWidth,pinned:pinned.length,body,hovered:row.matches(':hover'),scrollLeft:scroller.scrollLeft};
    })()`);
    results.push(result);
    b('screenshot',`${run}/${width}-${hovered?'hover':'rest'}.png`);
  }
}
writeFileSync(`${run}/checks.json`,JSON.stringify(results,null,2));
console.log(JSON.stringify({run,results},null,2));
