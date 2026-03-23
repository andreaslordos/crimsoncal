import { verifyToken, githubFetch } from './_auth.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Q-Guide HTML files can be a few MB
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await verifyToken(req))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { filename, content } = req.body || {};
  if (!filename || !content) {
    return res.status(400).json({ error: 'filename and content are required' });
  }

  // Sanitize filename
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `scraper/qguide/old_html/${safeName}`;

  try {
    // Check if file already exists (to get SHA for update)
    let sha = null;
    try {
      const existing = await githubFetch(`/contents/${filePath}`);
      const data = await existing.json();
      sha = data.sha;
    } catch {
      // File doesn't exist yet — that's fine
    }

    const body = {
      message: `Upload Q-Guide index HTML: ${safeName}`,
      content: Buffer.from(content).toString('base64'),
    };
    if (sha) body.sha = sha;

    await githubFetch(`/contents/${filePath}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    return res.status(200).json({ ok: true, path: filePath });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to upload file', detail: err.message });
  }
}
