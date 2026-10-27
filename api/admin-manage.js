const clean = (value, max = 2000) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

const TABLES = {
  planning: ['stream_planning'],
  contacts: ['contact_messages'],
  avis: ['guestbook_entries', 'guestbook'],
};

function responseError(res, status, message) {
  return res.status(status).json({ error: message });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Vary', 'Authorization');
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return responseError(res, 503, 'Configuration serveur manquante : ADMIN_PASSWORD.');
  if (req.headers.authorization !== `Bearer ${secret}`) return responseError(res, 401, 'Mot de passe administrateur incorrect.');

  const baseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) return responseError(res, 503, 'Stockage permanent indisponible : configurez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans Vercel.');

  const type = clean(req.query?.type, 20);
  const tables = TABLES[type];
  if (!tables) return responseError(res, 400, 'Section inconnue.');
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', type === 'planning' ? 'GET, POST, PATCH, DELETE' : 'GET, PATCH, DELETE');
    return responseError(res, 405, 'Méthode non autorisée.');
  }
  if (type !== 'planning' && req.method === 'POST') return responseError(res, 405, 'Ajout non autorisé pour cette section.');
  if (type !== 'planning' && type !== 'contacts' && type !== 'avis' && req.method === 'PATCH') return responseError(res, 405, 'Modification non autorisée.');

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };
  const id = clean(req.query?.id, 160);
  const parseBody = () => typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(req.body || '{}');
  const order = type === 'planning' ? 'start_at.asc' : 'created_at.desc';

  async function callTable(table, method, query = '', body = undefined) {
    const response = await fetch(`${baseUrl}/rest/v1/${table}${query ? `?${query}` : ''}`, {
      method,
      headers: {
        ...headers,
        ...(method !== 'GET' && method !== 'DELETE' ? { Prefer: 'return=representation' } : {}),
        ...(method === 'DELETE' ? { Prefer: 'return=representation' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { response, data, text, table };
  }

  try {
    if (req.method === 'GET') {
      let last;
      const collected = [];
      const successfulTables = [];
      for (const table of tables) {
        const query = new URLSearchParams({ select: '*', order, limit: '200' });
        const result = await callTable(table, 'GET', query.toString());
        if (result.response.ok && Array.isArray(result.data)) {
          collected.push(...result.data);
          successfulTables.push(table);
          if (type !== 'avis') break;
          continue;
        }
        last = result;
        if (result.response.status !== 404 && result.response.status !== 400) break;
      }
      if (successfulTables.length) {
        if (type === 'avis') {
          const unique = new Map();
          for (const item of collected) unique.set(String(item.id), item);
          const merged = [...unique.values()].sort((a, b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0));
          return res.status(200).json({ items: merged, table: successfulTables.join(' + ') });
        }
        return res.status(200).json({ items: collected, table: successfulTables[0] });
      }
      const detail = typeof last?.data === 'string' ? last.data : JSON.stringify(last?.data || {});
      return responseError(res, last?.response?.status >= 500 ? 502 : (last?.response?.status || 502), `Lecture impossible (${last?.table || tables[0]}): ${detail}`);
    }

    if (req.method === 'POST' && type === 'planning' || req.method === 'PATCH' && type === 'planning') {
      const body = parseBody();
      const title = clean(body.title, 160);
      const startAt = clean(body.start_at, 40);
      if (!title || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(startAt) || Number.isNaN(Date.parse(startAt))) {
        return responseError(res, 400, 'Le titre et une date/heure valide sont obligatoires.');
      }
      if (req.method === 'PATCH' && !id) return responseError(res, 400, 'ID du stream manquant.');
      const endAt = clean(body.end_at, 40);
      if (endAt && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(endAt) || Number.isNaN(Date.parse(endAt)) || Date.parse(endAt) <= Date.parse(startAt))) {
        return responseError(res, 400, 'L’heure de fin doit être postérieure à l’heure de début.');
      }
      const payload = { title, start_at: new Date(startAt).toISOString(), end_at: endAt ? new Date(endAt).toISOString() : null, game: clean(body.game, 120), description: clean(body.description, 2000) };
      const query = req.method === 'PATCH' ? `id=eq.${encodeURIComponent(id)}` : '';
      const result = await callTable('stream_planning', req.method, query, req.method === 'POST' ? [payload] : payload);
      if (!result.response.ok) return responseError(res, result.response.status, `Enregistrement du planning impossible : ${JSON.stringify(result.data)}`);
      return res.status(200).json({ ok: true, items: Array.isArray(result.data) ? result.data : [] });
    }

    if (req.method === 'PATCH' && type === 'avis') {
      if (!id) return responseError(res, 400, 'ID de l’avis manquant.');
      const body = parseBody();
      if (!['pending', 'approved', 'rejected'].includes(body.moderation_status)) return responseError(res, 400, 'Statut de modération invalide.');
      let last;
      for (const table of tables) {
        const result = await callTable(table, 'PATCH', `id=eq.${encodeURIComponent(id)}`, { moderation_status: body.moderation_status });
        if (result.response.ok && Array.isArray(result.data) && result.data.length) return res.status(200).json({ ok: true, items: result.data });
        if (result.response.ok) { last = result; continue; }
        last = result;
        if (result.response.status !== 404 && result.response.status !== 400) break;
      }
      return responseError(res, last?.response?.ok ? 404 : (last?.response?.status || 502), `Modification de l’avis impossible : ${JSON.stringify(last?.data)}`);
    }

    if (req.method === 'PATCH' && type === 'contacts') {
      if (!id) return responseError(res, 400, 'ID du message manquant.');
      const body = parseBody();
      if (!['new', 'handled'].includes(body.status)) return responseError(res, 400, 'Statut invalide.');
      const result = await callTable('contact_messages', 'PATCH', `id=eq.${encodeURIComponent(id)}`, { status: body.status });
      if (!result.response.ok) return responseError(res, result.response.status, `Mise à jour du contact impossible : ${JSON.stringify(result.data)}`);
      if (Array.isArray(result.data) && result.data.length === 0) return responseError(res, 404, 'Message de contact introuvable.');
      return res.status(200).json({ ok: true, items: result.data || [] });
    }

    if (req.method === 'DELETE') {
      if (!id) return responseError(res, 400, 'ID de l’élément manquant.');
      let last;
      for (const table of tables) {
        const result = await callTable(table, 'DELETE', `id=eq.${encodeURIComponent(id)}`);
        if (result.response.ok) {
          if (Array.isArray(result.data) && result.data.length === 0 && type === 'avis' && table !== tables[tables.length - 1]) { last = result; continue; }
          if (Array.isArray(result.data) && result.data.length === 0 && type !== 'avis') return responseError(res, 404, 'Élément introuvable.');
          return res.status(200).json({ ok: true, deleted: id });
        }
        last = result;
        if (result.response.status !== 404 && result.response.status !== 400) break;
      }
      return responseError(res, last?.response?.ok ? 404 : (last?.response?.status || 502), `Suppression impossible : ${JSON.stringify(last?.data)}`);
    }

    return responseError(res, 405, 'Méthode non autorisée.');
  } catch (error) {
    return responseError(res, 500, `Erreur interne : ${clean(error?.message || 'inconnue', 300)}`);
  }
}
