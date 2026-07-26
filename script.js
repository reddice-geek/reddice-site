
document.addEventListener("DOMContentLoaded", async ()=>{
  initReveal(); initActiveNav(); initTwitchEmbeds(); initStreamStatus(); initPlanningV2(); initGuestbook(); setYear();
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
  const host=location.hostname;
  if(!host) return;
  const parent=encodeURIComponent(host);
  p.src=`https://player.twitch.tv/?channel=reddice_stream&parent=${parent}&muted=true`;
  setTimeout(()=>{c.src=`https://www.twitch.tv/embed/reddice_stream/chat?parent=${parent}`},300);
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
      set(j.live?"is-live":"is-offline", j.live?"Stream On":"Stream Off");
    }catch{set("is-offline","Offline")}
  };
  await refresh(); setInterval(refresh,60000);
}
async function initPlanningV2(){
  const editableNode=document.getElementById("planning-editable");
  const archiveNode=document.getElementById("planning-archives");
  const statusNode=document.getElementById("planning-status");
  if(!editableNode) return;
  try{
    const res=await fetch("/data/planning.json",{cache:"no-store"});
    const planning=await res.json();
    editableNode.innerHTML="";
    planning.forEach(item=>{
      const div=document.createElement("div");
      div.className=`card planning-card reveal visible ${item.active?'active':''} ${item.time==='Off'?'off':''}`;
      div.innerHTML=`<div style="display:flex; gap:0.5rem; flex-wrap:wrap"><span class="mini-chip">${item.day}</span><span class="mini-chip">${item.time}</span><span class="mini-chip">${item.tag}</span></div><strong style="color:#fff; margin-top:0.3rem">${item.title}</strong>`;
      editableNode.appendChild(div);
    });
    if(statusNode) statusNode.textContent=`Planning à jour • ${planning.length} créneaux cette semaine`;
  }catch(e){ if(statusNode) statusNode.textContent="Planning indisponible pour le moment"; }

  // archives Twitch
  if(!archiveNode) return;
  try{
    const r=await fetch("/api/twitch-history?login=reddice_stream",{cache:"no-store"});
    const data=await r.json();
    const items=data.items||[];
    archiveNode.innerHTML="";
    items.slice(0,6).forEach(v=>{
      const art=document.createElement("article");
      art.className="card reveal visible";
      art.innerHTML=`<div style="height:140px; border-radius:10px; background:linear-gradient(rgba(0,0,0,0.2),rgba(0,0,0,0.4)), url('${v.thumbnail_url}') center/cover; margin-bottom:0.8rem"></div><span class="mini-chip">${new Date(v.created_at).toLocaleDateString('fr-FR')}</span> <span class="mini-chip">${v.duration}</span><h3 style="margin:0.5rem 0 0.2rem; font-size:1rem">${v.title}</h3><p style="color:var(--muted); font-size:0.85rem; margin:0 0 0.8rem">${v.view_count} vues</p><a class="btn" href="${v.url}" target="_blank">Voir VOD</a>`;
      archiveNode.appendChild(art);
    });
  }catch(e){ archiveNode.innerHTML="<p class='lead'>Archives indisponibles pour le moment.</p>"; }
}
async function initGuestbook(){
  const form=document.getElementById("guestbook-form");
  const list=document.getElementById("guestbook-list");
  const status=document.getElementById("guestbook-status");
  const countEl=document.getElementById("guestbook-count");
  const pagination=document.getElementById("guestbook-pagination");
  const ratingInput=document.getElementById("guestbook-rating");
  if(!form||!list) return;
  let items=[]; let current=5; let currentPage=1; const perPage=10;
  const STORAGE_KEY="reddice_guestbook_auto_v2";

  const stars=document.querySelectorAll("[data-rating-value]");
  const paint=v=>stars.forEach(s=>s.classList.toggle("active", Number(s.dataset.ratingValue)<=v));
  paint(5);
  stars.forEach(s=>s.addEventListener("click",()=>{current=Number(s.dataset.ratingValue); ratingInput.value=current; paint(current)}));

  const saveLocal=()=>{ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }catch{} };
  const loadLocal=()=>{ try{ const raw=localStorage.getItem(STORAGE_KEY); if(raw){ const arr=JSON.parse(raw); if(Array.isArray(arr)) return arr; } }catch{} return []; };

  const render=()=>{
    const total=items.length;
    if(countEl) countEl.textContent=`${total} avis • Page ${currentPage}/${Math.max(1,Math.ceil(total/perPage))}`;
    if(total===0){ list.innerHTML="<p class='lead'>Aucun avis, sois le premier. Ton avis s'affiche instantanément !</p>"; if(pagination) pagination.innerHTML=""; return; }
    const start=(currentPage-1)*perPage;
    const pageItems=items.slice(start, start+perPage);
    list.innerHTML="";
    pageItems.forEach(e=>{
      const d=document.createElement("div");
      d.className="card reveal visible";
      d.innerHTML=`<div style="display:flex; justify-content:space-between; align-items:center"><strong>${esc(e.name)}</strong><small style="color:var(--muted)">${new Date(e.created_at).toLocaleDateString('fr-FR')}</small></div><div style="color:var(--gold); letter-spacing:2px">${"★".repeat(e.rating||5)}${"☆".repeat(5-(e.rating||5))}</div>${e.title?`<h4 style="margin:0.4rem 0">${esc(e.title)}</h4>`:""}<p style="color:var(--muted)">${esc(e.message)}</p>${location.search.includes('admin')?`<button class="btn" onclick="deleteEntry('${e.id}')">Supprimer</button>`:""}`;
      list.appendChild(d);
    });
    if(pagination){
      const totalPages=Math.ceil(total/perPage);
      pagination.innerHTML="";
      if(totalPages>1){
        const mkBtn=(label,page,disabled=false,active=false)=>{
          const b=document.createElement("button");
          b.textContent=label;
          b.className="btn"+(active?" btn-primary":"");
          b.disabled=disabled;
          b.style.opacity=disabled?"0.4":"1";
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
          items=j.items;
          saveLocal();
          currentPage=1;
          render();
          return;
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
    if(!payload.name||!payload.message){ status.textContent="Pseudo + message obligatoires"; return;}
    const newItem={id:"local_"+Date.now(), name:payload.name, title:payload.title, message:payload.message, rating:payload.rating, created_at:new Date().toISOString()};
    items.unshift(newItem);
    saveLocal();
    currentPage=1;
    render();
    status.textContent="Publié instantanément !";
    form.reset(); current=5; ratingInput.value=5; paint(5);
    try{
      const r=await fetch("/api/guestbook",{method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload)});
      const j=await r.json();
      if(r.ok && j.item){
        items[0]=j.item;
        saveLocal();
        render();
        status.textContent="Publié et sauvegardé !";
      }
    }catch(e){
      status.textContent="Publié en local (serveur indisponible).";
    }
  });

  await load();
  window.deleteEntry=async(id)=>{
    if(!confirm("Supprimer cet avis ?")) return;
    items=items.filter(i=>i.id!==id);
    saveLocal();
    const totalPages=Math.max(1,Math.ceil(items.length/perPage));
    if(currentPage>totalPages) currentPage=totalPages;
    render();
    try{ await fetch(`/api/guestbook?id=${id}`,{method:"DELETE"}); }catch{}
  };
}

async function initContact(){ /* contact removed */ }

function setYear(){ const n=document.getElementById("current-year"); if(n) n.textContent=new Date().getFullYear(); }
function esc(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
