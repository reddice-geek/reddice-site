async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

function clean(value, max = 1000) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, max);
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    url,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    }
  };
}

export default async function handler(req, res) {
  const { url, headers } = getSupabaseConfig();

  if (!url || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Configuration Supabase manquante." });
  }

  try {
    if (req.method === "GET") {
      const response = await fetch(
        `${url}/rest/v1/guestbook_entries?select=id,name,title,message,rating,created_at&order=created_at.desc`,
        {
          method: "GET",
          headers
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        return res.status(500).json({ error: `Lecture impossible. ${errorText}` });
      }

      const items = await response.json();
      return res.status(200).json({ items });
    }

    if (req.method === "POST") {
      const body = await readBody(req);

      const name = clean(body.name, 80);
      const title = clean(body.title, 120);
      const message = clean(body.message, 1200);
      const website = clean(body.website, 200);
      const rating = Math.max(1, Math.min(5, Number(body.rating || 5)));

      if (website) {
        return res.status(200).json({ ok: true });
      }

      if (!name || !message) {
        return res.status(400).json({ error: "Pseudo et message obligatoires." });
      }

      const response = await fetch(`${url}/rest/v1/guestbook_entries`, {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "return=representation"
        },
        body: JSON.stringify([
          {
            name,
            title,
            message,
            rating
          }
        ])
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        return res.status(500).json({ error: `Publication impossible. ${errorText}` });
      }

      const rows = await response.json();
      return res.status(200).json({ ok: true, item: rows[0] || null });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({ error: "Erreur serveur livre d’or." });
  }
}
