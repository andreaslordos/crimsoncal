import { verifyToken, getConfigFromGitHub, updateConfigOnGitHub } from './_auth.js';

export default async function handler(req, res) {
  if (!(await verifyToken(req))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { content } = await getConfigFromGitHub();
      return res.status(200).json(content);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch config', detail: err.message });
    }
  }

  if (req.method === 'POST') {
    const { term, year } = req.body || {};
    if (!term || !year) {
      return res.status(400).json({ error: 'term and year are required' });
    }

    const semesterName = `${term} ${year}`;

    try {
      const { content: config, sha } = await getConfigFromGitHub();

      if (config.semesters.some(s => s.term === semesterName)) {
        return res.status(409).json({ error: `${semesterName} already exists` });
      }

      config.semesters.push({
        term: semesterName,
        published: false,
        lastScraped: null,
        courseCount: 0,
      });

      await updateConfigOnGitHub(config, sha, `Add ${semesterName} semester`);
      return res.status(201).json({ ok: true, semester: semesterName });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to add semester', detail: err.message });
    }
  }

  if (req.method === 'DELETE') {
    const { term } = req.body || {};
    if (!term) {
      return res.status(400).json({ error: 'term is required' });
    }

    try {
      const { content: config, sha } = await getConfigFromGitHub();
      const semester = config.semesters.find(s => s.term === term);

      if (!semester) {
        return res.status(404).json({ error: `${term} not found` });
      }
      if (semester.published) {
        return res.status(400).json({ error: 'Cannot delete a published semester. Unpublish it first.' });
      }

      config.semesters = config.semesters.filter(s => s.term !== term);
      await updateConfigOnGitHub(config, sha, `Remove ${term} semester`);
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to delete semester', detail: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
