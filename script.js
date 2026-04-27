document.addEventListener("DOMContentLoaded", async () => {
  await safeRun(initReveal);
  await safeRun(initActiveNav);
  await safeRun(initTwitchEmbeds);
  await safeRun(initStreamStatus);
  await safeRun(initPlanningSync);
  await safeRun(initGuestbook);
  await safeRun(initContactForm);
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
  }, { threshold: 0.1 });

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
  const playerSrc = `https://player.twitch.tv/?channel=reddice_stream&parent=${parent}&muted=true`;
  const chatSrc = `https://www.twitch.tv/embed/reddice_stream/chat?parent=${parent}`;

  player.src = playerSrc;

  window.setTimeout(() => {
    chat.src = chatSrc;
  }, 350);
}

async function initStreamStatus() {
  const badges = document.querySelectorAll("[data-stream-status]");
  if (!badges.length) return;

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
      url.searchParams.set("login", "reddice_stream");
      url.searchParams.set("_", String(Date.now()));

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data?.live === true) {
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
    streamsNode.innerHTML = `<div class="planning-empty">${escapeHtml(text)}</div>`;
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
        <strong>${escapeHtml(day)}</strong>
        <div class="day-line"><span style="width:${width};"></span></div>
        <p>${count} stream${count > 1 ? "s" : ""}</p>
      `;
      daysNode.appendChild(article);
    });

    const totalStreams = items.length;
    const totalMinutes = items.reduce((sum, item) => sum + parseDurationToMinutes(item.duration), 0);
    const lastStreamDate = items[0]?.created_at ? formatDate(items[0].created_at) : "—";

    summaryNode.innerHTML = `
      <article class="card reveal visible">
        <h3>Streams récupérés</h3>
        <p>${totalStreams} session${totalStreams > 1 ? "s" : ""}</p>
      </article>
      <article class="card reveal visible">
        <h3>Durée totale récente</h3>
        <p>${formatMinutes(totalMinutes)}</p>
      </article>
      <article class="card reveal visible">
        <h3>Dernier live</h3>
        <p>${escapeHtml(lastStreamDate)}</p>
      </article>
    `;

    streamsNode.innerHTML = "";
    items.forEach((item) => {
      const article = document.createElement("article");
      article.className = "creation-card reveal visible";

      const thumb = document.createElement("div");
      thumb.className = "creation-thumb planning-thumb";

      if (item.thumbnail_url) {
        thumb.style.backgroundImage = `linear-gradient(rgba(8,12,20,0.2), rgba(8,12,20,0.2)), url("${item.thumbnail_url}")`;
        thumb.style.backgroundSize = "cover";
        thumb.style.backgroundPosition = "center";
        thumb.style.backgroundRepeat = "no-repeat";
        thumb.textContent = "";
      } else {
        thumb.textContent = "Stream archive";
      }

      const title = document.createElement("h3");
      title.textContent = item.title || "Stream";

      const meta = document.createElement("div");
      meta.className = "planning-meta";
      meta.innerHTML = `
        <span class="mini-chip">${escapeHtml(formatDate(item.created_at))}</span>
        <span class="mini-chip">${escapeHtml(item.duration || "—")}</span>
        <span class="mini-chip">${Number(item.view_count || 0)} vue${Number(item.view_count || 0) > 1 ? "s" : ""}</span>
      `;

      const text = document.createElement("p");
      text.textContent = item.description || "Session archivée sur Twitch.";

      const link = document.createElement("a");
      link.className = "ghost-btn";
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Voir la VOD";

      article.appendChild(thumb);
      article.appendChild(title);
      article.appendChild(meta);
      article.appendChild(text);
      article.appendChild(link);

      streamsNode.appendChild(article);
    });

    statusNode.textContent = "Historique Twitch synchronisé.";
  } catch (error) {
    console.error("Erreur planning sync:", error);
    statusNode.textContent = "Impossible de synchroniser l’historique pour le moment.";
    renderEmpty("Synchronisation indisponible.");
  }
}

async function initGuestbook() {
  const form = document.getElementById("guestbook-form");
  const list = document.getElementById("guestbook-list");
  const status = document.getElementById("guestbook-status");
  const ratingInput = document.getElementById("guestbook-rating");
  const stars = document.querySelectorAll("[data-rating-value]");

  if (!form || !list || !ratingInput) return;
  if (status) status.hidden = false;

  let items = [];
  let currentRating = Number(ratingInput.value || 5);

  const paintStars = (value) => {
    stars.forEach((star) => {
      const current = Number(star.dataset.ratingValue);
      star.classList.toggle("active", current <= value);
    });
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(date);
  };

  const renderRating = (rating) => {
    const safe = Math.max(1, Math.min(5, Number(rating || 0)));
    return "★".repeat(safe) + "☆".repeat(5 - safe);
  };

  const renderEntries = () => {
    list.innerHTML = "";

    if (!items.length) {
      list.innerHTML = `<div class="entry-empty">Aucun avis pour le moment. Sois le premier à laisser ton message.</div>`;
      return;
    }

    items.forEach((entry) => {
      const card = document.createElement("article");
      card.className = "entry-card reveal visible";

      card.innerHTML = `
        <div class="entry-meta">
          <strong>${escapeHtml(entry.name || "Anonyme")}</strong>
          <small>${escapeHtml(formatDate(entry.created_at))}</small>
        </div>
        <div class="rating-readonly">${escapeHtml(renderRating(entry.rating))}</div>
        ${entry.title ? `<h4>${escapeHtml(entry.title)}</h4>` : ""}
        <p>${escapeHtml(entry.message || "")}</p>
      `;

      list.appendChild(card);
    });
  };

  const loadEntries = async () => {
    try {
      list.innerHTML = `<div class="entry-empty">Chargement des avis...</div>`;
      const response = await fetch("/api/guestbook", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Impossible de charger le livre d’or");
      }

      const data = await response.json();
      items = Array.isArray(data.items) ? data.items : [];
      renderEntries();
    } catch (error) {
      console.error(error);
      list.innerHTML = `<div class="entry-empty">Impossible de charger les avis pour le moment.</div>`;
    }
  };

  paintStars(currentRating);

  stars.forEach((star) => {
    const value = Number(star.dataset.ratingValue);

    star.addEventListener("mouseenter", () => {
      paintStars(value);
    });

    star.addEventListener("click", () => {
      currentRating = value;
      ratingInput.value = String(value);
      paintStars(currentRating);
    });
  });

  const picker = document.querySelector(".rating-picker");
  if (picker) {
    picker.addEventListener("mouseleave", () => {
      paintStars(currentRating);
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get("name") || "").trim(),
      title: String(formData.get("title") || "").trim(),
      message: String(formData.get("message") || "").trim(),
      rating: Number(formData.get("rating") || 5),
      website: String(formData.get("website") || "").trim()
    };

    if (!payload.name || !payload.message) {
      if (status) {
        status.className = "form-status error";
        status.textContent = "Merci de remplir au minimum ton pseudo et ton message.";
      }
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Envoi...";
      }

      if (status) {
        status.className = "form-status";
        status.textContent = "Publication de l’avis...";
      }

      const response = await fetch("/api/guestbook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Impossible de publier l’avis");
      }

      if (data.item) {
        items.unshift(data.item);
      }

      renderEntries();
      form.reset();
      currentRating = 5;
      ratingInput.value = "5";
      paintStars(5);

      if (status) {
        status.className = "form-status success";
        status.textContent = "Ton avis a bien été publié.";
      }
    } catch (error) {
      console.error(error);
      if (status) {
        status.className = "form-status error";
        status.textContent = error.message || "Impossible de publier l’avis pour le moment.";
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Publier l’avis";
      }
    }
  });

  await loadEntries();
}

async function initContactForm() {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("contact-status");

  if (!form) return;
  if (status) status.hidden = false;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      subject: String(formData.get("subject") || "").trim(),
      message: String(formData.get("message") || "").trim(),
      website: String(formData.get("website") || "").trim()
    };

    if (!payload.name || !payload.email || !payload.subject || !payload.message) {
      if (status) {
        status.className = "form-status error";
        status.textContent = "Merci de remplir tous les champs du formulaire.";
      }
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Envoi...";
      }

      if (status) {
        status.className = "form-status";
        status.textContent = "Envoi du message...";
      }

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Impossible d’envoyer le message");
      }

      form.reset();

      if (status) {
        status.className = "form-status success";
        status.textContent = "Ton message a bien été envoyé.";
      }
    } catch (error) {
      console.error(error);
      if (status) {
        status.className = "form-status error";
        status.textContent = error.message || "Impossible d’envoyer le message pour le moment.";
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Envoyer le message";
      }
    }
  });
}

function setCurrentYear() {
  const yearNode = document.getElementById("current-year");
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
