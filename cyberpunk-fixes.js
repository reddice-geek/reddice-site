(() => {
  "use strict";
  const DOMAIN = "reddicestream.com";
  const TWITCH = "reddice_stream";
  const FURIOZ_TWITCH = "https://twitch.tv/furiozcompagnie";
  const FURIOZ_DISCORD = "https://discord.com/invite/nKj9NFDyxj";
  const FURIOZ_SITE = "https://furioz-compagnie.com";
  const year = new Date().getFullYear();

  const textWalker = (root, fn) => {
    const w = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    const nodes=[]; let n; while((n=w.nextNode())) nodes.push(n);
    nodes.forEach(fn);
  };

  function brandText() {
    textWalker(document.body, node => {
      if (!node.nodeValue) return;
      const next = node.nodeValue
        .replaceAll("KEYSTONE", "FURIOZ COMPAGNIE // INC.")
        .replaceAll("RED DICE", "REDDICE")
        .replaceAll("reddice.fr", DOMAIN)
        .replaceAll("www.reddice.fr", "www."+DOMAIN)
        .replaceAll("27 LEVEL", "33 ANS")
        .replaceAll("LEVEL 27 CLEARANCE", "BORN 26 AVRIL 1993 // 33 ANS")
        .replaceAll("STREAMER ORIGIN", "26 AVRIL 1993")
        .replace(/©\s*2022/g, "© "+year);
      if (next !== node.nodeValue) node.nodeValue = next;
    });
  }

  function ageBadge() {
    // Some of the original Cyberpunk exports render the age and label as separate text nodes.
    [...document.querySelectorAll('span,b')].forEach(el => {
      if (el.textContent.trim() !== '27') return;
      const parent = el.parentElement;
      if (!parent || !/LEVEL/.test(parent.textContent)) return;
      el.textContent = '33';
      [...parent.childNodes].forEach(n => {
        if (n.nodeType === Node.TEXT_NODE && n.nodeValue.trim() === 'LEVEL') n.nodeValue = 'ANS';
        if (n.nodeType === Node.ELEMENT_NODE && n.textContent.trim() === 'LEVEL') n.textContent = 'ANS';
      });
    });
  }

  function logoMain() {
    const imgs=[...document.querySelectorAll('img[src*="logo-main.png"]')];
    if (!imgs.length) {
      const spans=[...document.querySelectorAll('span')].filter(e=>e.textContent.trim()==="♦");
      const target=spans.find(e => e.parentElement && /FURIOZ COMPAGNIE \/\/ INC\./.test(e.parentElement.textContent));
      if (target) {
        const img=document.createElement('img');
        img.src='assets/logo-main.png'; img.alt='REDDICE'; img.width=1600; img.height=1600;
        img.style.width='28px'; img.style.height='28px'; img.style.objectFit='contain'; img.style.display='block';
        img.style.filter='drop-shadow(0 0 7px rgba(0,240,255,.5))';
        target.replaceWith(img);
      }
    }
    const links=document.querySelectorAll('link[rel="icon"]');
    links.forEach(l=>l.href='assets/logo-main.png');
  }

  function bioPhoto() {
    const img=document.querySelector('img[src$="bio-photo.png"]');
    if (!img) return;
    img.alt='REDDICE — Cédric';
    img.style.width='100%'; img.style.height='100%'; img.style.minHeight='0';
    img.style.objectFit='contain'; img.style.objectPosition='center'; img.style.display='block';
    let p=img.parentElement;
    for(let i=0;i<6 && p && p!==document.body;i++,p=p.parentElement){
      if(p.className && String(p.className).includes('overflow-hidden')){
        p.style.width='100%'; p.style.aspectRatio='1 / 1'; p.style.height='auto'; p.style.minHeight='0'; p.style.flex='0 0 auto';
        p.style.alignSelf='stretch';
        break;
      }
    }
  }

  function twitch() {
    document.querySelectorAll('iframe[src*="twitch.tv"]').forEach(frame => {
      try {
        const u=new URL(frame.src);
        const host=location.hostname || DOMAIN;
        const values=[DOMAIN, host];
        u.searchParams.delete('parent');
        [...new Set(values.filter(Boolean))].forEach(v=>u.searchParams.append('parent',v));
        if(u.hostname==='player.twitch.tv'){
          u.searchParams.set('channel',TWITCH);
          if(!u.searchParams.has('muted')) u.searchParams.set('muted','true');
          if(!u.searchParams.has('autoplay')) u.searchParams.set('autoplay','false');
        }
        frame.src=u.toString();
        frame.setAttribute('allow','autoplay; fullscreen; picture-in-picture');
        frame.setAttribute('allowfullscreen','true');
      } catch {}
    });
  }

  function footerYear() {
    textWalker(document.body, node => {
      if (/©\s*\d{4}/.test(node.nodeValue)) {
        const next=node.nodeValue.replace(/©\s*\d{4}/g,'© '+year);
        if(next!==node.nodeValue) node.nodeValue=next;
      }
    });
  }

  function makeVodSection() {
    if (location.pathname.toLowerCase().includes('planning')) {
      const existing=document.getElementById('rd-live-vod');
      if (existing) return existing;
      const archive=document.getElementById('planning-archives');
      if (!archive) return null;
      // Keep only the original Cyberpunk section header and replace its records area.
      [...archive.children].forEach((el,i)=>{ if(i>0) el.remove(); });
      const live=document.createElement('div'); live.id='rd-live-vod';
      live.innerHTML=`
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.22em;color:#FFC9B8">
          <span style="color:#FF3C0A">●</span> VOD TWITCH // REDDICE
          <span style="margin-left:auto;border:1px solid rgba(0,240,255,.4);padding:3px 7px;color:#00F0FF">LIVE SYNC</span>
        </div>
        <div id="rd-vod-status" style="border:1px solid rgba(0,240,255,.18);background:#08101a;color:#7ADFFF;padding:12px;font-family:'Share Tech Mono',monospace;font-size:11px">CHARGEMENT DES REDIFFUSIONS TWITCH…</div>
        <div id="rd-vod-player" style="display:none;margin-top:12px;border:1px solid rgba(0,240,255,.3);background:#000;position:relative;aspect-ratio:16/9;overflow:hidden"></div>
        <div id="rd-vod-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px"></div>`;
      archive.appendChild(live);
      loadVods();
      return live;
    }
    return null;
  }

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const duration=d=>{ const m=String(d||'').match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/); if(!m)return ''; const h=+(m[1]||0),mi=+(m[2]||0),se=+(m[3]||0); return h?`${h}h ${String(mi).padStart(2,'0')}m`:`${mi}m ${String(se).padStart(2,'0')}s`; };
  const dateFr=d=>{ const x=new Date(d); return Number.isNaN(x.getTime())?'':x.toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'}); };

  async function loadVods(){
    const status=document.getElementById('rd-vod-status'), grid=document.getElementById('rd-vod-grid');
    if(!grid||!status)return;
    try{
      const r=await fetch('/api/twitch-history?login='+encodeURIComponent(TWITCH),{cache:'no-store'});
      const data=await r.json();
      const items=Array.isArray(data.items)?data.items:[];
      if(!items.length){
        status.innerHTML='<strong style="color:#FF6A3A">AUCUNE VOD DISPONIBLE</strong><br><span style="opacity:.7">Twitch n’a actuellement aucune rediffusion remontée par l’API.</span>';
        return;
      }
      status.innerHTML='<span style="color:#00FF88">✓ '+items.length+' REDIFFUSION(S) RÉELLE(S) TROUVÉE(S)</span>';
      grid.innerHTML=items.map((v,i)=>`<article style="border:1px solid #1E2A36;background:#0D121A;overflow:hidden;clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px))">
        <button data-vod="${esc(v.id)}" style="display:block;width:100%;border:0;padding:0;background:#05080D;cursor:pointer;aspect-ratio:16/9;position:relative">
          <img src="${esc(v.thumbnail_url||'')}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;opacity:.9">
          <span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:54px;height:54px;border:2px solid #00F0FF;color:#00F0FF;display:grid;place-items:center;background:rgba(0,0,0,.65);font-size:20px">▶</span>
        </button>
        <div style="padding:12px 14px;font-family:'Share Tech Mono',monospace">
          <div style="font-size:9px;letter-spacing:.22em;color:#FF6A3A;margin-bottom:6px">VOD // ${String(i+1).padStart(2,'0')}</div>
          <div style="color:#fff;font-family:'Oxanium',sans-serif;font-weight:800;font-size:16px;line-height:1.1">${esc(v.title||'Rediffusion Twitch')}</div>
          <div style="margin-top:7px;font-size:10px;color:#8AA0B0">${esc(dateFr(v.created_at))} · ${esc(duration(v.duration))} · ${Number(v.view_count||0).toLocaleString('fr-FR')} vues</div>
          <div style="margin-top:10px;display:flex;gap:7px;flex-wrap:wrap">
            <button data-vod="${esc(v.id)}" style="border:1px solid #00F0FF;color:#00F0FF;background:rgba(0,240,255,.08);padding:6px 9px;font-family:'Share Tech Mono',monospace;font-size:10px;cursor:pointer">LIRE ICI</button>
            <a href="${esc(v.url||('https://www.twitch.tv/videos/'+v.id))}" target="_blank" rel="noopener noreferrer" style="border:1px solid #FF3C0A;color:#FF8A70;background:rgba(255,60,10,.08);padding:6px 9px;font-family:'Share Tech Mono',monospace;font-size:10px;text-decoration:none">TWITCH ↗</a>
          </div>
        </div>
      </article>`).join('');
      grid.querySelectorAll('[data-vod]').forEach(btn=>btn.addEventListener('click',()=>playVod(btn.dataset.vod)));
    }catch{
      status.innerHTML='<strong style="color:#FF6A3A">IMPOSSIBLE DE RÉCUPÉRER LES VOD</strong><br><span style="opacity:.7">La chaîne Twitch reste accessible directement.</span>';
    }
  }

  function playVod(id){
    const wrap=document.getElementById('rd-vod-player'); if(!wrap)return;
    const p=location.hostname||DOMAIN;
    wrap.style.display='block';
    wrap.innerHTML='<iframe src="https://player.twitch.tv/?video='+encodeURIComponent(id)+'&parent='+encodeURIComponent(DOMAIN)+'&parent='+encodeURIComponent(p)+'&autoplay=true&muted=false" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Rediffusion Twitch — Reddice"></iframe>';
    wrap.scrollIntoView({behavior:'smooth',block:'start'});
  }


  function furiozLinks() {
    if (document.getElementById('rd-furioz-links')) return;
    const footer = document.querySelector('footer');
    if (!footer) return;
    const box = document.createElement('section');
    box.id = 'rd-furioz-links';
    box.setAttribute('aria-label','Furioz Compagnie');
    box.style.cssText = [
      'margin-top:18px', 'border:1px solid rgba(0,240,255,.22)', 'border-left:3px solid #FF3C0A',
      'background:linear-gradient(90deg,rgba(255,60,10,.07),rgba(0,240,255,.04))',
      'box-shadow:inset 0 0 20px rgba(0,240,255,.05)', 'padding:14px 16px',
      "font-family:'Share Tech Mono',monospace"
    ].join(';');
    box.innerHTML = `
      <div style="display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:12px">
        <div>
          <div style="font-family:'Oxanium',sans-serif;font-weight:800;font-size:14px;letter-spacing:.12em;color:#FF3C0A">FURIOZ COMPAGNIE</div>
          <div style="margin-top:4px;font-size:10px;letter-spacing:.12em;color:#7F96A8">COLLECTIF // STREAM // COMMUNAUTÉ</div>
          <div style="margin-top:7px;font-size:10px;line-height:1.5;color:#A6B7C7;max-width:620px">Retrouve la Furioz Compagnie sur ses espaces officiels et rejoins le collectif autour du gaming, du streaming et des projets communautaires.</div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:7px;align-items:center">
          <a href="${FURIOZ_TWITCH}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;border:1px solid #9146FF;color:#D8BFFF;background:rgba(145,70,255,.10);padding:7px 10px;font-size:10px;letter-spacing:.10em">TWITCH // FURIOZ</a>
          <a href="${FURIOZ_DISCORD}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;border:1px solid #5865F2;color:#C9CCFF;background:rgba(88,101,242,.10);padding:7px 10px;font-size:10px;letter-spacing:.10em">DISCORD // FURIOZ</a>
          <a href="${FURIOZ_SITE}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;border:1px solid #00F0FF;color:#00F0FF;background:rgba(0,240,255,.08);padding:7px 10px;font-size:10px;letter-spacing:.10em">SITE // FURIOZ</a>
        </div>
      </div>`;
    footer.parentNode.insertBefore(box,footer);
  }

  function apply(){
    brandText(); ageBadge(); logoMain(); bioPhoto(); twitch(); footerYear(); makeVodSection(); furiozLinks();
    document.documentElement.style.scrollBehavior='smooth';
    document.querySelectorAll('a[href]').forEach(a=>{
      try{const u=new URL(a.href,location.href);if(u.origin===location.origin&&!a.getAttribute('href').startsWith('#')) a.style.transition='opacity .12s ease, transform .12s ease';}catch{}
    });
  }

  function start(){
    let tries=0;
    const tick=()=>{
      apply(); tries++;
      if(tries<120) setTimeout(tick,250);
    };
    tick();
    const obs=new MutationObserver(()=>apply());
    obs.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>obs.disconnect(),30000);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
