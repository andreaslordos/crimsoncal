import { verifyToken, getGitHubVariable } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await verifyToken(req))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const type = req.query.type; // 'harvard' or 'qguide'
  const varName = type === 'qguide' ? 'QGUIDE_COOKIE_VAR' : 'MY_HARVARD_COOKIE_VAR';

  try {
    const value = await getGitHubVariable(varName);
    return res.status(200).json({ cookie: value });
  } catch (err) {
    if (err.message.includes('404')) {
      return res.status(200).json({ cookie: null, detail: 'No saved cookie found. Save a cookie first.' });
    }
    return res.status(500).json({ error: 'Failed to fetch saved cookie', detail: err.message });
  }
}
