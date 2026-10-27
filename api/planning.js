// Lecture publique du planning. Toute écriture passe par /api/admin-manage protégé.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(503).json({ items: [], error: 'Planning non configuré : stockage Supabase indisponible.' });
  try {
    const query = new URLSearchParams({ select: 'id,title,start_at,end_at,game,description', start_at: `gte.${new Date().toISOString()}`, order: 'start_at.asc', limit: '100' });
    const r = await fetch(`${url}/rest/v1/stream_planning?${query}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = null; }
    if (!r.ok || !Array.isArray(data)) return res.status(502).json({ items: [], error: 'Impossible de charger le planning.', details: typeof text === 'string' ? text.slice(0, 300) : '' });
    return res.status(200).json({ items: data });
  } catch {
    return res.status(502).json({ items: [], error: 'Erreur de connexion au planning.' });
  }
}
