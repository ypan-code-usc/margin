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
function setInnerLayout(s){
  const children=childSets(s.id);
  const directNodeIds=(s.nodeIds||[]).filter(id=>byId(id));
  const allEntityIds=[...directNodeIds,...children.map(cs=>cs.id)];
  const allSet=new Set(allEntityIds);

  // build child set meta (size) recursively
  const childMeta={};
  children.forEach(cs=>{
    if(cs.collapsed){childMeta[cs.id]={type:'set',w:setCollapsedW(cs),h:SET_COLLAPSED_H};}
    else{const inner=setInnerLayout(cs);childMeta[cs.id]={type:'setopen',w:Math.max(180,inner.W),h:inner.H+SET_PAD,inner,childMeta:inner.childMeta};}
  });

  const size=id=>{const n=byId(id);if(n)return{w:boxW(n),h:BOX_H};const m=childMeta[id];return m?{w:m.w,h:m.h}:{w:120,h:BOX_H};};

  const dep=id=>{
    const n=byId(id);
    if(n){
      return[...(n.uses||[]),...(n.proof?.uses||[])].map(d=>{
        if(allSet.has(d))return d;
        const cs=children.find(c=>(c.nodeIds||[]).includes(d));
        return cs?cs.id:null;
      }).filter(d=>d&&d!==id&&allSet.has(d));
    }
    const cs=setById(id);if(!cs)return[];
    const deps=new Set();
    allNodesInSet(cs.id).forEach(mn=>{
      [...(mn.uses||[]),...(mn.proof?.uses||[])].forEach(d=>{
        if(allSet.has(d)&&d!==id)deps.add(d);
        const pcs=children.find(c=>c.id!==id&&(c.nodeIds||[]).includes(d));
        if(pcs)deps.add(pcs.id);
      });
    });
    return[...deps];
  };

  const L=layeredLayout(allEntityIds,dep,size,{top:SET_HDR+12,vgap:80,side:SET_PAD,hgap:40});
  return{...L,childMeta};
}
function layoutGraph(){
  const entities=[], entMeta={};
  data.nodes.forEach(n=>{if(!n.setId){entities.push(n.id);entMeta[n.id]={type:'node',node:n,w:boxW(n),h:BOX_H};}});
  rootSets().forEach(s=>{
    entities.push(s.id);
    if(s.collapsed){entMeta[s.id]={type:'set',set:s,w:setCollapsedW(s),h:SET_COLLAPSED_H};}
    else{
      const inner=setInnerLayout(s);
      (s.nodeIds||[]).forEach(nid=>{if(nodeManualPos[nid])inner.pos[nid]={...inner.pos[nid],...nodeManualPos[nid]};});
      entMeta[s.id]={type:'setopen',set:s,w:Math.max(180,inner.W),h:inner.H+SET_PAD,inner,childMeta:inner.childMeta};
    }
  });
  const entDeps=id=>{
    const meta=entMeta[id];
    const nodes=meta.type==='node'?[meta.node]:allNodesInSet(id);
    const out=new Set();
    nodes.forEach(n=>[...(n.uses||[]),...(n.proof?.uses||[])].forEach(r=>{const e=entityIdOfNode(r);if(e&&e!==id&&entMeta[e])out.add(e);}));
    return[...out];
  };
  const L=layeredLayout(entities,entDeps,id=>({w:entMeta[id].w,h:entMeta[id].h}),{});
  entities.forEach(id=>{if(entityManualPos[id])L.pos[id]={...L.pos[id],...entityManualPos[id]};});

  const nodePos={}, setAbsPos={};
  function computePositions(sid, epAbs, meta){
    const s=setById(sid);if(!s||!meta.inner)return;
    const w=meta.w,h=meta.h,ox=epAbs.x-w/2,oy=epAbs.y-h/2;
    setAbsPos[sid]=epAbs;
    (s.nodeIds||[]).forEach(nid=>{const rp=meta.inner.pos[nid];if(rp)nodePos[nid]={x:ox+rp.x,y:oy+rp.y};});
    const cm=meta.inner.childMeta||{};
    childSets(sid).forEach(cs=>{
      const csRel=meta.inner.pos[cs.id];if(!csRel)return;
      const csMeta=cm[cs.id];if(!csMeta)return;
      const csEp={x:ox+csRel.x,y:oy+csRel.y};
      setAbsPos[cs.id]=csEp;
      if(csMeta.type==='set'){allNodesInSet(cs.id).forEach(n=>nodePos[n.id]={x:csEp.x,y:csEp.y});}
      else{computePositions(cs.id,csEp,csMeta);}
    });
  }
  entities.forEach(id=>{
    const m=entMeta[id],ep=L.pos[id];
    if(m.type==='node')nodePos[id]={x:ep.x,y:ep.y};
    else if(m.type==='set'){setAbsPos[id]=ep;allNodesInSet(id).forEach(n=>nodePos[n.id]={x:ep.x,y:ep.y});}
    else computePositions(id,ep,m);
  });
  return{entities,entMeta,entPos:L.pos,nodePos,setAbsPos,W:L.W,H:L.H};
}
function computeEntityEdges(){
  const directed={}, internalOpen=[];
  data.nodes.forEach(c=>{
    [...new Set([...(c.uses||[]),...(c.proof?.uses||[])])].forEach(pid=>{const p=byId(pid); if(!p)return;
      const se=entityIdOfNode(pid), te=entityIdOfNode(c.id);
      if(se===te){
        // internal edge — only include if the root set is open
        const rs=setById(se);
        if(rs&&!rs.collapsed) internalOpen.push({from:pid,to:c.id});
        return;
      }
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

function renderGraph(){
  const g=$('#graph'); g.innerHTML='';
  const lay=layoutGraph(); const {entities,entMeta,entPos,nodePos,setAbsPos,W,H}=lay;

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

  // 1. expanded-set frames (recursive helper)
  function drawSetFrame(s, epAbs, m, parentGroup, parentEpAbs){
    const col=s.color||'#888', w=m.w, h=m.h;
    const tx=parentEpAbs?epAbs.x-parentEpAbs.x:epAbs.x;
    const ty=parentEpAbs?epAbs.y-parentEpAbs.y:epAbs.y;
    const fg=mk('g',{class:'setframe',id:`setframe-${s.id}`,transform:`translate(${tx},${ty})`});
    fg.appendChild(mk('rect',{class:'frame',x:-w/2,y:-h/2,width:w,height:h,rx:14,style:`fill:${col};stroke:${col}`}));
    const hdr=mk('g',{class:'fhdr'}); hdr.dataset.setId=s.id;
    hdr.appendChild(mk('rect',{class:'fhdr-bg',x:-w/2,y:-h/2,width:w-64,height:30,rx:14}));
    const childCount=childSets(s.id).length;
    const tt=mk('text',{class:'ftitle',x:-w/2+14,y:-h/2+18,style:`fill:${col}`});
    tt.textContent='▴ '+(s.title||'Set')+'  ·  '+(s.nodeIds||[]).length+(childCount?' + '+childCount+' sets':'');
    hdr.appendChild(tt); fg.appendChild(hdr);
    // "→ project" button (root sets only)
    if(!s.parentSetId){
      const expG=mk('g',{class:'fhdr-export',style:'pointer-events:auto;cursor:pointer'}); expG.dataset.setId=s.id;
      expG.appendChild(mk('rect',{x:w/2-122,y:-h/2+4,width:58,height:22,rx:7,style:`fill:${col};opacity:.18`}));
      const expT=mk('text',{x:w/2-93,y:-h/2+17,'text-anchor':'middle','dominant-baseline':'central',style:`fill:${col};font-size:10px;font-family:var(--font-ui);font-weight:600;pointer-events:none`});
      expT.textContent='→ project'; expG.appendChild(expT); fg.appendChild(expG);
    }
    const delG=mk('g',{class:'fhdr-delete',style:'pointer-events:auto;cursor:pointer'}); delG.dataset.setId=s.id;
    delG.appendChild(mk('rect',{x:w/2-58,y:-h/2+4,width:52,height:22,rx:7,style:`fill:${col};opacity:.18`}));
    const delT=mk('text',{x:w/2-32,y:-h/2+17,'text-anchor':'middle','dominant-baseline':'central',style:`fill:${col};font-size:10px;font-family:var(--font-ui);font-weight:600;pointer-events:none`});
    delT.textContent='✕ delete'; delG.appendChild(delT); fg.appendChild(delG);
    // internal edges between any two nodes in this root set
    const rootId=rootSetOf(s.id)?.id||s.id;
    internalOpen.forEach(e=>{
      if(entityIdOfNode(e.from)!==rootId||entityIdOfNode(e.to)!==rootId)return;
      // only draw if both nodes belong to THIS set or its descendants
      const descIds=new Set(allDescendantSetIds(s.id));
      const nf=byId(e.from),nt=byId(e.to);
      if(!nf||!nt||(!descIds.has(nf.setId)&&nf.setId!==s.id)||(!descIds.has(nt.setId)&&nt.setId!==s.id))return;
      const a=nodePos[e.from],b=nodePos[e.to];if(!a||!b)return;
      const ra={x:a.x-epAbs.x,y:a.y-epAbs.y},rb={x:b.x-epAbs.x,y:b.y-epAbs.y};
      fg.appendChild(mk('path',{class:'edge','data-from':e.from,'data-to':e.to,d:edgePath(ra,rb),'marker-end':'url(#arrow)'}));
    });
    // nested child sets
    const cm=m.inner?.childMeta||{};
    childSets(s.id).forEach(cs=>{
      const csAbsPos=setAbsPos[cs.id];if(!csAbsPos)return;
      const csMeta=cm[cs.id];if(!csMeta)return;
      if(csMeta.type==='setopen'){
        drawSetFrame(cs,csAbsPos,csMeta,fg,epAbs);
      } else {
        // collapsed child set rendered inside parent frame
        const col2=cs.color||'#888',w2=csMeta.w,h2=SET_COLLAPSED_H;
        const rx=csAbsPos.x-epAbs.x,ry=csAbsPos.y-epAbs.y;
        const cg=mk('g',{class:'nodeset'+(selected===cs.id?' sel':''),id:`set-${cs.id}`,transform:`translate(${rx},${ry})`});
        cg.dataset.setId=cs.id;
        const stack=mk('g',{class:'stack'});
        stack.appendChild(mk('rect',{x:-w2/2+7,y:-h2/2-7,width:w2-14,height:h2,rx:9,style:`fill:${tint(col2)};stroke:${col2};opacity:.55`}));
        stack.appendChild(mk('rect',{x:-w2/2+3.5,y:-h2/2-3.5,width:w2-7,height:h2,rx:9,style:`fill:${tint(col2)};stroke:${col2};opacity:.8`}));
        stack.appendChild(mk('rect',{class:'ss-body',x:-w2/2,y:-h2/2,width:w2,height:h2,rx:9,style:`fill:#fff;stroke:${col2}`}));
        cg.appendChild(stack);
        const ct=mk('text',{class:'ss-count',x:-w2/2+36,y:0,style:`fill:${col2};font-size:10px`});ct.textContent=(cs.title||'Set')+' · '+( cs.nodeIds||[]).length+' nodes';cg.appendChild(ct);
        fg.appendChild(cg);
      }
    });
    // direct nodes of this set
    (s.nodeIds||[]).forEach(nid=>{const n=byId(nid);const np=nodePos[nid];if(!n||!np)return;
      const rp={x:np.x-epAbs.x,y:np.y-epAbs.y};
      fg.appendChild(renderNodeCard(n,rp,{selDeps,inset:true}));});
    parentGroup.appendChild(fg);
  }
  entities.forEach(id=>{const m=entMeta[id];if(m.type!=='setopen')return;
    const ep=entPos[id];drawSetFrame(m.set,ep,m,pan,null);});

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

  // 4. collapsed set blocks (root sets only — child sets rendered inside parent frame)
  (data.sets||[]).forEach(s=>{ if(!s.collapsed||s.parentSetId)return; const ep=entityManualPos[s.id]||entPos[s.id]; if(!ep)return;
    const col=s.color||'#888', w=(entMeta[s.id]||{w:180}).w, h=SET_COLLAPSED_H;
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
  let aggClick=null, insetClick=null;
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
    // allow selecting a collapsed set in select mode
    const collapsedSetGrp=e.target.closest('.nodeset');
    if(collapsedSetGrp && selectMode){
      e.preventDefault();
      const id=collapsedSetGrp.dataset.setId;
      if(multiSel.has(id)){ multiSel.delete(id); collapsedSetGrp.classList.remove('multi-sel'); }
      else { multiSel.add(id); collapsedSetGrp.classList.add('multi-sel'); }
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
    if(fhdr){
      // header: drag moves the set; click (no move) toggles it
      e.preventDefault(); svg.setPointerCapture(e.pointerId);
      const id=fhdr.dataset.setId; const cur=center(id);
      setDrag={id,collapsed:false,startSvg:svgCoords(svg,e.clientX,e.clientY),startPos:{x:cur.x,y:cur.y}}; didMove=false; return;
    }
    const setGrp=e.target.closest('.nodeset'); const frame=e.target.closest('.setframe');
    if(setGrp){
      // collapsed set pill — drag to nest/move, click to toggle
      e.preventDefault(); svg.setPointerCapture(e.pointerId);
      const id=setGrp.dataset.setId; const cur=center(id);
      setDrag={id,collapsed:true,startSvg:svgCoords(svg,e.clientX,e.clientY),startPos:{x:cur.x,y:cur.y}}; didMove=false; return;
    }
    if(frame){
      e.preventDefault(); svg.setPointerCapture(e.pointerId);
      const fid=frame.id.replace('setframe-','');
      if(selectMode){
        // select mode: lasso inside the set
        const sc=svgCoords(svg,e.clientX,e.clientY);
        const r=mk('rect',{class:'lasso',x:sc.x,y:sc.y,width:0,height:0});
        $('#graph-pan').appendChild(r);
        lasso={startSvg:sc,rect:r,insideSetId:fid}; return;
      }
      // normal mode: drag the expanded set (click-only toggles it)
      const cur=center(fid);
      setDrag={id:fid,collapsed:false,startSvg:svgCoords(svg,e.clientX,e.clientY),startPos:{x:cur.x,y:cur.y}}; didMove=false; return;
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
      recalcEdges(setDrag.id);
      // only highlight drop targets when dragging a collapsed set
      if(setDrag.collapsed){
      svg.querySelectorAll('.setframe').forEach(f=>f.classList.remove('drop-target'));
      const hit=document.elementFromPoint(e.clientX,e.clientY);
      const targetFrame=hit&&hit.closest('.setframe');
      if(targetFrame){
        const tid=targetFrame.id.replace('setframe-','');
        const descIds=new Set(allDescendantSetIds(setDrag.id));
        if(tid&&tid!==setDrag.id&&!descIds.has(tid)) targetFrame.classList.add('drop-target');
      }
      } // end if(setDrag.collapsed)
      didMove=true; return;
    }
    if(lasso){
      const sc=svgCoords(svg,e.clientX,e.clientY);
      const x=Math.min(sc.x,lasso.startSvg.x), y=Math.min(sc.y,lasso.startSvg.y);
      const w=Math.abs(sc.x-lasso.startSvg.x), h=Math.abs(sc.y-lasso.startSvg.y);
      lasso.rect.setAttribute('x',x); lasso.rect.setAttribute('y',y);
      lasso.rect.setAttribute('width',w); lasso.rect.setAttribute('height',h);
      const lInsideId=lasso.insideSetId;
      const lDescIds=lInsideId?new Set(allNodesInSet(lInsideId).map(n=>n.id)):null;
      svg.querySelectorAll(lInsideId?'#graph .node.inset':'#graph .node:not(.inset)').forEach(n=>{
        const id=n.dataset.id;
        if(lDescIds&&!lDescIds.has(id))return;
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
      const uInsideId=lasso.insideSetId;
      const uDescIds=uInsideId?new Set(allNodesInSet(uInsideId).map(n=>n.id)):null;
      svg.querySelectorAll('#graph .node').forEach(n=>{
        const id=n.dataset.id;
        if(uDescIds&&!uDescIds.has(id))return;
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
    if(aggClick){ if(!didMove) openRelations(aggClick); aggClick=null; return; }
    if(insetDrag){ if(!didMove) select(insetDrag.id); else renderAll(); insetDrag=null; insetClick=null; didMove=false; return; }
    if(setDrag){
      svg.querySelectorAll('.setframe').forEach(f=>f.classList.remove('drop-target'));
      if(!didMove){ toggleSet(setDrag.id); }
      else {
        // check if dropped onto a valid set frame → nest inside it
        const hit=document.elementFromPoint(e.clientX,e.clientY);
        const targetFrame=hit&&hit.closest('.setframe');
        const tid=targetFrame?targetFrame.id.replace('setframe-',''):null;
        const descIds=new Set(allDescendantSetIds(setDrag.id));
        if(setDrag.collapsed&&tid&&tid!==setDrag.id&&!descIds.has(tid)){
          const dragged=setById(setDrag.id);
          if(dragged){
            dragged.parentSetId=tid;
            delete entityManualPos[setDrag.id];
            renderAll();
            toast(`"${dragged.title||'Set'}" nested inside "${setById(tid)?.title||'set'}".`);
          }
        } else if(!tid&&setDrag.collapsed){
          // dragged outside all frames → un-nest (make root)
          const dragged=setById(setDrag.id);
          if(dragged&&dragged.parentSetId){ dragged.parentSetId=null; renderAll(); toast(`"${dragged.title||'Set'}" moved to top level.`); }
          else renderAll();
        } else { renderAll(); }
      }
      setDrag=null; didMove=false; canvas&&canvas.classList.remove('panning'); return;
    }
    if(nodeDrag){ if(!didMove) select(nodeDrag.id); else renderAll(); nodeDrag=null; didMove=false; canvas&&canvas.classList.remove('panning'); return; }
    panStart=null; canvas&&canvas.classList.remove('panning');
  };
  svg.onpointercancel=()=>{
    if(lasso){lasso.rect.remove();lasso=null;}
    connectPreview&&connectPreview.remove(); connectPreview=null;
    connectSrc=null; nodeDrag=null; setDrag=null; insetDrag=null; panStart=null; aggClick=null; insetClick=null;
    canvas&&canvas.classList.remove('panning');
  };
}

/* expand / collapse a knowledge set */
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
  closeRelations(); renderAll();
  toast(`Deleted "${title}" and all nested sets.`);
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
      expBtn.textContent='→ Save to project'; $('#dpEdit').parentNode.appendChild(expBtn);
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
  try{
    if(activeProjectId) projectData[activeProjectId]=clone(data);
    localStorage.setItem('margin-autosave',JSON.stringify(
      {projects,projectData,activeProjectId,projCounter,setCounter,entityManualPos,nodeManualPos}));
  }catch(e){}
}
function loadAll(){
  try{
    const raw=localStorage.getItem('margin-autosave'); if(!raw)return false;
    const s=JSON.parse(raw);
    projects.length=0; s.projects.forEach(p=>projects.push(p));
    Object.keys(projectData).forEach(k=>delete projectData[k]);
    Object.assign(projectData,s.projectData);
    projCounter=s.projCounter||1; setCounter=s.setCounter||0;
    Object.assign(entityManualPos,s.entityManualPos||{});
    Object.assign(nodeManualPos,s.nodeManualPos||{});
    activeProjectId=s.activeProjectId;
    data=projectData[activeProjectId];
    if(!data.sets)data.sets=[];
    return true;
  }catch(e){return false;}
}

/* ===================== renderAll ===================== */
function renderAll(){
  derive(); renderGraph(); renderDetailPanel(); renderLegend(); updateProgress();
  $('#docName').innerHTML='project · <b>'+data.project.title+'</b>';
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

function boot(){
  loadPrefs();
  if(loadAll()){
    // autosave restored — sync project name display
    syncProjName();
  }
  renderAll();
  fitGraph();
}

window.addEventListener('load', boot);
