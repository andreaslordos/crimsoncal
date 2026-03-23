import loginHandler from './_login.js';
import logoutHandler from './_logout.js';
import sessionHandler from './_session.js';
import semestersHandler from './_semesters.js';
import scrapeHandler from './_scrape.js';
import scrapeLogsHandler from './_scrape-logs.js';
import scrapeStatusHandler from './_scrape-status.js';
import publishHandler from './_publish.js';
import cookieSaveHandler from './_cookie-save.js';
import cookieTestHandler from './_cookie-test.js';
import qguideCookieSaveHandler from './_qguide-cookie-save.js';
import qguideCookieTestHandler from './_qguide-cookie-test.js';
import qguideUploadHandler from './_qguide-upload.js';
import qguideScrapeHandler from './_qguide-scrape.js';
import cookieGetSavedHandler from './_cookie-get-saved.js';

const handlers = {
  'login': loginHandler,
  'logout': logoutHandler,
  'session': sessionHandler,
  'semesters': semestersHandler,
  'scrape': scrapeHandler,
  'scrape-logs': scrapeLogsHandler,
  'scrape-status': scrapeStatusHandler,
  'publish': publishHandler,
  'cookie-save': cookieSaveHandler,
  'cookie-test': cookieTestHandler,
  'qguide-cookie-save': qguideCookieSaveHandler,
  'qguide-cookie-test': qguideCookieTestHandler,
  'qguide-upload': qguideUploadHandler,
  'qguide-scrape': qguideScrapeHandler,
  'cookie-get-saved': cookieGetSavedHandler,
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  const { action } = req.query;
  const fn = handlers[action];

  if (!fn) {
    return res.status(404).json({ error: 'Not found' });
  }

  return fn(req, res);
}
