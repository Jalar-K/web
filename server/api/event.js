import { db } from '../lib/db.js';
import { cors, body, isUuid } from '../lib/http.js';

const ALLOWED = new Set([
  'home', 'game_start', 'game_end', 'star_caught', 'wish',
  'leave', 'location_shared', 'location_cleared',
  'message_sent', 'about_opened',
  'herquiz_saved', 'herquiz_shared', 'herquiz_answered'
]);

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const b = body(req);
  if (!isUuid(b.session_id)) return res.status(400).json({ error: 'bad session' });
  if (!ALLOWED.has(b.type))  return res.status(400).json({ error: 'bad type' });

  const payload = (b.payload && typeof b.payload === 'object') ? b.payload : {};
  if (JSON.stringify(payload).length > 2000) return res.status(413).json({ error: 'too big' });

  const { error } = await db.from('events')
    .insert({ session_id: b.session_id, type: b.type, payload });

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
}
