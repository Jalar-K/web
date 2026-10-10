const ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

export function cors(req, res) {
  const origin = req.headers.origin || '';
  if (ORIGINS.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}

export function body(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = v => typeof v === 'string' && UUID.test(v);
export const clip = (v, n) => typeof v === 'string' ? v.slice(0, n) : null;

// Vercel fills these at the edge. Country and city only, never an address.
export function geo(req) {
  const dec = v => v ? decodeURIComponent(v) : null;
  return {
    city:    dec(req.headers['x-vercel-ip-city']),
    region:  dec(req.headers['x-vercel-ip-country-region']),
    country: dec(req.headers['x-vercel-ip-country'])
  };
}

export function requireAdmin(req, res) {
  const key = req.headers['x-admin-key'];
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    res.status(401).json({ error: 'nope' });
    return false;
  }
  return true;
}
