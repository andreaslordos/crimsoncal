import { verifyToken } from './_auth.js';

// Replicates scraper/test_auth.py logic — fetch a course page and check for location data.
// Test courses are picked dynamically from the search API because past-term pages
// stop rendering the location section, so hardcoded URLs rot every semester.
const SEARCH_URL = 'https://my.harvard.edu/search/?q=&sort=subject_catalog&page=1';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function pickCourseUrls(count) {
  const response = await fetch(SEARCH_URL, {
    headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`search API returned HTTP ${response.status}`);
  }
  const data = await response.json();
  const hrefs = [...new Set(
    [...(data.hits || '').matchAll(/href="(\/course\/[^"]+)"/g)].map((m) => m[1])
  )];
  return hrefs.slice(0, count).map((h) => `https://my.harvard.edu${h}`);
}

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
    const courseUrls = await pickCourseUrls(10);
    if (courseUrls.length === 0) {
      return res.status(200).json({
        valid: false,
        detail: 'Search API returned no courses to test against — my.harvard.edu may have changed',
      });
    }

    let sawLocationDiv = false;

    for (const url of courseUrls) {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Cookie': cookie.trim(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        continue;
      }

      const html = await response.text();

      if (!html.includes('id="course-location"')) {
        continue;
      }
      sawLocationDiv = true;

      // Same extraction as test_auth.py: span inside div.flex inside #course-location.
      // The flex div carries extra utility classes, so match class="flex ..." not class="flex" exactly.
      const locationMatch = html.match(/id="course-location"[\s\S]*?<div[^>]*class="flex[^"]*"[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/);
      const locationText = locationMatch
        ? locationMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        : null;

      if (!locationText) {
        continue;
      }

      if (locationText.toLowerCase().includes('sign in') || locationText.toLowerCase().includes('signin')) {
        return res.status(200).json({
          valid: false,
          detail: 'Cookie is expired or invalid — location requires sign-in',
        });
      }

      return res.status(200).json({
        valid: true,
        detail: `Cookie is working. Location extracted: "${locationText}" (${url.split('/course/')[1]})`,
      });
    }

    return res.status(200).json({
      valid: false,
      detail: sawLocationDiv
        ? 'Course pages loaded but no location text could be extracted — page structure may have changed'
        : 'Course pages loaded but location section not found — page structure may have changed',
    });
  } catch (err) {
    return res.status(200).json({
      valid: false,
      detail: `Network error: ${err.message}`,
    });
  }
}
