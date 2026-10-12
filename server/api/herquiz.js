import { db } from '../lib/db.js';
import { cors, body, isUuid } from '../lib/http.js';

// Her "quiz me back" questions.
//   POST { session_id, questions, id? }   -> create (or update her own) quiz, returns { id }
//   GET  ?id=...                          -> questions WITHOUT the answers (for the person answering)
//   GET  ?id=...&session_id=...           -> full quiz + every attempt, only for the phone that made it

const MAX_Q = 12;

function clean(list) {
  if (!Array.isArray(list) || !list.length || list.length > MAX_Q) return null;
  const out = [];
  for (const it of list) {
    if (!it || typeof it !== 'object') return null;
    const q = typeof it.q === 'string' ? it.q.trim().slice(0, 200) : '';
    if (!q || !Array.isArray(it.a)) return null;
    const a = it.a.map(x => (typeof x === 'string' ? x.trim().slice(0, 120) : ''));
    if (a.length < 2 || a.length > 4 || a.some(x => !x)) return null;
    const c = Number(it.c);
    if (!Number.isInteger(c) || c < 0 || c >= a.length) return null;
    out.push({ q, a, c });
  }
  return out;
}

export default async function handler(req, res) {
  if (cors(req, res)) return;
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    const id = req.query.id;
    if (!isUuid(id)) return res.status(400).json({ error: 'bad id' });

    const { data: quiz, error } = await db.from('her_quizzes')
      .select('id, session_id, questions, updated_at').eq('id', id).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!quiz)  return res.status(404).json({ error: 'not found' });

    const owner = isUuid(req.query.session_id) && req.query.session_id === quiz.session_id;
    if (!owner) {
      return res.status(200).json({
        id: quiz.id,
        questions: (quiz.questions || []).map(({ q, a }) => ({ q, a }))
      });
    }

    const { data: attempts } = await db.from('her_quiz_attempts')
      .select('score, total, review, duration_ms, created_at')
      .eq('quiz_id', id).order('created_at', { ascending: false }).limit(20);

    return res.status(200).json({
      id: quiz.id, questions: quiz.questions, updated_at: quiz.updated_at,
      attempts: attempts || []
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'GET or POST only' });

  const b = body(req);
  if (!isUuid(b.session_id)) return res.status(400).json({ error: 'bad session' });
  const questions = clean(b.questions);
  if (!questions) return res.status(400).json({ error: 'check your questions' });

  if (isUuid(b.id)) {
    const { data, error } = await db.from('her_quizzes')
      .update({ questions, updated_at: new Date().toISOString() })
      .eq('id', b.id).eq('session_id', b.session_id)
      .select('id').maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (data)  return res.status(200).json({ ok: true, id: data.id });
    // not hers / gone -> fall through and make a new one
  }

  const since = new Date(Date.now() - 3600e3).toISOString();
  const { count } = await db.from('her_quizzes')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', b.session_id).gte('created_at', since);
  if ((count || 0) >= 10) return res.status(429).json({ error: 'slow down' });

  const { data, error } = await db.from('her_quizzes')
    .insert({ session_id: b.session_id, questions })
    .select('id').single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ ok: true, id: data.id });
}
