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

/* ===================== projects ===================== */
let projects=[]; // [{id,name,data}]
let activeProjectId=null;
let projCounter=0;
const $=s=>document.querySelector(s);
function clone(o){return JSON.parse(JSON.stringify(o));}

function newProject(name,blueprint){
  projCounter++;
  const id='proj'+projCounter;
  const d=blueprint?clone(blueprint):clone(SAMPLE);
  if(!d.sets)d.sets=[];
  projects.push({id,name:name||d.project?.title||'Untitled'});
  projectData[id]=d;
  return id;
}
const projectData={}; // id -> data object

function switchProject(id){
  if(activeProjectId===id)return;
  if(activeProjectId)projectData[activeProjectId]=clone(data);
  activeProjectId=id;
  data=projectData[id];
  if(!data.sets)data.sets=[];
  selected=null; derive(); renderAll(); renderProjList();
}

function deleteProject(id){
  if(projects.length<=1){toast('Cannot delete the only project.');return;}
  projects=projects.filter(p=>p.id!==id);
  delete projectData[id];
  if(activeProjectId===id) switchProject(projects[0].id);
  else renderProjList();
}

function renderProjList(){
  const list=$('#projList'); if(!list)return;
  list.innerHTML='';

  // ── Global Knowledge Sets (library) ──────────────────────────────────────
  const gSec=document.createElement('div');
  gSec.className='ps-section';
  const uploadIcon=`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 9l5-5 5 5M12 4v12"/></svg>`;
  gSec.innerHTML=`Global Library<span class="ps-section-line"></span><button class="ps-section-add" id="gsUploadBtn" title="Upload knowledge set to library">${uploadIcon}</button>`;
  list.appendChild(gSec);

  if(globalSets.length===0){
    const empty=document.createElement('div');
    empty.style.cssText='font-size:11px;color:var(--ink-faint);padding:4px 10px 8px;line-height:1.4';
    empty.textContent='Upload blueprint JSONs to build a reusable library.';
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
            globalSets.push({id:'gs'+gsCounter,name:d.project?.title||f.name.replace(/\.json$/,''),nodes:clone(d.nodes),project:clone(d.project||{})});
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
    btn.innerHTML=`<span class="pi-dot"></span><span class="pi-name">${p.name||'Untitled'}</span><button class="pi-del" title="Remove" data-pid="${p.id}">×</button>`;
    btn.onclick=ev=>{if(ev.target.classList.contains('pi-del'))return; switchProject(p.id);};
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
function entityIdOfNode(nodeId){const n=byId(nodeId); return (n&&n.setId)?n.setId:nodeId;}
function setMembers(s){return (s.nodeIds||[]).map(byId).filter(Boolean);}

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
function tint(hex,amt=0.86){const c=(hex||'#888').replace('#','');const r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16);const m=v=>Math.round(v+(255-v)*amt);return `rgb(${m(r)},${m(g)},${m(b)})`;}

/* ---- entity-aware layered layout ---- */
const SET_PAD=16, SET_HDR=28, SET_COLLAPSED_H=46;
function setCollapsedW(s){const t=(s.title||'Set');return Math.max(170,Math.min(260,t.length*7.4+76));}
function layeredLayout(ids, depsFn, sizeFn, opt){
  opt=opt||{}; const HGAP=opt.hgap??38, VGAP=opt.vgap??96, TOP=opt.top??40, SIDE=opt.side??30;
  const idset=new Set(ids), memo={};
  function layer(id,seen){ if(id in memo)return memo[id]; seen=seen||new Set(); if(seen.has(id))return 0; seen.add(id);
    const d=depsFn(id).filter(x=>idset.has(x)); const L=d.length?1+Math.max(...d.map(x=>layer(x,seen))):0; memo[id]=L; return L; }
  ids.forEach(id=>layer(id));
  const layers={}; ids.forEach(id=>{(layers[memo[id]]=layers[memo[id]]||[]).push(id);});
  const maxL=Math.max(0,...Object.keys(layers).map(Number));
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
function setInnerLayout(s){
  const ids=(s.nodeIds||[]).filter(id=>byId(id));
  const dep=id=>{const n=byId(id); if(!n)return[]; return [...(n.uses||[]),...(n.proof?.uses||[])].filter(r=>(s.nodeIds||[]).includes(r));};
  return layeredLayout(ids, dep, id=>({w:boxW(byId(id)),h:BOX_H}), {top:SET_HDR+12,vgap:64,side:SET_PAD,hgap:30});
}
function layoutGraph(){
  const entities=[], entMeta={};
  data.nodes.forEach(n=>{ if(!n.setId){ entities.push(n.id); entMeta[n.id]={type:'node',node:n,w:boxW(n),h:BOX_H}; }});
  (data.sets||[]).forEach(s=>{ entities.push(s.id);
    if(s.collapsed){ entMeta[s.id]={type:'set',set:s,w:setCollapsedW(s),h:SET_COLLAPSED_H}; }
    else { const inner=setInnerLayout(s);
      (s.nodeIds||[]).forEach(nid=>{ if(nodeManualPos[nid]) inner.pos[nid]={...inner.pos[nid],...nodeManualPos[nid]}; });
      entMeta[s.id]={type:'setopen',set:s,w:Math.max(180,inner.W),h:inner.H+SET_PAD,inner}; }});
  const entDeps=id=>{const meta=entMeta[id]; const nodes=meta.type==='node'?[meta.node]:setMembers(meta.set); const out=new Set();
    nodes.forEach(n=>[...(n.uses||[]),...(n.proof?.uses||[])].forEach(r=>{const e=entityIdOfNode(r); if(e&&e!==id&&entMeta[e])out.add(e);})); return [...out];};
  const L=layeredLayout(entities, entDeps, id=>({w:entMeta[id].w,h:entMeta[id].h}), {});
  entities.forEach(id=>{ if(entityManualPos[id]) L.pos[id]={...L.pos[id],...entityManualPos[id]}; });
  const nodePos={};
  entities.forEach(id=>{const m=entMeta[id], ep=L.pos[id];
    if(m.type==='node') nodePos[id]={x:ep.x,y:ep.y};
    else if(m.type==='set') setMembers(m.set).forEach(n=>nodePos[n.id]={x:ep.x,y:ep.y});
    else {const ox=ep.x-m.w/2, oy=ep.y-m.h/2; (m.set.nodeIds||[]).forEach(nid=>{const rp=m.inner.pos[nid]; if(rp)nodePos[nid]={x:ox+rp.x,y:oy+rp.y};});}});
  return {entities,entMeta,entPos:L.pos,nodePos,W:L.W,H:L.H};
}
function computeEntityEdges(){
  const directed={}, internalOpen=[];
  data.nodes.forEach(c=>{
    [...new Set([...(c.uses||[]),...(c.proof?.uses||[])])].forEach(pid=>{const p=byId(pid); if(!p)return;
      const se=entityIdOfNode(pid), te=entityIdOfNode(c.id);
      if(se===te){const s=setById(se); if(s&&!s.collapsed) internalOpen.push({from:pid,to:c.id}); return;}
      const key=se+'=>'+te; (directed[key]=directed[key]||{src:se,tgt:te,links:[]}).links.push({from:pid,to:c.id});});
  });
  const seen=new Set(), edges=[];
  Object.values(directed).forEach(d=>{const pkey=[d.src,d.tgt].sort().join('|'); if(seen.has(pkey))return; seen.add(pkey);
    const rev=directed[d.tgt+'=>'+d.src];
    edges.push({a:d.src,b:d.tgt,forward:d.links,backward:rev?rev.links:[],bidir:!!rev});});
  return {edges,internalOpen};
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
  const isMSel=!opts.inset&&multiSel.has(n.id);
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

function renderGraph(){
  const g=$('#graph'); g.innerHTML='';
  const lay=layoutGraph(); const {entities,entMeta,entPos,nodePos,W,H}=lay;

  const defs=document.createElementNS(NS,'defs');
  const mkMarker=(id,color)=>{const m=mk('marker',{id,markerWidth:'7',markerHeight:'7',refX:'6',refY:'3.5',orient:'auto'});
    m.appendChild(mk('polygon',{points:'0 0, 7 3.5, 0 7',fill:color})); return m;};
  defs.appendChild(mkMarker('arrow','#c2cedb'));
  defs.appendChild(mkMarker('arrow-hot','var(--accent)'));
  defs.appendChild(mkMarker('arrow-agg','var(--accent)'));
  const mkMarkerS=(id,color)=>{const m=mk('marker',{id,markerWidth:'7',markerHeight:'7',refX:'1',refY:'3.5',orient:'auto'});
    m.appendChild(mk('polygon',{points:'7 0, 0 3.5, 7 7',fill:color})); return m;};
  defs.appendChild(mkMarkerS('arrow-agg-s','var(--accent)'));
  g.appendChild(defs);

  const pan=mk('g',{transform:`translate(${graphPan.x},${graphPan.y}) scale(${graphZoom})`}); pan.id='graph-pan';
  const sel=byId(selected); const selDeps=sel?depsOf(sel).map(d=>d.id):[];
  const {edges,internalOpen}=computeEntityEdges();

  // 1. expanded-set frames
  entities.forEach(id=>{const m=entMeta[id]; if(m.type!=='setopen')return;
    const ep=entPos[id]; const col=m.set.color||'#888'; const w=m.w,h=m.h;
    const fg=mk('g',{class:'setframe',id:`setframe-${id}`,transform:`translate(${ep.x},${ep.y})`});
    fg.appendChild(mk('rect',{class:'frame',x:-w/2,y:-h/2,width:w,height:h,rx:14,style:`fill:${col};stroke:${col}`}));
    const hdr=mk('g',{class:'fhdr'}); hdr.dataset.setId=id;
    hdr.appendChild(mk('rect',{class:'fhdr-bg',x:-w/2,y:-h/2,width:w-64,height:30,rx:14}));
    const tt=mk('text',{class:'ftitle',x:-w/2+14,y:-h/2+18,style:`fill:${col}`}); tt.textContent='▴ '+(m.set.title||'Set')+'  ·  '+(m.set.nodeIds||[]).length;
    hdr.appendChild(tt); fg.appendChild(hdr);
    const expG=mk('g',{class:'fhdr-export',style:'pointer-events:auto;cursor:pointer'}); expG.dataset.setId=id;
    expG.appendChild(mk('rect',{x:w/2-116,y:-h/2+4,width:52,height:22,rx:7,style:`fill:${col};opacity:.18`}));
    const expT=mk('text',{x:w/2-90,y:-h/2+17,'text-anchor':'middle','dominant-baseline':'central',style:`fill:${col};font-size:10px;font-family:var(--font-ui);font-weight:600;pointer-events:none`});
    expT.textContent='⬇ export'; expG.appendChild(expT); fg.appendChild(expG);
    const delG=mk('g',{class:'fhdr-delete',style:'pointer-events:auto;cursor:pointer'}); delG.dataset.setId=id;
    delG.appendChild(mk('rect',{x:w/2-58,y:-h/2+4,width:52,height:22,rx:7,style:`fill:${col};opacity:.18`}));
    const delT=mk('text',{x:w/2-32,y:-h/2+17,'text-anchor':'middle','dominant-baseline':'central',style:`fill:${col};font-size:10px;font-family:var(--font-ui);font-weight:600;pointer-events:none`});
    delT.textContent='✕ delete'; delG.appendChild(delT); fg.appendChild(delG);
    internalOpen.forEach(e=>{const nf=byId(e.from), nt=byId(e.to); if(!nf||nf.setId!==id||!nt||nt.setId!==id)return;
      const a=nodePos[e.from], b=nodePos[e.to]; if(!a||!b)return;
      const ra={x:a.x-ep.x,y:a.y-ep.y}, rb={x:b.x-ep.x,y:b.y-ep.y};
      fg.appendChild(mk('path',{class:'edge','data-from':e.from,'data-to':e.to,d:edgePath(ra,rb),'marker-end':'url(#arrow)'}));});
    (m.set.nodeIds||[]).forEach(nid=>{const n=byId(nid); const np=nodePos[nid]; if(!n||!np)return;
      const rp={x:np.x-ep.x,y:np.y-ep.y};
      fg.appendChild(renderNodeCard(n,rp,{selDeps,inset:true}));});
    pan.appendChild(fg);
  });

  // 2. top-level edges
  edges.forEach(e=>{
    const agg=entMeta[e.a].type!=='node'||entMeta[e.b].type!=='node';
    const ca=entityManualPos[e.a]||entPos[e.a], cb=entityManualPos[e.b]||entPos[e.b]; if(!ca||!cb)return;
    if(!agg){
      const hot=(e.a===selected||e.b===selected);
      pan.appendChild(mk('path',{class:'edge'+(hot?' hot':''),id:`edge-${e.a}--${e.b}`,'data-a':e.a,'data-b':e.b,'data-kind':'node',
        d:edgePath(ca,cb),'marker-end':`url(#${hot?'arrow-hot':'arrow'})`}));
      return;
    }
    const ha=entMeta[e.a].h, hb=entMeta[e.b].h;
    const path=mk('path',{class:'edge agg',id:`aggedge-${e.a}--${e.b}`,'data-a':e.a,'data-b':e.b,'data-kind':'agg','data-ha':ha,'data-hb':hb,
      d:edgePath2(ca,cb,ha,hb)});
    if(e.forward.length) path.setAttribute('marker-end','url(#arrow-agg)');
    if(e.backward.length) path.setAttribute('marker-start','url(#arrow-agg-s)');
    path.__links={forward:e.forward,backward:e.backward,a:e.a,b:e.b,bidir:e.bidir};
    pan.appendChild(path);
    const total=e.forward.length+e.backward.length, mx=(ca.x+cb.x)/2, my=(ca.y+cb.y)/2;
    const cg=mk('g',{class:'edge-countg',style:'pointer-events:none'});
    cg.appendChild(mk('circle',{class:'edge-count-bg',cx:mx,cy:my,r:9}));
    const ct=mk('text',{class:'edge-count',x:mx,y:my,'text-anchor':'middle','dominant-baseline':'central'}); ct.textContent=total;
    cg.appendChild(ct); pan.appendChild(cg);
  });

  // 3. independent nodes
  data.nodes.forEach(n=>{ if(n.setId)return; const p=nodePos[n.id]; if(!p)return;
    pan.appendChild(renderNodeCard(n,p,{selDeps})); });

  // 4. collapsed set blocks
  (data.sets||[]).forEach(s=>{ if(!s.collapsed)return; const ep=entityManualPos[s.id]||entPos[s.id]; if(!ep)return;
    const col=s.color||'#888', w=entMeta[s.id].w, h=SET_COLLAPSED_H;
    const grp=mk('g',{class:'nodeset'+(selected===s.id?' sel':''),id:`set-${s.id}`,transform:`translate(${ep.x},${ep.y})`}); grp.dataset.setId=s.id;
    grp.appendChild(mk('rect',{class:'ss-ring',x:-w/2-4,y:-h/2-4,width:w+8,height:h+8,rx:14}));
    const stack=mk('g',{class:'stack'});
    stack.appendChild(mk('rect',{x:-w/2+7,y:-h/2-7,width:w-14,height:h,rx:9,style:`fill:${tint(col)};stroke:${col};opacity:.55`}));
    stack.appendChild(mk('rect',{x:-w/2+3.5,y:-h/2-3.5,width:w-7,height:h,rx:9,style:`fill:${tint(col)};stroke:${col};opacity:.8`}));
    stack.appendChild(mk('rect',{class:'ss-body',x:-w/2,y:-h/2,width:w,height:h,rx:9,style:`fill:#fff;stroke:${col}`}));
    grp.appendChild(stack);
    grp.appendChild(mk('rect',{x:-w/2+14,y:-8,width:14,height:11,rx:2,style:`fill:${col}`}));
    grp.appendChild(mk('rect',{x:-w/2+14,y:-11,width:7,height:3,rx:1.5,style:`fill:${col}`}));
    const tt=mk('text',{class:'ss-title',x:-w/2+36,y:-3,style:`fill:${col}`}); tt.textContent=(s.title||'Set'); grp.appendChild(tt);
    const ct=mk('text',{class:'ss-count',x:-w/2+36,y:12,style:'fill:var(--ink-faint)'}); ct.textContent=(s.nodeIds||[]).length+' nodes · click to expand'; grp.appendChild(ct);
    pan.appendChild(grp);
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
  const center=id=>entityManualPos[id]||lay.entPos[id]||{x:0,y:0};
  function recalcEdges(eid){
    svg.querySelectorAll('path.edge[data-a]').forEach(p=>{const a=p.dataset.a,b=p.dataset.b;
      if(a!==eid&&b!==eid)return; const pa=center(a),pb=center(b); if(!pa||!pb)return;
      if(p.dataset.kind==='agg') p.setAttribute('d',edgePath2(pa,pb,+p.dataset.ha,+p.dataset.hb));
      else p.setAttribute('d',edgePath(pa,pb));});
  }

  let panStart=null, nodeDrag=null, setDrag=null, insetDrag=null, didMove=false;
  let aggClick=null, insetClick=null, fhdrClick=null;
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
    if(nodeGrp && selectMode && !nodeGrp.classList.contains('inset')){
      e.preventDefault();
      const id=nodeGrp.dataset.id;
      if(multiSel.has(id)){ multiSel.delete(id); nodeGrp.classList.remove('multi-sel'); }
      else { multiSel.add(id); nodeGrp.classList.add('multi-sel'); }
      updateGroupControls(); return;
    }
    const agg=e.target.closest('path.edge.agg');
    if(agg){ e.preventDefault(); svg.setPointerCapture(e.pointerId); aggClick=agg; didMove=false; return; }
    if(nodeGrp){
      e.preventDefault(); svg.setPointerCapture(e.pointerId);
      const id=nodeGrp.dataset.id;
      if(nodeGrp.classList.contains('inset')){
        const frameEl=nodeGrp.closest('.setframe');
        const frameId=frameEl?frameEl.id.replace('setframe-',''):null;
        const innerP=frameId?lay.entMeta[frameId]:null;
        const ep=frameId?(entityManualPos[frameId]||lay.entPos[frameId]):null;
        insetClick=id;
        insetDrag={id,frameId,ep,innerW:innerP?innerP.w:0,innerH:innerP?innerP.h:0,
          startSvg:svgCoords(svg,e.clientX,e.clientY),
          startPos:nodeManualPos[id]||(lay.nodePos[id]&&ep?{x:lay.nodePos[id].x-ep.x+((innerP?innerP.w:0)/2),y:lay.nodePos[id].y-ep.y+((innerP?innerP.h:0)/2)}:{x:0,y:0})};
        didMove=false; return;
      }
      const cur=center(id); nodeDrag={id,startSvg:svgCoords(svg,e.clientX,e.clientY),startPos:{x:cur.x,y:cur.y}}; didMove=false;
      return;
    }
    const expBtn=e.target.closest('.fhdr-export');
    if(expBtn){ e.preventDefault(); e.stopPropagation(); exportSet(expBtn.dataset.setId); return; }
    const delBtn=e.target.closest('.fhdr-delete');
    if(delBtn){ e.preventDefault(); e.stopPropagation(); deleteSet(delBtn.dataset.setId); return; }
    const fhdr=e.target.closest('.fhdr');
    if(fhdr){ e.preventDefault(); svg.setPointerCapture(e.pointerId); fhdrClick=fhdr.dataset.setId; didMove=false; return; }
    const setGrp=e.target.closest('.nodeset'); const frame=e.target.closest('.setframe');
    if(setGrp||frame){
      e.preventDefault(); svg.setPointerCapture(e.pointerId);
      const id=setGrp?setGrp.dataset.setId:frame.id.replace('setframe-','');
      const cur=center(id); setDrag={id,collapsed:!!setGrp,startSvg:svgCoords(svg,e.clientX,e.clientY),startPos:{x:cur.x,y:cur.y}}; didMove=false;
      return;
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
    if(insetDrag){
      const sc=svgCoords(svg,e.clientX,e.clientY);
      const dx=sc.x-insetDrag.startSvg.x, dy=sc.y-insetDrag.startSvg.y;
      const nx=insetDrag.startPos.x+dx, ny=insetDrag.startPos.y+dy;
      nodeManualPos[insetDrag.id]={x:nx,y:ny};
      const grp=svg.querySelector(`#node-${CSS.escape(insetDrag.id)}`);
      if(grp){
        const rx=nx-insetDrag.innerW/2, ry=ny-insetDrag.innerH/2;
        grp.setAttribute('transform',`translate(${rx},${ry})`);
        const frameEl=svg.querySelector(`#setframe-${CSS.escape(insetDrag.frameId)}`);
        if(frameEl&&insetDrag.ep){
          const ep=insetDrag.ep;
          frameEl.querySelectorAll('path.edge').forEach(p=>{
            const srcId=p.dataset.from, tgtId=p.dataset.to; if(!srcId||!tgtId)return;
            const getRelPos=nid=>{if(nid===insetDrag.id)return{x:rx,y:ry};
              const np=lay.nodePos[nid]; if(!np)return null; return{x:np.x-ep.x,y:np.y-ep.y};};
            const pa=getRelPos(srcId), pb=getRelPos(tgtId); if(!pa||!pb)return;
            p.setAttribute('d',edgePath(pa,pb));
          });
        }
      }
      didMove=true; return;
    }
    if(nodeDrag){
      const sc=svgCoords(svg,e.clientX,e.clientY);
      const nx=nodeDrag.startPos.x+(sc.x-nodeDrag.startSvg.x), ny=nodeDrag.startPos.y+(sc.y-nodeDrag.startSvg.y);
      entityManualPos[nodeDrag.id]={x:nx,y:ny};
      const grp=svg.querySelector(`#node-${CSS.escape(nodeDrag.id)}`); if(grp)grp.setAttribute('transform',`translate(${nx},${ny})`);
      recalcEdges(nodeDrag.id); didMove=true; return;
    }
    if(setDrag){
      const sc=svgCoords(svg,e.clientX,e.clientY);
      const nx=setDrag.startPos.x+(sc.x-setDrag.startSvg.x), ny=setDrag.startPos.y+(sc.y-setDrag.startSvg.y);
      entityManualPos[setDrag.id]={x:nx,y:ny};
      const el=svg.querySelector(`#set-${CSS.escape(setDrag.id)}`)||svg.querySelector(`#setframe-${CSS.escape(setDrag.id)}`);
      if(el)el.setAttribute('transform',`translate(${nx},${ny})`);
      recalcEdges(setDrag.id); didMove=true; return;
    }
    if(lasso){
      const sc=svgCoords(svg,e.clientX,e.clientY);
      const x=Math.min(sc.x,lasso.startSvg.x), y=Math.min(sc.y,lasso.startSvg.y);
      const w=Math.abs(sc.x-lasso.startSvg.x), h=Math.abs(sc.y-lasso.startSvg.y);
      lasso.rect.setAttribute('x',x); lasso.rect.setAttribute('y',y);
      lasso.rect.setAttribute('width',w); lasso.rect.setAttribute('height',h);
      svg.querySelectorAll('#graph .node:not(.inset)').forEach(n=>{
        const p=lay.nodePos[n.dataset.id]||center(n.dataset.id);
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
      svg.querySelectorAll('#graph .node:not(.inset)').forEach(n=>{
        const id=n.dataset.id; const p=lay.nodePos[id];
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
        if(child && !(child.uses||[]).includes(connectSrc.id)){
          child.uses=[...(child.uses||[]),connectSrc.id]; derive(); renderAll();
          toast(`Linked: ${byId(connectSrc.id)?.title.split('(')[0].trim()} → ${child.title.split('(')[0].trim()}`);
        } else if(child) toast('Already linked.');
      }
      connectSrc=null; return;
    }
    if(aggClick){ if(!didMove) openRelations(aggClick); aggClick=null; return; }
    if(fhdrClick){ if(!didMove) toggleSet(fhdrClick); fhdrClick=null; return; }
    if(insetDrag){ if(!didMove) select(insetDrag.id); else renderAll(); insetDrag=null; insetClick=null; didMove=false; return; }
    if(setDrag){ if(!didMove) toggleSet(setDrag.id); else renderAll(); setDrag=null; didMove=false; canvas&&canvas.classList.remove('panning'); return; }
    if(nodeDrag){ if(!didMove) select(nodeDrag.id); else renderAll(); nodeDrag=null; didMove=false; canvas&&canvas.classList.remove('panning'); return; }
    panStart=null; canvas&&canvas.classList.remove('panning');
  };
  svg.onpointercancel=()=>{
    if(lasso){lasso.rect.remove();lasso=null;}
    connectPreview&&connectPreview.remove(); connectPreview=null;
    connectSrc=null; nodeDrag=null; setDrag=null; insetDrag=null; panStart=null; aggClick=null; insetClick=null; fhdrClick=null;
    canvas&&canvas.classList.remove('panning');
  };
}

/* expand / collapse a knowledge set */
function deleteSet(id){
  const s=setById(id); if(!s)return;
  const title=s.title||'Set';
  const memberIds=new Set(s.nodeIds||[]);
  data.nodes=data.nodes.filter(n=>!memberIds.has(n.id));
  data.nodes.forEach(n=>{
    n.uses=(n.uses||[]).filter(u=>!memberIds.has(u));
    if(n.proof) n.proof.uses=(n.proof.uses||[]).filter(u=>!memberIds.has(u));
  });
  data.sets=data.sets.filter(s=>s.id!==id);
  delete entityManualPos[id];
  if(selected===id) selected=null;
  closeRelations(); renderAll();
  toast(`Deleted knowledge set "${title}".`);
}
function toggleSet(id){
  const s=setById(id); if(!s)return;
  const lay=layoutGraph(); const cur=entityManualPos[id]||lay.entPos[id];
  if(cur) entityManualPos[id]={x:cur.x,y:cur.y};
  s.collapsed=!s.collapsed; selected=null; closeRelations(); renderAll();
  toast(s.collapsed?`Collapsed "${s.title}"`:`Expanded "${s.title}"`);}

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
  body.querySelectorAll('.rp-link').forEach(b=>b.onclick=()=>{const id=b.dataset.to||b.dataset.from; const s=setOfNode(id); if(s&&s.collapsed){s.collapsed=false;renderAll();} select(id);});
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
    let expBtn=$('#dpExportSet');
    if(!expBtn){
      expBtn=document.createElement('button'); expBtn.id='dpExportSet'; expBtn.className='btn';
      expBtn.textContent='Export set'; $('#dpEdit').parentNode.appendChild(expBtn);
    }
    expBtn.style.display=''; expBtn.onclick=()=>exportSet(selected);
    return;
  }
  const expBtn=$('#dpExportSet'); if(expBtn) expBtn.style.display='none';
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
    html+=`<div class="dp-section"><div class="dp-sec-label">Proof sketch</div><div class="dp-proof" id="dpProof">${n.proof.text}</div></div>`;
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
  else if(n._proved) note='All dependencies proved and proof sketch written.';
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
}

/* ===================== renderAll ===================== */
function renderAll(){
  derive(); renderGraph(); renderDetailPanel(); renderLegend(); updateProgress();
  $('#docName').innerHTML='project · <b>'+data.project.title+'</b>';
  renderProjList();
}

/* detail panel close */
$('#dpClose').onclick=()=>{selected=null;$('#detailPanel').classList.remove('open');renderGraph();};
$('#rpClose').onclick=closeRelations;

/* ===================== behaviour ===================== */
function select(id,scroll){selected=id;renderAll();}

/* export a single set as a standalone blueprint.json */
function buildSetBlob(sid){
  const s=setById(sid); if(!s)return null;
  const members=setMembers(s);
  const idMap={};
  members.forEach(n=>{ idMap[n.id]=n.id.replace(sid+':',''); });
  const nodes=members.map(n=>{
    const nn=clone(n); nn.id=idMap[n.id]||n.id; delete nn.setId;
    nn.uses=(n.uses||[]).map(u=>idMap[u]||u);
    if(nn.proof) nn.proof.uses=(n.proof?.uses||[]).map(u=>idMap[u]||u);
    ['_proved','_ready'].forEach(k=>delete nn[k]);
    return nn;
  });
  const out={project:{title:s.title},nodes};
  return {blob:new Blob([JSON.stringify(out,null,2)],{type:'application/json'}),
          filename:(s.title||'set').toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.blueprint.json',
          nodes};
}
async function exportSet(sid){
  const s=setById(sid); if(!s)return;
  const {blob,filename,nodes}=buildSetBlob(sid)||{};
  if(!blob)return;
  if(window.showDirectoryPicker){
    try{
      const dir=await window.showDirectoryPicker({mode:'readwrite',startIn:'documents'});
      const fh=await dir.getFileHandle(filename,{create:true});
      const writable=await fh.createWritable();
      await writable.write(blob); await writable.close();
      toast(`Saved "${filename}" to folder (${nodes.length} nodes).`);
      return;
    }catch(err){
      if(err.name==='AbortError')return;
    }
  }
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=filename; a.click(); URL.revokeObjectURL(a.href);
  toast(`Exported "${s.title}" (${nodes.length} nodes).`);
}

/* ── Global knowledge set preview & import ─────────────────────────────── */
function openGsPreview(gsid){
  const gs=globalSets.find(g=>g.id===gsid); if(!gs)return;
  gsPreviewId=gsid;
  $('#gsPreviewTitle').textContent=gs.name;
  $('#gsPreviewCount').textContent=gs.nodes.length+' nodes';
  $('#gsPreviewHint').textContent='Will be imported into: '+( projects.find(p=>p.id===activeProjectId)?.name||'current project');
  const listEl=$('#gsPreviewList');
  listEl.innerHTML=gs.nodes.map(n=>`
    <div class="gs-node-row">
      <span class="gn-kind">${n.kind||'node'}</span>
      <span class="gn-title">${n.title||n.id}</span>
    </div>`).join('');
  $('#gsPreviewScrim').classList.add('open');
}
function closeGsPreview(){$('#gsPreviewScrim').classList.remove('open');gsPreviewId=null;}
function importGlobalSet(gsid, dropPos){
  const gs=globalSets.find(g=>g.id===gsid); if(!gs)return;
  setCounter++;
  const sid='set'+setCounter;
  const color=SET_COLORS[(setCounter-1)%SET_COLORS.length];
  const idMap={};
  gs.nodes.forEach(n=>{idMap[n.id]=sid+':'+n.id;});
  const imported=gs.nodes.map(n=>{
    const nn=clone(n); nn.id=idMap[n.id]; nn.setId=sid;
    nn.uses=(n.uses||[]).map(u=>idMap[u]||u);
    if(nn.proof) nn.proof.uses=(n.proof.uses||[]).map(u=>idMap[u]||u);
    return nn;
  });
  data.sets=data.sets||[];
  data.sets.push({id:sid,title:gs.name,color,collapsed:true,nodeIds:imported.map(n=>n.id)});
  data.nodes.push(...imported);
  if(dropPos) entityManualPos[sid]={x:dropPos.x, y:dropPos.y};
  selected=null; renderAll();
  toast(`Imported "${gs.name}" into project (${imported.length} nodes).`);
}
$('#gsPreviewClose').onclick=closeGsPreview;
$('#gsPreviewCancel').onclick=closeGsPreview;
$('#gsPreviewScrim').onclick=e=>{if(e.target===$('#gsPreviewScrim'))closeGsPreview();};
$('#gsPreviewImport').onclick=()=>{if(gsPreviewId){importGlobalSet(gsPreviewId);closeGsPreview();}};

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
  const pad=48;
  const scaleX=(r.width-pad*2)/lay.W, scaleY=(r.height-pad*2)/lay.H;
  graphZoom=Math.min(scaleX,scaleY,1);
  graphPan={x:(r.width-lay.W*graphZoom)/2, y:pad};
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
    $('#groupCount').textContent=multiSel.size;
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
  const nodeIds=[...multiSel];
  nodeIds.forEach(id=>{const n=byId(id); if(n) n.setId=sid;});
  data.sets=data.sets||[];
  data.sets.push({id:sid,title:name,color,collapsed:false,nodeIds});
  $('#groupName').value='';
  setSelectMode(false);
  renderAll();
  toast(`"${name}" set created with ${nodeIds.length} nodes.`);
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
  $('#addMenu').classList.remove('open');select(id,true);toast(kindLabel(btn.dataset.kind)+' added.');
});

/* data bar: load / download / reset */
$('#loadJson').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.nodes||!Array.isArray(d.nodes))throw 0;
    d.project=d.project||{title:f.name.replace(/\.json$/,'')};
    Object.keys(data).forEach(k=>delete data[k]);
    Object.assign(data,d);
    if(!data.sets)data.sets=[];
    selected=null;syncProjName();renderAll();toast('Loaded '+data.nodes.length+' nodes from '+f.name);}
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
  selected=null;syncProjName();renderAll();toast('Reset to the Finsler sample.');
};

/* import a blueprint JSON as a collapsible knowledge set */
$('#importSet').onchange=e=>{
  const f=e.target.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const d=JSON.parse(r.result);
      if(!d.nodes||!Array.isArray(d.nodes))throw 0;
      setCounter++;
      const sid='set'+setCounter;
      const color=SET_COLORS[(setCounter-1)%SET_COLORS.length];
      const idMap={};
      d.nodes.forEach(n=>{ idMap[n.id]=sid+':'+n.id; });
      const imported=d.nodes.map(n=>{
        const nn=clone(n);
        nn.id=idMap[n.id];
        nn.setId=sid;
        nn.uses=(n.uses||[]).map(u=>idMap[u]||u);
        if(nn.proof) nn.proof.uses=(n.proof.uses||[]).map(u=>idMap[u]||u);
        return nn;
      });
      data.sets=data.sets||[];
      data.sets.push({id:sid,title:d.project?.title||f.name.replace(/\.json$/,''),color,collapsed:true,nodeIds:imported.map(n=>n.id)});
      data.nodes.push(...imported);
      selected=null; renderAll();
      toast('Imported "'+data.sets[data.sets.length-1].title+'" as a knowledge set ('+imported.length+' nodes).');
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
  if(isDef(n)){ proofWrap.style.display='none'; $('#eProof').value=''; }
  else { proofWrap.style.display=''; $('#eProof').value=(n.proof?.text)||''; }
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

function addDep(id){
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
  derive(); renderAll();
  toast('Block saved.');
};
$('#eCancelBtn').onclick=closeEditModal;
$('#eCancelX').onclick=closeEditModal;
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
  projCounter=1;
  const firstId='proj1';
  projects.push({id:firstId,name:data.project?.title||'Finsler Systolic'});
  projectData[firstId]=data;
  activeProjectId=firstId;

  const sidebar=$('#projSidebar');
  $('#psToggle').onclick=()=>{
    sidebar.classList.toggle('collapsed');
    $('#psToggle').textContent=sidebar.classList.contains('collapsed')?'›':'‹';
  };

  $('#psNew').onclick=()=>{
    const name=prompt('Project name:','Untitled project');
    if(name===null)return;
    const id=newProject(name);
    switchProject(id);
    toast('New project "'+name+'" created.');
  };

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

function boot(){
  renderAll();
  fitGraph();
}

window.addEventListener('load', boot);
