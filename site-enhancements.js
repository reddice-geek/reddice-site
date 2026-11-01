(() => {
  "use strict";

  const SITE = {
    name: "RedDice",
    domain: "reddicestream.com",
    twitch: "reddice_stream",
    pages: [
      ["Accueil", "index.html"],
      ["Bio", "bio.html"],
      ["Setup", "setup.html"],
      ["Jeux", "jeux.html"],
      ["Planning", "planning.html"],
      ["Livre d’or", "livre-or.html"],
      ["Contact", "contact.html"]
    ]
  };

  const TITLES = {
    "": "RedDice — Streamer multigaming",
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

  const PERSONAL_INTROS = {
    "bio.html": {
      code: "01 / PROFIL PERSONNEL",
      title: "Moi, c’est <em>RedDice</em>.",
      copy: "Je m’appelle Cédric. En ligne, je partage mon univers : le streaming, le multigaming, les jeux qui me passionnent, les découvertes et les moments de réaction. J’ai aussi fondé la Furioz Compagnie pour faire vivre un collectif de streamers.",
      chips: ["STREAMER", "MULTIGAMING", "FURIOZ COMPAGNIE"]
    },
    "setup.html": {
      code: "02 / MON ESPACE DE JEU",
      title: "Mon <em>setup</em>, mon terrain de jeu.",
      copy: "Je te présente le matériel que j’utilise pour jouer et créer mes lives. Ma configuration évolue avec mes besoins, les jeux auxquels je joue et les projets que je prépare.",
      chips: ["HARDWARE", "STREAMING", "CONFIGURATION"]
    },
    "jeux.html": {
      code: "03 / MA BIBLIOTHÈQUE",
      title: "Les jeux qui composent mon <em>univers</em>.",
      copy: "Je suis multigaming : je passe d’un univers à l’autre selon mes envies, entre RPG, expériences immersives, jeux compétitifs et découvertes en live. Ma bibliothèque évolue au fil de mes parties et de mes prochaines envies de stream.",
      chips: ["RPG", "DÉCOUVERTES", "MULTIGAMING"]
    },
    "planning.html": {
      code: "04 / RENDEZ-VOUS EN DIRECT",
      title: "Voici mon <em>planning</em>.",
      copy: "Je partage ici mes prochaines sessions, mes soirées spéciales et les rendez-vous de la communauté. Mon programme peut évoluer : repasse vérifier cette page avant le live pour retrouver les dernières informations.",
      chips: ["PROCHAINS LIVES", "SESSIONS SPÉCIALES", "REDIFFUSIONS"]
    }
  };

  function currentPage() {
    const path = (window.location.pathname.split("/").pop() || "").toLowerCase();
    const aliases = {
      "": "index.html", "bio": "bio.html", "setup": "setup.html",
      "jeux": "jeux.html", "planning": "planning.html", "contact": "contact.html",
      "livre-or": "livre-or.html", "admin": "admin.html", "sitemap": "sitemap.html",
      "404": "404.html"
    };
    return aliases[path] || path;
  }

  const PAGE = currentPage();

  function setMeta() {
    document.documentElement.lang = "fr";
    document.title = TITLES[PAGE] || "RedDice — reddicestream.com";
    document.documentElement.dataset.rdPage = PAGE.replace(/\.html$/, "") || "home";

    if (!document.querySelector('link[rel="canonical"]')) {
      const link = document.createElement("link");
      link.rel = "canonical";
      link.href = `https://${SITE.domain}${PAGE && PAGE !== "index.html" ? `/${PAGE}` : "/"}`;
      document.head.appendChild(link);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = "#070a10";
      document.head.appendChild(meta);
    }
  }

  function addSafeExternalLinks(scope = document) {
    scope.querySelectorAll?.('a[href^="http"]:not([data-rd-link-ready])').forEach((a) => {
      try {
        const url = new URL(a.href, window.location.href);
        if (url.origin !== window.location.origin) {
          a.target = "_blank";
          a.rel = "noopener noreferrer";
        }
        a.dataset.rdLinkReady = "1";
      } catch { /* Ignore malformed links. */ }
    });
  }

  function injectHeader() {
    if (document.querySelector(".rd-header")) return;

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
          <span></span><span></span><span></span>
          <b>MENU</b>
        </button>
        <nav class="rd-nav" id="rd-main-nav" aria-label="Navigation principale"></nav>
        <div class="rd-status" title="Site disponible">
          <span class="rd-status-dot" aria-hidden="true"></span>
          <span>SIGNAL STABLE</span>
        </div>
      </div>`;

    const nav = header.querySelector(".rd-nav");
    for (const [index, [label, href]] of SITE.pages.entries()) {
      const a = document.createElement("a");
      a.href = href === "index.html" ? "./" : href;
      a.textContent = label;
      a.dataset.index = String(index + 1).padStart(2, "0");
      if (PAGE === href || (PAGE === "" && href === "index.html")) {
        a.setAttribute("aria-current", "page");
      }
      nav.appendChild(a);
    }

    const toggle = header.querySelector(".rd-menu-toggle");
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      header.classList.toggle("rd-menu-open", open);
    });
    nav.addEventListener("click", (event) => {
      if (!event.target.closest("a")) return;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Ouvrir le menu");
      header.classList.remove("rd-menu-open");
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Ouvrir le menu");
        header.classList.remove("rd-menu-open");
      }
    });

    document.body.insertBefore(header, document.body.firstChild);
  }

  function markLegacyChrome(root = document.getElementById("root")) {
    if (!root) return;
    const required = ["bio.html", "setup.html", "jeux.html", "planning.html", "livre-or.html", "contact.html"];
    const candidates = [...root.querySelectorAll("nav, div, header")].map((element) => {
      const links = [...element.querySelectorAll("a[href]")];
      const hrefs = links.map((link) => (link.getAttribute("href") || "").toLowerCase().split(/[?#]/)[0]);
      const containsCoreLinks = required.every((href) => hrefs.some((value) => value.endsWith(href)));
      return { element, count: links.length, containsCoreLinks };
    }).filter((item) => item.containsCoreLinks && item.count >= 6 && item.count <= 12);

    // The original exports do not use a consistent element for navigation:
    // some pages use <nav>, others use a sticky <div>. Hide the smallest shared link group.
    candidates.sort((a, b) => a.count - b.count);
    if (candidates.length) {
      let legacy = candidates[0].element;
      const parent = legacy.parentElement;
      if (parent && parent.children.length === 1 && parent.querySelectorAll("a[href]").length === candidates[0].count) legacy = parent;
      legacy.classList.add("rd-legacy-nav");
    }
    root.querySelectorAll("footer").forEach((footer) => footer.classList.add("rd-legacy-footer"));
  }

  function injectPersonalIntro() {
    const intro = PERSONAL_INTROS[PAGE];
    const root = document.getElementById("root");
    if (!intro || !root || !root.childElementCount || document.querySelector(".rd-personal-intro")) return;

    const section = document.createElement("section");
    section.className = "rd-personal-intro";
    section.setAttribute("aria-label", intro.code);
    section.innerHTML = `
      <div class="rd-personal-main">
        <div class="rd-personal-kicker"><span class="rd-personal-dot"></span>${intro.code}</div>
        <h1>${intro.title}</h1>
        <p>${intro.copy}</p>
        <div class="rd-personal-chips">${intro.chips.map((chip) => `<span>${chip}</span>`).join("")}</div>
      </div>
      <div class="rd-personal-side" aria-hidden="true">
        <span class="rd-personal-side-label">PLAYER PROFILE</span>
        <strong>RD<span>//</span>01</strong>
        <span class="rd-personal-side-line"></span>
        <span class="rd-personal-side-status">IDENTITY VERIFIED</span>
      </div>`;
    root.parentNode.insertBefore(section, root);
  }

  function injectFooter() {
    if (document.querySelector(".rd-footer")) return;
    const footer = document.createElement("footer");
    footer.className = "rd-footer";
    footer.innerHTML = `
      <div class="rd-footer-inner">
        <div class="rd-footer-brand">
          <div class="rd-footer-name">REDDICE <span>// STREAM HUB</span></div>
          <div class="rd-footer-meta">© ${new Date().getFullYear()} CÉDRIC · REDDICE · FURIOZ COMPAGNIE</div>
        </div>
        <div class="rd-footer-links">
          <a href="./">Accueil</a><a href="bio.html">Bio</a><a href="setup.html">Setup</a>
          <a href="jeux.html">Mes jeux</a><a href="planning.html">Planning</a>
          <a href="livre-or.html">Livre d’or</a><a href="contact.html">Contact</a>
          <a href="sitemap.html">Plan du site</a>
        </div>
        <a class="rd-footer-twitch" href="https://twitch.tv/reddice_stream">RETROUVE-MOI SUR TWITCH <span>↗</span></a>
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

  // Twitch's player reloads whenever its src is assigned. Only correct it when needed.
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

  function revealSections(root) {
    if (!root || !("IntersectionObserver" in window)) return;
    const targets = root.querySelectorAll("main > section, main > div > section, main article");
    if (!targets.length) return;
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("rd-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
    targets.forEach((element) => {
      if (!element.classList.contains("rd-reveal")) {
        element.classList.add("rd-reveal");
        observer.observe(element);
      }
    });
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
    injectFooter();
    addSafeExternalLinks();
    smoothNavigation();

    const root = document.getElementById("root");
    if (!root) return;

    const applyToRoot = () => {
      markLegacyChrome(root);
      addSafeExternalLinks(root);
      fixBioPhoto();
      fixTwitchPlayers(root);
      injectPersonalIntro();
      revealSections(root);
    };
    applyToRoot();

    const observer = new MutationObserver(() => applyToRoot());
    observer.observe(root, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 20000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
