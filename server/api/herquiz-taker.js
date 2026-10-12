import { db } from '../lib/db.js';
import { cors, body, isUuid, fingerprint } from '../lib/http.js';

// Who is answering her quiz.
//   POST { quiz_id, device_id }        -> { taker } if this phone already has a name, else { taker: null }
//   POST { quiz_id, device_id, name }  -> claims that name for this phone (once; it can't be changed)

const okDevice = v => typeof v === 'string' && /^[A-Za-z0-9-]{16,64}$/.test(v);

// A person is recognised ONLY by the random id saved on their phone.
// (Matching by network address was dropped: on mobile data many different phones
// share one address, so it could log one person in as someone else.)
export async function findTaker(quiz_id, device_id) {
  const { data } = await db.from('her_quiz_takers')
    .select('id, name').eq('quiz_id', quiz_id).eq('device_id', device_id).maybeSingle();
  return data || null;
}

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const b = body(req);
  if (!isUuid(b.quiz_id))   return res.status(400).json({ error: 'bad quiz' });
  if (!okDevice(b.device_id)) return res.status(400).json({ error: 'bad device' });
  const fp = fingerprint(req);

  const existing = await findTaker(b.quiz_id, b.device_id);
  if (existing) return res.status(200).json({ taker: existing, locked: true });

  const name = typeof b.name === 'string' ? b.name.replace(/\s+/g, ' ').trim() : '';
  if (!name) return res.status(200).json({ taker: null });
  if (name.length < 2 || name.length > 30) return res.status(400).json({ error: 'name length' });

  const { data: quiz } = await db.from('her_quizzes').select('id').eq('id', b.quiz_id).maybeSingle();
  if (!quiz) return res.status(404).json({ error: 'not found' });

  const { data: clash } = await db.from('her_quiz_takers')
    .select('id').eq('quiz_id', b.quiz_id).ilike('name', name.replace(/[%_\\]/g, '\\$&')).maybeSingle();
  if (clash) return res.status(409).json({ error: 'name taken' });

  const { data, error } = await db.from('her_quiz_takers')
    .insert({ quiz_id: b.quiz_id, name, device_id: b.device_id, fp })
    .select('id, name').single();
  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'name taken' });
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json({ taker: data, locked: true });
}
