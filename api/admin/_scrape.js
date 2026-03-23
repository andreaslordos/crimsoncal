import { verifyToken, githubFetch } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await verifyToken(req))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { term, year } = req.body || {};
  if (!term || !year) {
    return res.status(400).json({ error: 'term and year are required' });
  }

  try {
    // Dispatch the GitHub Actions workflow with term/year inputs
    await githubFetch('/actions/workflows/daily-scraper.yml/dispatches', {
      method: 'POST',
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          term: term,
          year: String(year),
        },
      }),
    });

    // GitHub doesn't return the run ID from dispatch, so we wait briefly
    // then find the most recent run triggered by workflow_dispatch
    await new Promise(r => setTimeout(r, 2000));

    const runsRes = await githubFetch(
      '/actions/workflows/daily-scraper.yml/runs?per_page=1&event=workflow_dispatch'
    );
    const runsData = await runsRes.json();
    const latestRun = runsData.workflow_runs?.[0];

    return res.status(200).json({
      ok: true,
      runId: latestRun?.id || null,
      status: latestRun?.status || 'unknown',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to trigger scrape', detail: err.message });
  }
}
