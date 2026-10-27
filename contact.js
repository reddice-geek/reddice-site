// /api/contact.js - Reddice HUB V3.1 - 100% fonctionnel - Anti-404
// GET -> liste messages | POST -> nouveau message
// Fallback mémoire si Supabase non configuré ou en erreur -> jamais de 404 pour le front

function clean(v, max = 2000) {
  return String(v || "").replace(/<[^>]*>/g, "").trim().slice(0, max);
}

function cfg() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    url,
    key,
    hasSupabase: !!(url && key),
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
  };
}

// Fallback mémoire serveur (redémarre à vide au redeploy Vercel)
let mem = [];

export default async function handler(req, res) {
  // CORS pour tests locaux + Vercel
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url, key, hasSupabase, headers } = cfg();

  // MODE SANS SUPABASE -> mémoire
  if (!hasSupabase) {
    if (req.method === "GET") {
      return res.status(200).json({
        items: mem,
        source: "memory",
        message: "Supabase non configuré - mode mémoire (max 100)",
      });
    }
    if (req.method === "POST") {
      try {
        const b = typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");
        const name = clean(b.name, 80);
        const email = clean(b.email, 120);
        const subject = clean(b.subject, 140);
        const message = clean(b.message, 2000);
        const website = clean(b.website, 200); // honeypot

        if (website) return res.status(200).json({ ok: true, spam: true });

        if (!name || !email || !message) {
          return res.status(400).json({ error: "Champs requis: name, email, message" });
        }

        const item = {
          id: "mem_" + Date.now(),
          name,
          email,
          subject,
          message,
          created_at: new Date().toISOString(),
        };
        mem.unshift(item);
        if (mem.length > 100) mem = mem.slice(0, 100);

        return res.status(200).json({ ok: true, item, source: "memory" });
      } catch (e) {
        return res.status(500).json({ error: "contact memory error", details: e.message });
      }
    }
    return res.status(405).json({ error: "Method not allowed - use GET or POST" });
  }

  // MODE SUPABASE
  try {
    if (req.method === "GET") {
      const r = await fetch(
        `${url}/rest/v1/contact_messages?select=id,name,email,subject,message,created_at&order=created_at.desc&limit=100`,
        { headers }
      );
      const text = await r.text();
      let items;
      try {
        items = JSON.parse(text);
      } catch {
        items = [];
      }
      if (!Array.isArray(items)) {
        return res.status(200).json({
          items: mem,
          source: "memory_fallback",
          raw: text,
          warning: "Supabase returned non-array, fallback mémoire",
        });
      }
      return res.status(200).json({ items, source: "supabase" });
    }

    if (req.method === "POST") {
      const b = typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");
      const name = clean(b.name, 80);
      const email = clean(b.email, 120);
      const subject = clean(b.subject, 140);
      const message = clean(b.message, 2000);
      const website = clean(b.website, 200);

      if (website) return res.status(200).json({ ok: true, spam: true });

      if (!name || !email || !message) {
        return res.status(400).json({ error: "Champs requis: name, email, message" });
      }

      // Insert Supabase
      const r = await fetch(`${url}/rest/v1/contact_messages`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify([{ name, email, subject, message }]),
      });

      const rowsText = await r.text();
      let rows;
      try {
        rows = JSON.parse(rowsText);
      } catch {
        rows = [];
      }

      if (!r.ok) {
        // Fallback mémoire si insert fail -> pas de 404 pour le front
        const item = {
          id: "mem_" + Date.now(),
          name,
          email,
          subject,
          message,
          created_at: new Date().toISOString(),
          supabase_error: rowsText,
        };
        mem.unshift(item);
        if (mem.length > 100) mem = mem.slice(0, 100);

        return res.status(200).json({
          ok: true,
          item,
          source: "memory_fallback",
          warning: "Supabase insert failed, saved in memory",
          supabase_response: rowsText,
        });
      }

      return res.status(200).json({ ok: true, item: rows[0], source: "supabase" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    // En cas d'erreur réseau Supabase -> fallback mémoire pour GET, 200 pour POST
    if (req.method === "GET") {
      return res.status(200).json({
        items: mem,
        source: "memory_error_fallback",
        error: e.message,
      });
    }
    return res.status(500).json({ error: "contact error", details: e.message });
  }
}
