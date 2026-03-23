import { verifyToken, githubFetch } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await verifyToken(req))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const runId = req.query.runId;
  if (!runId) {
    return res.status(400).json({ error: 'runId query parameter is required' });
  }

  try {
    const runRes = await githubFetch(`/actions/runs/${runId}`);
    const run = await runRes.json();

    return res.status(200).json({
      status: run.status,           // queued, in_progress, completed
      conclusion: run.conclusion,   // success, failure, cancelled, null
      startedAt: run.run_started_at,
      updatedAt: run.updated_at,
      htmlUrl: run.html_url,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch run status', detail: err.message });
  }
}
