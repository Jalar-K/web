import { db } from '../lib/db.js';
import { cors, body, isUuid, clip } from '../lib/http.js';

// add a new game's key here too, or the server rejects its result
const GAMES = new Set(['stars', 'constellation', 'pairs', 'breathe', 'quiz']);
const int = (v, max) => Number.isFinite(+v) ? Math.min(Math.max(0, Math.round(+v)), max) : null;

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const b = body(req);
  if (!isUuid(b.session_id)) return res.status(400).json({ error: 'bad session' });
  if (!GAMES.has(b.game))    return res.status(400).json({ error: 'bad game' });

  const detail = (b.detail && typeof b.detail === 'object') ? b.detail : {};
  if (JSON.stringify(detail).length > 4000) return res.status(413).json({ error: 'too big' });

  const { error } = await db.from('game_results').insert({
    session_id:  b.session_id,
    game:        clip(b.game, 20),
    score:       int(b.score, 10000),
    total:       int(b.total, 10000),
    duration_ms: int(b.duration_ms, 86400000),
    detail
  });

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
}
