import { verifyToken, getConfigFromGitHub, updateConfigOnGitHub } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await verifyToken(req))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { term } = req.body || {};
  if (!term) {
    return res.status(400).json({ error: 'term is required' });
  }

  try {
    const { content: config, sha } = await getConfigFromGitHub();
    const idx = config.semesters.findIndex(s => s.term === term);

    if (idx === -1) {
      return res.status(404).json({ error: `${term} not found` });
    }

    if (idx === 0) {
      return res.status(200).json({ ok: true, detail: `${term} is already the default` });
    }

    // Move to the front
    const [semester] = config.semesters.splice(idx, 1);
    config.semesters.unshift(semester);

    await updateConfigOnGitHub(config, sha, `Set ${term} as default semester`);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to set default', detail: err.message });
  }
}
