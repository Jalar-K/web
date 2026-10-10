import { db } from '../lib/db.js';
import { cors, body, isUuid } from '../lib/http.js';

// There is deliberately no draft endpoint. Drafts live on her phone.
export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const b = body(req);
  if (!isUuid(b.session_id)) return res.status(400).json({ error: 'bad session' });

  const text = typeof b.body === 'string' ? b.body.trim() : '';
  if (!text)              return res.status(400).json({ error: 'empty' });
  if (text.length > 2000) return res.status(413).json({ error: 'too long' });

  const since = new Date(Date.now() - 3600e3).toISOString();
  const { count } = await db.from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', b.session_id).gte('created_at', since);
  if ((count || 0) >= 10) return res.status(429).json({ error: 'slow down' });

  const { data, error } = await db.from('messages').insert({
    session_id: b.session_id,
    body: text,
    status: 'sent',
    sent_at: new Date().toISOString()
  }).select('id').single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ ok: true, id: data.id });
}
