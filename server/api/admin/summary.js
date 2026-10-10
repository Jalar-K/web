import { db } from '../../lib/db.js';
import { cors, requireAdmin } from '../../lib/http.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (!requireAdmin(req, res)) return;

  const [visits, events, games, messages, pins, total] = await Promise.all([
    db.from('visits').select('*').order('opened_at', { ascending: false }).limit(200),
    db.from('events').select('*').order('created_at', { ascending: false }).limit(200),
    db.from('game_results').select('*').order('created_at', { ascending: false }).limit(100),
    db.from('messages').select('*').order('created_at', { ascending: false }).limit(100),
    db.from('pins').select('*').order('created_at', { ascending: false }).limit(20),
    db.from('visits').select('id', { count: 'exact', head: true })
  ]);

  const v = visits.data || [];
  const byHour = Array(24).fill(0);
  v.forEach(x => { if (x.local_hour != null) byHour[x.local_hour]++; });

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    totals: {
      visits:    total.count || v.length,
      sessions:  new Set(v.map(x => x.session_id)).size,
      games:     (games.data || []).length,
      messages:  (messages.data || []).length,
      last_open: v[0]?.opened_at || null
    },
    by_hour:  byHour,
    visits:   v.slice(0, 60),
    events:   events.data   || [],
    games:    games.data    || [],
    messages: messages.data || [],
    pins:     pins.data     || []
  });
}
