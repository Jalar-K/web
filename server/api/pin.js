import { db } from '../lib/db.js';
import { cors, body, isUuid, clip } from '../lib/http.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const b = body(req);
  if (!isUuid(b.session_id)) return res.status(400).json({ error: 'bad session' });

  // Undo really deletes it
  if (b.clear) {
    await db.from('pins').delete().eq('session_id', b.session_id);
    return res.status(200).json({ ok: true, cleared: true });
  }

  const lat = Number(b.lat), lng = Number(b.lng);
  if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
    return res.status(400).json({ error: 'bad coords' });

  const { error } = await db.from('pins').insert({
    session_id: b.session_id, lat, lng,
    accuracy_m: isFinite(Number(b.accuracy_m)) ? Number(b.accuracy_m) : null,
    note: clip(b.note, 120)
  });

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ ok: true });
}
