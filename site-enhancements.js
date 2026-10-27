(() => {
  "use strict";

  const SITE = {
    name: "Reddice",
    domain: "reddicestream.com",
    twitch: "reddice_stream",
    pages: [
      ["Accueil", "index.html"],
      ["Bio", "bio.html"],
      ["Setup", "setup.html"],
      ["Jeux", "jeux.html"],
      ["Planning", "planning.html"],
      ["Livre d’or", "livre-or.html"],
      ["Contact", "contact.html"],
      ["Admin", "admin.html"],
      ["Sitemap", "sitemap.html"]
    ]
  };

  const TITLES = {
    "": "Reddice — Streamer & Créateur",
    "index.html": "Reddice — Accueil",
    "bio.html": "Reddice — Bio",
    "setup.html": "Reddice — Setup PCB RGB",
    "jeux.html": "Reddice — Jeux",
    "planning.html": "Reddice — Planning",
    "livre-or.html": "Reddice — Livre d’or",
    "contact.html": "Reddice — Contact",
    "admin.html": "Reddice — Admin",
    "sitemap.html": "Reddice — Sitemap",
    "404.html": "Reddice — 404"
  };

  function currentPage() {
    const path = (window.location.pathname.split("/").pop() || "").toLowerCase();
    const aliases = {
      "": "index.html",
      "index.html": "index.html",
      "bio": "bio.html",
      "setup": "setup.html",
      "jeux": "jeux.html",
      "planning": "planning.html",
      "livre-or": "livre-or.html",
      "contact": "contact.html",
      "admin": "admin.html",
      "sitemap": "sitemap.html",
      "404": "404.html"
    };
    return aliases[path] || path;
  }

  function setMeta() {
    document.documentElement.lang = "fr";
    const page = currentPage();
    document.title = TITLES[page] || "Reddice — reddicestream.com";

    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (!existingCanonical) {
      const link = document.createElement("link");
      link.rel = "canonical";
      link.href = `${window.location.protocol === "file:" ? "https" : window.location.protocol}//${SITE.domain}${page && page !== "index.html" && page !== "" ? `/${page}` : "/"}`;
      document.head.appendChild(link);
    }

    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = "#05070A";
      document.head.appendChild(meta);
    }
  }

  function fixLegacyLinks(scope = document) {
    scope.querySelectorAll?.("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (!href) return;

      if (href === "setup_v5_final.html") a.setAttribute("href", "setup.html");
      const lower = a.getAttribute("href").toLowerCase();
      if (lower === "index.html") a.setAttribute("href", "./");

      try {
        const url = new URL(a.href, window.location.href);
        const isExternal = /^https?:$/.test(url.protocol) && url.host !== window.location.host;
        if (isExternal) {
          a.target = "_blank";
          a.rel = "noopener noreferrer";
        }
      } catch {
        // Ignore malformed/non-URL anchors.
      }
    });
  }

  function injectHeader() {
    if (document.querySelector(".rd-header")) return;

    const header = document.createElement("header");
    header.className = "rd-header";
    header.innerHTML = `
      <div class="rd-topline" aria-hidden="true"></div>
      <div class="rd-header-inner">
        <a class="rd-brand" href="./" aria-label="Reddice — accueil">
          <img src="assets/logo-main.png" alt="Reddice" width="1600" height="1600" decoding="async">
          <span class="rd-brand-copy">
            <span class="rd-brand-name">REDDICE</span>
            <span class="rd-brand-sub">STREAM HUB // REDDICESTREAM.COM</span>
          </span>
        </a>
        <nav class="rd-nav" aria-label="Navigation principale"></nav>
        <div class="rd-status" title="Site en ligne">
          <span class="rd-status-dot" aria-hidden="true"></span>
          ONLINE
        </div>
      </div>
    `;

    const nav = header.querySelector(".rd-nav");
    const page = currentPage();
    for (const [label, href] of SITE.pages) {
      const a = document.createElement("a");
      a.href = href === "index.html" ? "./" : href;
      a.textContent = label;
      const current = page === href || (page === "" && href === "index.html");
      if (current) {
        a.setAttribute("aria-current", "page");
      }
      nav.appendChild(a);
    }

    document.body.insertBefore(header, document.body.firstChild);
  }

  function markLegacyChrome() {
    const root = document.getElementById("root");
    if (!root) return;

    root.querySelectorAll("nav").forEach((nav) => {
      if (nav.classList.contains("rd-nav")) return;
      const links = [...nav.querySelectorAll("a[href]")].map((a) => (a.getAttribute("href") || "").toLowerCase());
      const mainNav = links.some((href) => /(^|\/)bio\.html$/.test(href)) && links.some((href) => /(^|\/)planning\.html$/.test(href));
      if (mainNav) nav.classList.add("rd-legacy-nav");
    });

    root.querySelectorAll("footer").forEach((footer) => footer.classList.add("rd-legacy-footer"));
  }

  function injectFooter() {
    if (document.querySelector(".rd-footer")) return;
    const year = new Date().getFullYear();
    const footer = document.createElement("footer");
    footer.className = "rd-footer";
    footer.innerHTML = `
      <div class="rd-footer-inner">
        <div class="rd-footer-brand">
          <div class="rd-footer-name">REDDICE // STREAM HUB</div>
          <div class="rd-footer-meta">© ${year} REDDICE • FURIOZ COMPAGNIE // INC. • ${SITE.domain}</div>
        </div>
        <div class="rd-footer-links">
          <a href="./">Accueil</a>
          <a href="bio.html">Bio</a>
          <a href="setup.html">Setup</a>
          <a href="jeux.html">Jeux</a>
          <a href="planning.html">Planning</a>
          <a href="livre-or.html">Livre d’or</a>
          <a href="contact.html">Contact</a>
          <a href="https://twitch.tv/reddice_stream">Twitch</a>
        </div>
      </div>
      <div class="rd-footer-accent" aria-hidden="true"></div>
    `;
    document.body.appendChild(footer);
  }

  function fixBioPhoto() {
    const img = document.querySelector('img[src$="bio-photo.png"]');
    if (!img) return;

    img.alt = "Reddice — Cédric";
    img.width = 1080;
    img.height = 1080;
    img.loading = "eager";

    let frame = img.parentElement;
    while (frame && frame !== document.body) {
      const cls = String(frame.className || "");
      if (cls.includes("flex-1") && cls.includes("overflow-hidden")) {
        frame.classList.add("rd-bio-photo-frame");
        break;
      }
      frame = frame.parentElement;
    }
  }

  function fixTwitchPlayers() {
    const embeds = document.querySelectorAll('iframe[src*="twitch.tv"]');
    if (!embeds.length) return;

    const parent = window.location.hostname || SITE.domain;

    embeds.forEach((iframe) => {
      try {
        const src = new URL(iframe.src);
        const isPlayer = src.hostname === "player.twitch.tv";
        src.searchParams.delete("parent");
        src.searchParams.append("parent", parent);
        if (isPlayer) {
          src.searchParams.set("channel", SITE.twitch);
          src.searchParams.set("muted", "true");
          src.searchParams.set("autoplay", "false");
        }
        iframe.src = src.toString();
      } catch {
        const fallback = iframe.src.includes("/embed/")
          ? `https://www.twitch.tv/embed/${SITE.twitch}/chat?parent=${encodeURIComponent(parent)}&darkpopout`
          : `https://player.twitch.tv/?channel=${SITE.twitch}&parent=${encodeURIComponent(parent)}&muted=true&autoplay=false`;
        iframe.src = fallback;
      }

      iframe.setAttribute("allow", "autoplay; fullscreen; picture-in-picture");
      iframe.setAttribute("allowfullscreen", "true");
      if (iframe.src.includes("player.twitch.tv")) {
        iframe.setAttribute("title", "Lecteur Twitch — Reddice");
      } else if (iframe.src.includes("twitch.tv/embed/")) {
        iframe.setAttribute("title", "Chat Twitch — Reddice");
      }
    });
  }

  function smoothNavigation() {
    document.addEventListener("click", (event) => {
      const link = event.target.closest?.("a[href]");
      if (!link) return;
      if (event.defaultPrevented) return;
      if (link.target === "_blank" || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const href = link.getAttribute("href") || "";
      if (!href || href.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(href)) return;

      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.hash) return;
        document.getElementById("root")?.classList.add("rd-page-leave");
      } catch {
        // Ignore.
      }
    }, true);
  }

  function apply() {
    setMeta();
    injectHeader();
    markLegacyChrome();
    fixLegacyLinks();
    fixBioPhoto();
    fixTwitchPlayers();
    injectFooter();
    document.getElementById("root")?.classList.add("rd-page-enter");
  }

  function start() {
    apply();

    const root = document.getElementById("root");
    if (root) {
      const observer = new MutationObserver(() => {
        markLegacyChrome();
        fixLegacyLinks(root);
        fixBioPhoto();
        fixTwitchPlayers();
      });
      observer.observe(root, { childList: true, subtree: true });
      window.setTimeout(() => observer.disconnect(), 15000);
    }

    smoothNavigation();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
