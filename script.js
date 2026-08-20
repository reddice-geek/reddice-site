
document.addEventListener("DOMContentLoaded", async ()=>{
  initReveal(); initActiveNav(); initTwitchEmbeds(); initStreamStatus(); initPlanningV2(); initGuestbook(); initContactForm(); initAdmin(); setYear();
});
function initReveal(){
  const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add("visible")}),{threshold:0.08});
  document.querySelectorAll(".reveal").forEach(el=>obs.observe(el));
}
function initActiveNav(){
  const page=document.body.dataset.page;
  document.querySelectorAll("[data-nav]").forEach(a=>{if(a.dataset.nav===page)a.classList.add("active")});
}
function initTwitchEmbeds(){
  const p=document.getElementById("twitch-player");
  const c=document.getElementById("twitch-chat");
  if(!p||!c) return;
  const host=location.hostname || "localhost";
  const parent=encodeURIComponent(host);
  p.src=`https://player.twitch.tv/?channel=reddice_stream&parent=${parent}&muted=true`;
  setTimeout(()=>{c.src=`https://www.twitch.tv/embed/reddice_stream/chat?parent=${parent}`},250);
}
async function initStreamStatus(){
  const badges=document.querySelectorAll("[data-stream-status]");
  if(!badges.length) return;
  const set=(cls,txt)=>badges.forEach(b=>{b.className=`stream-badge ${cls}`; b.textContent=txt});
  const refresh=async()=>{
    set("is-loading","Checking");
    try{
      const r=await fetch(`/api/twitch-status?login=reddice_stream&_=${Date.now()}`,{cache:"no-store"});
      const j=await r.json();
      set(j.live?"is-live":"is-offline", j.live?`ON • ${j.viewer_count||0} VIEWERS` : "Stream Off");
    }catch{set("is-offline","Offline")}
  };
  await refresh(); setInterval(refresh,60000);
}

/* PLANNING V2 ENHANCED */
async function initPlanningV2(){
  const upcomingNode=document.getElementById("planning-upcoming");
  const archiveNode=document.getElementById("planning-archives");
  const specialNode=document.getElementById("planning-special");
  const catchNode=document.getElementById("planning-catch");
  const statsNode=document.getElementById("planning-stats");
  const editableNode=document.getElementById("planning-editable"); // legacy fallback
  const statusNode=document.getElementById("planning-status");
  const targetNode = upcomingNode || editableNode;
  if(!targetNode && !archiveNode) return;

  let planning=[];
  try{
    const stored=localStorage.getItem("reddice_planning_override_v3");
    if(stored){ planning=JSON.parse(stored); }
    else{
      const res=await fetch("/data/planning.json",{cache:"no-store"});
      planning=await res.json();
    }
    if(!Array.isArray(planning)) planning=[];
  }catch(e){ planning=[]; }

  // split types
  const upcoming = planning.filter(p=> (p.type||"upcoming")==="upcoming" && p.active!==false);
  const specials = planning.filter(p=> (p.type||"")=== "special" || (p.tag||"").toLowerCase().includes("special") || (p.tag||"").toLowerCase().includes("event"));

  const renderUpcoming = (node, items)=>{
    if(!node) return;
    node.innerHTML="";
    if(!items.length){ node.innerHTML="<p class='lead'>Aucun stream prévu. Ajoute-en dans le panel admin.</p>"; return; }
    items.forEach(item=>{
      const div=document.createElement("div");
      div.className=`card planning-card reveal visible active`;
      const dateStr = item.date ? formatDateFR(item.date) : item.day;
      const gCal = buildGCalLink(item);
      const outlook = buildOutlookLink(item);
      div.innerHTML=`
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap"><span class="mini-chip">${esc(dateStr)}</span><span class="mini-chip">${esc(item.time)}</span><span class="mini-chip">${esc(item.tag||"Live")}</span></div>
        <strong style="color:#fff; margin-top:0.4rem; font-size:1.05rem">${esc(item.title)}</strong>
        <div style="display:flex; gap:.4rem; margin-top:.7rem; flex-wrap:wrap">
          <a href="${gCal}" target="_blank" class="btn btn-small btn-ghost">+ Google Calendar</a>
          <a href="${outlook}" target="_blank" class="btn btn-small btn-ghost">+ Outlook</a>
        </div>`;
      node.appendChild(div);
    });
  };
  renderUpcoming(targetNode, upcoming);
  renderUpcoming(specialNode, specials);

  if(statusNode) statusNode.textContent=`Planning à jour • ${upcoming.length} streams à venir • ${specials.length} events spéciaux`;

  // archives Twitch
  let historyItems=[];
  if(archiveNode){
    try{
      const r=await fetch("/api/twitch-history?login=reddice_stream",{cache:"no-store"});
      const data=await r.json();
      historyItems=data.items||[];
      archiveNode.innerHTML="";
      if(!historyItems.length){ archiveNode.innerHTML="<p class='lead'>Aucune VOD. Active la conservation des VOD dans Twitch.</p>"; }
      historyItems.slice(0,6).forEach(v=>{
        const art=document.createElement("article");
        art.className="card reveal visible";
        art.innerHTML=`<div style="height:140px; background:linear-gradient(rgba(0,0,0,0.15),rgba(0,0,0,0.5)), url('${v.thumbnail_url}') center/cover; margin-bottom:0.8rem; border:1px solid var(--border-dim)"></div>
          <span class="mini-chip">${new Date(v.created_at).toLocaleDateString('fr-FR')}</span> <span class="mini-chip">${esc(v.duration)}</span>
          <h3 style="margin:0.5rem 0 0.2rem; font-size:1rem">${esc(v.title)}</h3>
          <p style="color:var(--muted); font-size:0.85rem; margin:0 0 0.8rem">${v.view_count} vues • ${esc(v.type||"archive")}</p>
          <a class="btn btn-small" href="${v.url}" target="_blank">Voir VOD</a>`;
        archiveNode.appendChild(art);
      });
    }catch(e){ if(archiveNode) archiveNode.innerHTML="<p class='lead'>Archives indisponibles.</p>"; }
  }

  // stats Twitch monthly
  if(statsNode){
    try{
      const now=new Date();
      const monthStart=new Date(now.getFullYear(), now.getMonth(), 1);
      const monthItems = historyItems.filter(i=> new Date(i.created_at) >= monthStart);
      const totalSec = monthItems.reduce((acc, cur)=>{
        // parse duration like 2h13m5s
        const m = String(cur.duration||"").match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
        if(!m) return acc;
        const h=parseInt(m[1]||0), mi=parseInt(m[2]||0), s=parseInt(m[3]||0);
        return acc + h*3600 + mi*60 + s;
      },0);
      const hours = (totalSec/3600).toFixed(1);
      // try fetch followers count from status if available extended
      let followers="—", subs="—", games= new Set(monthItems.map(i=>i.title)).size || "—";
      try{
        const r=await fetch(`/api/twitch-status?login=reddice_stream&_=${Date.now()}`,{cache:"no-store"});
        const j=await r.json();
        // if api returns extra, use
        if(j.followers) followers=j.followers;
        if(j.subscribers) subs=j.subscribers;
      }catch{}
      statsNode.innerHTML=`
        <div class="stat"><small class="mini-chip">Août 2026</small><strong>${hours}h</strong><span style="color:var(--muted); font-family:var(--font-mono); font-size:.8rem">Temps stream ce mois</span></div>
        <div class="stat"><small class="mini-chip">Jeux</small><strong>${games}</strong><span style="color:var(--muted); font-family:var(--font-mono); font-size:.8rem">Titres différents</span></div>
        <div class="stat"><small class="mini-chip">Followers</small><strong id="stat-followers">${esc(String(followers))}</strong><span style="color:var(--muted); font-family:var(--font-mono); font-size:.8rem">Communauté</span></div>
        <div class="stat"><small class="mini-chip">Subs</small><strong id="stat-subs">${esc(String(subs))}</strong><span style="color:var(--muted); font-family:var(--font-mono); font-size:.8rem">Abonnés actifs</span></div>
      `;
      // try fetch real followers via new api if exists
      fetch("/api/twitch-stats?login=reddice_stream").then(r=>r.json()).then(j=>{
        if(j.followers) document.getElementById("stat-followers").textContent=j.followers;
        if(j.subscribers) document.getElementById("stat-subs").textContent=j.subscribers;
      }).catch(()=>{});
    }catch{}
  }

  // catch reac section
  if(catchNode){
    const keywords=["WWE","AEW","RAW","SMACKDOWN","NXT","PLE","CATCH","WRESTLE"];
    const catchItems = historyItems.filter(v=> keywords.some(k=> (v.title||"").toUpperCase().includes(k)));
    catchNode.innerHTML="";
    if(!catchItems.length){
      catchNode.innerHTML="<p class='lead'>Aucun REAC catch récent. Mots-clés surveillés: WWE, AEW, RAW, SmackDown, NXT, PLE.</p>";
    }else{
      catchItems.slice(0,6).forEach(v=>{
        const el=document.createElement("div");
        el.className="card reveal visible";
        el.innerHTML=`<span class="mini-chip">CATCH REAC</span><h4 style="margin:.5rem 0">${esc(v.title)}</h4><small style="color:var(--muted)">${new Date(v.created_at).toLocaleDateString('fr-FR')} • ${esc(v.duration)}</small><br><a class="btn btn-small" href="${v.url}" target="_blank" style="margin-top:.6rem">Voir</a>`;
        catchNode.appendChild(el);
      });
    }
  }
}
function formatDateFR(iso){
  try{ const d=new Date(iso); return d.toLocaleDateString('fr-FR',{weekday:'short', day:'2-digit', month:'short'}); }catch{return iso}
}
function buildGCalLink(item){
  const date = item.date || new Date().toISOString().slice(0,10);
  const time = (item.time||"20:30").replace("Off","20:30");
  const [h,m]=time.split(":").map(x=>parseInt(x)||20);
  const start=new Date(date); start.setHours(h, m||0,0,0);
  const end=new Date(start.getTime()+2*60*60*1000);
  const fmt=d=>d.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
  const params=new URLSearchParams({
    action:"TEMPLATE",
    text:item.title||"Stream Reddice",
    dates:`${fmt(start)}/${fmt(end)}`,
    details:`Stream Reddice - ${item.tag||""} - https://www.twitch.tv/reddice_stream`,
    location:"https://www.twitch.tv/reddice_stream"
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
function buildOutlookLink(item){
  const date = item.date || new Date().toISOString().slice(0,10);
  const time = (item.time||"20:30").replace("Off","20:30");
  const [h,m]=time.split(":").map(x=>parseInt(x)||20);
  const start=new Date(date); start.setHours(h, m||0,0,0);
  const end=new Date(start.getTime()+2*60*60*1000);
  const fmt=d=>d.toISOString();
  const params=new URLSearchParams({
    path:"/calendar/action/compose",
    rru:"addevent",
    subject:item.title||"Stream Reddice",
    body:`Stream Reddice - ${item.tag||""} - https://www.twitch.tv/reddice_stream`,
    startdt:fmt(start),
    enddt:fmt(end),
    location:"https://www.twitch.tv/reddice_stream"
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/* GUESTBOOK DYNAMIC */
async function initGuestbook(){
  const form=document.getElementById("guestbook-form");
  const list=document.getElementById("guestbook-list");
  const status=document.getElementById("guestbook-status");
  const countEl=document.getElementById("guestbook-count");
  const pagination=document.getElementById("guestbook-pagination");
  const ratingInput=document.getElementById("guestbook-rating");
  if(!form||!list) return;
  let items=[]; let current=5; let currentPage=1; const perPage=10;
  const STORAGE_KEY="reddice_guestbook_auto_v3";
  const stars=Array.from(document.querySelectorAll("[data-rating-value]")).filter(b=>b.closest("#guestbook-stars")||true);
  const paint=v=>stars.forEach(s=>s.classList.toggle("is-active", Number(s.dataset.ratingValue)<=v));
  paint(5);
  stars.forEach(s=>s.addEventListener("click",()=>{current=Number(s.dataset.ratingValue); if(ratingInput) ratingInput.value=current; paint(current)}));

  const saveLocal=()=>{ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }catch{} };
  const loadLocal=()=>{ try{ const raw=localStorage.getItem(STORAGE_KEY); if(raw){ const arr=JSON.parse(raw); if(Array.isArray(arr)) return arr; } }catch{} return []; };

  const render=()=>{
    const total=items.length;
    if(countEl) countEl.textContent=`${total} avis • Page ${currentPage}/${Math.max(1,Math.ceil(total/perPage))} • Holo-feed actif`;
    if(total===0){ list.innerHTML="<p class='lead'>Aucun avis, sois le premier. Ton avis s'affiche instantanément en holo-feed !</p>"; if(pagination) pagination.innerHTML=""; return; }
    const start=(currentPage-1)*perPage;
    const pageItems=items.slice(start, start+perPage);
    list.innerHTML="";
    pageItems.forEach(e=>{
      const d=document.createElement("div");
      d.className="card reveal visible";
      d.style.animation=`holoIn .4s ease`;
      d.innerHTML=`<div style="display:flex; justify-content:space-between; align-items:center"><strong style="color:#fff">${esc(e.name)}</strong><small style="color:var(--muted)">${new Date(e.created_at).toLocaleDateString('fr-FR')}</small></div><div style="color:var(--gold); letter-spacing:2px; margin:.3rem 0">${"★".repeat(e.rating||5)}<span style="color:#333">${"★".repeat(5-(e.rating||5))}</span></div>${e.title?`<h4 style="margin:0.4rem 0; color:var(--cyan)">${esc(e.title)}</h4>`:""}<p style="color:var(--muted); line-height:1.4">${esc(e.message)}</p>${location.search.includes('admin')?`<button class="btn btn-small" onclick="deleteEntry('${e.id}')">Supprimer</button>`:""}`;
      list.appendChild(d);
    });
    if(pagination){
      const totalPages=Math.ceil(total/perPage);
      pagination.innerHTML="";
      if(totalPages>1){
        const mkBtn=(label,page,disabled=false,active=false)=>{
          const b=document.createElement("button");
          b.textContent=label; b.className="btn btn-small"+(active?" btn-primary":""); b.disabled=disabled; b.style.opacity=disabled?"0.4":"1";
          b.onclick=()=>{ currentPage=page; render(); window.scrollTo({top:list.offsetTop-120, behavior:"smooth"}); };
          return b;
        };
        pagination.appendChild(mkBtn("◀", Math.max(1,currentPage-1), currentPage===1));
        for(let p=1;p<=totalPages;p++){
          if(totalPages>7 && Math.abs(p-currentPage)>2 && p!==1 && p!==totalPages){
            if(p===2 || p===totalPages-1){ const sep=document.createElement("span"); sep.textContent="…"; sep.style.padding="0.5rem"; pagination.appendChild(sep); }
            continue;
          }
          pagination.appendChild(mkBtn(String(p), p, false, p===currentPage));
        }
        pagination.appendChild(mkBtn("▶", Math.min(totalPages,currentPage+1), currentPage===totalPages));
      }
    }
  };

  const load=async()=>{
    try{
      const r=await fetch("/api/guestbook",{cache:"no-store"});
      if(r.ok){
        const j=await r.json();
        if(j.items && j.items.length){
          items=j.items; saveLocal(); currentPage=1; render(); return;
        }
      }
    }catch{}
    const local=loadLocal();
    if(local.length){ items=local; }
    render();
  };

  form.addEventListener("submit", async ev=>{
    ev.preventDefault();
    const fd=new FormData(form);
    const payload={name:String(fd.get("name")||"").trim(), title:String(fd.get("title")||"").trim(), message:String(fd.get("message")||"").trim(), rating:Number(fd.get("rating")||5), website:String(fd.get("website")||"").trim()};
    if(!payload.name||!payload.message){ if(status) status.textContent="Pseudo + message obligatoires"; return;}
    const newItem={id:"local_"+Date.now(), name:payload.name, title:payload.title, message:payload.message, rating:payload.rating, created_at:new Date().toISOString()};
    items.unshift(newItem); saveLocal(); currentPage=1; render();
    if(status) status.textContent="Publié instantanément !";
    form.reset(); current=5; if(ratingInput) ratingInput.value=5; paint(5);
    try{
      const r=await fetch("/api/guestbook",{method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload)});
      const j=await r.json();
      if(r.ok && j.item){ items[0]=j.item; saveLocal(); render(); if(status) status.textContent="Publié et sauvegardé !"; }
    }catch(e){ if(status) status.textContent="Publié en local (serveur indisponible)."; }
  });

  await load();
  window.deleteEntry=async(id)=>{
    if(!confirm("Supprimer cet avis ?")) return;
    items=items.filter(i=>i.id!==id); saveLocal();
    const totalPages=Math.max(1,Math.ceil(items.length/perPage));
    if(currentPage>totalPages) currentPage=totalPages;
    render();
    try{ await fetch(`/api/guestbook?id=${id}`,{method:"DELETE"}); }catch{}
  };
}

/* CONTACT */
function initContactForm(){
  const form=document.getElementById("contact-form");
  const status=document.getElementById("contact-status");
  if(!form) return;
  form.addEventListener("submit", async e=>{
    e.preventDefault();
    const fd=new FormData(form);
    const payload={
      name:String(fd.get("name")||"").trim(),
      email:String(fd.get("email")||"").trim(),
      subject:String(fd.get("subject")||"").trim(),
      message:String(fd.get("message")||"").trim(),
      website:String(fd.get("website")||"").trim(),
    };
    if(payload.website){ status.textContent="Spam détecté."; return; }
    if(!payload.name || !payload.email || !payload.message){ status.textContent="Nom, email et message requis."; return; }
    status.textContent="Envoi...";
    // save locally + try api
    try{
      const r=await fetch("/api/contact",{method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload)});
      if(r.ok){ status.textContent="Message envoyé ! Je te réponds vite."; form.reset(); return; }
      throw new Error("api fail");
    }catch{
      // fallback local
      const key="reddice_contacts_v3";
      const arr=JSON.parse(localStorage.getItem(key)||"[]");
      arr.unshift({...payload, id:"ct_"+Date.now(), created_at:new Date().toISOString()});
      localStorage.setItem(key, JSON.stringify(arr));
      status.textContent="Message enregistré en local (API indisponible). Je le verrai dans l'admin.";
      form.reset();
    }
  });
}

/* ADMIN - login + panel */
function initAdmin(){
  const loginForm=document.getElementById("admin-login-form");
  const panel=document.getElementById("admin-panel");
  if(!loginForm) return;
  // CHANGE ICI TES IDENTIFIANTS UNIQUES
  const ADMIN_USER="reddice"; // <-- change
  const ADMIN_PASS="Furioz_2026_Secure!"; // <-- change

  const checkSession=()=> localStorage.getItem("reddice_admin_session")==="ok";
  const setSession=()=>{ localStorage.setItem("reddice_admin_session","ok"); panel.classList.add("is-open"); loginForm.parentElement.style.display="none"; loadAdminData(); };
  if(checkSession()) setSession();

  loginForm.addEventListener("submit", e=>{
    e.preventDefault();
    const fd=new FormData(loginForm);
    const u=String(fd.get("username")||"").trim();
    const p=String(fd.get("password")||"");
    if(u===ADMIN_USER && p===ADMIN_PASS){ setSession(); }
    else{ document.getElementById("admin-login-status").textContent="Identifiants invalides."; }
  });

  document.getElementById("admin-logout")?.addEventListener("click", ()=>{
    localStorage.removeItem("reddice_admin_session");
    location.reload();
  });

  // tabs
  document.querySelectorAll("[data-admin-tab]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll("[data-admin-tab]").forEach(b=>b.classList.remove("btn-primary"));
      btn.classList.add("btn-primary");
      document.querySelectorAll(".admin-section").forEach(s=>s.style.display="none");
      document.getElementById("admin-section-"+btn.dataset.adminTab).style.display="block";
    });
  });
}

async function loadAdminData(){
  // planning editor
  const planningList=document.getElementById("admin-planning-list");
  const contactsList=document.getElementById("admin-contacts-list");
  const guestbookAdmin=document.getElementById("admin-guestbook-list");
  let planning=[];
  try{
    const stored=localStorage.getItem("reddice_planning_override_v3");
    if(stored) planning=JSON.parse(stored);
    else{
      const r=await fetch("/data/planning.json",{cache:"no-store"});
      planning=await r.json();
    }
  }catch{}
  if(planningList){
    planningList.innerHTML="";
    planning.forEach((ev, idx)=>{
      const row=document.createElement("div");
      row.className="card";
      row.innerHTML=`<div style="display:grid; gap:.4rem">
        <input data-idx="${idx}" data-field="title" value="${esc(ev.title)}">
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:.4rem">
          <input data-idx="${idx}" data-field="date" type="date" value="${esc(ev.date||"")}">
          <input data-idx="${idx}" data-field="time" value="${esc(ev.time)}">
          <input data-idx="${idx}" data-field="tag" value="${esc(ev.tag)}">
        </div>
        <select data-idx="${idx}" data-field="type"><option value="upcoming" ${ev.type==="upcoming"?"selected":""}>upcoming</option><option value="special" ${ev.type==="special"?"selected":""}>special</option></select>
        <div style="display:flex; gap:.4rem"><button class="btn btn-small" onclick="adminDeletePlanning(${idx})">Supprimer</button></div>
      </div>`;
      planningList.appendChild(row);
    });
    planningList.querySelectorAll("input,select").forEach(inp=>{
      inp.addEventListener("change", e=>{
        const idx=parseInt(e.target.dataset.idx);
        const field=e.target.dataset.field;
        planning[idx][field]=e.target.value;
        localStorage.setItem("reddice_planning_override_v3", JSON.stringify(planning));
      });
    });
  }
  window.adminDeletePlanning=(idx)=>{
    planning.splice(idx,1);
    localStorage.setItem("reddice_planning_override_v3", JSON.stringify(planning));
    loadAdminData();
  };
  window.adminAddPlanning=()=>{
    const title=prompt("Titre de l'event ?");
    if(!title) return;
    const date=prompt("Date YYYY-MM-DD","2026-09-01")|| new Date().toISOString().slice(0,10);
    const time=prompt("Heure HH:MM","20:30")||"20:30";
    const tag=prompt("Tag","Live principal")||"Live";
    const type=prompt("Type upcoming / special","upcoming")||"upcoming";
    planning.push({id:"evt_"+Date.now(), day: new Date(date).toLocaleDateString('fr-FR',{weekday:'long'}), date, time, title, tag, active:true, type});
    localStorage.setItem("reddice_planning_override_v3", JSON.stringify(planning));
    loadAdminData();
  };
  window.adminExportPlanning=()=>{
    const blob=new Blob([JSON.stringify(planning, null, 2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="planning.json"; a.click();
  };
  window.adminResetPlanning=()=>{
    if(confirm("Reset planning vers fichier d'origine ?")){ localStorage.removeItem("reddice_planning_override_v3"); loadAdminData(); }
  };

  // contacts
  if(contactsList){
    contactsList.innerHTML="";
    let contacts=[];
    try{
      const r=await fetch("/api/contact",{cache:"no-store"});
      if(r.ok){ const j=await r.json(); contacts=j.items||[]; }
    }catch{}
    if(!contacts.length){
      contacts=JSON.parse(localStorage.getItem("reddice_contacts_v3")||"[]");
    }
    if(!contacts.length) contactsList.innerHTML="<p class='lead'>Aucun contact.</p>";
    contacts.forEach(c=>{
      const div=document.createElement("div");
      div.className="card";
      div.innerHTML=`<strong>${esc(c.name)} - ${esc(c.email)}</strong><br><small style="color:var(--muted)">${new Date(c.created_at).toLocaleDateString('fr-FR')} - ${esc(c.subject||"")}</small><p style="color:var(--muted)">${esc(c.message)}</p>`;
      contactsList.appendChild(div);
    });
  }
  // guestbook in admin
  if(guestbookAdmin){
    try{
      const r=await fetch("/api/guestbook",{cache:"no-store"});
      const j=await r.json();
      const items=j.items||JSON.parse(localStorage.getItem("reddice_guestbook_auto_v3")||"[]");
      guestbookAdmin.innerHTML="";
      items.slice(0,50).forEach(e=>{
        const d=document.createElement("div");
        d.className="card";
        d.innerHTML=`<strong>${esc(e.name)}</strong> - ${e.rating}/5<br><small>${esc(e.title||"")}</small><p>${esc(e.message)}</p><button class="btn btn-small" onclick="deleteEntry('${e.id}')">Supprimer</button>`;
        guestbookAdmin.appendChild(d);
      });
    }catch{}
  }
}

function setYear(){ const n=document.getElementById("current-year"); if(n) n.textContent=new Date().getFullYear(); }
function esc(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
