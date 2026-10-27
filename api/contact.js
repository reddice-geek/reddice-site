// Formulaire public de contact. La lecture et la gestion des messages sont réservées à /api/admin-manage.
const clean = (value, max = 2000) => String(value ?? '').replace(/<[^>]*>/g, '').trim().slice(0, max);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(503).json({ error: 'Le formulaire est temporairement indisponible : stockage permanent non configuré.' });
  let body;
  try { body = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(req.body || '{}'); }
  catch { return res.status(400).json({ error: 'Données du formulaire invalides.' }); }

  const name = clean(body.name, 80);
  const email = clean(body.email, 120);
  const subject = clean(body.subject, 140);
  const message = clean(body.message, 2000);
  const website = clean(body.website, 200);
  if (website) return res.status(200).json({ ok: true, spam: true });
  if (!name || !email || !message) return res.status(400).json({ error: 'Le pseudo, l’e-mail et le message sont obligatoires.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Adresse e-mail invalide.' });

  try {
    const response = await fetch(`${url}/rest/v1/contact_messages`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify([{ name, email, subject, message }]),
    });
    const text = await response.text();
    let rows; try { rows = JSON.parse(text); } catch { rows = null; }
    if (!response.ok || !Array.isArray(rows) || !rows[0]) {
      return res.status(502).json({ error: 'Le message n’a pas pu être enregistré. Réessaie plus tard.' });
    }
    return res.status(201).json({ ok: true, item: { id: rows[0].id }, message: 'Message enregistré.' });
  } catch {
    return res.status(502).json({ error: 'Erreur de connexion. Le message n’a pas été enregistré, réessaie plus tard.' });
  }
}
