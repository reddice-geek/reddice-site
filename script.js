document.addEventListener("DOMContentLoaded", async () => {
  await safeRun(initReveal);
  await safeRun(initActiveNav);
  await safeRun(initTwitchEmbeds);
  await safeRun(initStreamStatus);
  await safeRun(initPlanningSync);
  await safeRun(initGuestbook);
  await safeRun(initContactDraft);
  await safeRun(setCurrentYear);
});

function safeRun(fn) {
  return Promise.resolve()
    .then(() => fn())
    .catch((error) => {
      console.error(`Erreur dans ${fn.name}:`, error);
    });
}

function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, { threshold: 0.12 });

  items.forEach((item) => observer.observe(item));
}

function initActiveNav() {
  const page = document.body.dataset.page;
  if (!page) return;

  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === page) {
      link.classList.add("active");
    }
  });
}

function initTwitchEmbeds() {
  const player = document.getElementById("twitch-player");
  const chat = document.getElementById("twitch-chat");
  const warning = document.getElementById("embed-warning");

  if (!player || !chat) return;

  const host = window.location.hostname;

  if (!host) {
    if (warning) warning.style.display = "block";
    return;
  }

  const parent = encodeURIComponent(host);
  player.src = `https://player.twitch.tv/?channel=reddice_stream&parent=${parent}&muted=true`;
  chat.src = `https://www.twitch.tv/embed/reddice_stream/chat?parent=${parent}`;
}

async function initStreamStatus() {
  const badges = document.querySelectorAll("[data-stream-status]");
  if (!badges.length) return;

  const login = "reddice_stream";

  const setState = (state, text) => {
    badges.forEach((badge) => {
      badge.classList.remove("is-loading", "is-live", "is-offline", "is-error");
      badge.classList.add(state);
      badge.textContent = text;
    });
  };

  const refresh = async () => {
    setState("is-loading", "Checking");

    try {
      const url = new URL("/api/twitch-status", window.location.origin);
      url.searchParams.set("login", login);
      url.searchParams.set("_", String(Date.now()));

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { "Accept": "application/json" },
        cache: "no-store"
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status} ${errorText}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const rawText = await response.text().catch(() => "");
        throw new Error(`Réponse non JSON: ${rawText.slice(0, 120)}`);
      }

      const data = await response.json();
      const isLive = data?.live === true || data?.live === "true" || data?.live === 1;

      if (isLive) {
        setState("is-live", "Stream On");
      } else {
        setState("is-offline", "Stream Off");
      }
    } catch (error) {
      console.error("Erreur Twitch status:", error);
      setState("is-error", "Unknown");
    }
  };

  await refresh();
  window.setInterval(refresh, 60000);
}

async function initPlanningSync() {
  const statusNode = document.getElementById("planning-status");
  const summaryNode = document.getElementById("planning-summary");
  const streamsNode = document.getElementById("planning-streams");
  const daysNode = document.getElementById("planning-days");

  if (!statusNode || !summaryNode || !streamsNode || !daysNode) return;

  const dayNames = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi"
  ];

  const formatDate = (iso) => {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(d);
  };

  const parseDurationToMinutes = (duration) => {
    if (!duration) return 0;
    const h = duration.match(/(\d+)h/i);
    const m = duration.match(/(\d+)m/i);
    const s = duration.match(/(\d+)s/i);

    const hours = h ? Number(h[1]) : 0;
    const minutes = m ? Number(m[1]) : 0;
    const seconds = s ? Number(s[1]) : 0;

    return (hours * 60) + minutes + Math.round(seconds / 60);
  };

  const formatMinutes = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  };

  const renderEmpty = (text) => {
    streamsNode.innerHTML = `<div class="planning-empty">${text}</div>`;
    summaryNode.innerHTML = "";
    daysNode.innerHTML = "";
  };

  try {
    statusNode.textContent = "Synchronisation des streams...";
    const response = await fetch("/api/twitch-history?login=reddice_stream", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Impossible de charger l’historique Twitch");
    }

    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];

    if (!items.length) {
      statusNode.textContent = "Aucun stream archivé trouvé pour le moment.";
      renderEmpty("Aucun stream archivé trouvé.");
      return;
    }

    const totalStreams = items.length;
    const totalMinutes = items.reduce((sum, item) => sum + parseDurationToMinutes(item.duration), 0);
    const lastStreamDate = items[0]?.created_at ? formatDate(items[0].created_at) : "—";

    summaryNode.innerHTML = `
      <article class="card reveal visible">
        <h3>Streams récupérés</h3>
        <p>${totalStreams} session${totalStreams > 1 ? "s" : ""}</p>
      </article>
      <article class="card reveal visible">
        <h3>Durée totale</h3>
        <p>${formatMinutes(totalMinutes)}</p>
      </article>
      <article class="card reveal visible">
        <h3>Dernier live</h3>
        <p>${lastStreamDate}</p>
      </article>
    `;

    streamsNode.innerHTML = "";
    items.forEach((item) => {
      const article = document.createElement("article");
      article.className = "creation-card reveal visible";

      article.innerHTML = `
        <div class="creation-thumb">Stream archive</div>
        <h3>${escapeHtml(item.title || "Stream")}</h3>
        <div class="planning-meta">
          <span class="mini-chip">${escapeHtml(formatDate(item.created_at))}</span>
          <span class="mini-chip">${escapeHtml(item.duration || "—")}</span>
          <span class="mini-chip">${Number(item.view_count || 0)} vue${Number(item.view_count || 0) > 1 ? "s" : ""}</span>
        </div>
        <p>${escapeHtml(item.description || "Session archivée sur Twitch.")}</p>
        <a class="ghost-btn planning-link" href="${item.url}" target="_blank">Voir la VOD</a>
      `;

      streamsNode.appendChild(article);
    });

    const counts = [0, 0, 0, 0, 0, 0, 0];
    items.forEach((item) => {
      const d = new Date(item.created_at);
      counts[d.getDay()] += 1;
    });

    const maxCount = Math.max(...counts, 1);

    daysNode.innerHTML = "";
    dayNames.forEach((day, index) => {
      const count = counts[index];
      const width = `${(count / maxCount) * 100}%`;

      const article = document.createElement("article");
      article.className = "card day-card reveal visible";
      article.innerHTML = `
        <strong>${day}</strong>
        <div class="day-line"><span style="width:${width};"></span></div>
        <p>${count} stream${count > 1 ? "s" : ""}</p>
      `;
      daysNode.appendChild(article);
    });

    statusNode.textContent = "Historique Twitch synchronisé.";
  } catch (error) {
    console.error("Erreur planning sync:", error);
    statusNode.textContent = "Impossible de synchroniser l’historique pour le moment.";
    renderEmpty("Synchronisation indisponible.");
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function initGuestbook() {
  const form = document.getElementById("guestbook-form");
  const list = document.getElementById("guestbook-list");
  const clearBtn = document.getElementById("guestbook-clear");

  if (!form || !list) return;

  const STORAGE_KEY = "reddice_guestbook_entries";

  const seedEntries = [
    {
      name: "Visiteur du Nexus",
      title: "Belle ambiance",
      message: "Le style du site colle super bien à l’univers stream.",
      date: new Date().toISOString()
    },
    {
      name: "Crew Member",
      title: "Force à toi",
      message: "Le mix gaming, cosplay et cyberpunk te correspond vraiment bien.",
      date: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  function loadEntries() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedEntries));
      return seedEntries;
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveEntries(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  function formatDate(isoDate) {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(date);
  }

  function renderEntries() {
    const entries = loadEntries().slice().reverse();
    list.innerHTML = "";

    if (!entries.length) {
      const empty = document.createElement("div");
      empty.className = "entry-empty";
      empty.textContent = "Aucun message pour le moment.";
      list.appendChild(empty);
      return;
    }

    entries.forEach((entry) => {
      const card = document.createElement("article");
      card.className = "entry-card reveal visible";

      const meta = document.createElement("div");
      meta.className = "entry-meta";

      const name = document.createElement("strong");
      name.textContent = entry.name || "Anonyme";

      const date = document.createElement("small");
      date.textContent = formatDate(entry.date);

      const title = document.createElement("h4");
      title.textContent = entry.title || "Message";

      const message = document.createElement("p");
      message.textContent = entry.message || "";

      meta.appendChild(name);
      meta.appendChild(date);

      card.appendChild(meta);
      card.appendChild(title);
      card.appendChild(message);

      list.appendChild(card);
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const title = String(formData.get("title") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!name || !message) return;

    const entries = loadEntries();
    entries.push({
      name,
      title: title || "Message du livre d’or",
      message,
      date: new Date().toISOString()
    });

    saveEntries(entries);
    form.reset();
    renderEntries();
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedEntries));
      renderEntries();
    });
  }

  renderEntries();
}

function initContactDraft() {
  const form = document.getElementById("contact-draft-form");
  const output = document.getElementById("contact-draft-output");
  const copyBtn = document.getElementById("contact-draft-copy");

  if (!form || !output) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const subject = String(formData.get("subject") || "").trim();
    const channel = String(formData.get("channel") || "").trim();
    const message = String(formData.get("message") || "").trim();

    const text = [
      `Pseudo : ${name || "-"}`,
      `Sujet : ${subject || "-"}`,
      `Canal souhaité : ${channel || "-"}`,
      "",
      "Message :",
      message || "-"
    ].join("\n");

    output.value = text;
    output.hidden = false;

    if (copyBtn) {
      copyBtn.hidden = false;
    }
  });

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(output.value);
        copyBtn.textContent = "Copié";
        setTimeout(() => {
          copyBtn.textContent = "Copier";
        }, 1500);
      } catch {
        copyBtn.textContent = "Impossible";
      }
    });
  }
}

function setCurrentYear() {
  const yearNode = document.getElementById("current-year");
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }
}
