import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const html = join(root, 'app', 'ms-sql-plan-analyzer.html');
const chromeCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];
const browserPath = chromeCandidates.find(existsSync);
if (!browserPath) throw new Error('Chrome or Edge not found');

function filesUnder(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(path) : /\.(sqlplan|sqplan)$/i.test(entry.name) ? [path] : [];
  });
}

const allPlans = filesUnder(join(root, 'Test data'));
const smokeSkip = Number(process.env.SMOKE_SKIP || 0);
const plans = process.env.SMOKE_LIMIT ? allPlans.slice(smokeSkip, smokeSkip + Number(process.env.SMOKE_LIMIT)) : allPlans.slice(smokeSkip);
const repeatedSubplan = `<?xml version="1.0"?>
<ShowPlanXML xmlns="http://schemas.microsoft.com/sqlserver/2004/07/showplan" Version="1.0" Build="test"><BatchSequence><Batch><Statements>
<StmtSimple StatementId="1" StatementType="SELECT" StatementText="synthetic repeated subtree"><QueryPlan>
<RelOp NodeId="0" PhysicalOp="Concatenation" LogicalOp="Concatenation" EstimateRows="2" EstimatedTotalSubtreeCost="2">
<Concatenation>
<RelOp NodeId="1" PhysicalOp="Nested Loops" LogicalOp="Inner Join" EstimateRows="1" EstimatedTotalSubtreeCost="1"><NestedLoops>
<RelOp NodeId="2" PhysicalOp="Index Scan" LogicalOp="Index Scan" EstimateRows="1" EstimatedTotalSubtreeCost="0.4"><IndexScan><Object Schema="[dbo]" Table="[A]" Index="[IX_A]"/></IndexScan></RelOp>
<RelOp NodeId="3" PhysicalOp="Index Seek" LogicalOp="Index Seek" EstimateRows="1" EstimatedTotalSubtreeCost="0.4"><IndexScan><Object Schema="[dbo]" Table="[B]" Index="[IX_B]"/></IndexScan></RelOp>
</NestedLoops></RelOp>
<RelOp NodeId="4" PhysicalOp="Nested Loops" LogicalOp="Inner Join" EstimateRows="1" EstimatedTotalSubtreeCost="1"><NestedLoops>
<RelOp NodeId="5" PhysicalOp="Index Scan" LogicalOp="Index Scan" EstimateRows="1" EstimatedTotalSubtreeCost="0.4"><IndexScan><Object Schema="[dbo]" Table="[A]" Index="[IX_A]"/></IndexScan></RelOp>
<RelOp NodeId="6" PhysicalOp="Index Seek" LogicalOp="Index Seek" EstimateRows="1" EstimatedTotalSubtreeCost="0.4"><IndexScan><Object Schema="[dbo]" Table="[B]" Index="[IX_B]"/></IndexScan></RelOp>
</NestedLoops></RelOp>
</Concatenation></RelOp></QueryPlan></StmtSimple></Statements></Batch></BatchSequence></ShowPlanXML>`;
const profile = mkdtempSync(join(tmpdir(), 'sql-plan-smoke-'));
const port = 9300 + Math.floor(Math.random() * 500);
const browser = spawn(browserPath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, pathToFileURL(html).href
], { stdio: 'ignore', windowsHide: true });

const delay = ms => new Promise(resolveDelay => setTimeout(resolveDelay, ms));
async function retry(fn, attempts = 80) {
  let error;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); } catch (e) { error = e; await delay(100); }
  }
  throw error;
}

try {
  const pages = await retry(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/json/list`);
    if (!response.ok) throw new Error('DevTools endpoint is not ready');
    const value = await response.json();
    const page = value.find(item => item.type === 'page' && item.url.includes('ms-sql-plan-analyzer.html'));
    if (!page) throw new Error('Analyzer page is not ready');
    return page;
  });
  const socket = new WebSocket(pages.webSocketDebuggerUrl);
  await new Promise((ok, fail) => { socket.onopen = ok; socket.onerror = fail; });
  let sequence = 0;
  const pending = new Map();
  const browserErrors = [];
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { ok, fail } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? fail(new Error(message.error.message)) : ok(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') browserErrors.push(message.params.exceptionDetails.text);
  };
  const send = (method, params = {}) => new Promise((ok, fail) => {
    const id = ++sequence;
    pending.set(id, { ok, fail });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  await send('Runtime.enable');
  await retry(async () => {
    if (!await evaluate("document.readyState === 'complete'")) throw new Error('Page is loading');
  });
  const documentNode = await send('DOM.getDocument');
  const input = await send('DOM.querySelector', { nodeId: documentNode.root.nodeId, selector: '#fileInput' });
  const failures = [];
  let reusableZones = 0;
  for (const plan of plans) {
    if (process.env.SMOKE_PROGRESS) console.log(`Testing ${basename(plan)}`);
    await evaluate("document.getElementById('toast').textContent = ''");
    await send('DOM.setFileInputFiles', { nodeId: input.nodeId, files: [plan] });
    try {
      await retry(async () => {
        const snapshot = await evaluate("({title:document.getElementById('planTitle').textContent,visible:document.getElementById('viewer').classList.contains('visible'),toast:document.getElementById('toast').textContent})");
        const expected = basename(plan).replace(/\.(sqlplan|sqplan)$/i, '');
        if (!snapshot.visible || snapshot.title !== expected || !snapshot.toast) throw new Error(snapshot.toast || 'Plan did not render');
      }, 120);
      const snapshot = await evaluate(`(() => {
        const cards=Array.from(document.querySelectorAll('.node-card'));
        const boxes=cards.map(card=>({id:card.dataset.id,left:card.offsetLeft,top:card.offsetTop,right:card.offsetLeft+card.offsetWidth,bottom:card.offsetTop+card.offsetHeight}));
        let overlaps=0;
        for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)overlaps++;}
        return {tabs:document.querySelectorAll('.statement-tab').length,tree:document.querySelectorAll('.tree-row').length,cards:cards.length,zones:document.querySelectorAll('.subplan-zone').length,overlaps,missingFlagTips:Array.from(document.querySelectorAll('.flag')).filter(x=>!x.title).length,meta:document.getElementById('planMeta').textContent};
      })()`);
      reusableZones += snapshot.zones;
      if (!snapshot.tabs || Boolean(snapshot.tree) !== Boolean(snapshot.cards)) failures.push(`${plan}: inconsistent UI (${JSON.stringify(snapshot)})`);
      if (snapshot.overlaps) failures.push(`${plan}: ${snapshot.overlaps} graph-card overlaps`);
      if (snapshot.missingFlagTips) failures.push(`${plan}: flags without tooltips`);
      if (basename(plan).toLowerCase() === 'batch_hash_table_build.sqlplan') {
        const timeState = await evaluate(`(() => {document.querySelector('[data-metric="time"]').click();return {notice:document.getElementById('metricNotice').textContent,values:Array.from(document.querySelectorAll('.tree-value')).map(x=>x.textContent)}})()`);
        if (!timeState.notice || timeState.values.some(value => value.includes('0 ms') || value.includes('0 мс'))) failures.push(`${plan}: missing elapsed time is shown as zero`);
      }
    } catch (error) {
      failures.push(`${plan}: ${error.message}`);
    }
  }
  const interaction = await evaluate(`(() => {
    document.querySelector('.node-card').click();
    const drawerOpened=document.getElementById('detailsDrawer').classList.contains('open');
    const check=document.getElementById('hideDetailsCheck');check.checked=true;check.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('.node-card').click();
    const stayedClosed=!document.getElementById('detailsDrawer').classList.contains('open')&&document.getElementById('detailsHandle').classList.contains('visible');
    document.getElementById('detailsHandle').click();
    const unlocked=document.getElementById('detailsDrawer').classList.contains('open');
    const language=document.getElementById('languageSelect');language.value='ru';language.dispatchEvent(new Event('change',{bubbles:true}));
    const russian=document.getElementById('menuBtn').textContent;
    language.value='en';language.dispatchEvent(new Event('change',{bubbles:true}));
    const english=document.getElementById('menuBtn').textContent;
    const canvas=document.getElementById('canvasWrap');const before=document.getElementById('zoomLabel').textContent;canvas.dispatchEvent(new WheelEvent('wheel',{ctrlKey:true,deltaY:-150,clientX:100,clientY:100,cancelable:true,bubbles:true}));const after=document.getElementById('zoomLabel').textContent;
    document.getElementById('menuBtn').click();
    return {drawerOpened,stayedClosed,unlocked,russian,english,before,after,homeVisible:!document.getElementById('homeSidebar').classList.contains('hidden'),viewerButtonsHidden:document.getElementById('menuBtn').classList.contains('hidden')&&document.getElementById('historyBtn').classList.contains('hidden'),languageSaved:localStorage.getItem('sql-plan-language')};
  })()`);
  if (!interaction.drawerOpened || !interaction.stayedClosed || !interaction.unlocked) failures.push(`Details locking failed: ${JSON.stringify(interaction)}`);
  if (interaction.russian !== 'Возврат в меню' || interaction.english !== 'Back to menu' || interaction.languageSaved !== 'en') failures.push(`Language switching failed: ${JSON.stringify(interaction)}`);
  if (interaction.before === interaction.after) failures.push(`Graph zoom failed: ${JSON.stringify(interaction)}`);
  if (!interaction.homeVisible || !interaction.viewerButtonsHidden) failures.push(`Home screen state failed: ${JSON.stringify(interaction)}`);
  await evaluate(`document.getElementById('planNameInput').value='Smoke custom name'; document.getElementById('pasteBox').value = ${JSON.stringify(repeatedSubplan)}; document.getElementById('parsePasteBtn').click()`);
  await retry(async () => {
    const snapshot = await evaluate("({title:document.getElementById('planTitle').textContent,zones:document.querySelectorAll('.subplan-zone').length,calls:document.querySelectorAll('.edge.call').length})");
    if (snapshot.title!=='Smoke custom name'||!snapshot.zones || snapshot.calls < 2) throw new Error('Custom name or reusable subplan rendering failed');
    reusableZones += snapshot.zones;
  });
  socket.close();
  if (browserErrors.length) failures.push(...browserErrors.map(x => `Browser exception: ${x}`));
  if (failures.length) {
    console.error(failures.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`OK: ${plans.length} SQL Server plans opened in Chromium; ${reusableZones} reusable-subplan zones rendered`);
  }
} finally {
  browser.kill();
  await delay(200);
  rmSync(profile, { recursive: true, force: true });
}
