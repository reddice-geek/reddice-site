(() => {
  "use strict";
  const DOMAIN = "reddicestream.com";
  const TWITCH = "reddice_stream";
  const FURIOZ_TWITCH = "https://twitch.tv/furiozcompagnie";
  const FURIOZ_DISCORD = "https://discord.com/invite/nKj9NFDyxj";
  const FURIOZ_SITE = "https://furioz-compagnie.com";
  const year = new Date().getFullYear();

  const textWalker = (root, fn) => {
    const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(fn);
  };

  function brandText() {
    textWalker(document.body, (node) => {
      if (!node.nodeValue) return;
      const next = node.nodeValue
        .replaceAll("KEYSTONE", "REDDICE STREAM HUB")
        .replaceAll("FURIOZ COMPAGNIE // INC.", "REDDICE // STREAM HUB")
        .replaceAll("ARASAKADIR://INTEL.DEPT/PROFILE", "REDDICE://PLAYER.PROFILE")
        .replaceAll("RED DICE", "REDDICE")
        .replaceAll("reddice.fr", DOMAIN)
        .replaceAll("www.reddice.fr", `www.${DOMAIN}`)
        .replaceAll("27 LEVEL", "33 ANS")
        .replaceAll("LEVEL 27 CLEARANCE", "33 ANS // REDDICE")
        .replaceAll("STREAMER ORIGIN", "REDDICE PROFILE")
        .replace(/©\s*2022/g, `© ${year}`);
      if (next !== node.nodeValue) node.nodeValue = next;
    });
  }

  function ageBadge() {
    [...document.querySelectorAll("span,b")].forEach((element) => {
      if (element.textContent.trim() !== "27") return;
      const parent = element.parentElement;
      if (!parent || !/LEVEL/.test(parent.textContent)) return;
      element.textContent = "33";
      [...parent.childNodes].forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() === "LEVEL") node.nodeValue = "ANS";
        if (node.nodeType === Node.ELEMENT_NODE && node.textContent.trim() === "LEVEL") node.textContent = "ANS";
      });
    });
  }

  function logoMain() {
    const imgs = [...document.querySelectorAll('img[src*="logo-main.png"]')];
    if (!imgs.length) {
      const spans = [...document.querySelectorAll("span")].filter((element) => element.textContent.trim() === "♦");
      const target = spans.find((element) => element.parentElement && /REDDICE \/\/ STREAM HUB/.test(element.parentElement.textContent));
      if (target) {
        const img = document.createElement("img");
        img.src = "assets/logo-main.png";
        img.alt = "REDDICE";
        img.width = 1600;
        img.height = 1600;
        img.style.cssText = "width:28px;height:28px;object-fit:contain;display:block;filter:drop-shadow(0 0 7px rgba(0,240,255,.5))";
        target.replaceWith(img);
      }
    }
    document.querySelectorAll('link[rel="icon"]').forEach((link) => { link.href = "assets/logo-main.png"; });
  }

  function bioPhoto() {
    const img = document.querySelector('img[src$="bio-photo.png"]');
    if (!img || img.dataset.rdLegacyPhotoFixed) return;
    img.dataset.rdLegacyPhotoFixed = "1";
    img.alt = "RedDice — Cédric";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.minHeight = "0";
    img.style.objectFit = "contain";
    img.style.objectPosition = "center";
    let parent = img.parentElement;
    for (let i = 0; i < 6 && parent && parent !== document.body; i++, parent = parent.parentElement) {
      if (parent.className && String(parent.className).includes("overflow-hidden")) {
        parent.style.width = "100%";
        parent.style.aspectRatio = "1 / 1";
        parent.style.height = "auto";
        parent.style.minHeight = "0";
        parent.style.flex = "0 0 auto";
        parent.style.alignSelf = "stretch";
        break;
      }
    }
  }

  function footerYear() {
    textWalker(document.body, (node) => {
      if (!node.nodeValue || !/©\s*\d{4}/.test(node.nodeValue)) return;
      node.nodeValue = node.nodeValue.replace(/©\s*\d{4}/g, `© ${year}`);
    });
  }

  function makeVodSection() {
    if (!location.pathname.toLowerCase().includes("planning")) return;
    const archive = document.getElementById("planning-archives");
    if (!archive || document.getElementById("rd-live-vod")) return;
    [...archive.children].forEach((element, index) => { if (index > 0) element.remove(); });
    const live = document.createElement("div");
    live.id = "rd-live-vod";
    live.innerHTML = `
      <div class="rd-vod-head"><span>●</span> VOD TWITCH // REDDICE <b>ARCHIVES LIVE</b></div>
      <div id="rd-vod-status" class="rd-vod-status">CHARGEMENT DES REDIFFUSIONS TWITCH…</div>
      <div id="rd-vod-player" class="rd-vod-player" hidden></div>
      <div id="rd-vod-grid" class="rd-vod-grid"></div>`;
    archive.appendChild(live);
    loadVods();
  }

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const duration = (value) => {
    const match = String(value || "").match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
    if (!match) return "";
    const hours = +(match[1] || 0), minutes = +(match[2] || 0), seconds = +(match[3] || 0);
    return hours ? `${hours}h ${String(minutes).padStart(2, "0")}m` : `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  };
  const dateFr = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  };

  async function loadVods() {
    const status = document.getElementById("rd-vod-status");
    const grid = document.getElementById("rd-vod-grid");
    if (!grid || !status) return;
    try {
      const response = await fetch(`/api/twitch-history?login=${encodeURIComponent(TWITCH)}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];
      if (!items.length) {
        status.innerHTML = '<strong>AUCUNE VOD DISPONIBLE</strong><span>Twitch ne remonte actuellement aucune rediffusion.</span>';
        return;
      }
      status.textContent = `${items.length} REDIFFUSION(S) DISPONIBLE(S)`;
      grid.innerHTML = items.map((vod, index) => `
        <article class="rd-vod-card">
          <button class="rd-vod-thumb" type="button" data-vod="${esc(vod.id)}" aria-label="Lire ${esc(vod.title || "cette rediffusion")}">
            <img src="${esc(vod.thumbnail_url || "")}" alt="" loading="lazy">
            <span>▶</span>
          </button>
          <div class="rd-vod-info">
            <div class="rd-vod-index">REDIFFUSION // ${String(index + 1).padStart(2, "0")}</div>
            <h3>${esc(vod.title || "Rediffusion Twitch")}</h3>
            <p>${esc(dateFr(vod.created_at))} · ${esc(duration(vod.duration))} · ${Number(vod.view_count || 0).toLocaleString("fr-FR")} vues</p>
            <div class="rd-vod-actions">
              <button type="button" data-vod="${esc(vod.id)}">LIRE ICI</button>
              <a href="${esc(vod.url || `https://www.twitch.tv/videos/${vod.id}`)}" target="_blank" rel="noopener noreferrer">OUVRIR SUR TWITCH ↗</a>
            </div>
          </div>
        </article>`).join("");
      grid.querySelectorAll("[data-vod]").forEach((button) => button.addEventListener("click", () => playVod(button.dataset.vod)));
    } catch {
      status.innerHTML = '<strong>IMPOSSIBLE DE RÉCUPÉRER LES VOD</strong><span>La chaîne Twitch reste accessible directement.</span>';
    }
  }

  function playVod(id) {
    const wrap = document.getElementById("rd-vod-player");
    if (!wrap || !id) return;
    const frame = document.createElement("iframe");
    const url = new URL("https://player.twitch.tv/");
    url.searchParams.set("video", id);
    url.searchParams.set("parent", DOMAIN);
    if (location.hostname && location.hostname !== DOMAIN) url.searchParams.append("parent", location.hostname);
    url.searchParams.set("autoplay", "true");
    url.searchParams.set("muted", "false");
    frame.src = url.toString();
    frame.allow = "autoplay; fullscreen; picture-in-picture";
    frame.allowFullscreen = true;
    frame.title = "Rediffusion Twitch — RedDice";
    wrap.replaceChildren(frame);
    wrap.hidden = false;
    wrap.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function furiozLinks() {
    const footer = document.querySelector(".rd-footer, footer:not(.rd-legacy-footer)");
    if (!footer || document.getElementById("rd-furioz-links")) return;
    const box = document.createElement("section");
    box.id = "rd-furioz-links";
    box.className = "rd-furioz-links";
    box.setAttribute("aria-label", "Furioz Compagnie");
    box.innerHTML = `
      <div><strong>FURIOZ COMPAGNIE</strong><span>COLLECTIF // STREAM // COMMUNAUTÉ</span><p>Je fais partie de la Furioz Compagnie, un collectif de créateurs et de streamers qui partagent la même envie : jouer, créer et avancer ensemble.</p></div>
      <div class="rd-furioz-actions">
        <a href="${FURIOZ_TWITCH}" target="_blank" rel="noopener noreferrer">TWITCH ↗</a>
        <a href="${FURIOZ_DISCORD}" target="_blank" rel="noopener noreferrer">DISCORD ↗</a>
        <a href="${FURIOZ_SITE}" target="_blank" rel="noopener noreferrer">SITE OFFICIEL ↗</a>
      </div>`;
    footer.parentNode.insertBefore(box, footer);
  }

  function apply() {
    brandText();
    ageBadge();
    logoMain();
    bioPhoto();
    footerYear();
    makeVodSection();
    furiozLinks();
  }

  function start() {
    apply();
    const observer = new MutationObserver(() => apply());
    observer.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 20000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
