// Livre d'or public : les avis sont créés en attente et ne sont visibles qu'après modération.
const clean = (value, max = 1200) => String(value ?? '').replace(/<[^>]*>/g, '').trim().slice(0, max);
const tables = ['guestbook_entries', 'guestbook'];

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, key, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const { url, key, headers } = config();
  if (!url || !key) return res.status(503).json({ error: 'Le livre d’or est temporairement indisponible : stockage Supabase non configuré.' });

  try {
    if (req.method === 'GET') {
      let lastError = '';
      const collected = [];
      let successful = false;
      for (const table of tables) {
        const query = new URLSearchParams({ select: 'id,name,title,message,rating,created_at,moderation_status', moderation_status: 'eq.approved', order: 'created_at.desc', limit: '100' });
        const response = await fetch(`${url}/rest/v1/${table}?${query}`, { headers });
        const text = await response.text();
        let data; try { data = JSON.parse(text); } catch { data = null; }
        if (response.ok && Array.isArray(data)) {
          successful = true;
          collected.push(...data.filter(item => item && item.moderation_status === 'approved'));
          continue;
        }
        lastError = text;
        if (response.status !== 404 && response.status !== 400) break;
      }
      if (successful) {
        const unique = new Map();
        for (const item of collected) unique.set(String(item.id), item);
        const items = [...unique.values()].sort((a, b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0)).slice(0, 100);
        return res.status(200).json({ items, source: 'supabase' });
      }
      return res.status(502).json({ error: 'Impossible de charger les avis publiés.', details: lastError.slice(0, 300) });
    }

    let body;
    try { body = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(req.body || '{}'); }
    catch { return res.status(400).json({ error: 'Données du formulaire invalides.' }); }
    const name = clean(body.name, 80);
    const title = clean(body.title, 120);
    const message = clean(body.message, 1200);
    const rating = Math.max(1, Math.min(5, Math.round(Number(body.rating) || 5)));
    const website = clean(body.website, 200);
    if (website) return res.status(200).json({ ok: true, spam: true });
    if (!name || !message) return res.status(400).json({ error: 'Le pseudo et le message sont obligatoires.' });

    const payload = [{ name, title, message, rating, moderation_status: 'pending' }];
    let lastError = '';
    for (const table of tables) {
      const response = await fetch(`${url}/rest/v1/${table}`, { method: 'POST', headers: { ...headers, Prefer: 'return=representation' }, body: JSON.stringify(payload) });
      const text = await response.text();
      let data; try { data = JSON.parse(text); } catch { data = null; }
      if (response.ok && Array.isArray(data) && data[0]) return res.status(201).json({ ok: true, item: data[0], source: 'supabase', pending: true });
      lastError = text;
      if (response.status !== 404 && response.status !== 400) break;
    }
    return res.status(502).json({ error: 'Ton avis n’a pas pu être enregistré. Réessaie plus tard.', details: lastError.slice(0, 300) });
  } catch {
    return res.status(502).json({ error: 'Erreur de connexion au livre d’or. Réessaie plus tard.' });
  }
}
