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
    // Get jobs for this run
    const jobsRes = await githubFetch(`/actions/runs/${runId}/jobs`);
    const jobsData = await jobsRes.json();
    const job = jobsData.jobs?.[0];

    if (!job) {
      return res.status(200).json({ logs: 'No job data available yet.' });
    }

    // Build a summary from step statuses (full logs require redirect which is complex)
    const steps = (job.steps || []).map(step => {
      const icon = step.conclusion === 'success' ? '✓'
        : step.conclusion === 'failure' ? '✗'
        : step.status === 'in_progress' ? '⟳'
        : '·';
      const duration = step.completed_at && step.started_at
        ? `(${Math.round((new Date(step.completed_at) - new Date(step.started_at)) / 1000)}s)`
        : '';
      return `${icon} ${step.name} ${duration}`;
    });

    return res.status(200).json({
      jobName: job.name,
      status: job.status,
      conclusion: job.conclusion,
      steps,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch logs', detail: err.message });
  }
}
