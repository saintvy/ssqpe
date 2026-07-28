import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const html = join(root, 'app', 'ms-sql-plan-analyzer.html');
const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].filter(Boolean);
const browserPath = chromeCandidates.find(existsSync);
if (!browserPath) throw new Error('Chrome or Edge not found');

function filesUnder(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(path) : /\.(sqlplan|sqplan)$/i.test(entry.name) ? [path] : [];
  });
}

const allPlans = filesUnder(join(root, 'Test data'));
const smokeSkip = Number(process.env.SMOKE_SKIP || 0);
const plans = process.env.SMOKE_PUBLIC_ONLY ? [] : process.env.SMOKE_LIMIT ? allPlans.slice(smokeSkip, smokeSkip + Number(process.env.SMOKE_LIMIT)) : allPlans.slice(smokeSkip);
const repeatedSubplan = `<?xml version="1.0"?>
<ShowPlanXML xmlns="http://schemas.microsoft.com/sqlserver/2004/07/showplan" Version="1.0" Build="test"><BatchSequence><Batch><Statements>
<StmtSimple StatementId="1" StatementType="SELECT" StatementText="synthetic repeated subtree"><QueryPlan>
<RelOp NodeId="0" PhysicalOp="Concatenation" LogicalOp="Concatenation" EstimateRows="2" EstimatedTotalSubtreeCost="2"><OutputList><ColumnReference Database="[db]" Schema="[dbo]" Table="[A]" Column="Id"/></OutputList><DefinedValues><DefinedValue><ColumnReference Column="Expr1000"/></DefinedValue></DefinedValues><Predicate><ScalarOperator ScalarString="[A].[Id]&gt;(0)"/></Predicate><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="2" ActualExecutions="1" ActualElapsedms="351000" ActualCPUms="93600"/></RunTimeInformation>
<Concatenation>
<RelOp NodeId="1" PhysicalOp="Nested Loops" LogicalOp="Inner Join" EstimateRows="1" EstimatedTotalSubtreeCost="1"><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="100" ActualExecutions="1" ActualElapsedms="172800" ActualCPUms="50000"/></RunTimeInformation><NestedLoops>
<RelOp NodeId="2" PhysicalOp="Compute Scalar" LogicalOp="Compute Scalar" EstimateRows="1" EstimatedTotalSubtreeCost="0.4"><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="1" ActualExecutions="1"/></RunTimeInformation><ComputeScalar><RelOp NodeId="7" PhysicalOp="Stream Aggregate" LogicalOp="Aggregate" EstimateRows="1" EstimatedTotalSubtreeCost="0.3"><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="1" ActualExecutions="1" ActualElapsedms="172800" ActualCPUms="40000"/></RunTimeInformation><StreamAggregate><RelOp NodeId="9" PhysicalOp="Filter" LogicalOp="Filter" EstimateRows="1" EstimatedTotalSubtreeCost="0.2"><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="1" ActualExecutions="1" ActualElapsedms="400" ActualCPUms="100"/></RunTimeInformation><Filter><RelOp NodeId="10" PhysicalOp="Index Scan" LogicalOp="Index Scan" EstimateRows="1" EstimatedTotalSubtreeCost="0.1"><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="1" ActualExecutions="1" ActualElapsedms="170000" ActualCPUms="39000"/></RunTimeInformation><IndexScan><Object Schema="[dbo]" Table="[A]" Index="[IX_A]"/></IndexScan></RelOp></Filter></RelOp></StreamAggregate></RelOp></ComputeScalar></RelOp>
<RelOp NodeId="3" PhysicalOp="Index Seek" LogicalOp="Index Seek" EstimateRows="1" EstimatedTotalSubtreeCost="0.4"><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="1" ActualExecutions="1"/></RunTimeInformation><IndexScan><Object Schema="[dbo]" Table="[B]" Index="[IX_B]"/></IndexScan></RelOp>
</NestedLoops></RelOp>
<RelOp NodeId="4" PhysicalOp="Nested Loops" LogicalOp="Inner Join" EstimateRows="1" EstimatedTotalSubtreeCost="1"><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="0" ActualExecutions="1" ActualElapsedms="1000" ActualCPUms="500"/></RunTimeInformation><NestedLoops>
<RelOp NodeId="5" PhysicalOp="Compute Scalar" LogicalOp="Compute Scalar" EstimateRows="1" EstimatedTotalSubtreeCost="0.4"><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="1" ActualExecutions="1"/></RunTimeInformation><ComputeScalar><RelOp NodeId="8" PhysicalOp="Stream Aggregate" LogicalOp="Aggregate" EstimateRows="1" EstimatedTotalSubtreeCost="0.3"><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="1" ActualExecutions="1" ActualElapsedms="800" ActualCPUms="300"/></RunTimeInformation><StreamAggregate><RelOp NodeId="11" PhysicalOp="Filter" LogicalOp="Filter" EstimateRows="1" EstimatedTotalSubtreeCost="0.2"><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="1" ActualExecutions="1" ActualElapsedms="200" ActualCPUms="100"/></RunTimeInformation><Filter><RelOp NodeId="12" PhysicalOp="Index Scan" LogicalOp="Index Scan" EstimateRows="1" EstimatedTotalSubtreeCost="0.1"><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="1" ActualExecutions="1" ActualElapsedms="700" ActualCPUms="200"/></RunTimeInformation><IndexScan><Object Schema="[dbo]" Table="[A]" Index="[IX_A]"/></IndexScan></RelOp></Filter></RelOp></StreamAggregate></RelOp></ComputeScalar></RelOp>
<RelOp NodeId="6" PhysicalOp="Index Seek" LogicalOp="Index Seek" EstimateRows="1" EstimatedTotalSubtreeCost="0.4"><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="1" ActualExecutions="1"/></RunTimeInformation><IndexScan><Object Schema="[dbo]" Table="[B]" Index="[IX_B]"/></IndexScan></RelOp>
</NestedLoops></RelOp>
</Concatenation></RelOp></QueryPlan></StmtSimple></Statements></Batch></BatchSequence></ShowPlanXML>`;
const mixedModeTiming = `<?xml version="1.0"?>
<ShowPlanXML xmlns="http://schemas.microsoft.com/sqlserver/2004/07/showplan" Version="1.0" Build="test"><BatchSequence><Batch><Statements>
<StmtSimple StatementId="1" StatementType="SELECT" StatementText="synthetic mixed execution modes"><QueryPlan>
<RelOp NodeId="0" PhysicalOp="Merge Join" LogicalOp="Inner Join" EstimateRows="1" EstimatedTotalSubtreeCost="1" EstimatedExecutionMode="Row"><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="1" ActualExecutions="1" ActualElapsedms="50000" ActualCPUms="40000" ActualExecutionMode="Row"/></RunTimeInformation><Merge>
<RelOp NodeId="1" PhysicalOp="Sort" LogicalOp="Sort" EstimateRows="1" EstimatedTotalSubtreeCost="0.7" EstimatedExecutionMode="Batch"><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="1" ActualExecutions="1" ActualElapsedms="10000" ActualCPUms="9000" ActualExecutionMode="Batch"/></RunTimeInformation><Sort>
<RelOp NodeId="2" PhysicalOp="Merge Join" LogicalOp="Inner Join" EstimateRows="1" EstimatedTotalSubtreeCost="0.5" EstimatedExecutionMode="Row"><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="1" ActualExecutions="1" ActualElapsedms="30000" ActualCPUms="28000" ActualExecutionMode="Row"/></RunTimeInformation><Merge>
<RelOp NodeId="3" PhysicalOp="Index Scan" LogicalOp="Index Scan" EstimateRows="1" EstimatedTotalSubtreeCost="0.2" EstimatedExecutionMode="Row"><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="1" ActualExecutions="1" ActualElapsedms="25000" ActualCPUms="24000" ActualExecutionMode="Row"/></RunTimeInformation><IndexScan/></RelOp>
<RelOp NodeId="4" PhysicalOp="Index Scan" LogicalOp="Index Scan" EstimateRows="1" EstimatedTotalSubtreeCost="0.1" EstimatedExecutionMode="Row"><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="1" ActualExecutions="1" ActualElapsedms="5000" ActualCPUms="4000" ActualExecutionMode="Row"/></RunTimeInformation><IndexScan/></RelOp>
</Merge></RelOp></Sort></RelOp>
<RelOp NodeId="5" PhysicalOp="Clustered Index Scan" LogicalOp="Clustered Index Scan" EstimateRows="1" EstimatedTotalSubtreeCost="0.2" EstimatedExecutionMode="Row"><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="1" ActualExecutions="1" ActualElapsedms="5000" ActualCPUms="0" ActualExecutionMode="Row"/></RunTimeInformation><IndexScan/></RelOp>
</Merge></RelOp></QueryPlan></StmtSimple></Statements></Batch></BatchSequence></ShowPlanXML>`;
const repeatedExecutionRows = `<?xml version="1.0"?>
<ShowPlanXML xmlns="http://schemas.microsoft.com/sqlserver/2004/07/showplan" Version="1.0" Build="test"><BatchSequence><Batch><Statements>
<StmtSimple StatementId="1" StatementType="SELECT" StatementText="synthetic rows per execution"><QueryPlan>
<RelOp NodeId="0" PhysicalOp="Concatenation" LogicalOp="Concatenation" EstimateRows="2" EstimatedTotalSubtreeCost="1"><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="2" ActualExecutions="1"/></RunTimeInformation><Concatenation>
<RelOp NodeId="1" PhysicalOp="Index Seek" LogicalOp="Index Seek" EstimateRows="1" EstimatedTotalSubtreeCost="0.4"><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="39553" ActualExecutions="39553"/></RunTimeInformation><IndexScan/></RelOp>
<RelOp NodeId="2" PhysicalOp="Index Seek" LogicalOp="Index Seek" EstimateRows="2" EstimatedTotalSubtreeCost="0.4"><RunTimeInformation><RunTimeCountersPerThread Thread="0" ActualRows="20" ActualExecutions="10"/><RunTimeCountersPerThread Thread="1" ActualRows="60" ActualExecutions="10"/></RunTimeInformation><IndexScan/></RelOp>
</Concatenation></RelOp></QueryPlan></StmtSimple></Statements></Batch></BatchSequence></ShowPlanXML>`;
const longSqlText = `SELECT /* ${'horizontal-scroll-marker-'.repeat(80)} */\n${Array.from({length:700},(_,index)=>`  CASE WHEN source.[Column${index}] IS NULL THEN ${index} ELSE source.[Column${index}] END AS [Result${index}]`).join(',\n')}\nFROM dbo.Source AS source;`;
const longSqlTail = `SELECT COUNT_BIG(*) AS [Tail marker] FROM dbo.Source;`;
const xmlAttr = value => value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('\r','&#13;').replaceAll('\n','&#10;');
const longSqlPlan = `<?xml version="1.0"?><ShowPlanXML xmlns="http://schemas.microsoft.com/sqlserver/2004/07/showplan" Version="1.0" Build="test"><BatchSequence><Batch><Statements><StmtSimple StatementId="1" StatementType="SELECT" StatementText="${xmlAttr(longSqlText)}"><QueryPlan><RelOp NodeId="0" PhysicalOp="Constant Scan" LogicalOp="Constant Scan" EstimateRows="1" EstimatedTotalSubtreeCost="0.01"><ConstantScan/></RelOp></QueryPlan></StmtSimple><StmtSimple StatementId="2" StatementType="SELECT" StatementText="${xmlAttr(longSqlTail)}"><QueryPlan><RelOp NodeId="1" PhysicalOp="Constant Scan" LogicalOp="Constant Scan" EstimateRows="1" EstimatedTotalSubtreeCost="0.01"><ConstantScan/></RelOp></QueryPlan></StmtSimple></Statements></Batch></BatchSequence></ShowPlanXML>`;
const longSqlBatch = `${longSqlText}\n\n${longSqlTail}`;
const profile = mkdtempSync(join(tmpdir(), 'sql-plan-smoke-'));
const port = 9300 + Math.floor(Math.random() * 500);
const browser = spawn(browserPath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, pathToFileURL(html).href
], { stdio: 'ignore', windowsHide: true });

const delay = ms => new Promise(resolveDelay => setTimeout(resolveDelay, ms));
async function retry(fn, attempts = 200) {
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
  let timeAlerts = 0;
  let rowAlerts = 0;
  let maxIndent = 0;
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
        return {tabs:document.querySelectorAll('.statement-tab').length,tree:document.querySelectorAll('.tree-row').length,cards:cards.length,zones:document.querySelectorAll('.subplan-zone').length,overlaps,timeAlerts:document.querySelectorAll('[data-alert="time"]').length,rowAlerts:document.querySelectorAll('[data-alert="rows"]').length,maxIndent:Math.max(0,...Array.from(document.querySelectorAll('.tree-op')).map(x=>parseFloat(getComputedStyle(x).paddingLeft))),missingFlagTips:Array.from(document.querySelectorAll('.flag,.performance-badge')).filter(x=>!x.title).length,meta:document.getElementById('planMeta').textContent};
      })()`);
      reusableZones += snapshot.zones;
      timeAlerts += snapshot.timeAlerts;
      rowAlerts += snapshot.rowAlerts;
      maxIndent = Math.max(maxIndent, snapshot.maxIndent);
      if (!snapshot.tabs || Boolean(snapshot.tree) !== Boolean(snapshot.cards)) failures.push(`${plan}: inconsistent UI (${JSON.stringify(snapshot)})`);
      if (snapshot.overlaps) failures.push(`${plan}: ${snapshot.overlaps} graph-card overlaps`);
      if (snapshot.missingFlagTips) failures.push(`${plan}: flags without tooltips`);
      if (process.env.SMOKE_BENCHMARK && basename(plan).toLowerCase().includes(process.env.SMOKE_BENCHMARK.toLowerCase())) {
        const panBenchmark = await evaluate(`new Promise(resolve => {
          const canvas=document.getElementById('canvasWrap'),samples=[];let previous=performance.now(),frame=0;
          const maxLeft=Math.max(0,canvas.scrollWidth-canvas.clientWidth),maxTop=Math.max(0,canvas.scrollHeight-canvas.clientHeight);
          const tick=now=>{samples.push(now-previous);previous=now;const phase=frame/119;canvas.scrollLeft=maxLeft*Math.abs(Math.sin(phase*Math.PI*2));canvas.scrollTop=maxTop*Math.abs(Math.sin(phase*Math.PI*3));frame++;if(frame<120)requestAnimationFrame(tick);else{const sorted=samples.slice(1).sort((a,b)=>a-b),pct=p=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))];resolve({cards:document.querySelectorAll('.node-card').length,width:canvas.scrollWidth,height:canvas.scrollHeight,p50:pct(.5),p95:pct(.95),max:sorted.at(-1),over20:sorted.filter(x=>x>20).length});}};requestAnimationFrame(tick);
        })`);
        console.log(`PAN ${basename(plan)} ${JSON.stringify(panBenchmark)}`);
      }
      if (basename(plan).toLowerCase() === 'batch_hash_table_build.sqlplan') {
        const timeState = await evaluate(`(() => {document.querySelector('[data-metric="time"]').click();return {notice:document.getElementById('metricNotice').textContent,elapsedBars:document.querySelectorAll('.time-elapsed').length}})()`);
        if (!timeState.notice || timeState.elapsedBars) failures.push(`${plan}: missing elapsed time is represented as measured data: ${JSON.stringify(timeState)}`);
      }
    } catch (error) {
      failures.push(`${plan}: ${error.message}`);
    }
  }
  await evaluate(`document.getElementById('planNameInput').value='Smoke custom name'; document.getElementById('pasteBox').value = ${JSON.stringify(repeatedSubplan)}; document.getElementById('parsePasteBtn').click()`);
  await retry(async () => {
    const snapshot = await evaluate("({title:document.getElementById('planTitle').textContent,zones:document.querySelectorAll('.subplan-zone').length,calls:document.querySelectorAll('.edge.call').length})");
    if (snapshot.title!=='Smoke custom name'||!snapshot.zones || snapshot.calls < 2) throw new Error(`Custom name or reusable subplan rendering failed: ${JSON.stringify(snapshot)}`);
    reusableZones += snapshot.zones;
  });
  const structure = await evaluate(`(() => {
    const card=id=>document.querySelector('.node-card[data-subplan="false"][data-node-id="'+id+'"]');
    const root=card('0'),left=card('1'),right=card('4');
    const center=el=>el?el.offsetLeft+el.offsetWidth/2:null;
    const toggle=document.querySelector('.tree-toggle'),bar=document.querySelector('.tree-bar'),metrics=document.querySelector('.tree-metrics'),value=document.querySelector('.tree-value');
    const version=document.querySelector('.app-version'),versionStyle=getComputedStyle(version);
    return {rootTop:root?.offsetTop,rootBottom:root?root.offsetTop+root.offsetHeight:null,leftTop:left?.offsetTop,rightTop:right?.offsetTop,rootX:center(root),leftX:center(left),rightX:center(right),detailsButton:Boolean(document.getElementById('detailsBtn')),flagSvg:Boolean(document.querySelector('#languageFlag svg')),emojiLanguage:Array.from(document.querySelectorAll('#languageSelect option')).some(option=>!['Русский','English'].includes(option.textContent)),version:version.textContent,versionFont:parseFloat(versionStyle.fontSize),versionColor:versionStyle.color,toggleFont:parseFloat(getComputedStyle(toggle).fontSize),toggleOpacity:getComputedStyle(toggle).opacity,hoverNone:matchMedia('(hover: none)').matches,barBackground:getComputedStyle(bar).backgroundColor,barMask:getComputedStyle(bar,'::before').backgroundColor,metricsBackground:getComputedStyle(metrics).backgroundColor,metricsZ:getComputedStyle(metrics).zIndex,nameZ:getComputedStyle(document.querySelector('.tree-name')).zIndex,metricsWidth:metrics.getBoundingClientRect().width,contentsWidth:bar.getBoundingClientRect().width+value.getBoundingClientRect().width};
  })()`);
  if (structure.rootTop === undefined || structure.leftTop <= structure.rootBottom || structure.rightTop <= structure.rootBottom || !(structure.leftX < structure.rootX && structure.rootX < structure.rightX)) failures.push(`Top-down graph layout failed: ${JSON.stringify(structure)}`);
  if (structure.detailsButton || !structure.flagSvg || structure.emojiLanguage) failures.push(`Toolbar or embedded language flags failed: ${JSON.stringify(structure)}`);
  if (structure.version!=='v0.2.6' || structure.versionFont>11 || structure.versionColor==='rgb(237, 241, 247)') failures.push(`Application version label failed: ${JSON.stringify(structure)}`);
  if (structure.toggleFont < 20 || (structure.toggleOpacity !== '0' && !structure.hoverNone) || structure.barBackground === 'rgba(0, 0, 0, 0)' || structure.barMask === 'rgba(0, 0, 0, 0)' || structure.metricsBackground === 'rgba(0, 0, 0, 0)' || Number(structure.metricsZ) <= Number(structure.nameZ) || structure.metricsWidth <= structure.contentsWidth) failures.push(`Tree controls or opaque metric column failed: ${JSON.stringify(structure)}`);

  const collapseBefore = await evaluate(`(() => {document.querySelector('.tree-row').click();const toggle=document.querySelector('.tree-row .tree-toggle'),r=toggle.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;return {before:document.querySelectorAll('.tree-row').length,selectedBefore:document.querySelectorAll('.tree-row.selected').length,x,y,hitToggle:Boolean(document.elementFromPoint(x,y)?.closest('[data-toggle]'))}})()`);
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:collapseBefore.x,y:collapseBefore.y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:collapseBefore.x,y:collapseBefore.y,button:'left',clickCount:1});
  const collapseMiddle = await evaluate(`(() => {const toggle=document.querySelector('.tree-row .tree-toggle'),r=toggle.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;return {collapsed:document.querySelectorAll('.tree-row').length,selectedCollapsed:document.querySelectorAll('.tree-row.selected').length,x,y,hitToggle:Boolean(document.elementFromPoint(x,y)?.closest('[data-toggle]'))}})()`);
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:collapseMiddle.x,y:collapseMiddle.y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:collapseMiddle.x,y:collapseMiddle.y,button:'left',clickCount:1});
  const collapseAfter = await evaluate(`(() => {const result={expanded:document.querySelectorAll('.tree-row').length,selectedExpanded:document.querySelectorAll('.tree-row.selected').length};document.querySelector('.tree-row').click();return result})()`);
  const collapse = {...collapseBefore,...collapseMiddle,...collapseAfter};
  if (!(collapse.collapsed < collapse.before && collapse.expanded === collapse.before && collapse.selectedBefore===1 && collapse.selectedCollapsed===1 && collapse.selectedExpanded===1)) failures.push(`Tree collapse or toggle selection isolation failed: ${JSON.stringify(collapse)}`);
  if (!collapseBefore.hitToggle || !collapseMiddle.hitToggle) failures.push(`Tree toggle is covered in pointer hit-testing: ${JSON.stringify(collapse)}`);
  const expandAll = await evaluate(`(() => {const button=document.getElementById('expandAllBtn'),before=document.querySelectorAll('.tree-row').length;document.querySelector('.tree-row .tree-toggle').click();const collapsed=document.querySelectorAll('.tree-row').length,enabled=!button.disabled,label=button.textContent,metricLabel=Boolean(document.querySelector('.metric-switch .label'));button.click();return {before,collapsed,expanded:document.querySelectorAll('.tree-row').length,enabled,disabledAfter:button.disabled,label,metricLabel}})()`);
  if (!(expandAll.collapsed<expandAll.before && expandAll.expanded===expandAll.before && expandAll.enabled && expandAll.disabledAfter) || expandAll.label!=='Expand all' || expandAll.metricLabel) failures.push(`Expand-all tree control failed: ${JSON.stringify(expandAll)}`);

  const rowsMetric = await evaluate(`(() => {
    document.querySelector('[data-metric="rows"]').click();
    const segments=nodeId=>{
      const graphCard=document.querySelector('.node-card[data-subplan="false"][data-node-id="'+nodeId+'"]');
      const row=document.querySelector('.tree-row[data-id="'+graphCard.dataset.id+'"]');
      return Array.from(row.querySelectorAll('.rows-segment')).map(segment=>({series:segment.dataset.series,left:parseFloat(segment.style.left)||0,width:parseFloat(segment.style.width)||0,severity:Array.from(segment.classList).find(value=>value.startsWith('severity-'))}));
    };
    return {high:segments('1'),low:segments('4'),legend:document.querySelectorAll('#metricNotice .metric-dot').length};
  })()`);
  const highEstimate=rowsMetric.high.find(segment=>segment.series==='estimate'),highActual=rowsMetric.high.find(segment=>segment.series==='actual');
  const lowEstimate=rowsMetric.low.find(segment=>segment.series==='estimate'),lowActual=rowsMetric.low.find(segment=>segment.series==='actual');
  if (!highEstimate || !highActual || Math.abs(highEstimate.width-1)>0.1 || Math.abs(highActual.left-1)>0.1 || Math.abs(highActual.width-99)>0.1 || highActual.severity!=='severity-2' || !lowEstimate || !lowActual || Math.abs(lowEstimate.width-1)>0.1 || lowEstimate.severity!=='severity-4' || rowsMetric.legend!==4) failures.push(`Rows metric scale or estimate/actual segments failed: ${JSON.stringify(rowsMetric)}`);
  await evaluate(`document.querySelector('[data-metric="time"]').click()`);
  const timeMetric = await evaluate(`(() => {
    const series=nodeId=>{
      const card=document.querySelector('.node-card[data-subplan="false"][data-node-id="'+nodeId+'"]');
      const row=document.querySelector('.tree-row[data-id="'+card.dataset.id+'"]');
      const width=name=>parseFloat(row.querySelector('[data-series="'+name+'"]').style.width)||0;
      return {elapsed:width('elapsed'),current:width('current'),value:row.querySelector('.tree-value').textContent};
    };
    return {root:series('0'),child:series('1'),legend:document.querySelectorAll('#metricNotice .metric-dot').length};
  })()`);
  if (Math.abs(timeMetric.root.elapsed-100)>0.1 || Math.abs(timeMetric.root.current-(178200/351000*100))>0.1 || timeMetric.root.value!=='2.97 min' || Math.abs(timeMetric.child.elapsed-(172800/351000*100))>0.1 || timeMetric.child.current!==0 || timeMetric.child.value!=='0 ms' || timeMetric.legend!==2) failures.push(`Time metric elapsed/current-operator scale failed: ${JSON.stringify(timeMetric)}`);
  const graphOperatorStats = await evaluate(`(() => {
    const value=nodeId=>document.querySelector('.node-card[data-subplan="false"][data-node-id="'+nodeId+'"] .node-stats .stat:nth-child(2) .stat-value').textContent;
    return {root:value('0'),child:value('4')};
  })()`);
  if (graphOperatorStats.root!=='2.97 min / 0' || graphOperatorStats.child!=='200 ms / 0.2') failures.push(`Graph cards do not show current-operator time/cost: ${JSON.stringify(graphOperatorStats)}`);

  const treePoint = await evaluate(`(() => {const tree=document.getElementById('tree');tree.scrollLeft=0;const r=tree.getBoundingClientRect();return {x:r.right-25,y:r.top+80,left:r.left+25,canPan:tree.scrollWidth>tree.clientWidth}})()`);
  if (treePoint.canPan) {
    await send('Input.dispatchMouseEvent',{type:'mousePressed',x:treePoint.x,y:treePoint.y,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:treePoint.left,y:treePoint.y,button:'left',buttons:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:treePoint.left,y:treePoint.y,button:'left',clickCount:1});
  }
  const horizontalPan = await evaluate("document.getElementById('tree').scrollLeft");
  if (treePoint.canPan && horizontalPan <= 0) failures.push(`Tree horizontal drag failed: ${JSON.stringify({treePoint,horizontalPan})}`);

  const wheelPoint = await evaluate(`(() => {const tree=document.getElementById('tree');tree.style.maxHeight='120px';tree.scrollTop=0;const r=tree.getBoundingClientRect();return {x:r.left+40,y:r.top+60}})()`);
  await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:wheelPoint.x,y:wheelPoint.y,deltaX:0,deltaY:120});
  await delay(100);
  const verticalWheel = await evaluate(`(() => {const tree=document.getElementById('tree');const top=tree.scrollTop;tree.style.maxHeight='';return top})()`);
  if (verticalWheel <= 0) failures.push(`Tree vertical wheel scrolling failed: ${verticalWheel}`);

  const targetId = await evaluate("document.querySelector('.node-card[data-subplan=\"false\"][data-node-id=\"4\"]').dataset.id");
  await evaluate(`document.querySelector('.tree-row[data-id=${JSON.stringify(targetId)}]').click()`);
  await delay(500);
  const camera = await evaluate(`(() => {const canvas=document.getElementById('canvasWrap'),card=document.querySelector('.node-card[data-id=${JSON.stringify(targetId)}]'),drawer=document.getElementById('detailsDrawer');const expectedLeft=Math.max(0,Math.min(canvas.scrollWidth-canvas.clientWidth,(card.offsetLeft+card.offsetWidth/2)-canvas.clientWidth/2));const expectedTop=Math.max(0,Math.min(canvas.scrollHeight-canvas.clientHeight,(card.offsetTop+card.offsetHeight/2)-canvas.clientHeight/2));return {selected:card.classList.contains('selected'),drawer:drawer.classList.contains('open'),leftError:Math.abs(canvas.scrollLeft-expectedLeft),topError:Math.abs(canvas.scrollTop-expectedTop)}})()`);
  if (!camera.selected || !camera.drawer || camera.leftError > 3 || camera.topError > 3) failures.push(`Tree-to-graph camera focus failed: ${JSON.stringify(camera)}`);
  const repeatedSelection = await evaluate(`(() => {document.querySelector('.tree-row[data-id=${JSON.stringify(targetId)}]').click();return {selected:document.querySelectorAll('.node-card.selected').length,drawer:document.getElementById('detailsDrawer').classList.contains('open')}})()`);
  if (repeatedSelection.selected || repeatedSelection.drawer) failures.push(`Repeated node click did not clear selection: ${JSON.stringify(repeatedSelection)}`);

  const graphToTreeId = await evaluate("document.querySelector('.node-card[data-subplan=\"true\"][data-node-id=\"3\"]').dataset.id");
  await evaluate(`(() => {const tree=document.getElementById('tree');tree.style.maxHeight='120px';tree.scrollTop=0;document.querySelector('.tree-row .tree-toggle').click();document.querySelector('.node-card[data-id=${JSON.stringify(graphToTreeId)}]').click()})()`);
  await delay(500);
  const graphToTree = await evaluate(`(() => {const tree=document.getElementById('tree'),row=document.querySelector('.tree-row[data-id=${JSON.stringify(graphToTreeId)}]');const result={rows:document.querySelectorAll('.tree-row').length,exists:Boolean(row),selected:row?.classList.contains('selected'),scrollTop:tree.scrollTop,drawer:document.getElementById('detailsDrawer').classList.contains('open')};tree.style.maxHeight='';return result})()`);
  if (!graphToTree.exists || !graphToTree.selected || graphToTree.rows<=1 || graphToTree.scrollTop<=0 || !graphToTree.drawer) failures.push(`Graph-to-tree camera focus failed: ${JSON.stringify(graphToTree)}`);

  const elapsedDetails = await evaluate(`(() => {const card=id=>document.querySelector('.node-card[data-node-id="'+id+'"]'),rowValue=id=>document.querySelector('.tree-row[data-id="'+card(id).dataset.id+'"] .tree-value').textContent;card('0').click();const rootText=document.getElementById('drawerBody').textContent,rootValue=rowValue('0');card('1').click();const bridgedText=document.getElementById('drawerBody').textContent,bridgedValue=rowValue('1');card('7').click();const deepText=document.getElementById('drawerBody').textContent,deepValue=rowValue('7');return {actual:rootText.includes('5.85 min'),exclusive:rootText.includes('≈ 2.97 min'),cpu:rootText.includes('1.56 min'),rootValue,bridged:bridgedText.includes('≈ 0 ms'),bridgedValue,deep:deepText.includes('≈ 2.80 s'),deepValue,note:Boolean(document.querySelector('#drawerBody .detail-note'))}})()`);
  if (!elapsedDetails.actual || !elapsedDetails.exclusive || !elapsedDetails.cpu || elapsedDetails.rootValue!=='2.97 min' || !elapsedDetails.bridged || elapsedDetails.bridgedValue!=='0 ms' || !elapsedDetails.deep || elapsedDetails.deepValue!=='2.80 s' || !elapsedDetails.note) failures.push(`Elapsed-time details or displayed current-operator estimate failed: ${JSON.stringify(elapsedDetails)}`);
  const collapsedDetails = await evaluate(`(() => {
    document.querySelector('.node-card[data-subplan="false"][data-node-id="0"]').click();
    const sections=Array.from(document.querySelectorAll('#drawerBody details.detail-collapsible'));
    const initial=sections.map(section=>section.open),labels=sections.map(section=>section.querySelector('summary').textContent),cpuLabel=document.getElementById('drawerBody').textContent.includes('Actual elapsed CPU time');
    sections[0].querySelector('summary').click();const opened=sections[0].open;
    sections[0].querySelector('summary').click();const closedAgain=!sections[0].open;
    return {count:sections.length,initial,labels,cpuLabel,opened,closedAgain};
  })()`);
  if (collapsedDetails.count!==3 || collapsedDetails.initial.some(Boolean) || !collapsedDetails.cpuLabel || !collapsedDetails.opened || !collapsedDetails.closedAgain) failures.push(`Collapsed detail sections or CPU label failed: ${JSON.stringify(collapsedDetails)}`);

  const emptySelection = await evaluate(`(() => {document.querySelector('.node-card[data-subplan="false"][data-node-id="4"]').click();const opened=document.getElementById('detailsDrawer').classList.contains('open');document.getElementById('graph').dispatchEvent(new MouseEvent('click',{bubbles:true}));return {opened,selected:document.querySelectorAll('.node-card.selected').length,drawer:document.getElementById('detailsDrawer').classList.contains('open')}})()`);
  if (!emptySelection.opened || emptySelection.selected || emptySelection.drawer) failures.push(`Empty graph click did not clear selection: ${JSON.stringify(emptySelection)}`);

  const lockState = await evaluate(`(() => {
    document.querySelector('.node-card[data-subplan="false"][data-node-id="0"]').click();
    const drawerOpened=document.getElementById('detailsDrawer').classList.contains('open');
    const check=document.getElementById('hideDetailsCheck');check.checked=true;check.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('.node-card[data-subplan="false"][data-node-id="4"]').click();
    const stayedClosed=!document.getElementById('detailsDrawer').classList.contains('open')&&document.getElementById('detailsHandle').classList.contains('visible');
    document.getElementById('detailsHandle').click();
    return {drawerOpened,stayedClosed,unlocked:document.getElementById('detailsDrawer').classList.contains('open')};
  })()`);
  const graphWheel = await evaluate(`(() => {const canvas=document.getElementById('canvasWrap');canvas.scrollTop=0;const before=document.getElementById('zoomLabel').textContent,canScroll=canvas.scrollHeight>canvas.clientHeight;canvas.dispatchEvent(new WheelEvent('wheel',{deltaY:140,clientX:100,clientY:100,cancelable:true,bubbles:true}));return {top:canvas.scrollTop,before,after:document.getElementById('zoomLabel').textContent,canScroll}})()`);
  if ((graphWheel.canScroll && graphWheel.top<=0) || graphWheel.after!==graphWheel.before) failures.push(`Plain graph wheel did not scroll without zooming: ${JSON.stringify(graphWheel)}`);
  const interaction = await evaluate(`(() => {
    const language=document.getElementById('languageSelect');language.value='ru';language.dispatchEvent(new Event('change',{bubbles:true}));
    const russian=document.getElementById('menuBtn').textContent,ruFlag=Boolean(document.querySelector('#languageFlag svg'));
    language.value='en';language.dispatchEvent(new Event('change',{bubbles:true}));
    const english=document.getElementById('menuBtn').textContent,enFlag=Boolean(document.querySelector('#languageFlag svg'));
    const canvas=document.getElementById('canvasWrap');const before=document.getElementById('zoomLabel').textContent;canvas.dispatchEvent(new WheelEvent('wheel',{deltaY:-150,ctrlKey:true,clientX:100,clientY:100,cancelable:true,bubbles:true}));const after=document.getElementById('zoomLabel').textContent;
    document.getElementById('menuBtn').click();
    return {russian,english,ruFlag,enFlag,before,after,homeVisible:!document.getElementById('homeSidebar').classList.contains('hidden'),viewerButtonsHidden:document.getElementById('menuBtn').classList.contains('hidden')&&document.getElementById('historyBtn').classList.contains('hidden'),languageSaved:localStorage.getItem('sql-plan-language')};
  })()`);
  if (!lockState.drawerOpened || !lockState.stayedClosed || !lockState.unlocked) failures.push(`Graph click or details locking failed: ${JSON.stringify(lockState)}`);
  if (interaction.russian !== 'Возврат в меню' || interaction.english !== 'Back to menu' || !interaction.ruFlag || !interaction.enFlag || interaction.languageSaved !== 'en') failures.push(`Language switching failed: ${JSON.stringify(interaction)}`);
  if (interaction.before === interaction.after) failures.push(`Graph zoom failed: ${JSON.stringify(interaction)}`);
  if (!interaction.homeVisible || !interaction.viewerButtonsHidden) failures.push(`Home screen state failed: ${JSON.stringify(interaction)}`);
  await evaluate(`document.getElementById('pasteBox').value=${JSON.stringify(mixedModeTiming)};document.getElementById('parsePasteBtn').click()`);
  await retry(async () => {
    const visible=await evaluate("document.getElementById('viewer').classList.contains('visible') && document.querySelectorAll('.node-card').length===6");
    if (!visible) throw new Error('Mixed-mode timing plan did not render');
  });
  const mixedTiming = await evaluate(`(() => {
    document.querySelector('[data-metric="time"]').click();
    const series=nodeId=>{
      const card=document.querySelector('.node-card[data-subplan="false"][data-node-id="'+nodeId+'"]'),row=document.querySelector('.tree-row[data-id="'+card.dataset.id+'"]');
      const width=name=>parseFloat(row.querySelector('[data-series="'+name+'"]').style.width)||0;
      return {elapsed:width('elapsed'),current:width('current'),value:row.querySelector('.tree-value').textContent};
    };
    return {root:series('0'),sort:series('1'),inner:series('2'),leaf:series('3'),legend:document.getElementById('metricNotice').textContent};
  })()`);
  if (Math.abs(mixedTiming.root.elapsed-100)>0.1 || Math.abs(mixedTiming.root.current-20)>0.1 || mixedTiming.root.value!=='10.00 s' || Math.abs(mixedTiming.sort.elapsed-20)>0.1 || Math.abs(mixedTiming.sort.current-20)>0.1 || mixedTiming.sort.value!=='10.00 s' || Math.abs(mixedTiming.inner.elapsed-60)>0.1 || Math.abs(mixedTiming.inner.current-10)>0.1 || mixedTiming.inner.value!=='5.00 s' || mixedTiming.leaf.value!=='25.00 s' || mixedTiming.legend.includes('CPU')) failures.push(`Mixed Row/Batch elapsed-time estimate failed: ${JSON.stringify(mixedTiming)}`);
  await evaluate(`document.getElementById('menuBtn').click();document.getElementById('pasteBox').value=${JSON.stringify(repeatedExecutionRows)};document.getElementById('parsePasteBtn').click()`);
  await retry(async () => {
    if (!await evaluate("document.getElementById('viewer').classList.contains('visible') && document.querySelectorAll('.node-card').length===3")) throw new Error('Rows-per-execution plan did not render');
  });
  const rowsPerExecution = await evaluate(`(() => {
    document.querySelector('[data-metric="rows"]').click();
    const card=id=>document.querySelector('.node-card[data-subplan="false"][data-node-id="'+id+'"]');
    const row=id=>document.querySelector('.tree-row[data-id="'+card(id).dataset.id+'"]');
    const graphValue=id=>card(id).querySelector('.node-stats .stat:first-child .stat-value').textContent;
    card('1').click();
    const details=Object.fromEntries(Array.from(document.querySelectorAll('#drawerBody .kv')).map(item=>[item.querySelector('.k').textContent,item.lastElementChild.textContent]));
    return {treeOne:row('1').querySelector('.tree-value').textContent,treeParallel:row('2').querySelector('.tree-value').textContent,graphOne:graphValue('1'),graphParallel:graphValue('2'),nodeOneAlert:Boolean(card('1').querySelector('[data-alert="rows"]')),estimated:details['Estimated rows per execution'],actualPerExecution:details['Actual rows per execution'],actualAllExecutions:details['Actual rows for all executions'],executions:details.Executions};
  })()`);
  if (rowsPerExecution.treeOne!=='1 / 1' || rowsPerExecution.treeParallel!=='2 / 4' || rowsPerExecution.graphOne!=='1 / 1' || rowsPerExecution.graphParallel!=='2 / 4' || rowsPerExecution.nodeOneAlert || rowsPerExecution.estimated!=='1' || rowsPerExecution.actualPerExecution!=='1' || rowsPerExecution.actualAllExecutions!=='39.55K' || rowsPerExecution.executions!=='39.55K') failures.push(`Rows per execution normalization failed: ${JSON.stringify(rowsPerExecution)}`);
  await evaluate(`document.getElementById('menuBtn').click();document.getElementById('pasteBox').value=${JSON.stringify(longSqlPlan)};document.getElementById('parsePasteBtn').click()`);
  await retry(async () => {
    if (!await evaluate("document.getElementById('viewer').classList.contains('visible')")) throw new Error('Long-SQL plan did not render');
  });
  const textViewers = await evaluate(`(async() => {
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__copiedText=value}}});
    document.getElementById('queryBtn').click();
    const modal=document.getElementById('queryModal'),text=document.getElementById('queryText'),card=modal.querySelector('.modal-card'),rect=card.getBoundingClientRect();
    text.scrollTop=text.scrollHeight;text.scrollLeft=text.scrollWidth;
    document.getElementById('copyTextBtn').click();await new Promise(resolve=>setTimeout(resolve,0));
    const query={length:text.textContent.length,exact:text.textContent===${JSON.stringify(longSqlBatch)},hasTail:text.textContent.endsWith(${JSON.stringify(longSqlTail)}),tabs:document.querySelectorAll('.statement-tab').length,vertical:text.scrollHeight>text.clientHeight,horizontal:text.scrollWidth>text.clientWidth,atBottom:Math.abs(text.scrollHeight-text.clientHeight-text.scrollTop)<2,atRight:Math.abs(text.scrollWidth-text.clientWidth-text.scrollLeft)<2,insideViewport:rect.top>=0&&rect.bottom<=innerHeight,overflowX:getComputedStyle(text).overflowX,copied:window.__copiedText===text.textContent,title:document.getElementById('textModalTitle').textContent,copyLabel:document.getElementById('copyTextBtn').textContent};
    document.getElementById('rawPlanBtn').click();text.scrollLeft=text.scrollWidth;window.__copiedText='';document.getElementById('copyTextBtn').click();await new Promise(resolve=>setTimeout(resolve,0));
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('permission denied')}}});window.__fallbackCopied='';document.execCommand=command=>{window.__fallbackCopied=document.activeElement?.value||'';return command==='copy'};document.getElementById('copyTextBtn').click();await new Promise(resolve=>setTimeout(resolve,0));
    const raw={exact:text.textContent===${JSON.stringify(longSqlPlan)},horizontal:text.scrollWidth>text.clientWidth,scrolled:text.scrollLeft>0,copied:window.__copiedText===text.textContent,fallbackCopied:window.__fallbackCopied===text.textContent,title:document.getElementById('textModalTitle').textContent,button:document.getElementById('rawPlanBtn').textContent,adjacent:document.getElementById('queryBtn').nextElementSibling===document.getElementById('rawPlanBtn')};
    return {query,raw};
  })()`);
  const longQuery=textViewers.query,rawPlan=textViewers.raw;
  if (!longQuery.exact || longQuery.length!==longSqlBatch.length || !longQuery.hasTail || longQuery.tabs!==2 || !longQuery.vertical || !longQuery.horizontal || !longQuery.atBottom || !longQuery.atRight || !longQuery.insideViewport || !['auto','scroll'].includes(longQuery.overflowX) || !longQuery.copied || longQuery.title!=='Query text' || longQuery.copyLabel!=='Copy') failures.push(`Long SQL batch viewer failed: ${JSON.stringify(longQuery)}`);
  if (!rawPlan.exact || !rawPlan.horizontal || !rawPlan.scrolled || !rawPlan.copied || !rawPlan.fallbackCopied || rawPlan.title!=='Raw XML plan' || rawPlan.button!=='Show raw plan' || !rawPlan.adjacent) failures.push(`Raw plan viewer failed: ${JSON.stringify(rawPlan)}`);
  if (plans.length > 10 && (!timeAlerts || !rowAlerts || maxIndent <= 105)) failures.push(`PEV2 alerts or deep indentation missing: ${JSON.stringify({timeAlerts,rowAlerts,maxIndent})}`);
  socket.close();
  if (browserErrors.length) failures.push(...browserErrors.map(x => `Browser exception: ${x}`));
  if (failures.length) {
    console.error(failures.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`OK: ${plans.length} SQL Server plans opened in Chromium; ${reusableZones} reusable-subplan zones; ${timeAlerts} time alerts; ${rowAlerts} row-estimate alerts`);
  }
} finally {
  browser.kill();
  await delay(200);
  rmSync(profile, { recursive: true, force: true });
}
