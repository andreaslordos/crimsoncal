import { verifyToken } from './_auth.js';

// Test Q-Guide auth by fetching the browse index page
const TEST_URL = 'https://qreports.fas.harvard.edu/browse/index?school=FAS&calTerm=2025%20Fall';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await verifyToken(req))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { cookie } = req.body || {};
  if (!cookie || !cookie.trim()) {
    return res.status(400).json({ error: 'cookie is required' });
  }

  try {
    const response = await fetch(TEST_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': cookie.trim(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'manual', // Don't follow redirects — a redirect means auth failed
    });

    // If we get a redirect (302/301), auth failed
    if (response.status >= 300 && response.status < 400) {
      return res.status(200).json({
        valid: false,
        detail: 'Cookie is expired or invalid — redirected to login page',
      });
    }

    if (!response.ok) {
      return res.status(200).json({
        valid: false,
        detail: `HTTP ${response.status} from qreports.fas.harvard.edu`,
      });
    }

    const html = await response.text();

    // Check if the page contains Q-Guide course links (bluera URLs)
    const hasCourseLinks = html.includes('bluera');
    // Check for FAS ID elements which indicate real course data
    const hasFasIds = html.includes('FAS-');

    if (hasCourseLinks && hasFasIds) {
      // Count approximate number of courses
      const fasCount = (html.match(/FAS-\d+/g) || []).length;
      return res.status(200).json({
        valid: true,
        detail: `Cookie is working. Found ~${fasCount} Q-Guide entries on the browse page.`,
      });
    }

    if (html.toLowerCase().includes('sign in') || html.toLowerCase().includes('login')) {
      return res.status(200).json({
        valid: false,
        detail: 'Cookie is expired — page shows login prompt',
      });
    }

    return res.status(200).json({
      valid: false,
      detail: 'Page loaded but no Q-Guide data found — cookie may be invalid',
    });
  } catch (err) {
    return res.status(200).json({
      valid: false,
      detail: `Network error: ${err.message}`,
    });
  }
}
