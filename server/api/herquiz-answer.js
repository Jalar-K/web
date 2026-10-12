import { db } from '../lib/db.js';
import { cors, body, isUuid } from '../lib/http.js';
import { findTaker } from './herquiz-taker.js';

// You answering her quiz. Marked here on the server so the right answers
// never have to be sent to your phone.
//   POST { quiz_id, device_id, answers: [index, ...], duration_ms } -> { score, total, review }
// The name comes from the phone's saved id, so nobody can answer as someone else.

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const b = body(req);
  if (!isUuid(b.quiz_id)) return res.status(400).json({ error: 'bad quiz' });
  if (!Array.isArray(b.answers) || b.answers.length > 20) return res.status(400).json({ error: 'bad answers' });

  const { data: quiz, error } = await db.from('her_quizzes')
    .select('id, questions').eq('id', b.quiz_id).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!quiz)  return res.status(404).json({ error: 'not found' });

  const taker = typeof b.device_id === 'string'
    ? await findTaker(quiz.id, b.device_id) : null;
  if (!taker) return res.status(403).json({ error: 'pick a name first' });

  const since = new Date(Date.now() - 3600e3).toISOString();
  const { count } = await db.from('her_quiz_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('quiz_id', quiz.id).gte('created_at', since);
  if ((count || 0) >= 30) return res.status(429).json({ error: 'slow down' });

  const qs = quiz.questions || [];
  const review = qs.map((it, i) => {
    const p = Number(b.answers[i]);
    const pick = Number.isInteger(p) && p >= 0 && p < it.a.length ? p : null;
    return { q: it.q, a: it.a, c: it.c, pick, right: pick === it.c };
  });
  const score = review.filter(r => r.right).length;
  const dur = Number(b.duration_ms);

  const { error: e2 } = await db.from('her_quiz_attempts').insert({
    quiz_id: quiz.id, taker_id: taker.id, score, total: qs.length, review,
    duration_ms: Number.isFinite(dur) ? Math.min(Math.max(0, Math.round(dur)), 86400000) : null
  });
  if (e2) return res.status(500).json({ error: e2.message });

  res.status(200).json({ ok: true, name: taker.name, score, total: qs.length, review });
}
