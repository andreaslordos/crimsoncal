import { createToken, checkPassword, checkRateLimit } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  }

  const { password } = req.body || {};
  if (!password || !checkPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = await createToken();

  res.setHeader('Set-Cookie', [
    `admin_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
  ]);

  return res.status(200).json({ ok: true });
}
