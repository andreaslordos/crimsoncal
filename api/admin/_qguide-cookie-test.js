import { verifyToken } from './_auth.js';

// Test by fetching an actual Q-Guide report page on bluera.com (same domain the downloader uses)
const TEST_URL = 'https://my-harvard-bc.bluera.com/rpv-eng.aspx?lang=eng&redi=1&SelectedIDforPrint=4d261612ca3939d596643f28c19d1e645ed628a5747b371ee6a7c675d62dd8529216a97944bd245cb751fafd12d11676&ReportType=2&regl=en-US';

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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Cookie': cookie.trim(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'manual',
    });

    // A redirect means auth failed — bluera sends you to login
    if (response.status >= 300 && response.status < 400) {
      return res.status(200).json({
        valid: false,
        detail: 'Cookie is expired or invalid — redirected to login',
      });
    }

    if (!response.ok) {
      return res.status(200).json({
        valid: false,
        detail: `HTTP ${response.status} from bluera.com`,
      });
    }

    const html = await response.text();

    // A valid response contains a Q-Guide report with table data
    if (html.includes('<table') && (html.includes('Evaluate') || html.includes('Hours per week') || html.includes('Responded'))) {
      return res.status(200).json({
        valid: true,
        detail: 'Cookie is working — successfully fetched a Q-Guide report.',
      });
    }

    // Check for login/auth prompts in the page content
    const lowerHtml = html.toLowerCase();
    if (lowerHtml.includes('sign in') || lowerHtml.includes('log in') || lowerHtml.includes('authentication') || lowerHtml.includes('unauthorized')) {
      return res.status(200).json({
        valid: false,
        detail: 'Cookie is expired — page shows login prompt',
      });
    }

    // Got a page but can't identify it
    return res.status(200).json({
      valid: false,
      detail: 'Page loaded but could not verify Q-Guide content. Cookie may be invalid.',
    });
  } catch (err) {
    return res.status(200).json({
      valid: false,
      detail: `Network error: ${err.message}`,
    });
  }
}
