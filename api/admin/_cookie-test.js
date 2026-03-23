import { verifyToken } from './_auth.js';

// Replicates scraper/test_auth.py logic — fetch a course page and check for location data
const TEST_URL = 'https://beta.my.harvard.edu/course/COMPSCI2880/2026-Spring/001';

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
    });

    if (!response.ok) {
      return res.status(200).json({
        valid: false,
        detail: `HTTP ${response.status} from my.harvard.edu`,
      });
    }

    const html = await response.text();

    // Check for the location div with actual data (same logic as test_auth.py)
    const hasLocationDiv = html.includes('id="course-location"');
    const requiresSignIn = html.toLowerCase().includes('sign in') && html.includes('course-location');

    // Look for a real location value in the HTML near the course-location div
    // The Python script looks for a span inside div.flex inside #course-location
    const locationMatch = html.match(/id="course-location"[\s\S]*?<div[^>]*class="flex"[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/);
    const locationText = locationMatch ? locationMatch[1].trim() : null;

    if (!hasLocationDiv) {
      return res.status(200).json({
        valid: false,
        detail: 'Course page loaded but location section not found — page structure may have changed',
      });
    }

    if (requiresSignIn || (locationText && locationText.toLowerCase().includes('sign in'))) {
      return res.status(200).json({
        valid: false,
        detail: 'Cookie is expired or invalid — location requires sign-in',
      });
    }

    if (locationText) {
      return res.status(200).json({
        valid: true,
        detail: `Cookie is working. Location extracted: "${locationText}"`,
      });
    }

    // Location div exists but couldn't extract text — still likely OK
    return res.status(200).json({
      valid: true,
      detail: 'Cookie appears valid — location section is present (could not extract specific text)',
    });
  } catch (err) {
    return res.status(200).json({
      valid: false,
      detail: `Network error: ${err.message}`,
    });
  }
}
