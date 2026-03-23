import { verifyToken, githubFetch } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await verifyToken(req))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { filename } = req.body || {};

    // Dispatch the Q-Guide workflow, optionally with a specific file
    const inputs = {};
    if (filename) inputs.filename = filename;

    await githubFetch('/actions/workflows/qguide-update.yml/dispatches', {
      method: 'POST',
      body: JSON.stringify({
        ref: 'main',
        inputs,
      }),
    });

    // Wait briefly then find the run
    await new Promise(r => setTimeout(r, 2000));

    const runsRes = await githubFetch(
      '/actions/workflows/qguide-update.yml/runs?per_page=1&event=workflow_dispatch'
    );
    const runsData = await runsRes.json();
    const latestRun = runsData.workflow_runs?.[0];

    return res.status(200).json({
      ok: true,
      runId: latestRun?.id || null,
      status: latestRun?.status || 'unknown',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to trigger Q-Guide pipeline', detail: err.message });
  }
}
