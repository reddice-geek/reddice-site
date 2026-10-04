// Reddice V5 FROM ZERO - Keystone + Inventory
document.addEventListener('DOMContentLoaded',()=>{
  const yearEl=document.getElementById('year'); if(yearEl) yearEl.textContent=new Date().getFullYear();
  const sysDate=document.getElementById('sys-date');
  if(sysDate) setInterval(()=>{sysDate.textContent=new Date().toLocaleString('fr-FR')+' • ANGERS // FR'},1000);

  // Twitch fallback if iframe blocked in preview
  const twitchBox=document.querySelector('.player-box iframe');
  if(twitchBox){
    setTimeout(()=>{
      try{
        if(twitchBox.clientHeight<50){
          twitchBox.parentElement.innerHTML='<div style="padding:2rem;text-align:center;color:#8aa0bc;font-family:Share Tech Mono">PLAYER BLOQUE EN PREVIEW — ouvre en prod sur reddice.fr<br><a href="https://twitch.tv/reddice_stream" target="_blank" class="btn btn-primary" style="margin-top:1rem">Ouvrir Twitch</a></div>';
        }
      }catch(e){}
    },2000);
  }

  // Guestbook V5 vide de base
  const list=document.getElementById('guestbook-list'), count=document.getElementById('guestbook-count'), form=document.getElementById('guestbook-form'), ratingInput=document.getElementById('guestbook-rating'), starsWrap=document.getElementById('guestbook-stars'), status=document.getElementById('guestbook-status');
  let rating=5; const LS_KEY='reddice_guestbook_auto_v3';
  function paintStars(v){ if(!starsWrap) return; [...starsWrap.children].forEach(b=>{ b.style.color=parseInt(b.dataset.ratingValue)<=v?'#ffd54a':'rgba(255,255,255,0.2)' }) }
  if(starsWrap){
    starsWrap.addEventListener('click',e=>{
      const btn=e.target.closest('[data-rating-value]'); if(!btn) return;
      rating=parseInt(btn.dataset.ratingValue); if(ratingInput) ratingInput.value=rating; paintStars(rating);
    });
    paintStars(5);
  }
  function load(){ try{return JSON.parse(localStorage.getItem(LS_KEY)||'[]')}catch{return[]} }
  function save(arr){ localStorage.setItem(LS_KEY, JSON.stringify(arr)) }
  function render(){
    const data=load();
    if(count) count.textContent=`${data.length} avis`;
    if(!list) return;
    if(data.length===0){ list.innerHTML='<div class="shell" style="margin:0;text-align:center;color:var(--muted)">Aucun avis pour l\'instant. Sois le premier choom — feed vide de base, clean.</div>'; return; }
    list.innerHTML=data.map(d=>`<div class="shell fia-red" style="margin:0"><div style="display:flex;justify-content:space-between"><strong>${d.name}</strong><span>${'★'.repeat(d.rating)}${'☆'.repeat(5-d.rating)}</span></div><small style="color:var(--muted)">${d.title||''} • ${new Date(d.date).toLocaleString('fr-FR')}</small><p style="margin-top:.6rem">${d.message}</p></div>`).join('');
  }
  if(form){
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const fd=new FormData(form);
      const entry={name:fd.get('name')||'Anonyme', title:fd.get('title')||'', message:fd.get('message')||'', rating:rating, date:new Date().toISOString()};
      const arr=load(); arr.unshift(entry); save(arr); render(); form.reset(); rating=5; if(ratingInput) ratingInput.value=5; paintStars(5);
      if(status){ status.textContent='Transmis en Holo-Feed ✓'; status.style.color='#3CFF9A' }
    });
  }
  render();

  // Contact failsafe
  const cForm=document.getElementById('contact-form'), cStatus=document.getElementById('contact-status');
  if(cForm){
    cForm.addEventListener('submit',e=>{
      e.preventDefault();
      const fd=new FormData(cForm); const data=Object.fromEntries(fd.entries());
      const saved=JSON.parse(localStorage.getItem('reddice_contacts_v5')||'[]'); saved.unshift({...data,date:new Date().toISOString()}); localStorage.setItem('reddice_contacts_v5', JSON.stringify(saved));
      if(cStatus){ cStatus.style.display='block'; cStatus.textContent='✓ Transmission sauvegardée localement - visible dans admin.html'; cStatus.style.borderColor='#3CFF9A'; cStatus.style.color='#3CFF9A' }
      cForm.reset();
    });
  }

  // Games filter (jeux.html)
  const grid=document.getElementById('grid'), gCount=document.getElementById('games-count'), search=document.getElementById('search'), filter=document.getElementById('filter');
  const GAMES=[["GOG","Cyberpunk 2077"],["GOG","The Witcher 3"],["GOG","DOOM (1993)"],["GOG","Fallout: New Vegas"],["GOG","Baldur's Gate II"],["GOG","Mafia: Definitive Edition"],["GOG","Star Wars: Bounty Hunter"],["Epic","Alan Wake"],["Epic","Alien: Isolation"],["Epic","ARK: Survival Evolved"]];
  function renderGames(){
    if(!grid) return;
    const q=(search?.value||'').toLowerCase(); const f=filter?.value||'all';
    const filtered=GAMES.filter(([p,t])=>(f==='all'||p===f)&&t.toLowerCase().includes(q));
    if(gCount) gCount.textContent=`${filtered.length} jeux / ${GAMES.length} chargés • INVENTORY SYNCED`;
    grid.innerHTML=filtered.map(([p,t])=>`<div class="shell" style="margin:0;border-left:3px solid ${p==='GOG'?'#00F0FF':'#8A5CFF'}"><div style="display:flex;justify-content:space-between"><span class="mini-chip">${p}</span><span class="mini-chip" style="color:#FF3C0A">DPS ${Math.floor(Math.random()*200+150)}</span></div><h4 style="margin:.6rem 0 0">${t}</h4><small style="color:var(--muted);font-family:var(--font-mono)">${p==='GOG'?'DRM-Free':'Cloud Ready'} • Circuit</small></div>`).join('');
  }
  if(search) search.addEventListener('input',renderGames);
  if(filter) filter.addEventListener('change',renderGames);
  renderGames();
});
function buildGCalLink(title,desc,dateStr,timeStr){ const start=new Date(`${dateStr}T${timeStr||'20:30'}`); const end=new Date(start.getTime()+2*3600*1000); const fmt=d=>d.toISOString().replace(/-|:|\.\d+/g,''); return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(desc)}&dates=${fmt(start)}/${fmt(end)}`; }
