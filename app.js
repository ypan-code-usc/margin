/* Margin — clean edition (no Lean/formalization features)
 * All status is derived from proof.text presence and dependency graph only.
 */

/* ============================ default sample data ============================ */
const SAMPLE = {
 project:{title:"Systolic inequalities on Finsler ℝP²"},
 nodes:[
  {id:"def:convex-body",kind:"definition",title:"Convex body about the origin",statement:"A <i>convex body about the origin</i> in $\\mathbb{R}^n$ is a compact convex set $K\\subset\\mathbb{R}^n$ with $0\\in\\operatorname{int}K$. We do <i>not</i> assume $K=-K$.",uses:[],proof:null},
  {id:"def:gauge",kind:"definition",title:"Gauge (asymmetric Minkowski norm)",statement:"The <i>gauge</i> of $K$ is $\\|x\\|_K=\\inf\\{\\,t\\ge 0:x\\in tK\\,\\}$. Positively homogeneous and subadditive, with $\\|x\\|_K\\neq\\|{-}x\\|_K$ in general.",uses:["def:convex-body"],proof:null},
  {id:"def:polar",kind:"definition",title:"Polar body",statement:"$K^\\circ=\\{\\,y:\\langle x,y\\rangle\\le 1\\ \\forall x\\in K\\,\\}$, with $(K^\\circ)^\\circ=K$.",uses:["def:convex-body"],proof:null},
  {id:"def:reversible",kind:"definition",title:"Reversibility",statement:"$K$ is <i>reversible</i> if $\\|x\\|_K=\\|{-}x\\|_K$ for all $x$, i.e. $K=-K$.",uses:["def:gauge"],proof:null},
  {id:"lem:gauge-support",kind:"lemma",title:"Gauge equals support function of the polar",statement:"For every $x$, $\\|x\\|_K=h_{K^\\circ}(x)=\\sup_{y\\in K^\\circ}\\langle x,y\\rangle.$",uses:["def:gauge","def:polar"],proof:{uses:["def:gauge","def:polar"],text:"Combine the radial–support duality $\\rho_K(x)\\,h_{K^\\circ}(x)=1$ with $\\|x\\|_K=1/\\rho_K(x)$."}},
  {id:"def:ht-volume",kind:"definition",title:"Holmes–Thompson volume (linear case)",statement:"On $(\\mathbb{R}^n,\\|\\cdot\\|_K)$ the <i>Holmes–Thompson volume</i> uses the density $\\tfrac{1}{\\omega_n}\\operatorname{vol}(K^\\circ)$ times Lebesgue measure.",uses:["def:gauge","def:polar"],proof:null},
  {id:"def:finsler-metric",kind:"definition",title:"Finsler metric",statement:"A <i>Finsler metric</i> on $M$ assigns to each $p$ a gauge $F_p=\\|\\cdot\\|_{K_p}$ on $T_pM$, $K_p$ strongly convex, varying smoothly. Non-reversible $K_p$ gives a quasi-metric.",uses:["def:gauge"],proof:null},
  {id:"def:systole",kind:"definition",title:"Systole",statement:"For Finsler $F$ on $\\mathbb{RP}^2$, $\\operatorname{sys}(F)$ is the infimum of $F$-lengths of non-contractible closed curves.",uses:["def:finsler-metric"],proof:null},
  {id:"thm:finsler-pu",kind:"theorem",title:"Finsler isosystolic inequality on ℝP²",statement:"There is $c>0$ with $\\operatorname{sys}(F)^2\\le c\\,\\operatorname{vol}_{HT}(\\mathbb{RP}^2,F)$ for every normalised Finsler $F$ on $\\mathbb{RP}^2$, generalising Pu’s inequality.",uses:["def:systole","def:ht-volume"],proof:{uses:["lem:gauge-support","def:ht-volume","def:systole"],text:"Crofton-type lower bound for the Holmes–Thompson volume in terms of the systole."}}
 ]
};

/* ===================== global knowledge set library ===================== */
let globalSets=[]; // [{id,name,nodes:[]}]  — shared across projects
let gsCounter=0;
let gsPreviewId=null; // which global set is currently being previewed
let gsEditingNodeIdx=null; // null=none, -1=adding new, n=editing index n

/* ===================== preferences ===================== */
const ACCENT_PRESETS=[
  {name:'Terracotta',accent:'#C96442',soft:'#F4E9E2',ink:'#B0512F'},
  {name:'Indigo',accent:'#5B6FBE',soft:'#EAECF6',ink:'#4558A8'},
  {name:'Sage',accent:'#4E8A6F',soft:'#E5F0EA',ink:'#3A6E58'},
  {name:'Plum',accent:'#7B5EA7',soft:'#EDE8F4',ink:'#6349A0'},
  {name:'Slate',accent:'#3E6E8E',soft:'#E0EBF3',ink:'#2F5A78'},
];
let prefs={theme:'light',accentIdx:0,name:'',anthropicKey:'',openaiKey:'',geminiKey:'',model:'claude-sonnet-4-6',baseUrl:''};

function loadPrefs(){
  try{
    const saved=localStorage.getItem('margin-prefs');
    if(saved) prefs=Object.assign({},prefs,JSON.parse(saved));
  }catch(e){}
  applyPrefs();
}
function applyPrefs(){
  document.documentElement.setAttribute('data-theme',prefs.theme||'light');
  const a=ACCENT_PRESETS[prefs.accentIdx]||ACCENT_PRESETS[0];
  document.documentElement.style.setProperty('--accent',a.accent);
  document.documentElement.style.setProperty('--accent-soft',a.soft);
  document.documentElement.style.setProperty('--accent-ink',a.ink);
}
function savePrefs(){
  try{localStorage.setItem('margin-prefs',JSON.stringify(prefs));}catch(e){}
}

/* ===================== projects ===================== */
let projects=[]; // [{id,name,data}]
let activeProjectId=null;
let projCounter=0;
const $=s=>document.querySelector(s);
function clone(o){return JSON.parse(JSON.stringify(o));}

const BLANK={project:{title:'Untitled'},nodes:[],sets:[]};
function newProject(name,blueprint){
  projCounter++;
  const id='proj'+projCounter;
  const d=blueprint?clone(blueprint):clone(BLANK);
  if(!d.sets)d.sets=[];
  const resolvedName=name||d.project?.title||'Untitled';
  if(!d.project)d.project={};
  d.project.title=resolvedName;
  projects.push({id,name:resolvedName});
  projectData[id]=d;
  projManualPos[id]={entity:{},node:{}};
  return id;
}
const projectData={}; // id -> data object
const projManualPos={}; // id -> {entity:{}, node:{}}

function showCanvas(){
  const hp=$('#homePage'), gf=$('#graphfull');
  if(hp) hp.classList.remove('visible');
  if(gf) gf.style.display='';
}
function showHome(){
  const hp=$('#homePage'), gf=$('#graphfull');
  if(gf) gf.style.display='none';
  if(hp){ hp.classList.add('visible'); renderHomePage(); }
  $('#homeBtn')?.classList.add('active');
  $('#docName').innerHTML='<b>Home</b>';
}
function goHome(){
  if(activeProjectId){
    projectData[activeProjectId]=clone(data);
    projManualPos[activeProjectId]={entity:clone(entityManualPos),node:clone(nodeManualPos)};
    activeProjectId=null;
    saveAll();
  }
  showHome(); renderProjList();
}

function switchProject(id){
  currentUniverseId=null;
  if(activeProjectId===id){ showCanvas(); return; }
  if(activeProjectId){
    projectData[activeProjectId]=clone(data);
    projManualPos[activeProjectId]={entity:clone(entityManualPos),node:clone(nodeManualPos)};
  }
  activeProjectId=id;
  data=projectData[id];
  if(!data.sets)data.sets=[];
  const pos=projManualPos[id]||{entity:{},node:{}};
  Object.keys(entityManualPos).forEach(k=>delete entityManualPos[k]);
  Object.keys(nodeManualPos).forEach(k=>delete nodeManualPos[k]);
  Object.assign(entityManualPos,pos.entity||{});
  Object.assign(nodeManualPos,pos.node||{});
  showCanvas();
  $('#homeBtn')?.classList.remove('active');
  selected=null; derive(); renderAll(); renderProjList(); fitGraph();
}

let _confirmCallback=null;
let _inlineInputCallback=null;
function showInlineInput(title,current,onSave){
  _inlineInputCallback=onSave;
  $('#confirmMsg').innerHTML=`<b style="display:block;margin-bottom:8px">${title}</b><input id="confirmInput" type="text" style="width:100%;box-sizing:border-box;border:1px solid var(--accent);border-radius:7px;padding:6px 9px;font-size:13px;font-family:var(--font-ui);background:var(--surface);color:var(--ink);outline:none" value="">`;
  $('#confirmYes').textContent='Rename';
  $('#confirmOverlay').style.display='flex';
  const inp=document.getElementById('confirmInput');
  inp.value=current; inp.select(); inp.focus();
  inp.addEventListener('keydown',e=>{
    if(e.key==='Enter') $('#confirmYes').click();
    if(e.key==='Escape') $('#confirmNo').click();
  });
}
function showConfirm(msg,onYes){
  _confirmCallback=onYes;
  $('#confirmMsg').textContent=msg;
  $('#confirmOverlay').style.display='flex';
}
(function(){
  function closeConfirm(){ $('#confirmOverlay').style.display='none'; $('#confirmYes').textContent='Delete'; }
  document.getElementById('confirmYes')?.addEventListener('click',()=>{
    const inpEl=document.getElementById('confirmInput');
    closeConfirm();
    if(_inlineInputCallback){ _inlineInputCallback(inpEl?.value??''); _inlineInputCallback=null; }
    else if(_confirmCallback){ _confirmCallback(); _confirmCallback=null; }
  });
  document.getElementById('confirmNo')?.addEventListener('click',()=>{
    closeConfirm(); _confirmCallback=null; _inlineInputCallback=null;
  });
})();

function deleteProject(id){
  const p=projects.find(x=>x.id===id);
  showConfirm(`Delete project "${p?.name||'Untitled'}"? This cannot be undone.`, ()=>{
    projects=projects.filter(p=>p.id!==id);
    delete projectData[id];
    delete projManualPos[id];
    activeProjectId=null;
    saveAll();
    goHome();
  });
}

function renameProject(id){
  const p=projects.find(x=>x.id===id); if(!p) return;
  showInlineInput(`Rename "${p.name||'Untitled'}"`, p.name||'', newName=>{
    if(!newName.trim()) return;
    p.name=newName.trim();
    if(projectData[id]?.project) projectData[id].project.title=p.name;
    if(activeProjectId===id && data.project) data.project.title=p.name;
    renderProjList();
    if($('#homePage').classList.contains('visible')) renderHomePage();
    saveAll();
  });
}

function renderProjList(){
  const list=$('#projList'); if(!list)return;
  list.innerHTML='';

  // ── Global Knowledge Sets (library) ──────────────────────────────────────
  const gSec=document.createElement('div');
  gSec.className='ps-section';
  const uploadIcon=`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 9l5-5 5 5M12 4v12"/></svg>`;
  gSec.innerHTML=`Global Library<span class="ps-section-line"></span><button class="ps-section-add" id="gsNewBtn" title="Create new knowledge set" style="font-size:14px">+</button><button class="ps-section-add" id="gsUploadBtn" title="Upload knowledge set to library">${uploadIcon}</button>`;
  list.appendChild(gSec);

  if(globalSets.length===0){
    const empty=document.createElement('div');
    empty.style.cssText='font-size:11px;color:var(--ink-faint);padding:4px 10px 8px;line-height:1.4';
    empty.textContent='Create or upload blueprint JSONs to build a reusable library.';
    list.appendChild(empty);
  }
  globalSets.forEach(gs=>{
    const row=document.createElement('button');
    row.className='gset-folder';
    row.draggable=true;
    row.dataset.gsid=gs.id;
    row.innerHTML=`<span class="gs-icon">📂</span><span class="gs-name">${gs.name}</span><span class="gs-count">${gs.nodes.length}</span><button class="gs-del" title="Remove from library">×</button>`;
    row.ondragstart=ev=>{
      ev.dataTransfer.setData('application/x-gsid', gs.id);
      ev.dataTransfer.effectAllowed='copy';
    };
    row.onclick=ev=>{
      if(ev.target.classList.contains('gs-del')){ev.stopPropagation();globalSets=globalSets.filter(g=>g.id!==gs.id);renderProjList();return;}
      openGsPreview(gs.id);
    };
    list.appendChild(row);
  });

  // hidden file input for global set upload
  if(!document.getElementById('gsFileInput')){
    const inp=document.createElement('input');
    inp.type='file'; inp.id='gsFileInput'; inp.accept='.json,application/json';
    inp.style.cssText='position:absolute;opacity:0;pointer-events:none';
    inp.multiple=true;
    inp.onchange=e=>{
      [...e.target.files].forEach(f=>{
        const r=new FileReader();
        r.onload=()=>{
          try{
            const d=JSON.parse(r.result);
            if(!d.nodes||!Array.isArray(d.nodes))throw 0;
            gsCounter++;
            globalSets.push({id:'gs'+gsCounter,name:d.project?.title||f.name.replace(/\.json$/,''),nodes:clone(d.nodes),sets:clone(d.sets||[]),project:clone(d.project||{})});
            renderProjList();
            toast(`Added "${globalSets[globalSets.length-1].name}" to library.`);
          }catch{toast('Couldn\'t parse — expected blueprint.json with a "nodes" array.');}
        };
        r.readAsText(f);
      });
      e.target.value='';
    };
    document.body.appendChild(inp);
  }
  // wire upload button
  const gsBtn=document.getElementById('gsUploadBtn');
  if(gsBtn) gsBtn.onclick=e=>{e.stopPropagation();document.getElementById('gsFileInput').click();};
  // wire new set button
  const gsNewBtn=document.getElementById('gsNewBtn');
  if(gsNewBtn) gsNewBtn.onclick=e=>{e.stopPropagation();createNewGlobalSet();};

  // divider between library and projects
  const div=document.createElement('div'); div.className='ps-divider'; list.appendChild(div);

  // ── Projects ──────────────────────────────────────────────────────────────
  const pSec=document.createElement('div');
  pSec.className='ps-section';
  pSec.innerHTML='Projects<span class="ps-section-line"></span>';
  list.appendChild(pSec);

  projects.forEach(p=>{
    const isActive=p.id===activeProjectId;
    const btn=document.createElement('button');
    btn.className='proj-item'+(isActive?' active':'');
    btn.innerHTML=`<span class="pi-dot"></span><span class="pi-name">${p.name||'Untitled'}</span><button class="pi-ren" title="Rename">✎</button><button class="pi-del" title="Remove" data-pid="${p.id}">×</button>`;
    btn.onclick=ev=>{if(ev.target.closest('.pi-del,.pi-ren'))return; switchProject(p.id);};
    btn.querySelector('.pi-ren').onclick=ev=>{ev.stopPropagation();renameProject(p.id);};
    btn.querySelector('.pi-del').onclick=ev=>{ev.stopPropagation();deleteProject(p.id);};
    list.appendChild(btn);
  });
}

// bootstrap with sample project
let data = clone(SAMPLE);
if(!data.sets) data.sets=[];
let selected = null;
function byId(id){return data.nodes.find(n=>n.id===id);}
function kindLabel(k){return k.charAt(0).toUpperCase()+k.slice(1);}
function isDef(n){return n.kind==='definition';}

/* ===================== knowledge sets ===================== */
let setCounter=0;
const SET_COLORS=['#5B83B0','#B07A4E','#6B8E8A','#A0698E','#8C7BA6','#7A9457'];
function setById(id){return (data.sets||[]).find(s=>s.id===id);}
function setOfNode(nodeId){const n=byId(nodeId); return n&&n.setId?setById(n.setId):null;}
function rootSets(){return (data.sets||[]).filter(s=>!s.parentSetId);}
function childSets(sid){return (data.sets||[]).filter(s=>s.parentSetId===sid);}
function rootSetOf(setId){let s=setById(setId);while(s&&s.parentSetId)s=setById(s.parentSetId);return s;}
function entityIdOfNode(nodeId){const n=byId(nodeId);if(!n||!n.setId)return nodeId;const r=rootSetOf(n.setId);return r?r.id:n.setId;}
function setMembers(s){return (s.nodeIds||[]).map(byId).filter(Boolean);}
function allNodesInSet(sid){const s=setById(sid);if(!s)return[];return[...(s.nodeIds||[]).flatMap(id=>{const n=byId(id);return n?[n]:[]}),...childSets(sid).flatMap(cs=>allNodesInSet(cs.id))];}
function allDescendantSetIds(sid){return[sid,...childSets(sid).flatMap(cs=>allDescendantSetIds(cs.id))];}
function depthOf(sid){let d=0,s=setById(sid);while(s&&s.parentSetId){d++;s=setById(s.parentSetId);}return d;}

/* ===================== derivation — simple proof-text based status ===================== */
function depsOf(n){const s=[...(n.uses||[])];if(n.proof)s.push(...(n.proof.uses||[]));return s.map(byId).filter(Boolean);}
function derive(){
  const map={};
  data.nodes.forEach(n=>map[n.id]=n);
  data.nodes.forEach(n=>{n._proved=isDef(n);n._ready=isDef(n);});
  let changed=true;
  while(changed){
    changed=false;
    data.nodes.forEach(n=>{
      if(isDef(n))return;
      const depsDone=(n.uses||[]).every(id=>{const d=map[id];return d&&d._proved;});
      const proved=depsDone&&!!(n.proof&&(n.proof.text||'').trim());
      if(proved!==n._proved||depsDone!==n._ready)changed=true;
      n._ready=depsDone; n._proved=proved;
    });
  }
}

/* graph box colours by category (kind) — soft earth tones matching the CSS --k-* vars */
const KIND_COLOR={
  definition:{bd:'#5E8B6F',fl:'#EBF1ED'},   // sage green
  lemma:{bd:'#8C7BA6',fl:'#EFECF4'},        // muted lavender
  proposition:{bd:'#8C7BA6',fl:'#EFECF4'},
  theorem:{bd:'#C17A52',fl:'#F6ECE3'},      // terracotta
  corollary:{bd:'#C17A52',fl:'#F6ECE3'},
  remark:{bd:'#A39C8C',fl:'#F0EEE7'},       // warm grey
  example:{bd:'#A39C8C',fl:'#F0EEE7'},
};
function kindColor(n){ return KIND_COLOR[n.kind]||KIND_COLOR.remark; }
function nodeBorderColor(n){ return kindColor(n).bd; }
function nodeFillColor(n){ return n._proved ? kindColor(n).fl : '#ffffff'; }
function checkmark(n){ return n._proved; }

function esc(s){return s.replace(/"/g,'&quot;');}

/* ===================== status chip ===================== */
function statusChip(n){
  if(isDef(n)) return `<span class="chip" style="--cc:${nodeBorderColor(n)};--cf:${nodeFillColor(n)}"><span class="pip"></span>Defined</span>`;
  if(n._proved) return `<span class="chip" style="--cc:${nodeBorderColor(n)};--cf:${nodeFillColor(n)}"><span class="pip"></span>✓ Proved</span>`;
  if(n._ready)  return `<span class="chip" style="--cc:var(--c-canstate);--cf:#fff"><span class="pip"></span>Ready</span>`;
  return `<span class="chip" style="--cc:var(--c-blocked);--cf:#fff"><span class="pip"></span>Waiting on deps</span>`;
}

/* ===================== progress bar ===================== */
function updateProgress(){
  const nonDef=data.nodes.filter(n=>!isDef(n));
  const proved=nonDef.filter(n=>n._proved).length;
  $('#pcd').textContent=proved; $('#pct').textContent=nonDef.length;
  $('#pcb').style.width=nonDef.length?`${proved/nonDef.length*100}%`:'0%';
}

/* ===================== legend ===================== */
function renderLegend(){
  const L=$('#legend');
  const item=(k,lbl)=>{const c=KIND_COLOR[k];return `<span><i style="--bd:${c.bd};--fl:${c.fl}"></i>${lbl}</span>`;};
  L.innerHTML=`<span class="sub">Category</span>${item('definition','Definition')}${item('lemma','Lemma')}${item('theorem','Theorem')}${item('remark','Remark')}<span style="grid-column:1/-1;font-size:9.5px;color:var(--ink-faint)"><i style="--bd:#5E8B6F;--fl:#5E8B6F;width:10px;height:10px"></i>✓ = proved</span>`;
}

/* ===================== auto-layout + graph ===================== */
const NS='http://www.w3.org/2000/svg';
function mk(t,a){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e;}
const BOX_H=34;
function nodeLabel(n){const t=(n.title||'').split('(')[0].trim();return t.length>24?t.slice(0,23)+'…':t;}
function boxW(n){const t=nodeLabel(n);return Math.max(108,Math.min(208,t.length*6.6+52));}
let graphPan={x:0,y:0};
let graphZoom=1;
let nodeManualPos={};
let multiSel=new Set();
let selectMode=false;
let entityManualPos={};
let currentUniverseId = null; // null = root universe

// Objects directly in current universe
function universeNodes() {
  return data.nodes.filter(n => (n.setId || null) === currentUniverseId);
}
function universeSets() {
  return (data.sets || []).filter(s => (s.parentSetId || null) === currentUniverseId);
}

// Map any node ID to the entity (node or set ID) that represents it in the current universe.
// Returns null if the node is external to the current universe.
function nodeToUniverseEntity(nodeId) {
  const n = byId(nodeId); if (!n) return null;
  if ((n.setId || null) === currentUniverseId) return nodeId; // directly in universe
  if (!n.setId) return null; // free node in a different universe (root)
  // Walk up set ancestors to find one whose parentSetId === currentUniverseId
  let sid = n.setId;
  while (sid) {
    const s = setById(sid);
    if (!s) break;
    if ((s.parentSetId || null) === currentUniverseId) return sid; // s is directly in current universe
    sid = s.parentSetId || null;
  }
  return null; // completely external
}

// Build breadcrumb path from root to currentUniverseId
function universePath() {
  const path = [];
  let id = currentUniverseId;
  while (id) {
    const s = setById(id); if (!s) break;
    path.unshift({ id, title: s.title || 'Set' });
    id = s.parentSetId || null;
  }
  path.unshift({ id: null, title: 'Root' });
  return path;
}

function enterUniverse(setId) {
  currentUniverseId = setId;
  selected = null;
  // reset manual positions for new universe view
  Object.keys(entityManualPos).forEach(k => delete entityManualPos[k]);
  closeRelations();
  renderAll();
  requestAnimationFrame(fitGraph);
}

function renderBreadcrumb() {
  const bc = $('#universeBreadcrumb'); if (!bc) return;
  const path = universePath();
  if (path.length <= 1) { bc.style.display = 'none'; return; }
  bc.style.display = 'flex';
  bc.innerHTML = path.map((p, i) => {
    const isLast = i === path.length - 1;
    return `<button class="bc-crumb${isLast ? ' bc-current' : ''}" data-uid="${p.id ?? ''}">${esc(p.title)}</button>${isLast ? '' : '<span class="bc-sep">›</span>'}`;
  }).join('');
  bc.querySelectorAll('.bc-crumb:not(.bc-current)').forEach(btn => {
    btn.onclick = () => {
      currentUniverseId = btn.dataset.uid || null;
      selected = null;
      Object.keys(entityManualPos).forEach(k => delete entityManualPos[k]);
      closeRelations();
      renderAll();
      requestAnimationFrame(fitGraph);
    };
  });
}

function tint(hex,amt=0.86){const c=(hex||'#888').replace('#','');const r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16);const m=v=>Math.round(v+(255-v)*amt);return `rgb(${m(r)},${m(g)},${m(b)})`;}

/* ---- entity-aware layered layout ---- */
const SET_PAD=16, SET_HDR=28, SET_COLLAPSED_H=46;
function setCollapsedW(s){const t=(s.title||'Set');return Math.max(170,Math.min(260,t.length*7.4+76));}
function layeredLayout(ids, depsFn, sizeFn, opt){
  opt=opt||{}; const HGAP=opt.hgap??48, VGAP=opt.vgap??112, TOP=opt.top??40, SIDE=opt.side??30;
  const idset=new Set(ids), memo={};
  function layer(id,seen){ if(id in memo)return memo[id]; seen=seen||new Set(); if(seen.has(id))return 0; seen.add(id);
    const d=depsFn(id).filter(x=>idset.has(x)); const L=d.length?1+Math.max(...d.map(x=>layer(x,seen))):0; memo[id]=L; return L; }
  ids.forEach(id=>layer(id));
  const layers={}; ids.forEach(id=>{(layers[memo[id]]=layers[memo[id]]||[]).push(id);});
  const maxL=Math.max(0,...Object.keys(layers).map(Number));
  // barycenter ordering: sort each layer so nodes are close to their deps in the previous layer
  const xOrd={}; ids.forEach(id=>xOrd[id]=0);
  for(let L=0;L<=maxL;L++){
    const row=layers[L]||[];
    row.forEach(id=>{const deps=depsFn(id).filter(x=>idset.has(x)&&memo[x]<L);
      if(deps.length) xOrd[id]=deps.reduce((s,d)=>s+xOrd[d],0)/deps.length;});
    row.sort((a,b)=>xOrd[a]-xOrd[b]);
    row.forEach((id,i)=>xOrd[id]=i);
    layers[L]=row;
  }
  const layerH={}, layerW={};
  for(let L=0;L<=maxL;L++){const row=layers[L]||[];
    layerW[L]=row.reduce((a,id)=>a+sizeFn(id).w,0)+HGAP*Math.max(0,row.length-1);
    layerH[L]=Math.max(BOX_H,...row.map(id=>sizeFn(id).h));}
  const W=Math.max(420,SIDE*2+Math.max(0,...Object.values(layerW)));
  const pos={}; let y=TOP;
  for(let L=0;L<=maxL;L++){const row=layers[L]||[]; let x=(W-layerW[L])/2; const cy=y+layerH[L]/2;
    row.forEach(id=>{const sz=sizeFn(id); pos[id]={x:x+sz.w/2,y:cy,w:sz.w,h:sz.h}; x+=sz.w+HGAP;});
    y+=layerH[L]+VGAP;}
  return {pos,W,H:Math.max(360,y-VGAP+TOP)};
}
function layoutGraph(){
  const nodes = universeNodes();
  const sets = universeSets();
  const entities = [], entMeta = {};

  nodes.forEach(n => {
    entities.push(n.id);
    entMeta[n.id] = { type: 'node', node: n, w: boxW(n), h: BOX_H };
  });
  sets.forEach(s => {
    entities.push(s.id);
    const nodeCount = allNodesInSet(s.id).length;
    const childCount = childSets(s.id).length;
    entMeta[s.id] = { type: 'set', set: s, w: setCollapsedW(s), h: SET_COLLAPSED_H, nodeCount, childCount };
  });

  const entitySet = new Set(entities);
  const entDeps = id => {
    const meta = entMeta[id];
    if (meta.type === 'node') {
      const n = meta.node;
      return [...new Set([...(n.uses||[]),...(n.proof?.uses||[])])]
        .map(uid => nodeToUniverseEntity(uid))
        .filter(eid => eid && eid !== id && entitySet.has(eid));
    } else {
      const deps = new Set();
      allNodesInSet(id).forEach(n => {
        [...(n.uses||[]),...(n.proof?.uses||[])].forEach(uid => {
          const eid = nodeToUniverseEntity(uid);
          if (eid && eid !== id && entitySet.has(eid)) deps.add(eid);
        });
      });
      return [...deps];
    }
  };

  const L = layeredLayout(entities, entDeps, id => ({ w: entMeta[id].w, h: entMeta[id].h }), { vgap: 72, hgap: 40 });
  entities.forEach(id => { if (entityManualPos[id]) L.pos[id] = { ...L.pos[id], ...entityManualPos[id] }; });

  const nodePos = {};
  nodes.forEach(n => { nodePos[n.id] = L.pos[n.id]; });
  sets.forEach(s => {
    const ep = L.pos[s.id];
    if (ep) allNodesInSet(s.id).forEach(n => { nodePos[n.id] = ep; });
  });

  return { entities, entMeta, entPos: L.pos, nodePos, W: L.W, H: L.H };
}
function computeEdges(lay){
  const { entities, entPos } = lay;
  const entitySet = new Set(entities);
  const edges = [], edgeSet = new Set();

  const stubMap = {}; // externalKey -> {label, targetUniverseId, fromEntities: Set, links:[]}

  function addEdge(fromId, toId) {
    const key = fromId + '|' + toId;
    if (!edgeSet.has(key)) { edgeSet.add(key); edges.push({ from: fromId, to: toId }); }
  }

  function addStub(externalNodeId, fromEntityId) {
    const extNode = byId(externalNodeId); if (!extNode) return;
    const targetUniverseId = extNode.setId || null;
    const key = externalNodeId;
    if (!stubMap[key]) {
      const label = extNode.title?.split('(')[0].trim() || externalNodeId;
      const universeLabel = targetUniverseId ? (setById(targetUniverseId)?.title || 'Set') : 'Root';
      stubMap[key] = { id: key, label, universeLabel, targetUniverseId, fromEntities: new Set(), links: [] };
    }
    stubMap[key].fromEntities.add(fromEntityId);
    stubMap[key].links.push({ from: externalNodeId, to: fromEntityId });
  }

  // Edges from universe nodes
  universeNodes().forEach(child => {
    const tgt = child.id;
    [...new Set([...(child.uses||[]),...(child.proof?.uses||[])])].forEach(pid => {
      const srcEntity = nodeToUniverseEntity(pid);
      if (srcEntity && srcEntity !== tgt && entitySet.has(srcEntity)) {
        addEdge(srcEntity, tgt);
      } else if (!srcEntity) {
        addStub(pid, tgt);
      }
    });
  });

  // Edges from universe sets (aggregate)
  universeSets().forEach(s => {
    allNodesInSet(s.id).forEach(child => {
      [...new Set([...(child.uses||[]),...(child.proof?.uses||[])])].forEach(pid => {
        const srcEntity = nodeToUniverseEntity(pid);
        if (srcEntity && srcEntity !== s.id && entitySet.has(srcEntity)) {
          addEdge(srcEntity, s.id);
        }
      });
    });
  });

  // Transitive reduction: remove edge (u→v) if v is reachable from u via another path.
  // This prevents long-range "skip-layer" edges from cluttering the graph when a blueprint
  // has dense cross-set dependencies.
  const adj = {};
  edges.forEach(e => { (adj[e.from] = adj[e.from] || []).push(e.to); });
  function reachableViaOther(start, end) {
    // BFS from start's neighbors (excluding direct edge to end)
    const visited = new Set();
    const queue = (adj[start] || []).filter(n => n !== end);
    queue.forEach(n => visited.add(n));
    while (queue.length) {
      const cur = queue.shift();
      if (cur === end) return true;
      (adj[cur] || []).forEach(n => { if (!visited.has(n)) { visited.add(n); queue.push(n); } });
    }
    return false;
  }
  // Only apply reduction when there are many set-level entities (node graphs stay as-is)
  const reducedEdges = universeSets().length > 1
    ? edges.filter(e => !reachableViaOther(e.from, e.to))
    : edges;

  const stubs = Object.values(stubMap);
  return { edges: reducedEdges, stubs };
}

function edgePath(a,b){
  const off=BOX_H/2+2;
  return `M ${a.x} ${a.y+off} C ${a.x} ${(a.y+b.y)/2}, ${b.x} ${(a.y+b.y)/2}, ${b.x} ${b.y-off-6}`;
}
function edgePath2(a,b,ha,hb){
  const oa=(ha||BOX_H)/2+4, ob=(hb||BOX_H)/2+8;
  return `M ${a.x} ${a.y+oa} C ${a.x} ${(a.y+b.y)/2}, ${b.x} ${(a.y+b.y)/2}, ${b.x} ${b.y-ob}`;
}

function renderNodeCard(n, p, opts){
  opts=opts||{};
  const isSel=n.id===selected, isDep=opts.selDeps&&opts.selDeps.includes(n.id);
  const col=kindColor(n); const w=boxW(n), h=BOX_H;
  const isMSel=multiSel.has(n.id);
  const grp=mk('g',{class:'node'+(isSel?' sel':'')+(isDep?' dep':'')+(opts.inset?' inset':'')+(isMSel?' multi-sel':''),tabindex:'0',role:'button',
    'aria-label':n.title,id:`node-${n.id}`,transform:`translate(${p.x},${p.y})`});
  grp.appendChild(mk('rect',{class:'ring',x:-w/2-4,y:-h/2-4,width:w+8,height:h+8,rx:12}));
  grp.appendChild(mk('rect',{class:'body',x:-w/2,y:-h/2,width:w,height:h,rx:9,style:`fill:${nodeFillColor(n)};stroke:${nodeBorderColor(n)}`}));
  grp.appendChild(mk('circle',{class:'dot',cx:-w/2+16,cy:0,r:4,style:`fill:${col.bd}`}));
  const clipId=`cl-${n.id.replace(/[^a-z0-9]/gi,'_')}`;
  const clipW=w/2-(checkmark(n)?28:14);
  const defs2=mk('defs'); const cp=mk('clipPath',{id:clipId});
  cp.appendChild(mk('rect',{x:-w/2+27,y:-h/2,width:Math.max(10,clipW-27+w/2),height:h})); defs2.appendChild(cp); grp.appendChild(defs2);
  const t=mk('text',{class:'lab',x:-w/2+27,y:'0','text-anchor':'start','dominant-baseline':'central','clip-path':`url(#${clipId})`});
  t.textContent=nodeLabel(n); grp.appendChild(t);
  if(checkmark(n)){
    const cg=mk('g',{class:'ckbadge',transform:`translate(${w/2-6},${-h/2+6})`});
    cg.appendChild(mk('circle',{cx:'0',cy:'0',r:'6.5',style:'fill:#5E8B6F'}));
    const ck=mk('text',{class:'ck',x:'0',y:'0.5','text-anchor':'middle','dominant-baseline':'central'}); ck.textContent='✓';
    cg.appendChild(ck); grp.appendChild(cg);
  }
  grp.dataset.id=n.id;
  grp.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(n.id,true);}};
  return grp;
}

function renderSetPill(s, ep, meta) {
  const col = s.color || '#888';
  const w = (meta && meta.w) || 180, h = SET_COLLAPSED_H;
  const isSel = selected === s.id;
  const grp = mk('g', {
    class: 'nodeset' + (isSel ? ' sel' : ''),
    'data-role': 'setpill', id: 'set-' + s.id, 'data-setid': s.id,
    transform: `translate(${ep.x},${ep.y})`
  });
  grp.appendChild(mk('rect', { class: 'ss-ring', x: -w/2-4, y: -h/2-4, width: w+8, height: h+8, rx: 14 }));
  const stack = mk('g', { class: 'stack' });
  stack.appendChild(mk('rect', { x: -w/2+7, y: -h/2-7, width: w-14, height: h, rx: 9, style: `fill:${tint(col)};stroke:${col};opacity:.55` }));
  stack.appendChild(mk('rect', { x: -w/2+3.5, y: -h/2-3.5, width: w-7, height: h, rx: 9, style: `fill:${tint(col)};stroke:${col};opacity:.8` }));
  stack.appendChild(mk('rect', { class: 'ss-body', x: -w/2, y: -h/2, width: w, height: h, rx: 9, style: `fill:#fff;stroke:${col}` }));
  grp.appendChild(stack);

  // "enter" arrow icon
  const enterIcon = mk('g', { style: 'pointer-events:none' });
  enterIcon.appendChild(mk('circle', { cx: w/2 - 16, cy: 0, r: 9, style: `fill:${col};opacity:.15` }));
  const enterTxt = mk('text', { x: w/2 - 16, y: 1, 'text-anchor': 'middle', 'dominant-baseline': 'central', style: `fill:${col};font-size:11px;font-family:var(--font-ui);font-weight:700;pointer-events:none` });
  enterTxt.textContent = '→';
  enterIcon.appendChild(enterTxt);
  grp.appendChild(enterIcon);

  const tt = mk('text', { class: 'ss-title', x: -w/2+14, y: -4, style: `fill:${col}` });
  tt.textContent = s.title || 'Set'; grp.appendChild(tt);
  const nodeCount = allNodesInSet(s.id).length;
  const childCount = childSets(s.id).length;
  const ct = mk('text', { class: 'ss-count', x: -w/2+14, y: 10, style: 'fill:var(--ink-faint)' });
  ct.textContent = nodeCount + ' nodes' + (childCount ? ' · ' + childCount + ' sets' : '');
  grp.appendChild(ct);
  return grp;
}

function renderGraph(){
  const g=$('#graph'); g.innerHTML='';
  const lay=layoutGraph();
  const {entities,entMeta,entPos,nodePos,W,H}=lay;

  const defs=document.createElementNS(NS,'defs');
  const mkMarker=(id,color)=>{const m=mk('marker',{id,markerWidth:'7',markerHeight:'7',refX:'6',refY:'3.5',orient:'auto'});
    m.appendChild(mk('polygon',{points:'0 0, 7 3.5, 0 7',fill:color})); return m;};
  defs.appendChild(mkMarker('arrow','#c2cedb'));
  defs.appendChild(mkMarker('arrow-hot','var(--accent)'));
  defs.appendChild(mkMarker('arrow-stub','var(--ink-faint)'));
  g.appendChild(defs);

  const pan=mk('g',{transform:`translate(${graphPan.x},${graphPan.y}) scale(${graphZoom})`}); pan.id='graph-pan';
  const sel=byId(selected); const selDeps=sel?depsOf(sel).map(d=>d.id):[];
  const {edges,stubs}=computeEdges(lay);

  // Layout boundary stubs above the main layout
  const STUB_Y=-70;
  const STUB_W=160, STUB_H=28;
  const stubCount=stubs.length;
  stubs.forEach((stub,i)=>{
    const sx=W/2+(i-(stubCount-1)/2)*(STUB_W+20);
    stub._pos={x:sx,y:STUB_Y};
  });

  // Draw edges to stubs first (below everything)
  stubs.forEach(stub=>{
    if(!stub._pos)return;
    stub.fromEntities.forEach(fromId=>{
      const pa=entPos[fromId]||nodePos[fromId]; if(!pa)return;
      const pb=stub._pos;
      pan.appendChild(mk('path',{
        class:'edge stub-edge',
        d:`M ${pa.x} ${pa.y-BOX_H/2-2} C ${pa.x} ${(pa.y+pb.y)/2}, ${pb.x} ${(pa.y+pb.y)/2}, ${pb.x} ${pb.y+STUB_H/2}`,
        'marker-end':'url(#arrow-stub)'
      }));
    });
  });

  // Draw same-universe edges
  edges.forEach(e=>{
    const pa=entPos[e.from]||nodePos[e.from];
    const pb=entPos[e.to]||nodePos[e.to];
    if(!pa||!pb)return;
    const hot=(e.from===selected||e.to===selected);
    pan.appendChild(mk('path',{
      class:'edge'+(hot?' hot':''),
      'data-from':e.from,'data-to':e.to,
      d:edgePath(pa,pb),
      'marker-end':`url(#${hot?'arrow-hot':'arrow'})`
    }));
  });

  // Render boundary stubs
  stubs.forEach(stub=>{
    if(!stub._pos)return;
    const {x,y}=stub._pos;
    const grp=mk('g',{class:'stub-node','data-stubid':stub.id,'data-target-universe':stub.targetUniverseId||'',transform:`translate(${x},${y})`});
    grp.appendChild(mk('rect',{x:-STUB_W/2,y:-STUB_H/2,width:STUB_W,height:STUB_H,rx:6}));
    const lbl=mk('text',{x:-STUB_W/2+10,y:0,'dominant-baseline':'central'});
    lbl.textContent='↗ '+stub.label;
    grp.appendChild(lbl);
    const sub=mk('text',{class:'stub-sub',x:-STUB_W/2+10,y:STUB_H/2-4});
    sub.textContent='in '+stub.universeLabel;
    grp.appendChild(sub);
    pan.appendChild(grp);
  });

  // Render node cards
  universeNodes().forEach(n=>{
    const p=nodePos[n.id]; if(!p)return;
    const hot=(n.id===selected||selDeps.includes(n.id));
    pan.appendChild(renderNodeCard(n,p,{selDeps,hot}));
  });

  // Render set pills
  universeSets().forEach(s=>{
    const ep=entPos[s.id]; if(!ep)return;
    pan.appendChild(renderSetPill(s,ep,entMeta[s.id]));
  });

  g.appendChild(pan);
  initGraphInteraction(g, lay);
}

function svgCoords(svg, clientX, clientY){
  const pt=svg.createSVGPoint();
  pt.x=clientX; pt.y=clientY;
  const m=svg.getScreenCTM();
  if(!m)return {x:clientX,y:clientY};
  const inv=m.inverse();
  const r=pt.matrixTransform(inv);
  return {x:(r.x-graphPan.x)/graphZoom, y:(r.y-graphPan.y)/graphZoom};
}

function initGraphInteraction(svg, lay){
  const {entMeta,entPos,nodePos}=lay;

  const center=id=>{
    if(entityManualPos[id])return entityManualPos[id];
    if(lay.entPos[id])return lay.entPos[id];
    return lay.nodePos[id]||null;
  };

  function recalcEdges(eid){
    const entityNode=byId(eid);
    const nodeIds=entityNode?new Set([eid]):new Set(allNodesInSet(eid).map(n=>n.id));
    const getPos=id=>entityManualPos[id]||lay.entPos[id]||lay.nodePos[id];
    svg.querySelectorAll('path.edge[data-from]').forEach(p=>{
      const from=p.dataset.from,to=p.dataset.to;
      if(!nodeIds.has(from)&&!nodeIds.has(to)&&from!==eid&&to!==eid)return;
      const pa=getPos(from),pb=getPos(to); if(!pa||!pb)return;
      p.setAttribute('d',edgePath(pa,pb));
    });
  }

  let panStart=null, nodeDrag=null, setDrag=null, didMove=false;
  let lasso=null;
  let connectSrc=null, connectPreview=null;
  const canvas=svg.closest('.gcanvas');

  svg.addEventListener('wheel',e=>{
    e.preventDefault();
    const factor=e.deltaY<0?1.12:1/1.12;
    const newZoom=Math.max(0.2,Math.min(4,graphZoom*factor));
    const rect=svg.getBoundingClientRect();
    const cx=e.clientX-rect.left, cy=e.clientY-rect.top;
    graphPan={x:cx-(cx-graphPan.x)*(newZoom/graphZoom), y:cy-(cy-graphPan.y)*(newZoom/graphZoom)};
    graphZoom=newZoom;
    const panGrp=$('#graph-pan'); if(panGrp)panGrp.setAttribute('transform',`translate(${graphPan.x},${graphPan.y}) scale(${graphZoom})`);
  },{passive:false});

  svg.onpointerdown=e=>{
    const nodeGrp=e.target.closest('.node');
    if(nodeGrp && connectMode){
      e.preventDefault(); svg.setPointerCapture(e.pointerId);
      const id=nodeGrp.dataset.id; const p=lay.nodePos[id]||center(id);
      connectSrc={id,x:p.x,y:p.y};
      connectPreview=mk('path',{class:'connect-preview',d:edgePath(p,p)});
      $('#graph-pan')&&$('#graph-pan').appendChild(connectPreview);
      return;
    }
    if(nodeGrp && selectMode){
      e.preventDefault();
      const id=nodeGrp.dataset.id;
      if(multiSel.has(id)){ multiSel.delete(id); nodeGrp.classList.remove('multi-sel'); }
      else { multiSel.add(id); nodeGrp.classList.add('multi-sel'); }
      updateGroupControls(); return;
    }
    const collapsedSetGrp=e.target.closest('[data-role="setpill"]');
    if(collapsedSetGrp && selectMode){
      e.preventDefault();
      const id=collapsedSetGrp.dataset.setid;
      if(multiSel.has(id)){ multiSel.delete(id); collapsedSetGrp.classList.remove('multi-sel'); }
      else { multiSel.add(id); collapsedSetGrp.classList.add('multi-sel'); }
      updateGroupControls(); return;
    }
    // stub node click — navigate to target universe
    const stubNode=e.target.closest('.stub-node');
    if(stubNode){
      e.preventDefault();
      const targetUid=stubNode.dataset.targetUniverse||null;
      enterUniverse(targetUid||null);
      return;
    }
    if(nodeGrp){
      e.preventDefault(); svg.setPointerCapture(e.pointerId);
      const id=nodeGrp.dataset.id;
      const cur=center(id)||{x:0,y:0};
      nodeDrag={id,startSvg:svgCoords(svg,e.clientX,e.clientY),startPos:{x:cur.x,y:cur.y}}; didMove=false;
      return;
    }
    const setpill=e.target.closest('[data-role="setpill"]');
    if(setpill){
      e.preventDefault(); svg.setPointerCapture(e.pointerId);
      const id=setpill.dataset.setid; const cur=center(id)||{x:0,y:0};
      const _sv=svgCoords(svg,e.clientX,e.clientY);_sv._cx=e.clientX;_sv._cy=e.clientY;
      setDrag={id,startSvg:_sv,startPos:{x:cur.x,y:cur.y}}; didMove=false; return;
    }
    if(selectMode){
      e.preventDefault(); svg.setPointerCapture(e.pointerId);
      const sc=svgCoords(svg,e.clientX,e.clientY);
      const r=mk('rect',{class:'lasso',x:sc.x,y:sc.y,width:0,height:0});
      $('#graph-pan').appendChild(r);
      lasso={startSvg:sc, rect:r}; return;
    }
    e.preventDefault(); svg.setPointerCapture(e.pointerId);
    panStart={x:e.clientX-graphPan.x, y:e.clientY-graphPan.y}; canvas&&canvas.classList.add('panning');
  };

  svg.onpointermove=e=>{
    if(connectSrc && connectPreview){
      const sc=svgCoords(svg,e.clientX,e.clientY);
      connectPreview.setAttribute('d',edgePath({x:connectSrc.x,y:connectSrc.y},sc));
      svg.querySelectorAll('.node.connect-target').forEach(n=>n.classList.remove('connect-target'));
      const el=document.elementFromPoint(e.clientX,e.clientY);
      const tgt=el&&el.closest('.node'); if(tgt&&tgt.dataset.id!==connectSrc.id) tgt.classList.add('connect-target');
      return;
    }
    if(nodeDrag){
      const sc=svgCoords(svg,e.clientX,e.clientY);
      const nx=nodeDrag.startPos.x+(sc.x-nodeDrag.startSvg.x), ny=nodeDrag.startPos.y+(sc.y-nodeDrag.startSvg.y);
      entityManualPos[nodeDrag.id]={x:nx,y:ny};
      const grp=svg.querySelector('#node-'+CSS.escape(nodeDrag.id)); if(grp)grp.setAttribute('transform',`translate(${nx},${ny})`);
      recalcEdges(nodeDrag.id); didMove=true; return;
    }
    if(setDrag){
      const sc=svgCoords(svg,e.clientX,e.clientY);
      const ddx=e.clientX-setDrag.startSvg._cx, ddy=e.clientY-setDrag.startSvg._cy;
      if(!didMove&&ddx*ddx+ddy*ddy<16)return;
      const nx=setDrag.startPos.x+(sc.x-setDrag.startSvg.x), ny=setDrag.startPos.y+(sc.y-setDrag.startSvg.y);
      entityManualPos[setDrag.id]={x:nx,y:ny};
      const pill=svg.querySelector('#set-'+CSS.escape(setDrag.id));
      if(pill)pill.setAttribute('transform',`translate(${nx},${ny})`);
      recalcEdges(setDrag.id);
      didMove=true; return;
    }
    if(lasso){
      const sc=svgCoords(svg,e.clientX,e.clientY);
      const x=Math.min(sc.x,lasso.startSvg.x), y=Math.min(sc.y,lasso.startSvg.y);
      const w=Math.abs(sc.x-lasso.startSvg.x), h=Math.abs(sc.y-lasso.startSvg.y);
      lasso.rect.setAttribute('x',x); lasso.rect.setAttribute('y',y);
      lasso.rect.setAttribute('width',w); lasso.rect.setAttribute('height',h);
      svg.querySelectorAll('#graph .node').forEach(n=>{
        const id=n.dataset.id;
        const p=lay.nodePos[id]||center(id);
        const inside=p&&p.x>=x&&p.x<=x+w&&p.y>=y&&p.y<=y+h;
        n.classList.toggle('multi-sel',inside);
      }); return;
    }
    if(panStart){
      graphPan={x:e.clientX-panStart.x, y:e.clientY-panStart.y};
      const panGrp=$('#graph-pan'); if(panGrp)panGrp.setAttribute('transform',`translate(${graphPan.x},${graphPan.y}) scale(${graphZoom})`);
    }
  };

  svg.onpointerup=e=>{
    if(lasso){
      const r=lasso.rect;
      const lx=parseFloat(r.getAttribute('x')), ly=parseFloat(r.getAttribute('y'));
      const lw=parseFloat(r.getAttribute('width')), lh=parseFloat(r.getAttribute('height'));
      svg.querySelectorAll('#graph .node').forEach(n=>{
        const id=n.dataset.id;
        const p=lay.nodePos[id];
        if(p&&p.x>=lx&&p.x<=lx+lw&&p.y>=ly&&p.y<=ly+lh){
          multiSel.add(id); n.classList.add('multi-sel');
        }
      });
      r.remove(); lasso=null; updateGroupControls(); return;
    }
    if(connectSrc){
      connectPreview&&connectPreview.remove(); connectPreview=null;
      svg.querySelectorAll('.node.connect-target').forEach(n=>n.classList.remove('connect-target'));
      const el=document.elementFromPoint(e.clientX,e.clientY);
      const tgt=el&&el.closest('.node');
      if(tgt && tgt.dataset.id!==connectSrc.id){
        const child=byId(tgt.dataset.id);
        if(child && !(child.uses||[]).includes(connectSrc.id) && !wouldCycle(connectSrc.id,tgt.dataset.id)){
          child.uses=[...(child.uses||[]),connectSrc.id]; derive(); renderAll();
          toast(`Linked: ${byId(connectSrc.id)?.title.split('(')[0].trim()} → ${child.title.split('(')[0].trim()}`);
        } else if(child) toast('Already linked.');
      }
      connectSrc=null; return;
    }
    if(setDrag){
      if(!didMove){ select(setDrag.id); } else { renderAll(); }
      setDrag=null; didMove=false; canvas&&canvas.classList.remove('panning'); return;
    }
    if(nodeDrag){ if(!didMove) select(nodeDrag.id); else renderAll(); nodeDrag=null; didMove=false; canvas&&canvas.classList.remove('panning'); return; }
    panStart=null; canvas&&canvas.classList.remove('panning');
  };
  svg.onpointercancel=()=>{
    if(lasso){lasso.rect.remove();lasso=null;}
    connectPreview&&connectPreview.remove(); connectPreview=null;
    connectSrc=null; nodeDrag=null; setDrag=null; panStart=null;
    canvas&&canvas.classList.remove('panning');
  };
}

function deleteSet(id){
  const s=setById(id); if(!s)return;
  const title=s.title||'Set';
  // collect all descendant set IDs and their node IDs
  const descSetIds=new Set(allDescendantSetIds(id));
  const memberIds=new Set();
  descSetIds.forEach(sid=>{ (setById(sid)?.nodeIds||[]).forEach(nid=>memberIds.add(nid)); });
  data.nodes=data.nodes.filter(n=>!memberIds.has(n.id));
  data.nodes.forEach(n=>{
    n.uses=(n.uses||[]).filter(u=>!memberIds.has(u));
    if(n.proof) n.proof.uses=(n.proof.uses||[]).filter(u=>!memberIds.has(u));
  });
  data.sets=data.sets.filter(s=>!descSetIds.has(s.id));
  descSetIds.forEach(sid=>delete entityManualPos[sid]);
  if(descSetIds.has(selected)) selected=null;
  // reset universe if we deleted the current universe or an ancestor
  if(currentUniverseId && descSetIds.has(currentUniverseId)) currentUniverseId=null;
  closeRelations(); renderAll();
  toast(`Deleted "${title}" and all nested sets.`);
}

/* relations panel */
function openRelations(pathEl){
  const info=pathEl&&pathEl.__links; if(!info)return;
  const nameA=entityName(info.a), nameB=entityName(info.b);
  $('#rpTitle').innerHTML=`${esc(nameA)} <span style="color:var(--ink-faint)">↔</span> ${esc(nameB)}`;
  const linkRow=(l)=>{const f=byId(l.from), t=byId(l.to);
    return `<button class="rp-link" data-from="${esc(l.from)}" data-to="${esc(l.to)}">
      <span class="from">${esc(f?f.title.split('(')[0].trim():l.from)}</span>
      <span class="arr">→</span>
      <span class="to">${esc(t?t.title.split('(')[0].trim():l.to)}</span></button>`;};
  let html='';
  if(info.forward.length) html+=`<div class="rp-group"><div class="rp-glabel">${esc(nameA)} → ${esc(nameB)} <span class="tag">(${info.forward.length})</span></div>${info.forward.map(linkRow).join('')}</div>`;
  if(info.backward.length) html+=`<div class="rp-group"><div class="rp-glabel">${esc(nameB)} → ${esc(nameA)} <span class="tag">(${info.backward.length})</span></div>${info.backward.map(linkRow).join('')}</div>`;
  const body=$('#rpBody'); body.innerHTML=html;
  body.querySelectorAll('.rp-link').forEach(b=>b.onclick=()=>{const id=b.dataset.to||b.dataset.from; select(id);});
  $('#relPanel').classList.add('open');
}
function closeRelations(){const p=$('#relPanel'); if(p)p.classList.remove('open');}
function entityName(id){const s=setById(id); if(s)return s.title||'Set'; const n=byId(id); return n?n.title.split('(')[0].trim():id;}

/* ===================== detail panel ===================== */
function renderDetailPanel(){
  const n=byId(selected);
  const panel=$('#detailPanel');
  const s=setById(selected);
  if(s&&!n){
    panel.classList.add('open');
    $('#dpKind').textContent='Set'; $('#dpKind').className='dp-kind-badge definition';
    $('#dpTitle').textContent=s.title;
    $('#dpChips').innerHTML='';
    $('#dpBody').innerHTML=`
      <div class="dp-section"><div class="dp-sec-label">Members</div>
        <div style="font-size:12px;color:var(--ink-faint);margin-bottom:8px">${(s.nodeIds||[]).length} nodes</div>
        ${setMembers(s).map(m=>`<div style="font-size:12px;padding:3px 0;color:var(--ink)">${kindLabel(m.kind)}: ${m.title.split('(')[0].trim()}</div>`).join('')}
      </div>`;
    $('#dpEdit').style.display='none';
    // "Enter universe" button
    let enterBtn=$('#dpEnterSet');
    if(!enterBtn){
      enterBtn=document.createElement('button'); enterBtn.id='dpEnterSet'; enterBtn.className='btn primary';
      enterBtn.textContent='→ Enter';
      const dpActions=$('#dpEdit').parentNode;
      dpActions.insertBefore(enterBtn, dpActions.firstChild);
    }
    enterBtn.style.display=''; enterBtn.onclick=()=>enterUniverse(selected);
    // export button
    let expBtn=$('#dpExportSet');
    if(!expBtn){
      expBtn=document.createElement('button'); expBtn.id='dpExportSet'; expBtn.className='btn';
      expBtn.textContent='→ Save to project'; $('#dpEdit').parentNode.appendChild(expBtn);
    }
    expBtn.style.display=''; expBtn.onclick=()=>exportSet(selected);
    return;
  }
  const expBtn=$('#dpExportSet'); if(expBtn) expBtn.style.display='none';
  const enterBtn=$('#dpEnterSet'); if(enterBtn) enterBtn.style.display='none';
  $('#dpEdit').style.display='';
  if(!n){panel.classList.remove('open');return;}
  panel.classList.add('open');

  const badge=$('#dpKind');
  badge.textContent=kindLabel(n.kind);
  badge.className='dp-kind-badge '+n.kind;
  $('#dpTitle').textContent=n.title;

  const chipsEl=$('#dpChips');
  chipsEl.innerHTML=statusChip(n);

  const body=$('#dpBody');
  const depNodes=(n.uses||[]).map(byId).filter(Boolean);
  const usedBy=data.nodes.filter(x=>depsOf(x).some(d=>d.id===n.id));
  const proofUses=(n.proof?.uses||[]).map(byId).filter(Boolean);
  const allDeps=[...new Set([...depNodes,...proofUses])];

  let html='';

  if(n.statement){
    html+=`<div class="dp-section"><div class="dp-sec-label">Statement</div><div class="dp-stmt" id="dpStmt">${n.statement}</div></div>`;
  }

  if(!isDef(n) && n.proof?.text){
    html+=`<div class="dp-section"><div class="dp-sec-label">Proof</div><div class="dp-proof" id="dpProof">${n.proof.text}</div></div>`;
  }

  if(allDeps.length){
    const tags=allDeps.map(d=>`<button class="dep" style="--cc:${nodeBorderColor(d)};--cf:${nodeFillColor(d)}" data-sel="${esc(d.id)}"><span class="pip"></span>${d.title.split('(')[0].trim()}</button>`).join('');
    html+=`<div class="dp-section"><div class="dp-sec-label">Uses</div><div class="uses" id="dpDeps">${tags}</div></div>`;
  }

  if(usedBy.length){
    const tags=usedBy.map(d=>`<button class="dep" style="--cc:${nodeBorderColor(d)};--cf:${nodeFillColor(d)}" data-sel="${esc(d.id)}"><span class="pip"></span>${d.title.split('(')[0].trim()}</button>`).join('');
    html+=`<div class="dp-section"><div class="dp-sec-label">Used by</div><div class="uses">${tags}</div></div>`;
  }

  // status note
  let note='';
  if(isDef(n)) note='A definition — always counts as done.';
  else if(n._proved) note='All dependencies proved and proof written.';
  else if(n._ready) note='Dependencies are proved — ready to write the proof.';
  else note='Waiting: some dependencies aren\'t proved yet.';
  html+=`<div class="dp-note">${note}</div>`;

  body.innerHTML=html;
  body.querySelectorAll('[data-sel]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.sel)));

  if(window.renderMathInElement){
    const opts={throwOnError:false,delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false},{left:'\\(',right:'\\)',display:false},{left:'\\[',right:'\\]',display:true}]};
    renderMathInElement(body,opts);
  }

  $('#dpEdit').onclick=()=>openEditModal(selected);
  const archBtn=$('#dpArchitect');
  if(archBtn){ archBtn.style.display=isDef(n)?'none':''; archBtn.onclick=()=>openArchitect(selected); }
}

/* ===================== autosave ===================== */
function saveAll(){
  if(activeProjectId){
    projectData[activeProjectId]=clone(data);
    projManualPos[activeProjectId]={entity:clone(entityManualPos),node:clone(nodeManualPos)};
  }
  const payload=JSON.stringify({projects,projectData,activeProjectId,projCounter,setCounter,projManualPos,currentUniverseId});
  if(window.marginFS){
    window.marginFS.save(payload).catch(()=>{});
    try{localStorage.removeItem('margin-autosave');}catch(e){}  // clear stale fallback data
  } else try{localStorage.setItem('margin-autosave',payload);}catch(e){}
}
async function loadAll(){
  try{
    const raw=window.marginFS ? await window.marginFS.load() : localStorage.getItem('margin-autosave');
    if(!raw)return false;
    let s=JSON.parse(raw);
    if(typeof s==='string') s=JSON.parse(s); // migrate legacy double-encoded files
    if(!s.projects?.length) return false;
    projects.length=0; s.projects.forEach(p=>projects.push(p));
    Object.keys(projectData).forEach(k=>delete projectData[k]);
    Object.assign(projectData,s.projectData||{});
    Object.keys(projManualPos).forEach(k=>delete projManualPos[k]);
    Object.assign(projManualPos,s.projManualPos||{});
    projCounter=s.projCounter||1; setCounter=s.setCounter||0;
    currentUniverseId=s.currentUniverseId||null;
    // restore active project only if it still exists in projectData
    const restoredId=s.activeProjectId&&projectData[s.activeProjectId]?s.activeProjectId:null;
    activeProjectId=restoredId;
    if(activeProjectId){
      data=projectData[activeProjectId];
      if(!data.sets)data.sets=[];
      const pos=projManualPos[activeProjectId]||{entity:{},node:{}};
      Object.assign(entityManualPos,pos.entity||{});
      Object.assign(nodeManualPos,pos.node||{});
    }
    return true;
  }catch(e){return false;}
}

/* ===================== renderAll ===================== */
function renderAll(){
  if(!activeProjectId) return;
  derive(); renderGraph(); renderDetailPanel(); renderLegend(); updateProgress();
  $('#docName').innerHTML='project · <b>'+(data.project?.title||'Untitled')+'</b>';
  renderBreadcrumb();
  renderProjList();
  saveAll();
}

/* detail panel close */
$('#dpClose').onclick=()=>{selected=null;$('#detailPanel').classList.remove('open');renderGraph();};
$('#rpClose').onclick=closeRelations;

/* ===================== behaviour ===================== */
function select(id,scroll){selected=id;renderAll();}

/* save a knowledge set as a new project (including all transitive deps) */
function collectTransitiveDeps(seedIds){
  const visited=new Set(seedIds);
  const queue=[...seedIds];
  while(queue.length){
    const id=queue.shift();
    const n=byId(id); if(!n)continue;
    [...(n.uses||[]),...(n.proof?.uses||[])].forEach(dep=>{
      if(!visited.has(dep)){visited.add(dep);queue.push(dep);}
    });
  }
  return[...visited];
}
function saveSetToProject(sid){
  const s=setById(sid); if(!s)return;
  // collect all nodes in this set (including nested child sets)
  const setNodeIds=allNodesInSet(sid).map(n=>n.id);
  const setNodeIdSet=new Set(setNodeIds);
  // transitively collect all dependency nodes
  const allIds=collectTransitiveDeps(setNodeIds);
  const depOnlyIds=allIds.filter(id=>!setNodeIdSet.has(id));

  // clone nodes for new project
  const newNodes=allIds.map(id=>{
    const n=byId(id); if(!n)return null;
    const nn=clone(n);
    ['_proved','_ready'].forEach(k=>delete nn[k]);
    if(!setNodeIdSet.has(id)) delete nn.setId; // dep nodes are free
    return nn;
  }).filter(Boolean);

  // reconstruct nested sets for the new project
  const descSetIds=allDescendantSetIds(sid);
  const newSets=descSetIds.map(dsid=>{
    const ds=setById(dsid); if(!ds)return null;
    const ns=clone(ds);
    ['_proved','_ready'].forEach(k=>delete ns[k]);
    // adjust parentSetId: root of the cloned tree has no parent
    if(ns.id===sid)ns.parentSetId=null;
    return ns;
  }).filter(Boolean);

  const d={project:{title:s.title},nodes:newNodes,sets:newSets};
  const pid=newProject(s.title,d);
  switchProject(pid);
  toast(`"${s.title}" saved as new project — ${setNodeIds.length} set nodes + ${depOnlyIds.length} dependencies.`);
}
// keep exportSet as alias used by the detail panel button
function exportSet(sid){saveSetToProject(sid);}

/* ── Global knowledge set preview & import ─────────────────────────────── */
function createNewGlobalSet(){
  gsCounter++;
  const gs={id:'gs'+gsCounter,name:'New knowledge set',nodes:[]};
  globalSets.push(gs);
  renderProjList();
  openGsPreview(gs.id);
  toast('New knowledge set created — add nodes to it.');
}

function openGsPreview(gsid){
  const gs=globalSets.find(g=>g.id===gsid); if(!gs)return;
  gsPreviewId=gsid;
  gsEditingNodeIdx=null;
  $('#gsPreviewTitle').textContent=gs.name;
  $('#gsPreviewHint').textContent='Will be imported into: '+( projects.find(p=>p.id===activeProjectId)?.name||'current project');
  renderGsPreview();
  $('#gsNodeForm').style.display='none';
  $('#gsPreviewScrim').classList.add('open');
}

function renderGsPreview(){
  const gs=globalSets.find(g=>g.id===gsPreviewId); if(!gs)return;
  $('#gsPreviewCount').textContent=gs.nodes.length+' nodes';
  const listEl=$('#gsPreviewList');
  listEl.innerHTML=gs.nodes.map((n,i)=>`
    <div class="gs-node-row" data-idx="${i}">
      <span class="gn-kind">${n.kind||'node'}</span>
      <span class="gn-title">${n.title||n.id}</span>
      <button class="gn-edit" data-idx="${i}" title="Edit">✎</button>
      <button class="gn-del" data-idx="${i}" title="Remove">×</button>
    </div>`).join('');
  listEl.querySelectorAll('.gn-edit').forEach(b=>b.onclick=e=>{e.stopPropagation();renderGsNodeForm(+b.dataset.idx);});
  listEl.querySelectorAll('.gn-del').forEach(b=>b.onclick=e=>{e.stopPropagation();
    const g=globalSets.find(g=>g.id===gsPreviewId); if(!g)return;
    g.nodes.splice(+b.dataset.idx,1); renderGsPreview(); renderProjList();});
}

function renderGsNodeForm(idx){
  gsEditingNodeIdx=idx;
  const gs=globalSets.find(g=>g.id===gsPreviewId);
  const n=idx===-1?null:gs?.nodes[idx];
  $('#gsNodeKind').value=n?.kind||'definition';
  $('#gsNodeTitle').value=n?.title||'';
  $('#gsNodeStmt').value=n?.statement||'';
  $('#gsNodeProof').value=n?.proof?.text||'';
  const isdef=(n?.kind||'definition')==='definition';
  $('#gsNodeProofWrap').style.display=isdef?'none':'';
  $('#gsNodeSaveBtn').textContent=idx===-1?'Add node':'Save node';
  $('#gsNodeForm').style.display='';
}

function saveGsNode(){
  const gs=globalSets.find(g=>g.id===gsPreviewId); if(!gs)return;
  const kind=$('#gsNodeKind').value;
  const title=$('#gsNodeTitle').value.trim();
  if(!title){toast('Title is required.');return;}
  const isdef=kind==='definition';
  const node={
    id:gsPreviewId+':'+Date.now(),kind,title,
    statement:$('#gsNodeStmt').value,
    uses:[],
    proof:isdef?null:{uses:[],text:$('#gsNodeProof').value}
  };
  if(gsEditingNodeIdx===-1){ gs.nodes.push(node); }
  else { Object.assign(gs.nodes[gsEditingNodeIdx],node); }
  gsEditingNodeIdx=null;
  $('#gsNodeForm').style.display='none';
  renderGsPreview(); renderProjList();
  toast(gsEditingNodeIdx===-1?'Node added.':'Node saved.');
}

function closeGsPreview(){$('#gsPreviewScrim').classList.remove('open');gsPreviewId=null;gsEditingNodeIdx=null;}
function importGlobalSet(gsid, dropPos){
  const gs=globalSets.find(g=>g.id===gsid); if(!gs)return;
  setCounter++;
  const prefix='set'+setCounter;
  const color=SET_COLORS[(setCounter-1)%SET_COLORS.length];
  const nodeIdMap={};
  gs.nodes.forEach(n=>{nodeIdMap[n.id]=prefix+':'+n.id;});
  const setIdMap={};
  (gs.sets||[]).forEach(s=>{setIdMap[s.id]=prefix+':s:'+s.id;});
  const nodeToSet={};
  (gs.sets||[]).forEach(s=>{(s.nodeIds||[]).forEach(nid=>{nodeToSet[nid]=s.id;});});
  data.sets=data.sets||[];
  (gs.sets||[]).forEach(s=>{
    data.sets.push({
      id:setIdMap[s.id],title:s.title,color,
      parentSetId:s.parentSetId?setIdMap[s.parentSetId]:null,
      nodeIds:(s.nodeIds||[]).map(nid=>nodeIdMap[nid]).filter(Boolean)
    });
  });
  const imported=gs.nodes.map(n=>{
    const nn=clone(n); nn.id=nodeIdMap[n.id];
    const bpSet=nodeToSet[n.id];
    nn.setId=bpSet?setIdMap[bpSet]:null;
    nn.uses=(n.uses||[]).map(u=>nodeIdMap[u]||u);
    if(nn.proof) nn.proof.uses=(n.proof.uses||[]).map(u=>nodeIdMap[u]||u);
    return nn;
  });
  data.nodes.push(...imported);
  if(dropPos){
    const rootSets=(gs.sets||[]).filter(s=>!s.parentSetId);
    if(rootSets.length>0) entityManualPos[setIdMap[rootSets[0].id]]={x:dropPos.x,y:dropPos.y};
    else if(imported.length>0) entityManualPos[imported[0].id]={x:dropPos.x,y:dropPos.y};
  }
  selected=null; renderAll();
  toast(`Imported "${gs.name}" into project (${imported.length} nodes).`);
}
$('#gsPreviewClose').onclick=closeGsPreview;
$('#gsPreviewCancel').onclick=closeGsPreview;
$('#gsPreviewScrim').onclick=e=>{if(e.target===$('#gsPreviewScrim'))closeGsPreview();};
$('#gsPreviewImport').onclick=()=>{if(gsPreviewId){importGlobalSet(gsPreviewId);closeGsPreview();}};
$('#gsAddNodeBtn').onclick=()=>renderGsNodeForm(-1);
$('#gsNodeKind').addEventListener('change',()=>{
  const isdef=$('#gsNodeKind').value==='definition';
  $('#gsNodeProofWrap').style.display=isdef?'none':'';
});
$('#gsNodeCancelBtn').onclick=()=>{$('#gsNodeForm').style.display='none';gsEditingNodeIdx=null;};
$('#gsNodeSaveBtn').onclick=saveGsNode;
$('#gsRenameBtn').onclick=()=>{
  const gs=globalSets.find(g=>g.id===gsPreviewId); if(!gs)return;
  const name=prompt('Rename knowledge set:',gs.name); if(!name)return;
  gs.name=name.trim();
  $('#gsPreviewTitle').textContent=gs.name;
  renderProjList(); toast('Renamed.');
};

/* ── Settings modal ─────────────────────────────────────────────────────── */
function openSettings(){
  // populate form from prefs
  $('#prefName').value=prefs.name||'';
  $('#prefAnthropicKey').value=prefs.anthropicKey||'';
  $('#prefOpenaiKey').value=prefs.openaiKey||'';
  $('#prefGeminiKey').value=prefs.geminiKey||'';
  $('#prefModel').value=prefs.model||'claude-sonnet-4-6';
  $('#prefBaseUrl').value=prefs.baseUrl||'';
  // theme buttons
  document.querySelectorAll('.theme-btn').forEach(b=>b.classList.toggle('active',b.dataset.theme===(prefs.theme||'light')));
  // accent swatches
  const sw=$('#accentSwatches');
  sw.innerHTML=ACCENT_PRESETS.map((a,i)=>`<span class="accent-swatch${i===(prefs.accentIdx||0)?' active':''}" data-idx="${i}" style="background:${a.accent}" title="${a.name}"></span>`).join('');
  sw.querySelectorAll('.accent-swatch').forEach(s=>s.onclick=()=>{
    prefs.accentIdx=+s.dataset.idx;
    sw.querySelectorAll('.accent-swatch').forEach(x=>x.classList.toggle('active',x===s));
    applyPrefs();
  });
  // tabs
  document.querySelectorAll('.stab').forEach(t=>t.onclick=()=>{
    document.querySelectorAll('.stab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.stab-pane').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    document.getElementById('stab-'+t.dataset.tab).classList.add('active');
  });
  // activate first tab
  document.querySelectorAll('.stab').forEach((t,i)=>{t.classList.toggle('active',i===0);});
  document.querySelectorAll('.stab-pane').forEach((p,i)=>{p.classList.toggle('active',i===0);});
  $('#settingsScrim').classList.add('open');
}
function closeSettings(){$('#settingsScrim').classList.remove('open');}
function saveSettings(){
  prefs.name=$('#prefName').value.trim();
  prefs.anthropicKey=$('#prefAnthropicKey').value;
  prefs.openaiKey=$('#prefOpenaiKey').value;
  prefs.geminiKey=$('#prefGeminiKey').value;
  prefs.model=$('#prefModel').value;
  prefs.baseUrl=$('#prefBaseUrl').value.trim();
  savePrefs(); applyPrefs(); closeSettings();
  toast('Preferences saved.');
}
$('#settingsBtn').onclick=openSettings;
$('#settingsClose').onclick=closeSettings;
$('#settingsCancel').onclick=closeSettings;
$('#settingsSave').onclick=saveSettings;
$('#settingsScrim').onclick=e=>{if(e.target===$('#settingsScrim'))closeSettings();};
document.querySelectorAll('.theme-btn').forEach(b=>b.onclick=()=>{
  prefs.theme=b.dataset.theme;
  document.querySelectorAll('.theme-btn').forEach(x=>x.classList.toggle('active',x===b));
  applyPrefs();
});

/* connect mode */
let connectMode=false;
function setConnectMode(on){
  connectMode=on;
  $('#connectBtn').classList.toggle('active',on);
  document.querySelector('.graphfull').classList.toggle('connect-mode',on);
}
$('#connectBtn').onclick=()=>setConnectMode(!connectMode);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&connectMode)setConnectMode(false);});

/* zoom controls */
function applyZoom(z,pivotX,pivotY){
  const newZ=Math.max(0.2,Math.min(4,z));
  if(pivotX===undefined){
    const svg=$('#graph'); const r=svg.getBoundingClientRect();
    pivotX=r.width/2; pivotY=r.height/2;
  }
  graphPan={x:pivotX-(pivotX-graphPan.x)*(newZ/graphZoom), y:pivotY-(pivotY-graphPan.y)*(newZ/graphZoom)};
  graphZoom=newZ;
  const panGrp=$('#graph-pan'); if(panGrp)panGrp.setAttribute('transform',`translate(${graphPan.x},${graphPan.y}) scale(${graphZoom})`);
}
$('#zoomIn').onclick=()=>applyZoom(graphZoom*1.25);
$('#zoomOut').onclick=()=>applyZoom(graphZoom/1.25);
function fitGraph(){
  const lay=layoutGraph();
  const svg=$('#graph'); const r=svg.getBoundingClientRect();
  if(!r.width||!r.height)return;
  // Compute actual bounding box from all entity positions (including manual overrides)
  // Also account for stub row above (y can be negative)
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  const STUB_Y=-70, STUB_H=28;
  const stubs=universeSets().length>0||universeNodes().some(n=>{
    return [...(n.uses||[]),...(n.proof?.uses||[])].some(uid=>!nodeToUniverseEntity(uid));
  });
  if(stubs){ minY=Math.min(minY,STUB_Y-STUB_H/2-10); }
  lay.entities.forEach(id=>{
    const pos=lay.entPos[id]; if(!pos)return;
    const meta=lay.entMeta[id]||{};
    const hw=(meta.w||180)/2, hh=(meta.h||40)/2;
    minX=Math.min(minX,pos.x-hw); minY=Math.min(minY,pos.y-hh);
    maxX=Math.max(maxX,pos.x+hw); maxY=Math.max(maxY,pos.y+hh);
  });
  if(!isFinite(minX)){minX=0;minY=0;maxX=lay.W;maxY=lay.H;}
  const bW=maxX-minX||1, bH=maxY-minY||1;
  const pad=48;
  const scaleX=(r.width-pad*2)/bW, scaleY=(r.height-pad*2)/bH;
  graphZoom=Math.min(scaleX,scaleY,1);
  graphPan={x:(r.width-bW*graphZoom)/2-minX*graphZoom, y:pad-minY*graphZoom};
  const p=$('#graph-pan'); if(p)p.setAttribute('transform',`translate(${graphPan.x},${graphPan.y}) scale(${graphZoom})`);
}
$('#zoomReset').onclick=()=>fitGraph();

/* select mode + group */
function setSelectMode(on){
  selectMode=on;
  $('#selectBtn').classList.toggle('active',on);
  if(!on){
    document.querySelectorAll('.node.multi-sel').forEach(n=>n.classList.remove('multi-sel'));
    multiSel.clear();
  }
  updateGroupControls();
}
function updateGroupControls(){
  const ctrls=$('#groupControls');
  if(selectMode && multiSel.size>=2){
    ctrls.style.display='flex';
    const nSets=[...multiSel].filter(id=>setById(id)).length;
    const nNodes=multiSel.size-nSets;
    $('#groupCount').textContent=nNodes+(nSets?` + ${nSets} set${nSets>1?'s':''}`:'')
  } else {
    ctrls.style.display='none';
  }
}
function doGroup(){
  if(multiSel.size<2)return;
  const name=($('#groupName').value||'').trim()||'New Set';
  setCounter++;
  const sid='set'+setCounter;
  const color=SET_COLORS[(setCounter-1)%SET_COLORS.length];
  const selectedSetIds=[...multiSel].filter(id=>setById(id));
  const selectedNodeIds=[...multiSel].filter(id=>byId(id));
  const selNodeSet=new Set(selectedNodeIds);

  // detect common parent: all selected nodes share the same immediate setId
  const parentSetIds=new Set(selectedNodeIds.map(id=>{const n=byId(id);return n?.setId||null;}).filter(Boolean));
  const allInSameSet=parentSetIds.size===1&&selectedNodeIds.every(id=>{const n=byId(id);return n&&n.setId;});
  const commonParentSetId=allInSameSet?[...parentSetIds][0]:null;

  // remove selected node IDs from any former parent set's nodeIds
  (data.sets||[]).forEach(s=>{s.nodeIds=(s.nodeIds||[]).filter(id=>!selNodeSet.has(id));});

  // assign new setId to nodes and parentSetId to nested sets
  selectedNodeIds.forEach(id=>{const n=byId(id);if(n)n.setId=sid;});
  selectedSetIds.forEach(id=>{const s=setById(id);if(s)s.parentSetId=sid;});

  data.sets=data.sets||[];
  data.sets.push({id:sid,title:name,color,collapsed:false,nodeIds:selectedNodeIds,parentSetId:commonParentSetId||null});
  $('#groupName').value='';
  setSelectMode(false);
  renderAll();
  toast(`"${name}" set created with ${selectedNodeIds.length} node${selectedNodeIds.length!==1?'s':''}${selectedSetIds.length?` and ${selectedSetIds.length} nested set${selectedSetIds.length!==1?'s':''}`:''}.`);
}
$('#selectBtn').onclick=()=>setSelectMode(!selectMode);
$('#groupCancel').onclick=()=>setSelectMode(false);
$('#groupBtn').addEventListener('click',doGroup);
$('#groupName').addEventListener('keydown',e=>{if(e.key==='Enter')doGroup();});

/* add block */
let cnt=0;
$('#addBtn').onclick=e=>{e.stopPropagation();$('#addMenu').classList.toggle('open');};
document.addEventListener('click',e=>{if(!e.target.closest('.graph-fab'))$('#addMenu').classList.remove('open');});
$('#addMenu').querySelectorAll('button').forEach(btn=>btn.onclick=()=>{
  cnt++;const id=btn.dataset.kind.slice(0,3)+':new-'+cnt;
  const isdef=btn.dataset.kind==='definition';
  data.nodes.push({id,kind:btn.dataset.kind,title:'Untitled '+btn.dataset.kind,statement:'<span style="color:var(--ink-faint)">Write the statement. Use $\\LaTeX$, then list dependencies.</span>',uses:[],proof:isdef?null:{uses:[],text:''}});
  recordActivity();
  $('#addMenu').classList.remove('open');select(id,true);toast(kindLabel(btn.dataset.kind)+' added.');
});

/* data bar: load / download / reset */
$('#loadJson').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.nodes||!Array.isArray(d.nodes))throw 0;
    d.project=d.project||{title:f.name.replace(/\.json$/,'')};
    Object.keys(data).forEach(k=>delete data[k]);
    Object.assign(data,d);
    if(!data.sets)data.sets=[];
    Object.keys(entityManualPos).forEach(k=>delete entityManualPos[k]);
    Object.keys(nodeManualPos).forEach(k=>delete nodeManualPos[k]);
    selected=null;syncProjName();derive();renderAll();setTimeout(fitGraph,0);toast('Loaded '+data.nodes.length+' nodes from '+f.name);}
    catch(err){toast('Couldn\'t parse that file — expected blueprint.json with a "nodes" array.');}};
  r.readAsText(f);e.target.value='';};
$('#dlJson').onclick=()=>{
  const out=clone(data);out.nodes.forEach(n=>['_proved','_ready'].forEach(k=>delete n[k]));
  const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'});const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='blueprint.json';a.click();URL.revokeObjectURL(a.href);
  toast('Downloaded blueprint.json');
};
$('#resetJson').onclick=()=>{
  const fresh=clone(SAMPLE); if(!fresh.sets)fresh.sets=[];
  Object.keys(data).forEach(k=>delete data[k]); Object.assign(data,fresh);
  selected=null;syncProjName();derive();renderAll();setTimeout(fitGraph,0);toast('Reset to the Finsler sample.');
};

/* import a blueprint JSON preserving nested set hierarchy */
$('#importSet').onchange=e=>{
  const f=e.target.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const d=JSON.parse(r.result);
      if(!d.nodes||!Array.isArray(d.nodes))throw 0;
      setCounter++;
      const prefix='set'+setCounter;
      const color=SET_COLORS[(setCounter-1)%SET_COLORS.length];
      const nodeIdMap={};
      d.nodes.forEach(n=>{ nodeIdMap[n.id]=prefix+':'+n.id; });
      const setIdMap={};
      (d.sets||[]).forEach(s=>{ setIdMap[s.id]=prefix+':s:'+s.id; });
      const nodeToSet={};
      (d.sets||[]).forEach(s=>{ (s.nodeIds||[]).forEach(nid=>{ nodeToSet[nid]=s.id; }); });
      data.sets=data.sets||[];
      (d.sets||[]).forEach(s=>{
        data.sets.push({
          id:setIdMap[s.id],title:s.title,color,
          parentSetId:s.parentSetId?setIdMap[s.parentSetId]:null,
          nodeIds:(s.nodeIds||[]).map(nid=>nodeIdMap[nid]).filter(Boolean)
        });
      });
      const imported=d.nodes.map(n=>{
        const nn=clone(n);
        nn.id=nodeIdMap[n.id];
        const bpSet=nodeToSet[n.id]||(n.setId&&setIdMap[n.setId]?n.setId:null);
        nn.setId=bpSet?setIdMap[bpSet]:null;
        nn.uses=(n.uses||[]).map(u=>nodeIdMap[u]||u);
        if(nn.proof) nn.proof.uses=(n.proof.uses||[]).map(u=>nodeIdMap[u]||u);
        return nn;
      });
      data.nodes.push(...imported);
      selected=null; renderAll();
      const rootCount=(d.sets||[]).filter(s=>!s.parentSetId).length;
      toast(`Imported "${d.project?.title||f.name.replace(/\.json$/,'')}" (${imported.length} nodes, ${rootCount} top-level sets).`);
    }catch(err){toast('Couldn\'t parse — expected blueprint.json with a "nodes" array.');}
  };
  r.readAsText(f); e.target.value='';
};

/* ===================== export modal (LaTeX only) ===================== */
function buildSheet(){
  $('#shT').textContent=data.project.title;
  let n=0;$('#shB').innerHTML=data.nodes.map(b=>{n++;const ck=checkmark(b)?'<span class="ck">✓</span>':'';
    return `<h4>${kindLabel(b.kind)} ${n}. ${b.title.split('(')[0].trim()}${ck}</h4><p>${b.statement}</p>`;}).join('');
  typeset($('#shB'));
}
$('#exportBtn').onclick=()=>{buildSheet();$('#scrim').classList.add('open');};
$('#cm').onclick=$('#cm2').onclick=()=>$('#scrim').classList.remove('open');
$('#scrim').onclick=e=>{if(e.target===$('#scrim'))$('#scrim').classList.remove('open');};
$('#dl').onclick=()=>{
  const tex=emitLatex(data);
  const blob=new Blob([tex],{type:'text/plain'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='content.tex';a.click();URL.revokeObjectURL(a.href);
  $('#scrim').classList.remove('open');toast('Downloaded content.tex');
};

/* ===================== LaTeX emit (json -> tex round-trip) ===================== */
function emitLatex(d){
  const lines=['\\documentclass[a4paper]{article}','\\usepackage{blueprint}','\\usepackage{amsmath,amssymb,hyperref}','',
    `\\title{${d.project.title||'Untitled'}}`,`\\author{Author}`,'\\date{\\today}','','\\begin{document}','\\maketitle',''];
  d.nodes.forEach(n=>{
    const env=n.kind;
    const titleArg=n.title?`[${n.title}]`:'';
    lines.push(`\\begin{${env}}${titleArg}\\label{${n.id}}`);
    if(n.uses&&n.uses.length) lines.push(`  \\uses{${n.uses.join(',')}}`);
    lines.push('  '+stripHtml(n.statement||''));
    if(n.proof){
      lines.push('\\begin{proof}');
      if(n.proof.uses&&n.proof.uses.length) lines.push(`  \\uses{${n.proof.uses.join(',')}}`);
      lines.push('  '+(n.proof.text||''));
      lines.push('\\end{proof}');
    }
    lines.push(`\\end{${env}}`,'');
  });
  lines.push('\\end{document}');
  return lines.join('\n');
}
function stripHtml(s){return s.replace(/<[^>]*>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ');}

/* ===================== edit modal ===================== */
let editingId=null;

function openEditModal(id){
  const n=byId(id); if(!n)return;
  editingId=id;
  $('#eKind').value=n.kind;
  $('#eTitle').value=n.title||'';
  $('#eStmt').value=n.statement||'';
  const proofWrap=$('#eProofWrap');
  const isDefinition=isDef(n);
  if(isDefinition){ proofWrap.style.display='none'; $('#eProof').value=''; }
  else { proofWrap.style.display=''; $('#eProof').value=(n.proof?.text)||''; }
  // show Architect button only for non-definitions
  const eArchBtn=$('#eArchitectBtn');
  if(eArchBtn) eArchBtn.style.display=isDefinition?'none':'';
  initProofChat(n);
  renderDepTags(n.uses||[]);
  refreshPreview();
  $('#editScrim').classList.add('open');
  setTimeout(()=>$('#eTitle').focus(),80);
}

function closeEditModal(){
  $('#editScrim').classList.remove('open');
  editingId=null;
}

/* --- dependency tag widget --- */
let editDeps=[];
function renderDepTags(ids){
  editDeps=[...ids];
  const container=$('#eDepTags');
  container.querySelectorAll('.edep-tag').forEach(t=>t.remove());
  const suggest=container.querySelector('.edep-suggest');
  editDeps.forEach(id=>{
    const d=byId(id);
    const tag=document.createElement('span'); tag.className='edep-tag';
    tag.innerHTML=`${d?d.title.split('(')[0].trim():id}<button data-rmv="${esc(id)}" aria-label="Remove">×</button>`;
    container.insertBefore(tag, suggest);
  });
  container.querySelectorAll('[data-rmv]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    editDeps=editDeps.filter(x=>x!==b.dataset.rmv);
    renderDepTags(editDeps);
  });
}

function wouldCycle(from, to){
  // returns true if adding "from uses to" would create a cycle
  const visited=new Set(); const stack=[from];
  while(stack.length){ const id=stack.pop(); if(id===to)return true;
    if(visited.has(id))continue; visited.add(id);
    const n=byId(id); if(!n)continue;
    [...(n.uses||[]),...(n.proof?.uses||[])].forEach(d=>stack.push(d)); }
  return false;
}

function addDep(id){
  if(editingId&&wouldCycle(id,editingId)){
    toast('Cannot add — this would create a circular dependency.');
    $('#eDepInput').value=''; $('#eDepDrop').classList.remove('open'); return;
  }
  if(!editDeps.includes(id)){ editDeps.push(id); renderDepTags(editDeps); }
  $('#eDepInput').value=''; $('#eDepDrop').classList.remove('open');
}

$('#eDepInput').addEventListener('input',()=>{
  const q=$('#eDepInput').value.toLowerCase().trim();
  const drop=$('#eDepDrop');
  const candidates=data.nodes.filter(n=>n.id!==editingId&&!editDeps.includes(n.id)&&
    (n.title.toLowerCase().includes(q)||n.id.toLowerCase().includes(q)));
  if(!q||!candidates.length){drop.classList.remove('open');return;}
  drop.innerHTML=candidates.slice(0,8).map(n=>
    `<button data-add="${esc(n.id)}"><span class="kind" style="font-size:9px">${n.kind}</span>${n.title.split('(')[0].trim()}</button>`
  ).join('');
  drop.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>addDep(b.dataset.add));
  drop.classList.add('open');
});
$('#eDepInput').addEventListener('keydown',e=>{
  if(e.key==='Escape'){$('#eDepDrop').classList.remove('open');}
});
document.addEventListener('click',e=>{
  if(!e.target.closest('#eDepTags'))$('#eDepDrop').classList.remove('open');
});
$('#eDepTags').addEventListener('click',()=>$('#eDepInput').focus());

/* --- live preview --- */
function refreshPreview(){
  const kind=$('#eKind').value;
  const title=$('#eTitle').value||'Untitled';
  const stmt=$('#eStmt').value||'';
  const proof=$('#eProof').value||'';

  $('#epKind').textContent=kindLabel(kind);
  $('#epKind').className='epv-kind '+kind;
  $('#epTitle').textContent=title;
  $('#epStmt').innerHTML=stmt;
  const pw=$('#epProofWrap');
  if(!isDef({kind}) && proof.trim()){
    $('#epProof').innerHTML=proof; pw.style.display='';
  } else { pw.style.display='none'; }

  const pv=$('#editScrim').querySelector('.epv-block');
  if(window.renderMathInElement) renderMathInElement(pv,{throwOnError:false,delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false},{left:'\\(',right:'\\)',display:false},{left:'\\[',right:'\\]',display:true}]});
}

['#eKind','#eTitle','#eStmt','#eProof'].forEach(sel=>{
  const el=$(sel);
  if(el) el.addEventListener('input',refreshPreview);
});
$('#eKind').addEventListener('change',()=>{
  const isdef=$('#eKind').value==='definition';
  $('#eProofWrap').style.display=isdef?'none':'';
  refreshPreview();
});

/* --- save / cancel / delete --- */
$('#eSaveBtn').onclick=()=>{
  if(!editingId)return;
  const n=byId(editingId); if(!n)return;
  const newKind=$('#eKind').value;
  const wasNonDef=n.proof!==null;
  const nowNonDef=newKind!=='definition';
  n.kind=newKind;
  n.title=$('#eTitle').value.trim()||n.title;
  n.statement=$('#eStmt').value;
  n.uses=[...editDeps];
  if(nowNonDef && !wasNonDef) n.proof={uses:[],text:''};
  if(!nowNonDef) n.proof=null;
  if(n.proof) n.proof.text=$('#eProof').value;
  closeEditModal();
  recordActivity();
  derive(); renderAll();
  toast('Block saved.');
};
$('#eCancelBtn').onclick=closeEditModal;
$('#eCancelX').onclick=closeEditModal;
$('#eArchitectBtn').onclick=()=>{
  if(!editingId)return;
  // use the unsaved proof text currently in the textarea
  const liveProofText=$('#eProof').value.trim();
  if(!liveProofText){toast('Write a proof first, then use Architect to decompose it.');return;}
  closeEditModal();
  // temporarily override proof text for architect to read
  const n=byId(editingId); const prev=n.proof?.text;
  if(n.proof) n.proof.text=liveProofText;
  openArchitect(editingId);
  if(n.proof) n.proof.text=prev; // restore (architect already captured it)
};
$('#editScrim').addEventListener('click',e=>{if(e.target===$('#editScrim'))closeEditModal();});
$('#eDeleteBtn').onclick=()=>{
  if(!editingId||!confirm('Delete this block?'))return;
  const id=editingId;
  data.nodes=data.nodes.filter(n=>n.id!==id);
  data.nodes.forEach(n=>{
    n.uses=(n.uses||[]).filter(u=>u!==id);
    if(n.proof)n.proof.uses=(n.proof.uses||[]).filter(u=>u!==id);
  });
  closeEditModal();
  selected=null;
  derive(); renderAll();
  toast('Block deleted.');
};

function toggleEdit(id){ openEditModal(id); }

/* misc */
let tID;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tID);tID=setTimeout(()=>t.classList.remove('show'),2600);}
function typeset(node){if(window.renderMathInElement){try{renderMathInElement(node,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false});}catch(e){}}}

/* ===================== project sidebar ===================== */
(function initProjects(){

  const sidebar=$('#projSidebar');
  $('#psToggle').onclick=()=>{
    sidebar.classList.toggle('collapsed');
    $('#psToggle').textContent=sidebar.classList.contains('collapsed')?'›':'‹';
  };

  const psNewForm=$('#psNewForm'), psNewName=$('#psNewName');
  $('#psNew').onclick=()=>{
    psNewForm.style.display=''; psNewName.value=''; psNewName.focus();
  };
  function confirmNewProject(){
    const name=(psNewName.value||'').trim()||'Untitled project';
    psNewForm.style.display='none';
    const id=newProject(name); switchProject(id);
    toast('New project "'+name+'" created.');
  }
  $('#psNewConfirm').onclick=confirmNewProject;
  $('#psNewCancel').onclick=()=>{ psNewForm.style.display='none'; };
  psNewName.addEventListener('keydown',e=>{
    if(e.key==='Enter') confirmNewProject();
    if(e.key==='Escape'){ psNewForm.style.display='none'; }
  });

  $('#psLoad').onchange=e=>{
    const f=e.target.files[0]; if(!f)return;
    const r=new FileReader();
    r.onload=()=>{
      try{
        const d=JSON.parse(r.result);
        if(!d.nodes||!Array.isArray(d.nodes))throw 0;
        d.project=d.project||{title:f.name.replace(/\.json$/,'')};
        const id=newProject(d.project.title,d);
        switchProject(id);
        toast('Opened "'+d.project.title+'" ('+d.nodes.length+' nodes).');
      }catch{toast('Couldn\'t parse — expected blueprint.json with a "nodes" array.');}
    };
    r.readAsText(f); e.target.value='';
  };

  renderProjList();
})();

/* ===================== import paper ===================== */
const PAPER_EXTRACT_PROMPT=`You are a mathematical knowledge extraction assistant. Read the paper and extract every named mathematical object: definitions, lemmas, theorems, propositions, corollaries, and remarks. For each one, identify which other objects in this paper it directly depends on.

Return ONLY valid JSON — no markdown fences, no explanation:
{
  "project": { "title": "<paper title>" },
  "nodes": [
    {
      "id": "<prefix>:<slug>",
      "kind": "definition|lemma|theorem|proposition|corollary|remark",
      "title": "<short name>",
      "statement": "<full statement, preserve LaTeX>",
      "uses": ["<id>"],
      "proof": null
    }
  ]
}
Rules:
- id prefixes: def: lem: thm: prop: cor: rmk:
- id slugs: lowercase, hyphens only, unique
- uses: only ids defined earlier in this same output; [] if none
- proof: null for definitions; for others: {"uses":[],"text":"<proof if present, else empty>"}
- Preserve LaTeX ($...$, $$...$$, \\(...\\), \\[...\\]) exactly
- Order nodes so dependencies come before the nodes that use them`;

async function callClaudeExtract(key, userContent){
  const resp=await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-beta':'pdfs-2024-09-25','anthropic-dangerous-direct-browser-access':'true'},
    body:JSON.stringify({model:'claude-opus-4-8',max_tokens:8192,system:PAPER_EXTRACT_PROMPT,messages:[{role:'user',content:userContent}]})
  });
  if(!resp.ok){const e=await resp.json().catch(()=>({}));throw new Error(e.error?.message||`API error ${resp.status}`);}
  return resp.json();
}

function parseBlueprint(raw){
  const cleaned=raw.replace(/^```(?:json)?\s*/,'').replace(/\s*```\s*$/,'').trim();
  const bp=JSON.parse(cleaned);
  if(!bp.nodes||!Array.isArray(bp.nodes)) throw new Error('Unexpected response format from Claude.');
  return bp;
}

(function initImportPaper(){
  const scrim=$('#importPaperScrim');
  const textArea=$('#importPaperText');
  const status=$('#importPaperStatus');
  const statusMsg=$('#importPaperStatusMsg');
  const convertBtn=$('#importPaperConvert');
  const fileInput=$('#importPaperFile');
  const fileLabel=$('#importPaperFileLabel');
  let pendingPdfBase64=null;

  function openModal(){
    textArea.value=''; status.style.display='none'; convertBtn.disabled=false;
    pendingPdfBase64=null; fileLabel.textContent='Upload PDF…';
    scrim.classList.add('open'); textArea.focus();
  }
  function closeModal(){ scrim.classList.remove('open'); pendingPdfBase64=null; }

  $('#importPaperBtn').onclick=openModal;
  $('#importPaperClose').onclick=closeModal;
  $('#importPaperCancel').onclick=closeModal;
  scrim.addEventListener('click',e=>{ if(e.target===scrim) closeModal(); });

  // Configure pdf.js worker using absolute URL so file:// context resolves it correctly
  if(window.pdfjsLib){
    const base=window.location.href.replace(/\/[^/]*$/, '/');
    pdfjsLib.GlobalWorkerOptions.workerSrc=base+'vendor/pdfjs/pdf.worker.min.js';
  }

  async function extractPdfText(arrayBuffer){
    if(!window.pdfjsLib) throw new Error('PDF library not loaded.');
    const pdf=await pdfjsLib.getDocument({data:arrayBuffer}).promise;
    const pages=[];
    for(let i=1;i<=pdf.numPages;i++){
      const page=await pdf.getPage(i);
      const content=await page.getTextContent();
      pages.push(content.items.map(it=>it.str).join(' '));
    }
    return pages.join('\n\n');
  }

  // PDF file input
  fileInput.onchange=async e=>{
    const f=e.target.files[0]; if(!f) return;
    fileLabel.textContent=f.name+' (reading…)';
    try{
      const buf=await f.arrayBuffer();
      statusMsg.textContent='Extracting text from PDF…';
      status.style.display='flex'; convertBtn.disabled=true;
      const extracted=await extractPdfText(buf);
      status.style.display='none'; convertBtn.disabled=false;
      if(!extracted.trim()) throw new Error('No readable text found in this PDF.');
      pendingPdfBase64=extracted; // reuse field to store extracted text
      fileLabel.textContent=f.name;
      textArea.value=extracted;
      textArea.placeholder='PDF text extracted — review or edit, then click Convert.';
    }catch(err){
      status.style.display='flex';
      statusMsg.textContent='Error: '+err.message;
      convertBtn.disabled=false;
      fileLabel.textContent='Upload PDF…';
    }
    e.target.value='';
  };

  convertBtn.onclick=async()=>{
    const text=textArea.value.trim();
    if(!text){ toast('Upload a PDF or paste paper text first.'); return; }
    const key=prefs.anthropicKey?.trim();
    if(!key){ toast('Set your Anthropic API key in Preferences first.'); return; }

    convertBtn.disabled=true;
    status.style.display='flex';
    statusMsg.textContent='Extracting mathematical structure…';

    try{
      const result=await callClaudeExtract(key,`Here is the paper to extract:\n\n${text}`);
      const raw=result.content?.[0]?.text||'';
      statusMsg.textContent='Parsing result…';
      const blueprint=parseBlueprint(raw);
      closeModal();
      textArea.placeholder='Paste paper content here (plain text or LaTeX)…';
      const title=blueprint.project?.title||'Imported paper';
      const id=newProject(title,blueprint);
      switchProject(id);
      toast(`Imported "${title}" — ${blueprint.nodes.length} nodes created.`);
    }catch(err){
      status.style.display='flex';
      statusMsg.textContent='Error: '+err.message;
      convertBtn.disabled=false;
    }
  };
})();

/* keep project name in sync when data.project.title changes */
function syncProjName(){
  const p=projects.find(p=>p.id===activeProjectId);
  if(p&&data.project?.title) p.name=data.project.title;
  renderProjList();
}

/* ── drag global knowledge set onto canvas ─────────────────────────── */
(function(){
  const gf=document.querySelector('.graphfull');
  gf.addEventListener('dragover',e=>{
    if(!e.dataTransfer.types.includes('application/x-gsid'))return;
    e.preventDefault(); e.dataTransfer.dropEffect='copy';
    gf.style.outline='2px dashed var(--accent)';
  });
  gf.addEventListener('dragleave',()=>{gf.style.outline='';});
  gf.addEventListener('drop',e=>{
    gf.style.outline='';
    const gsid=e.dataTransfer.getData('application/x-gsid'); if(!gsid)return;
    e.preventDefault();
    const svg=document.getElementById('graph');
    const sc=(()=>{
      const rect=svg.getBoundingClientRect();
      const px=e.clientX-rect.left, py=e.clientY-rect.top;
      return {x:(px-graphPan.x)/graphZoom, y:(py-graphPan.y)/graphZoom};
    })();
    importGlobalSet(gsid, sc);
  });
})();

/* ===================== AI integration ===================== */

async function callAI(messages, onChunk){
  const isAnthropic=prefs.model.startsWith('claude');
  const isGemini=prefs.model.startsWith('gemini');
  const key=isAnthropic?prefs.anthropicKey:isGemini?prefs.geminiKey:prefs.openaiKey;
  if(!key) throw new Error('No API key configured. Add one in Preferences → AI Integration.');

  let resp, full='';

  if(isGemini){
    const sys=messages.find(m=>m.role==='system');
    const contents=messages.filter(m=>m.role!=='system').map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}));
    const body={contents,generationConfig:{maxOutputTokens:4096}};
    if(sys?.content) body.systemInstruction={parts:[{text:sys.content}]};
    resp=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${prefs.model}:streamGenerateContent?key=${key}&alt=sse`,
      {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!resp.ok){const e=await resp.json().catch(()=>({}));throw new Error(e.error?.message||`Gemini API error ${resp.status}`);}
    const reader=resp.body.getReader(), dec=new TextDecoder();
    let buf='';
    while(true){
      const {done,value}=await reader.read(); if(done)break;
      buf+=dec.decode(value,{stream:true});
      const lines=buf.split('\n'); buf=lines.pop();
      for(const line of lines){
        if(!line.startsWith('data: '))continue;
        try{
          const ev=JSON.parse(line.slice(6));
          const text=ev.candidates?.[0]?.content?.parts?.[0]?.text||'';
          if(text){full+=text; onChunk&&onChunk(full);}
        }catch{}
      }
    }
    return full;
  }

  const base=(prefs.baseUrl||'').replace(/\/$/,'')||(isAnthropic?'https://api.anthropic.com':'https://api.openai.com');
  if(isAnthropic){
    const sys=messages.find(m=>m.role==='system');
    const userMsgs=messages.filter(m=>m.role!=='system');
    resp=await fetch(`${base}/v1/messages`,{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-calls':'true'},
      body:JSON.stringify({model:prefs.model,max_tokens:4096,system:sys?.content||'',messages:userMsgs,stream:true})});
  } else {
    resp=await fetch(`${base}/v1/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
      body:JSON.stringify({model:prefs.model,messages,stream:true,max_tokens:4096})});
  }
  if(!resp.ok){const e=await resp.json().catch(()=>({}));throw new Error(e.error?.message||`API error ${resp.status}`);}

  const reader=resp.body.getReader(), dec=new TextDecoder();
  let buf='';
  while(true){
    const {done,value}=await reader.read(); if(done)break;
    buf+=dec.decode(value,{stream:true});
    const lines=buf.split('\n'); buf=lines.pop();
    for(const line of lines){
      if(!line.startsWith('data: '))continue;
      const d=line.slice(6); if(d==='[DONE]')continue;
      try{
        const ev=JSON.parse(d);
        const text=isAnthropic?(ev.delta?.text||''):(ev.choices?.[0]?.delta?.content||'');
        if(text){full+=text; onChunk&&onChunk(full);}
      }catch{}
    }
  }
  return full;
}

/* ── Proof chat ──────────────────────────────────────────────────────── */
let proofChatHistory=[];
const nodeChatHistories={};  // nodeId → [{role,content}]

function initProofChat(node){
  // restore per-node history (persists across edits within the session)
  proofChatHistory=nodeChatHistories[node.id]||(nodeChatHistories[node.id]=[]);
  const msgs=$('#eProofChatMsgs');
  msgs.innerHTML='';
  // replay existing history into the UI
  proofChatHistory.forEach(m=>{
    const el=document.createElement('div');
    el.className='pchat-msg pchat-'+m.role;
    el.innerHTML=`<span class="pchat-bubble"></span>`;
    el.querySelector('.pchat-bubble').textContent=m.content;
    msgs.appendChild(el);
  });
  msgs.scrollTop=msgs.scrollHeight;
  $('#eProofChatInput').value='';
}

function proofChatAddMsg(role, text){
  proofChatHistory.push({role,content:text});
  const msgs=$('#eProofChatMsgs');
  const el=document.createElement('div');
  el.className='pchat-msg pchat-'+role;
  el.innerHTML=`<span class="pchat-bubble"></span>`;
  msgs.appendChild(el);
  const bubble=el.querySelector('.pchat-bubble');
  bubble.textContent=text;
  msgs.scrollTop=msgs.scrollHeight;
  return bubble;
}

async function sendProofChat(){
  const input=$('#eProofChatInput');
  const msg=input.value.trim(); if(!msg)return;
  input.value=''; input.disabled=true;
  $('#eProofChatSend').disabled=true;

  // show user bubble
  proofChatAddMsg('user', msg);

  const proofText=$('#eProof').value.trim();
  const nodeKind=$('#eKind').value;
  const nodeTitle=$('#eTitle').value.trim();
  const nodeStmt=$('#eStmt').value.trim();

  const system=`You are a mathematical assistant helping the user write and refine a proof in Margin, a theorem graph notebook.
Node: (${nodeKind}) "${nodeTitle}"
Statement: ${nodeStmt}
${proofText?`Current proof:\n${proofText}`:'No proof written yet.'}
Be concise. You may suggest LaTeX. When the user asks you to write or rewrite the proof, produce the full proof text they can copy in.`;

  // build messages from history (exclude the just-added user msg — we'll append it)
  const history=proofChatHistory.slice(0,-1).slice(-8);
  const messages=[{role:'system',content:system},...history,{role:'user',content:msg}];

  // streaming assistant bubble
  const msgs=$('#eProofChatMsgs');
  const el=document.createElement('div');
  el.className='pchat-msg pchat-assistant';
  el.innerHTML=`<span class="pchat-bubble"></span>`;
  msgs.appendChild(el);
  const aiBubble=el.querySelector('.pchat-bubble');
  msgs.scrollTop=msgs.scrollHeight;

  try{
    const full=await callAI(messages, text=>{
      aiBubble.textContent=text;
      msgs.scrollTop=msgs.scrollHeight;
    });
    proofChatHistory.push({role:'assistant',content:full});
  }catch(err){
    aiBubble.textContent='Error: '+err.message;
    aiBubble.style.color='var(--danger,#B5503A)';
  }
  input.disabled=false;
  $('#eProofChatSend').disabled=false;
  input.focus();
}

$('#eProofChatSend').onclick=sendProofChat;
$('#eProofChatInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendProofChat();}});

/* ── Proof Architect ──────────────────────────────────────────────────── */
let architectNodeId=null;
let architectResult=null;

async function openArchitect(nodeId){
  const n=byId(nodeId); if(!n)return;
  const proofText=(n.proof?.text||'').trim();
  if(!proofText){
    toast('Write a proof first — Architect will break it into nodes.');
    return;
  }
  architectNodeId=nodeId; architectResult=null;
  $('#archTargetBadge').textContent=n.title;
  $('#archBody').innerHTML=`<div class="arch-loading"><div class="arch-spinner"></div><div>Decomposing proof into nodes…</div><div class="arch-stream" id="archStream"></div></div>`;
  $('#archFooter').style.display='none';
  $('#architectScrim').classList.add('open');

  const targetDeps=(n.uses||[]).map(byId).filter(Boolean);
  const otherNodes=data.nodes.filter(x=>x.id!==n.id&&!(n.uses||[]).includes(x.id)).slice(0,40);

  const systemPrompt=`You are a mathematical proof architect embedded in Margin, a theorem graph notebook. Given a target statement and the user's written proof, you decompose the proof into clean intermediate nodes (lemmas, definitions, propositions) that can live as separate graph nodes. Output structured JSON only — no prose outside the JSON.`;

  const userPrompt=`Target to prove:
Kind: ${n.kind}
Title: ${n.title}
Statement: ${n.statement}

User's written proof:
${proofText}

Already-declared dependencies (existing nodes connected to the target):
${targetDeps.length?targetDeps.map(d=>`  [${d.id}] (${d.kind}) "${d.title}": ${d.statement}`).join('\n'):'  (none)'}

Other available nodes in the graph (can be referenced as dependencies):
${otherNodes.length?otherNodes.map(x=>`  [${x.id}] (${x.kind}) "${x.title}": ${x.statement}`).join('\n'):'  (none)'}

Decompose the user's proof into 2–5 intermediate nodes (key lemmas, sub-claims, or definitions introduced in the proof). Each node should be a clean, reusable mathematical unit that captures one logical step from the proof.

Respond with ONLY valid JSON:
{
  "strategy": "2–3 sentence description of how you decomposed the proof and what each node captures",
  "nodes": [
    {
      "kind": "lemma",
      "title": "Short descriptive title",
      "statement": "Precise mathematical statement (LaTeX supported with $...$ and $$...$$)",
      "proof": "The relevant excerpt or condensed proof of this sub-claim, from the user's proof",
      "dependsOnExisting": ["existing-node-id"],
      "dependsOnNew": []
    }
  ],
  "targetDependsOnNew": [0, 1]
}
Rules:
- Extract nodes from the actual proof text — do not invent new mathematics not present in the proof
- dependsOnExisting: IDs from the available nodes listed above only
- dependsOnNew: 0-based indices into your nodes array (dependencies between new nodes)
- targetDependsOnNew: indices of new nodes that the target directly uses`;

  try{
    const raw=await callAI(
      [{role:'system',content:systemPrompt},{role:'user',content:userPrompt}],
      full=>{ const el=$('#archStream'); if(el) el.textContent=full.slice(-140).replace(/^[^{]*/,'')+'…'; }
    );
    const m=raw.match(/\{[\s\S]*\}/); if(!m)throw new Error('Unexpected response format.');
    const parsed=JSON.parse(m[0]);
    architectResult={
      strategy:parsed.strategy||'',
      targetDependsOnNew:parsed.targetDependsOnNew||[],
      nodes:(parsed.nodes||[]).map(nd=>({...nd,dependsOnExisting:nd.dependsOnExisting||[],dependsOnNew:nd.dependsOnNew||[],_state:'pending'}))
    };
    renderArchitectResult();
  }catch(err){
    $('#archBody').innerHTML=`<div class="arch-loading" style="gap:10px"><div style="font-size:22px">⚠</div><div style="color:#B5503A;font-weight:600">${err.message}</div><div style="font-size:12px;color:var(--ink-faint)">Check your API key in Preferences → AI Integration.</div></div>`;
  }
}

function renderArchitectResult(){
  if(!architectResult)return;
  const {strategy,nodes}=architectResult;
  let html='';
  if(strategy) html+=`<div class="arch-strategy">${strategy}</div>`;
  if(!nodes.length){
    html+=`<div style="color:var(--ink-faint);font-size:13px;padding:20px 0;text-align:center">No intermediate nodes suggested — the statement may follow directly from its dependencies.</div>`;
  }
  nodes.forEach((node,i)=>{
    const kc=KIND_COLOR[node.kind]||KIND_COLOR.remark;
    const chips=[
      ...node.dependsOnExisting.map(id=>{const nd=byId(id);return `<span class="arch-dep-chip">${nd?nd.title.split('(')[0].trim():id}</span>`;}),
      ...node.dependsOnNew.map(idx=>`<span class="arch-dep-chip arch-dep-new">↑ ${nodes[idx]?.title||'node '+idx}</span>`)
    ].join('');
    html+=`<div class="arch-node-card ${node._state}" data-idx="${i}">
      <div class="arch-card-hd">
        <span class="arch-kind" style="color:${kc.bd}">${node.kind}</span>
        <span class="arch-title">${esc(node.title)}</span>
      </div>
      <div class="arch-stmt" id="archStmt${i}"></div>
      ${chips?`<div class="arch-deps">${chips}</div>`:''}
      <div class="arch-card-actions">
        <button class="btn ${node._state==='accepted'?'primary':''}" data-accept="${i}">${node._state==='accepted'?'✓ Accepted':'Accept'}</button>
        <button class="btn ${node._state==='rejected'?'active':''}" data-reject="${i}">${node._state==='rejected'?'Rejected':'Reject'}</button>
      </div>
    </div>`;
  });
  $('#archBody').innerHTML=html;
  nodes.forEach((_,i)=>{
    const el=$('#archBody').querySelector(`#archStmt${i}`);
    if(el){el.textContent=nodes[i].statement; typeset(el);}
  });
  $('#archBody').querySelectorAll('[data-accept]').forEach(b=>b.onclick=()=>{
    const nd=architectResult.nodes[+b.dataset.accept];
    nd._state=nd._state==='accepted'?'pending':'accepted'; renderArchitectResult();
  });
  $('#archBody').querySelectorAll('[data-reject]').forEach(b=>b.onclick=()=>{
    const nd=architectResult.nodes[+b.dataset.reject];
    nd._state=nd._state==='rejected'?'pending':'rejected'; renderArchitectResult();
  });
  const accepted=nodes.filter(nd=>nd._state==='accepted').length;
  $('#archHint').textContent=`${accepted} of ${nodes.length} node${nodes.length!==1?'s':''} accepted`;
  $('#archFooter').style.display='';
}

function applyArchitectResult(){
  if(!architectResult||!architectNodeId)return;
  const target=byId(architectNodeId); if(!target)return;
  const {nodes,targetDependsOnNew}=architectResult;
  const accepted=nodes.map((nd,i)=>({...nd,_origIdx:i})).filter(nd=>nd._state==='accepted');
  if(!accepted.length){closeArchitect();return;}
  const idMap={};
  accepted.forEach((nd,i)=>{idMap[nd._origIdx]='arch:'+(nd.kind.slice(0,3))+'-'+Date.now()+'-'+i;});
  accepted.forEach(nd=>{
    const uses=[
      ...nd.dependsOnExisting.filter(eid=>byId(eid)),
      ...nd.dependsOnNew.filter(idx=>idMap[idx]!==undefined).map(idx=>idMap[idx])
    ];
    data.nodes.push({id:idMap[nd._origIdx],kind:nd.kind,title:nd.title,statement:nd.statement,uses,
      proof:nd.kind==='definition'?null:{uses:[],text:nd.proof||''}});
  });
  const newDeps=targetDependsOnNew.filter(idx=>idMap[idx]!==undefined).map(idx=>idMap[idx]);
  target.uses=[...new Set([...(target.uses||[]),...newDeps])];
  closeArchitect(); derive(); renderAll();
  toast(`Added ${accepted.length} node${accepted.length!==1?'s':''} to the graph.`);
}

function closeArchitect(){
  $('#architectScrim').classList.remove('open');
  architectNodeId=null; architectResult=null;
}

$('#archClose').onclick=closeArchitect;
$('#archCancel').onclick=closeArchitect;
$('#architectScrim').onclick=e=>{if(e.target===$('#architectScrim'))closeArchitect();};
$('#archAcceptAll').onclick=()=>{architectResult&&architectResult.nodes.forEach(nd=>{if(nd._state!=='rejected')nd._state='accepted';});renderArchitectResult();};
$('#archApply').onclick=applyArchitectResult;

/* ── ⌘K search palette ──────────────────────────────────────────────────── */
(function initSearch(){
  let srActive=0;
  const scrim=$('#searchScrim'), input=$('#searchInput'), results=$('#searchResults');

  function openSearch(){ scrim.classList.add('open'); input.value=''; renderResults(''); input.focus(); }
  function closeSearch(){ scrim.classList.remove('open'); }

  function stripHtml(s){ const d=document.createElement('div'); d.innerHTML=s||''; return d.textContent||''; }

  function renderResults(q){
    q=q.toLowerCase().trim();
    const matches=q
      ? data.nodes.filter(n=>(n.title||'').toLowerCase().includes(q)||(stripHtml(n.statement||'')).toLowerCase().includes(q))
      : data.nodes.slice(0,12);
    results.innerHTML='';
    srActive=0;
    matches.slice(0,24).forEach((n,i)=>{
      const row=document.createElement('div'); row.className='search-result'+(i===0?' sr-active':'');
      row.innerHTML=`<span class="sr-kind">${n.kind}</span><span class="sr-title">${n.title||n.id}</span><span class="sr-stmt">${stripHtml(n.statement||'')}</span>`;
      row.onmouseenter=()=>{ results.querySelectorAll('.search-result').forEach((r,j)=>r.classList.toggle('sr-active',j===i)); srActive=i; };
      row.onclick=()=>{ closeSearch(); select(n.id); };
      results.appendChild(row);
    });
  }

  input.addEventListener('input',()=>renderResults(input.value));

  input.addEventListener('keydown',e=>{
    const rows=[...results.querySelectorAll('.search-result')];
    if(e.key==='ArrowDown'){ e.preventDefault(); srActive=Math.min(srActive+1,rows.length-1); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); srActive=Math.max(srActive-1,0); }
    else if(e.key==='Enter'){ const r=rows[srActive]; if(r) r.click(); return; }
    else if(e.key==='Escape'){ closeSearch(); return; }
    rows.forEach((r,i)=>r.classList.toggle('sr-active',i===srActive));
    rows[srActive]?.scrollIntoView({block:'nearest'});
  });

  scrim.addEventListener('click',e=>{ if(e.target===scrim) closeSearch(); });

  document.addEventListener('keydown',e=>{
    if((e.metaKey||e.ctrlKey)&&e.key==='k'){ e.preventDefault(); openSearch(); }
    if(e.key==='Escape'&&scrim.classList.contains('open')) closeSearch();
  });
})();

/* ===================== activity log ===================== */
let activityLog={}; // {YYYY-MM-DD: count}
function loadActivity(){
  try{ const r=localStorage.getItem('margin-activity'); if(r) activityLog=JSON.parse(r); }catch(e){}
}
function saveActivity(){
  try{ localStorage.setItem('margin-activity',JSON.stringify(activityLog)); }catch(e){}
}
function recordActivity(){
  const d=new Date(); const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  activityLog[key]=(activityLog[key]||0)+1; saveActivity();
}

/* ===================== home page ===================== */
function renderHomePage(){
  const hp=$('#homePage'); if(!hp) return;
  // greeting
  const h=new Date().getHours();
  const timeWord=h<12?'Good morning':h<17?'Good afternoon':'Good evening';
  const name=prefs.name?.trim();
  $('#homeGreeting').innerHTML=name?`${timeWord}, <span>${name}</span>.`:`${timeWord}.`;

  // activity calendar (12 weeks)
  const cal=$('#homeCal'); cal.innerHTML='';
  const today=new Date(); today.setHours(0,0,0,0);
  const WEEKS=16;
  // start from Monday of the week 16 weeks ago
  const startDay=new Date(today); startDay.setDate(today.getDate()-WEEKS*7+1);
  // find max for scaling
  const counts=Object.values(activityLog); const maxC=Math.max(...counts,1);
  function levelFor(c){ if(!c)return 0; const r=c/maxC; return r<.25?1:r<.5?2:r<.75?3:4; }
  function dateKey(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  $('#homeCalYear').textContent=today.getFullYear();
  const cur=new Date(startDay);
  for(let w=0;w<WEEKS;w++){
    const col=document.createElement('div'); col.className='hcol';
    for(let d=0;d<7;d++){
      const cell=document.createElement('div'); cell.className='hcell';
      const key=dateKey(cur); const cnt=activityLog[key]||0;
      const lv=levelFor(cnt); if(lv) cell.dataset.l=lv;
      cell.title=key+(cnt?` · ${cnt} edit${cnt>1?'s':''}`:'');
      col.appendChild(cell);
      cur.setDate(cur.getDate()+1);
    }
    cal.appendChild(col);
  }

  // project cards
  const cards=$('#homeCards'); cards.innerHTML='';
  // new project card
  const nc=document.createElement('button'); nc.className='home-card new-card';
  nc.innerHTML=`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg><span>New project</span>`;
  nc.onclick=()=>{ $('#psNew').click(); };
  cards.appendChild(nc);

  const ic=document.createElement('button'); ic.className='home-card new-card';
  ic.innerHTML=`<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12h6M9 16h6M6 2h8l4 4v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"/><polyline points="14,2 14,8 20,8"/></svg><span>Import from paper</span>`;
  ic.onclick=()=>{ $('#importPaperBtn').click(); };
  cards.appendChild(ic);

  projects.forEach(p=>{
    const d=projectData[p.id]; if(!d) return;
    const nodes=d.nodes||[]; const total=nodes.length;
    const nonDef=nodes.filter(n=>n.kind!=='definition');
    const proved=nonDef.filter(n=>n.proof?.text?.trim()).length;
    const pct=nonDef.length?Math.round(proved/nonDef.length*100):0;
    const sets=(d.sets||[]).length;
    const card=document.createElement('button'); card.className='home-card';
    card.innerHTML=`
      <div class="home-card-mini" id="hcmini-${p.id}"></div>
      <div class="home-card-name">${p.name||'Untitled'}</div>
      <div class="home-card-stats">
        <div class="home-card-stat"><b>${total}</b><span>nodes</span></div>
        <div class="home-card-stat"><b>${pct}%</b><span>proved</span></div>
        <div class="home-card-stat"><b>${sets}</b><span>sets</span></div>
      </div>`;
    card.onclick=()=>openProjectDetail(p.id);
    cards.appendChild(card);
    // render mini graph async
    setTimeout(()=>renderMiniGraph(p.id, document.getElementById('hcmini-'+p.id)), 0);
  });
}

function renderMiniGraph(pid, container){
  if(!container) return;
  const d=projectData[pid]; if(!d) return;
  const nodes=d.nodes||[]; if(!nodes.length){ container.innerHTML='<svg></svg>'; return; }
  const W=container.clientWidth||220, H=container.clientHeight||70;
  const PAD=10, cols=Math.ceil(Math.sqrt(nodes.length*1.5));
  const cw=(W-PAD*2)/Math.max(cols,1); const ch=(H-PAD*2)/Math.max(Math.ceil(nodes.length/cols),1);
  const pos={};
  nodes.forEach((n,i)=>{ pos[n.id]={x:PAD+(i%cols+.5)*cw, y:PAD+(Math.floor(i/cols)+.5)*ch}; });
  const kindColor={'definition':'#6B9080','lemma':'#7B93C4','theorem':'#C07B8E','remark':'#A89262','proposition':'#7B93C4','corollary':'#7B93C4'};
  let svg=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  // edges
  nodes.forEach(n=>{ (n.uses||[]).forEach(uid=>{ const a=pos[n.id],b=pos[uid]; if(a&&b) svg+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#ccc" stroke-width="1" opacity=".7"/>`; }); });
  // nodes
  nodes.forEach(n=>{ const p=pos[n.id]; const c=kindColor[n.kind]||'#999'; svg+=`<circle cx="${p.x}" cy="${p.y}" r="4" fill="${c}" opacity=".85"/>`; });
  svg+='</svg>';
  container.innerHTML=svg;
}

function openProjectDetail(pid){
  const det=$('#homeDetail'), body=$('#homeDetailBody'); if(!det||!body) return;
  const p=projects.find(x=>x.id===pid); if(!p) return;
  const d=projectData[pid]||{nodes:[],sets:[]};
  const nodes=d.nodes||[]; const total=nodes.length;
  const nonDef=nodes.filter(n=>n.kind!=='definition');
  const proved=nonDef.filter(n=>n.proof?.text?.trim()).length;
  const pct=nonDef.length?Math.round(proved/nonDef.length*100):0;
  const sets=(d.sets||[]).length;

  // recent activity: last 5 nodes by edit timestamp (fall back to array order)
  const recent=[...nodes].reverse().slice(0,5);
  const actHtml=recent.length?recent.map(n=>`<div class="hd-act-item"><span class="hd-act-dot"></span><span>${n.kind[0].toUpperCase()+n.kind.slice(1)}: <b>${n.title||'—'}</b></span></div>`).join(''):'<div style="font-size:12px;color:var(--ink-faint)">No nodes yet.</div>';

  body.innerHTML=`
    <div class="hd-name">${p.name||'Untitled'}</div>
    <div class="hd-stats">
      <div class="hd-stat"><div class="hd-stat-val">${total}</div><div class="hd-stat-lbl">Nodes</div></div>
      <div class="hd-stat"><div class="hd-stat-val">${pct}%</div><div class="hd-stat-lbl">Proved</div></div>
      <div class="hd-stat"><div class="hd-stat-val">${sets}</div><div class="hd-stat-lbl">Sets</div></div>
    </div>
    <div class="hd-mini" id="hdMini"></div>
    <div class="hd-section">Recent nodes</div>
    <div class="hd-activity">${actHtml}</div>
    <div class="hd-actions">
      <button class="btn primary" id="hdOpen">Open →</button>
      <button class="btn danger" id="hdDelete" style="border-color:#E5C9C0;color:#B5503A;background:#F8EEEA">Delete</button>
    </div>`;

  det.classList.add('open');
  renderMiniGraph(pid, document.getElementById('hdMini'));
  document.getElementById('hdOpen').onclick=()=>{ det.classList.remove('open'); switchProject(pid); };
  document.getElementById('hdDelete').onclick=()=>{ det.classList.remove('open'); deleteProject(pid); renderHomePage(); };
}

async function boot(){
  loadPrefs();
  loadActivity();
  if(await loadAll()) syncProjName();
  showHome();        // hides canvas, renders home page + sidebar
  renderProjList();  // populate sidebar regardless
  if(activeProjectId) derive(); // pre-derive so canvas is ready when opened
  // wire home button
  document.getElementById('homeBtn')?.addEventListener('click', goHome);
  document.getElementById('homeDetailClose')?.addEventListener('click', ()=>$('#homeDetail').classList.remove('open'));
}

window.addEventListener('load', boot);
