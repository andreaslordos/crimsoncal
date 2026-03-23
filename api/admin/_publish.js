import { verifyToken, getConfigFromGitHub, updateConfigOnGitHub } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await verifyToken(req))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { term, published } = req.body || {};
  if (!term || typeof published !== 'boolean') {
    return res.status(400).json({ error: 'term (string) and published (boolean) are required' });
  }

  try {
    const { content: config, sha } = await getConfigFromGitHub();
    const semester = config.semesters.find(s => s.term === term);

    if (!semester) {
      return res.status(404).json({ error: `${term} not found` });
    }

    semester.published = published;
    const action = published ? 'Publish' : 'Unpublish';
    await updateConfigOnGitHub(config, sha, `${action} ${term}`);

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update publish state', detail: err.message });
  }
}
