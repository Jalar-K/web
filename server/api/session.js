import { db } from '../lib/db.js';
import { cors, body, isUuid, clip, geo } from '../lib/http.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const b = body(req);
  if (!isUuid(b.session_id)) return res.status(400).json({ error: 'bad session' });

  const g = geo(req);
  const { error } = await db.from('visits').insert({
    session_id: b.session_id,
    local_hour: Number.isInteger(b.local_hour) ? b.local_hour : null,
    local_time: clip(b.local_time, 20),
    tz:         clip(b.tz, 60),
    screen:     clip(b.screen, 20),
    user_agent: clip(req.headers['user-agent'] || '', 300),
    is_return:  !!b.is_return,
    ...g
  });

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ ok: true, city: g.city, country: g.country });
}
