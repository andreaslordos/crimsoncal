// Vercel Edge Middleware - serves custom OG tags for share link previews
// This runs before the React app loads

export const config = {
  matcher: '/',
};

// Common crawler/bot user agents that fetch link previews
const CRAWLER_PATTERNS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
  'TelegramBot',
  'WhatsApp',
  'Discordbot',
  'iMessage', // Apple's preview fetcher
  'Applebot',
  'Pinterest',
  'redditbot',
];

function isCrawler(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_PATTERNS.some(pattern => ua.includes(pattern.toLowerCase()));
}

export default function middleware(request) {
  const url = new URL(request.url);
  const calParam = url.searchParams.get('cal');
  const userAgent = request.headers.get('user-agent') || '';

  // Only intercept share links for crawlers
  if (!calParam || !isCrawler(userAgent)) {
    return; // Continue to normal app
  }

  // Serve minimal HTML with custom OG tags for link previews
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>See my course schedule | CrimsonCal</title>
  <meta property="og:title" content="See my course schedule">
  <meta property="og:description" content="Check out my Harvard course schedule on CrimsonCal">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url.href}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="See my course schedule">
  <meta name="twitter:description" content="Check out my Harvard course schedule on CrimsonCal">
</head>
<body></body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}
