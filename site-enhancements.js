(() => {
  "use strict";

  const SITE = {
    domain: "reddicestream.com",
    twitch: "reddice_stream",
    pages: [
      ["Accueil", "index.html"],
      ["Bio", "bio.html"],
      ["Setup", "setup.html"],
      ["Mes jeux", "jeux.html"],
      ["Planning", "planning.html"],
      ["Livre d’or", "livre-or.html"],
      ["Contact", "contact.html"]
    ]
  };

  const PAGE_DATA = {
    "index.html": {
      code: "REDDICE // STREAM HUB",
      title: "Je suis <em>RedDice</em>.",
      copy: "Bienvenue dans mon univers. Je stream ce qui me passionne : du multigaming, des aventures qui marquent, des découvertes, du catch en réaction et surtout des moments à partager.",
      tags: ["MULTIGAMING", "IMMERSION", "COMMUNAUTÉ"],
      secondary: ["Voir mon planning", "planning.html"]
    },
    "bio.html": {
      code: "01 // IDENTITÉ DU JOUEUR",
      title: "Derrière <em>RedDice</em>, il y a Cédric.",
      copy: "Je suis Cédric. Ici, je te raconte qui je suis, ce qui m’anime et pourquoi le streaming est devenu mon terrain d’expression. Jeux vidéo, culture geek et Furioz Compagnie font partie de mon histoire.",
      tags: ["CÉDRIC", "STREAMER", "FURIOZ COMPAGNIE"],
      secondary: ["Découvrir mon setup", "setup.html"]
    },
    "setup.html": {
      code: "02 // MON ENVIRONNEMENT",
      title: "Mon setup, mon <em>cockpit</em>.",
      copy: "Je te montre le matériel qui m’accompagne pour jouer, créer et diffuser mes lives. Ma configuration évolue avec mes projets : je privilégie un espace fiable, pratique et adapté à mes usages.",
      tags: ["HARDWARE", "STREAMING", "CONFIGURATION"],
      secondary: ["Voir mes jeux", "jeux.html"]
    },
    "jeux.html": {
      code: "03 // MA BIBLIOTHÈQUE",
      title: "Je ne joue pas qu’à un seul <em>univers</em>.",
      copy: "Je passe d’un RPG à un jeu compétitif, d’une grande aventure à une découverte en live. Voici les titres qui composent ma bibliothèque et les mondes dans lesquels j’aime me perdre.",
      tags: ["RPG", "ACTION", "DÉCOUVERTES"],
      secondary: ["Me retrouver en live", "https://twitch.tv/reddice_stream"]
    },
    "planning.html": {
      code: "04 // PROCHAINS RENDEZ-VOUS",
      title: "On se retrouve <em>quand</em> ?",
      copy: "Je partage ici mes prochains lives, mes sessions spéciales et les rediffusions à retrouver. Le programme peut changer : je mets cette page à jour au fil de mes envies et de mes disponibilités.",
      tags: ["PROCHAINS LIVES", "SESSIONS SPÉCIALES", "VOD"],
      secondary: ["Voir ma chaîne Twitch", "https://twitch.tv/reddice_stream"]
    },
    "livre-or.html": {
      code: "05 // MESSAGES DE LA COMMUNAUTÉ",
      title: "Ton message a sa <em>place</em> ici.",
      copy: "Ce site, je le construis autour du partage. Laisse-moi un mot, un souvenir de live, une recommandation ou simplement un petit coucou : je prends le temps de vous lire.",
      tags: ["COMMUNAUTÉ", "SOUVENIRS", "ÉCHANGES"],
      secondary: ["Me contacter", "contact.html"]
    },
    "contact.html": {
      code: "06 // OUVRIR UN CANAL",
      title: "On a quelque chose à <em>se dire</em> ?",
      copy: "Une proposition, une collaboration, une question ou une idée de contenu ? Tu peux m’écrire directement depuis cette page. Je te répondrai dès que possible.",
      tags: ["COLLABORATION", "PROJET", "CONTACT"],
      secondary: ["Voir mon univers", "bio.html"]
    },
    "sitemap.html": {
      code: "07 // INDEX DU HUB",
      title: "Tous mes accès, au même <em>endroit</em>.",
      copy: "Je t’ai regroupé ici les différentes sections de mon espace. Tu peux passer de ma présentation à mon setup, parcourir mes jeux ou retrouver mes prochains rendez-vous.",
      tags: ["NAVIGATION", "RED DICE", "STREAM HUB"],
      secondary: ["Retour à l’accueil", "index.html"]
    },
    "404.html": {
      code: "SIGNAL PERDU // 404",
      title: "Cette page a quitté le <em>réseau</em>.",
      copy: "Je n’ai pas trouvé ce que tu cherches. Le reste de mon univers est toujours accessible depuis la navigation.",
      tags: ["ERREUR 404", "RETOUR AU HUB"],
      secondary: ["Retour à l’accueil", "index.html"]
    },
    "admin-tools.html": {
      code: "ADMIN // ACCÈS PRIVÉ",
      title: "Mon centre de <em>contrôle</em>.",
      copy: "Cette zone me permet de gérer les contenus du site. Elle est réservée à l’administration de RedDice.",
      tags: ["PLANNING", "MODÉRATION", "GESTION"],
      secondary: ["Retour au site", "index.html"]
    }
  };

  const TITLES = {
    "index.html": "RedDice — Accueil",
    "bio.html": "RedDice — Qui je suis",
    "setup.html": "RedDice — Mon setup",
    "jeux.html": "RedDice — Mes jeux",
    "planning.html": "RedDice — Mes prochains lives",
    "livre-or.html": "RedDice — Livre d’or",
    "contact.html": "RedDice — Contact",
    "admin.html": "RedDice — Administration",
    "admin-tools.html": "RedDice — Console de gestion",
    "sitemap.html": "RedDice — Plan du site",
    "404.html": "RedDice — Signal perdu"
  };

  const NAV_LABELS = new Set([
    "accueil", "home", "bio", "setup", "setup pcb rgb", "mes jeux", "jeux",
    "planning", "livre d'or", "livre d’or", "contact", "admin", "sitemap", "plan du site"
  ]);

  const normalise = (value) => String(value || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "'").replace(/\s+/g, " ").trim().toLowerCase();

  function currentPage() {
    const raw = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    const aliases = {
      "": "index.html", "bio": "bio.html", "setup": "setup.html", "jeux": "jeux.html",
      "planning": "planning.html", "contact": "contact.html", "livre-or": "livre-or.html",
      "sitemap": "sitemap.html", "404": "404.html"
    };
    return aliases[raw] || raw;
  }

  const PAGE = currentPage();

  function setMeta() {
    document.documentElement.lang = "fr";
    document.title = TITLES[PAGE] || "RedDice — reddicestream.com";
    document.documentElement.dataset.rdPage = PAGE.replace(/\.html$/, "") || "home";
    if (document.body) document.body.dataset.rdPage = PAGE.replace(/\.html$/, "") || "home";

    if (!document.querySelector('link[rel="canonical"]')) {
      const link = document.createElement("link");
      link.rel = "canonical";
      link.href = `https://${SITE.domain}${PAGE === "index.html" ? "/" : `/${PAGE}`}`;
      document.head.appendChild(link);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = "#06080d";
      document.head.appendChild(meta);
    }
  }

  function addSafeExternalLinks(scope = document) {
    scope.querySelectorAll?.('a[href^="http"]:not([data-rd-link-ready])').forEach((anchor) => {
      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) {
          anchor.target = "_blank";
          anchor.rel = "noopener noreferrer";
        }
        anchor.dataset.rdLinkReady = "1";
      } catch { /* Ignore malformed links. */ }
    });
  }

  function injectHeader() {
    const existing = [...document.querySelectorAll(".rd-header")];
    existing.slice(1).forEach((header) => header.remove());
    if (existing.length) return;

    const header = document.createElement("header");
    header.className = "rd-header";
    header.innerHTML = `
      <div class="rd-topline" aria-hidden="true"></div>
      <div class="rd-header-inner">
        <a class="rd-brand" href="./" aria-label="RedDice — accueil">
          <img src="assets/logo-main.png" alt="Logo RedDice" width="1600" height="1600" decoding="async">
          <span class="rd-brand-copy">
            <span class="rd-brand-name">REDDICE<span class="rd-brand-cursor">_</span></span>
            <span class="rd-brand-sub">STREAMER // MULTIGAMING</span>
          </span>
        </a>
        <button class="rd-menu-toggle" type="button" aria-expanded="false" aria-controls="rd-main-nav" aria-label="Ouvrir le menu">
          <span></span><span></span><span></span><b>MENU</b>
        </button>
        <nav class="rd-nav" id="rd-main-nav" aria-label="Navigation principale"></nav>
        <div class="rd-status" title="Navigation du site">
          <span class="rd-status-dot" aria-hidden="true"></span>
          <span>STREAM HUB</span>
        </div>
      </div>`;

    const nav = header.querySelector(".rd-nav");
    SITE.pages.forEach(([label, href], index) => {
      const anchor = document.createElement("a");
      anchor.href = href === "index.html" ? "./" : href;
      anchor.textContent = label;
      anchor.dataset.index = String(index + 1).padStart(2, "0");
      if (PAGE === href || (PAGE === "" && href === "index.html")) anchor.setAttribute("aria-current", "page");
      nav.appendChild(anchor);
    });

    const toggle = header.querySelector(".rd-menu-toggle");
    const closeMenu = () => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Ouvrir le menu");
      header.classList.remove("rd-menu-open");
    };
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      header.classList.toggle("rd-menu-open", open);
    });
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
    document.addEventListener("click", (event) => {
      if (!header.contains(event.target)) closeMenu();
    });
    document.body.insertBefore(header, document.body.firstChild);
  }

  function matchingNavigationLinks(element) {
    const links = [...element.querySelectorAll("a[href]")];
    const labels = new Set();
    links.forEach((anchor) => {
      const label = normalise(anchor.textContent);
      const href = (anchor.getAttribute("href") || "").split(/[?#]/)[0].toLowerCase();
      const knownHref = /(?:^|\/)(?:index|bio|setup|setup_v5_final|jeux|planning|livre-or|contact|admin|sitemap)(?:\.html)?$/.test(href);
      if (NAV_LABELS.has(label) || knownHref) labels.add(label || href);
    });
    return { links, labels };
  }

  function removeLegacyNavigation(scope) {
    if (!scope) return;
    const candidates = [...scope.querySelectorAll("nav, header, div, section")]
      .filter((element) => !element.closest(".rd-header, .rd-footer, footer, .rd-page-hero"))
      .map((element) => ({ element, ...matchingNavigationLinks(element) }))
      .filter(({ links, labels }) => links.length >= 5 && links.length <= 16 && labels.size >= 5 && labels.size / links.length >= 0.58)
      .sort((a, b) => {
        if (a.links.length !== b.links.length) return a.links.length - b.links.length;
        return a.element.querySelectorAll("*").length - b.element.querySelectorAll("*").length;
      });

    // Hide only the smallest link clusters that behave like the old page menus.
    const hidden = [];
    candidates.forEach(({ element }) => {
      if (hidden.some((other) => other.contains(element) || element.contains(other))) return;
      element.classList.add("rd-legacy-nav");
      element.setAttribute("aria-hidden", "true");
      hidden.push(element);
    });

    scope.querySelectorAll("footer").forEach((footer) => {
      if (!footer.closest(".rd-footer")) footer.classList.add("rd-legacy-footer");
    });
    scope.querySelectorAll(".hub-nav").forEach((nav) => nav.classList.add("rd-legacy-nav"));
  }

  function injectPageHero() {
    if (document.querySelector(".rd-page-hero")) return;
    const info = PAGE_DATA[PAGE];
    if (!info) return;

    const root = document.getElementById("root");
    const hero = document.createElement("section");
    hero.className = `rd-page-hero rd-hero-${PAGE.replace(/\.html$/, "")}`;
    hero.setAttribute("aria-label", info.code);
    const secondHref = info.secondary[1];
    const secondaryIsExternal = /^https?:/i.test(secondHref);
    hero.innerHTML = `
      <div class="rd-hero-gridline" aria-hidden="true"></div>
      <div class="rd-page-hero-copy">
        <div class="rd-page-hero-code"><span class="rd-page-hero-led"></span>${info.code}</div>
        <h1>${info.title}</h1>
        <p>${info.copy}</p>
        <div class="rd-page-hero-tags">${info.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
        <div class="rd-page-hero-actions">
          <a class="rd-hero-primary" href="https://twitch.tv/${SITE.twitch}" target="_blank" rel="noopener noreferrer">ME RETROUVER SUR TWITCH <span>↗</span></a>
          <a class="rd-hero-secondary" href="${secondHref}" ${secondaryIsExternal ? 'target="_blank" rel="noopener noreferrer"' : ""}>${info.secondary[0]} <span>→</span></a>
        </div>
      </div>
      <div class="rd-page-hero-aside" aria-hidden="true">
        <div class="rd-hero-orbit"><span>RD</span><i></i><b></b></div>
        <div class="rd-hero-aside-code">REDDICE <small>// PLAYER PROFILE</small></div>
        <div class="rd-hero-meter"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
        <div class="rd-hero-aside-foot"><span>CHANNEL</span><strong>REDDICE_STREAM</strong></div>
      </div>`;

    if (root) root.parentNode.insertBefore(hero, root);
    else {
      const header = document.querySelector(".rd-header");
      if (header && header.parentNode) header.parentNode.insertBefore(hero, header.nextSibling);
      else {
        const target = document.querySelector(".keystone-frame") || document.body.firstElementChild;
        if (target) target.parentNode.insertBefore(hero, target);
        else document.body.appendChild(hero);
      }
    }
  }

  function injectFooter() {
    const existing = [...document.querySelectorAll(".rd-footer")];
    existing.slice(1).forEach((footer) => footer.remove());
    if (existing.length) return;

    const footer = document.createElement("footer");
    footer.className = "rd-footer";
    footer.innerHTML = `
      <div class="rd-footer-inner">
        <div class="rd-footer-brand">
          <div class="rd-footer-name">REDDICE <span>// STREAM HUB</span></div>
          <div class="rd-footer-meta">© ${new Date().getFullYear()} CÉDRIC · REDDICE · FURIOZ COMPAGNIE</div>
          <p>Je joue, je découvre, je partage. L’immersion ou rien.</p>
        </div>
        <div class="rd-footer-links">
          <a href="./">Accueil</a><a href="bio.html">Bio</a><a href="setup.html">Setup</a>
          <a href="jeux.html">Mes jeux</a><a href="planning.html">Planning</a>
          <a href="livre-or.html">Livre d’or</a><a href="contact.html">Contact</a>
          <a href="sitemap.html">Plan du site</a>
        </div>
        <a class="rd-footer-twitch" href="https://twitch.tv/${SITE.twitch}" target="_blank" rel="noopener noreferrer">RETROUVE-MOI SUR TWITCH <span>↗</span></a>
      </div>
      <div class="rd-footer-accent" aria-hidden="true"></div>`;
    document.body.appendChild(footer);
  }

  function fixBioPhoto() {
    const img = document.querySelector('#root img[src$="bio-photo.png"]');
    if (!img || img.dataset.rdPhotoFixed) return;
    img.dataset.rdPhotoFixed = "1";
    img.alt = "RedDice — Cédric";
    img.width = 1080;
    img.height = 1080;
    img.loading = "eager";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.minHeight = "0";
    img.style.objectFit = "contain";
    img.style.objectPosition = "center";
    let frame = img.parentElement;
    while (frame && frame !== document.body) {
      const cls = String(frame.className || "");
      if (cls.includes("overflow-hidden")) {
        frame.classList.add("rd-bio-photo-frame");
        break;
      }
      frame = frame.parentElement;
    }
  }

  function fixTwitchPlayers(scope = document) {
    scope.querySelectorAll?.('iframe[src*="twitch.tv"]:not([data-rd-twitch-ready])').forEach((iframe) => {
      try {
        const src = new URL(iframe.getAttribute("src"), window.location.href);
        const isPlayer = src.hostname === "player.twitch.tv";
        const expectedParents = [...new Set([SITE.domain, window.location.hostname].filter(Boolean))];
        const existingParents = src.searchParams.getAll("parent");
        let changed = false;

        if (isPlayer && src.searchParams.get("channel") !== SITE.twitch) {
          src.searchParams.set("channel", SITE.twitch);
          changed = true;
        }
        if (isPlayer && !src.searchParams.has("muted")) {
          src.searchParams.set("muted", "true");
          changed = true;
        }
        if (isPlayer && !src.searchParams.has("autoplay")) {
          src.searchParams.set("autoplay", "false");
          changed = true;
        }
        if (expectedParents.some((parent) => !existingParents.includes(parent)) ||
            existingParents.some((parent) => !expectedParents.includes(parent))) {
          src.searchParams.delete("parent");
          expectedParents.forEach((parent) => src.searchParams.append("parent", parent));
          changed = true;
        }

        if (changed) iframe.src = src.toString();
        iframe.dataset.rdTwitchReady = "1";
        iframe.setAttribute("allow", "autoplay; fullscreen; picture-in-picture");
        iframe.setAttribute("allowfullscreen", "true");
        iframe.setAttribute("title", isPlayer ? "Lecteur Twitch — RedDice" : "Chat Twitch — RedDice");
      } catch { /* Leave unsupported Twitch URLs untouched. */ }
    });
  }

  function enhanceContent(root) {
    if (!root) return;
    root.classList.add("rd-app-content");
    const pageClass = `rd-content-${PAGE.replace(/\.html$/, "")}`;
    root.classList.add(pageClass);

    root.querySelectorAll("h1,h2,h3").forEach((heading) => heading.classList.add("rd-heading-enhanced"));
    root.querySelectorAll('button, input[type="submit"], input[type="button"]').forEach((control) => control.classList.add("rd-control-enhanced"));

    const cards = root.querySelectorAll('article, [class*="border-[#"], [class*="border-white/"], [class*="border-cyan"], [class*="border-red"], [class*="rounded-xl"], [class*="rounded-lg"]');
    cards.forEach((card) => {
      if (card.closest(".rd-legacy-nav, footer")) return;
      const text = (card.textContent || "").trim();
      if (text.length > 20 && text.length < 1800) card.classList.add("rd-card-enhanced");
    });
  }

  function revealSections(root) {
    if (!root || !("IntersectionObserver" in window)) return;
    const targets = root.querySelectorAll("section, article, .rd-card-enhanced");
    if (!targets.length) return;
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("rd-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06, rootMargin: "0px 0px -20px 0px" });
    targets.forEach((element) => {
      if (!element.classList.contains("rd-reveal")) {
        element.classList.add("rd-reveal");
        observer.observe(element);
      }
    });
  }

  function addScrollProgress() {
    if (document.querySelector(".rd-scroll-progress")) return;
    const bar = document.createElement("div");
    bar.className = "rd-scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  function smoothNavigation() {
    document.addEventListener("click", (event) => {
      const link = event.target.closest?.('a[href]');
      if (!link || event.defaultPrevented || link.target === "_blank" || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const href = link.getAttribute("href") || "";
      if (!href || href.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(href)) return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
          document.getElementById("root")?.classList.add("rd-page-leave");
        }
      } catch { /* Ignore invalid links. */ }
    }, true);
  }

  function start() {
    setMeta();
    injectHeader();
    injectPageHero();
    injectFooter();
    addScrollProgress();
    addSafeExternalLinks();
    smoothNavigation();

    const root = document.getElementById("root");
    const scope = root || document.body;
    const apply = () => {
      removeLegacyNavigation(scope);
      addSafeExternalLinks(scope);
      fixBioPhoto();
      fixTwitchPlayers(scope);
      enhanceContent(root);
      revealSections(root);
    };
    apply();

    if (root) {
      const observer = new MutationObserver(() => apply());
      observer.observe(root, { childList: true, subtree: true });
      window.setTimeout(() => observer.disconnect(), 30000);
    } else {
      removeLegacyNavigation(document.body);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
