import { db } from '../lib/db.js';
import { cors } from '../lib/http.js';

const BUCKETS = ['deep_night','dawn','morning','midday','afternoon','dusk','night'];

export function bucketForHour(h) {
  if (h < 5)  return 'deep_night';
  if (h < 7)  return 'dawn';
  if (h < 11) return 'morning';
  if (h < 15) return 'midday';
  if (h < 18) return 'afternoon';
  if (h < 20) return 'dusk';
  return 'night';
}

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const h = parseInt(req.query.hour, 10);
  const bucket = BUCKETS.includes(req.query.bucket)
    ? req.query.bucket
    : bucketForHour(h >= 0 && h < 24 ? h : new Date().getUTCHours());

  const { data, error } = await db.from('quotes')
    .select('text').eq('bucket', bucket).eq('active', true).limit(80);

  if (error) return res.status(500).json({ error: error.message });

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
  res.status(200).json({ bucket, quotes: (data || []).map(q => q.text) });
}
