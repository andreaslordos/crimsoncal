import { useState, useEffect, useCallback, useRef } from 'react';
import { Lock, LogOut, Plus, Play, Eye, EyeOff, Trash2, ChevronDown, ChevronUp, Loader2, CheckCircle2, XCircle, ExternalLink, Cookie, FlaskConical, Save, Upload, BookOpen } from 'lucide-react';

// --- Login Screen ---
function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        onLogin();
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--harvard-crimson)' }}>
              <Lock size={20} className="text-white" />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-center text-gray-900 mb-1">CrimsonCal Admin</h1>
          <p className="text-sm text-gray-500 text-center mb-6">Enter password to continue</p>

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent mb-3"
              style={{ '--tw-ring-color': 'var(--harvard-crimson)' }}
              autoFocus
              disabled={loading}
            />
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-2 px-4 rounded-md text-white text-sm font-medium disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-opacity"
              style={{ backgroundColor: 'var(--harvard-crimson)' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- Semester Card ---
function SemesterCard({ semester, isDefault, onScrape, onPublish, onRemove, onSetDefault, scrapeState }) {
  const [logsOpen, setLogsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'publish' | 'unpublish' | 'remove'

  const isRunning = scrapeState?.status === 'in_progress' || scrapeState?.status === 'queued';
  const elapsed = scrapeState?.startedAt
    ? Math.round((Date.now() - new Date(scrapeState.startedAt).getTime()) / 1000)
    : null;

  const handleConfirm = (action) => {
    if (confirmAction === action) {
      // Second click — execute
      if (action === 'publish') onPublish(semester.term, true);
      else if (action === 'unpublish') onPublish(semester.term, false);
      else if (action === 'remove') onRemove(semester.term);
      setConfirmAction(null);
    } else {
      setConfirmAction(action);
    }
  };

  // Reset confirm after 3s
  useEffect(() => {
    if (!confirmAction) return;
    const t = setTimeout(() => setConfirmAction(null), 3000);
    return () => clearTimeout(t);
  }, [confirmAction]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{semester.term}</h3>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            {semester.courseCount > 0 && <span>{semester.courseCount.toLocaleString()} courses</span>}
            {semester.lastScraped && (
              <span>Last scraped: {new Date(semester.lastScraped).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
            )}
            {!semester.lastScraped && semester.courseCount === 0 && <span>Not yet scraped</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDefault && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              Default
            </span>
          )}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            semester.published
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-gray-50 text-gray-600 border border-gray-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${semester.published ? 'bg-green-500' : 'bg-gray-400'}`} />
            {semester.published ? 'Published' : 'Unpublished'}
          </span>
        </div>
      </div>

      {/* Scrape progress */}
      {isRunning && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Loader2 size={14} className="animate-spin" />
            <span>Scraping in progress{elapsed !== null ? ` · ${Math.floor(elapsed / 60)}m ${elapsed % 60}s elapsed` : ''}...</span>
          </div>
        </div>
      )}

      {/* Scrape result */}
      {scrapeState?.conclusion && !isRunning && (
        <div className={`mb-3 p-3 rounded-md border text-sm flex items-center gap-2 ${
          scrapeState.conclusion === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {scrapeState.conclusion === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          Scrape {scrapeState.conclusion}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onScrape(semester.term)}
          disabled={isRunning}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {isRunning ? 'Scraping...' : 'Scrape Now'}
        </button>

        {scrapeState?.runId && (
          <button
            onClick={() => setLogsOpen(!logsOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
          >
            {logsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Logs
          </button>
        )}

        {semester.published ? (
          <button
            onClick={() => handleConfirm('unpublish')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors ${
              confirmAction === 'unpublish'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <EyeOff size={14} />
            {confirmAction === 'unpublish' ? 'Click again to confirm' : 'Unpublish'}
          </button>
        ) : (
          <>
            <button
              onClick={() => handleConfirm('publish')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors ${
                confirmAction === 'publish'
                  ? 'text-white border border-transparent'
                  : 'text-white border border-transparent hover:opacity-90'
              }`}
              style={{ backgroundColor: confirmAction === 'publish' ? '#2563eb' : 'var(--harvard-crimson)' }}
            >
              <Eye size={14} />
              {confirmAction === 'publish' ? 'Click again to confirm' : 'Publish'}
            </button>
            <button
              onClick={() => handleConfirm('remove')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors ${
                confirmAction === 'remove'
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Trash2 size={14} />
              {confirmAction === 'remove' ? 'Click again to confirm' : 'Remove'}
            </button>
          </>
        )}

        {semester.published && !isDefault && (
          <button
            onClick={() => onSetDefault(semester.term)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
          >
            Set as Default
          </button>
        )}

        {scrapeState?.htmlUrl && (
          <a
            href={scrapeState.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ExternalLink size={14} />
            GitHub
          </a>
        )}
      </div>

      {/* Logs panel */}
      {logsOpen && scrapeState?.logs && (
        <div className="mt-3 p-3 bg-gray-900 rounded-md text-xs text-gray-300 font-mono overflow-x-auto max-h-60 overflow-y-auto">
          {scrapeState.logs.map((line, i) => (
            <div key={i} className="whitespace-pre">{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Cookie Manager ---
function CookieManager() {
  const [cookieValue, setCookieValue] = useState('');
  const [testing, setTesting] = useState(false);
  const [testingSaved, setTestingSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null); // { type: 'success'|'error'|'info', message }

  const handleTest = async () => {
    if (!cookieValue.trim()) return;
    setTesting(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/cookie-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookie: cookieValue }),
      });
      const data = await res.json();

      setResult({
        type: data.valid ? 'success' : 'error',
        message: data.detail,
      });
    } catch {
      setResult({ type: 'error', message: 'Failed to test cookie' });
    } finally {
      setTesting(false);
    }
  };

  const handleTestSaved = async () => {
    setTestingSaved(true);
    setResult(null);

    try {
      // Fetch the saved cookie from GitHub variable
      const fetchRes = await fetch('/api/admin/cookie-get-saved?type=harvard');
      const fetchData = await fetchRes.json();

      if (!fetchData.cookie) {
        setResult({ type: 'error', message: fetchData.detail || 'No saved cookie found. Save one first.' });
        return;
      }

      // Test the saved cookie
      const testRes = await fetch('/api/admin/cookie-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookie: fetchData.cookie }),
      });
      const testData = await testRes.json();

      setResult({
        type: testData.valid ? 'success' : 'error',
        message: `[Saved cookie] ${testData.detail}`,
      });
    } catch {
      setResult({ type: 'error', message: 'Failed to test saved cookie' });
    } finally {
      setTestingSaved(false);
    }
  };

  const handleSave = async () => {
    if (!cookieValue.trim()) return;
    setSaving(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/cookie-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookie: cookieValue }),
      });
      const data = await res.json();

      if (res.ok) {
        setResult({ type: 'success', message: 'Cookie saved to GitHub Actions secret.' });
      } else {
        setResult({ type: 'error', message: data.error || 'Failed to save' });
      }
    } catch {
      setResult({ type: 'error', message: 'Failed to save cookie' });
    } finally {
      setSaving(false);
    }
  };

  const busy = testing || testingSaved || saving;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <Cookie size={16} className="text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900">Harvard Cookie</h3>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Paste your my.harvard.edu cookie here. Test it first, then save to update the GitHub Actions secret used by the scraper.
      </p>
      <textarea
        value={cookieValue}
        onChange={(e) => setCookieValue(e.target.value)}
        placeholder="Paste cookie string from browser DevTools..."
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:border-transparent resize-y mb-3"
        style={{ '--tw-ring-color': 'var(--harvard-crimson)' }}
      />

      {result && (
        <div className={`mb-3 p-3 rounded-md border text-sm flex items-center gap-2 ${
          result.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {result.type === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          {result.message}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleTest}
          disabled={busy || !cookieValue.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
        >
          {testing ? <Loader2 size={14} className="animate-spin" /> : <FlaskConical size={14} />}
          {testing ? 'Testing...' : 'Test Cookie'}
        </button>
        <button
          onClick={handleSave}
          disabled={busy || !cookieValue.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-md disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-opacity"
          style={{ backgroundColor: 'var(--harvard-crimson)' }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save to GitHub'}
        </button>
        <button
          onClick={handleTestSaved}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
        >
          {testingSaved ? <Loader2 size={14} className="animate-spin" /> : <FlaskConical size={14} />}
          {testingSaved ? 'Testing...' : 'Test Saved'}
        </button>
      </div>
    </div>
  );
}

// --- Q-Guide Manager ---
function QGuideManager() {
  const [sessionId, setSessionId] = useState('');
  const [cookieName, setCookieName] = useState('');
  const [testing, setTesting] = useState(false);
  const [testingSaved, setTestingSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cookieResult, setCookieResult] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadTerm, setUploadTerm] = useState('Fall');
  const [uploadYear, setUploadYear] = useState(new Date().getFullYear());
  const [uploadFile, setUploadFile] = useState(null);

  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState(null);
  const [runStatus, setRunStatus] = useState(null);
  const [runLogs, setRunLogs] = useState([]);
  const [logsOpen, setLogsOpen] = useState(false);
  const pollRef = useRef(null);

  // Cleanup poll on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const buildCookieString = () =>
    `ASP.NET_SessionId=${sessionId.trim()}; CookieName=${cookieName.trim()}`;

  const hasInput = sessionId.trim() && cookieName.trim();

  const testCookieValue = async (cookie) => {
    const res = await fetch('/api/admin/qguide-cookie-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cookie }),
    });
    return await res.json();
  };

  const handleTestCookie = async () => {
    if (!hasInput) return;
    setTesting(true);
    setCookieResult(null);
    try {
      const data = await testCookieValue(buildCookieString());
      setCookieResult({ type: data.valid ? 'success' : 'error', message: data.detail });
    } catch {
      setCookieResult({ type: 'error', message: 'Failed to test cookie' });
    } finally {
      setTesting(false);
    }
  };

  const handleTestSaved = async () => {
    setTestingSaved(true);
    setCookieResult(null);
    try {
      const fetchRes = await fetch('/api/admin/cookie-get-saved?type=qguide');
      const fetchData = await fetchRes.json();

      if (!fetchData.cookie) {
        setCookieResult({ type: 'error', message: fetchData.detail || 'No saved cookie found. Save one first.' });
        return;
      }

      const data = await testCookieValue(fetchData.cookie);
      setCookieResult({
        type: data.valid ? 'success' : 'error',
        message: `[Saved cookie] ${data.detail}`,
      });
    } catch {
      setCookieResult({ type: 'error', message: 'Failed to test saved cookie' });
    } finally {
      setTestingSaved(false);
    }
  };

  const handleSaveCookie = async () => {
    if (!hasInput) return;
    setSaving(true);
    setCookieResult(null);
    try {
      const res = await fetch('/api/admin/qguide-cookie-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookie: buildCookieString() }),
      });
      const data = await res.json();
      setCookieResult({
        type: res.ok ? 'success' : 'error',
        message: res.ok ? data.detail : (data.error || 'Failed to save'),
      });
    } catch {
      setCookieResult({ type: 'error', message: 'Failed to save cookie' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setUploadFile(file);
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadResult(null);

    const filename = `QReports_${uploadYear}${uploadTerm}.htm`;

    try {
      const content = await uploadFile.text();
      const res = await fetch('/api/admin/qguide-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content }),
      });
      const data = await res.json();
      setUploadResult({
        type: res.ok ? 'success' : 'error',
        message: res.ok ? `Uploaded as ${filename}` : (data.error || 'Upload failed'),
      });
      if (res.ok) setUploadFile(null);
    } catch {
      setUploadResult({ type: 'error', message: 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const pollStatus = useCallback((id) => {
    if (pollRef.current) clearInterval(pollRef.current);

    const poll = async () => {
      try {
        const statusRes = await fetch(`/api/admin/scrape-status?runId=${id}`);
        const statusData = await statusRes.json();

        const logsRes = await fetch(`/api/admin/scrape-logs?runId=${id}`);
        const logsData = await logsRes.json();

        setRunStatus(statusData);
        setRunLogs(logsData.steps || []);

        if (statusData.status === 'completed') {
          setRunning(false);
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch { /* retry on next poll */ }
    };

    poll();
    pollRef.current = setInterval(poll, 8000);
  }, []);

  const handleRunPipeline = async () => {
    setRunning(true);
    setRunStatus(null);
    setRunLogs([]);
    try {
      const res = await fetch('/api/admin/qguide-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.runId) {
        setRunId(data.runId);
        pollStatus(data.runId);
      } else {
        setRunning(false);
      }
    } catch {
      setRunning(false);
    }
  };

  const isComplete = runStatus?.status === 'completed';
  const elapsed = runStatus?.startedAt
    ? Math.round((Date.now() - new Date(runStatus.startedAt).getTime()) / 1000)
    : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 space-y-5">
      <div className="flex items-center gap-2">
        <BookOpen size={16} className="text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900">Q-Guide Data</h3>
      </div>

      {/* Q-Guide Cookie */}
      <div>
        <p className="text-xs text-gray-500 mb-2">
          Q-Guide cookies from <span className="font-mono">qreports.fas.harvard.edu</span>. Get them from DevTools → Application → Cookies.
        </p>
        <div className="space-y-2 mb-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">ASP.NET_SessionId</label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Paste session ID value..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': 'var(--harvard-crimson)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">CookieName</label>
            <input
              type="text"
              value={cookieName}
              onChange={(e) => setCookieName(e.target.value)}
              placeholder="Paste CookieName value..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': 'var(--harvard-crimson)' }}
            />
          </div>
        </div>
        {cookieResult && (
          <div className={`mb-2 p-3 rounded-md border text-sm flex items-center gap-2 ${
            cookieResult.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {cookieResult.type === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {cookieResult.message}
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleTestCookie}
            disabled={testing || testingSaved || saving || !hasInput}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            {testing ? <Loader2 size={14} className="animate-spin" /> : <FlaskConical size={14} />}
            {testing ? 'Testing...' : 'Test Cookie'}
          </button>
          <button
            onClick={handleSaveCookie}
            disabled={testing || testingSaved || saving || !hasInput}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-md disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-opacity"
            style={{ backgroundColor: 'var(--harvard-crimson)' }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save to GitHub'}
          </button>
          <button
            onClick={handleTestSaved}
            disabled={testing || testingSaved || saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            {testingSaved ? <Loader2 size={14} className="animate-spin" /> : <FlaskConical size={14} />}
            {testingSaved ? 'Testing...' : 'Test Saved'}
          </button>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Upload Index HTML */}
      <div>
        <p className="text-xs text-gray-500 mb-2">
          Upload Q-Guide browse page HTML. Save the page from <span className="font-mono">qreports.fas.harvard.edu/browse/index</span> (Ctrl+S → HTML only), pick the semester, and upload.
        </p>
        {uploadResult && (
          <div className={`mb-2 p-3 rounded-md border text-sm flex items-center gap-2 ${
            uploadResult.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {uploadResult.type === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {uploadResult.message}
          </div>
        )}
        <div className="flex items-end gap-2 flex-wrap">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Term</label>
            <select
              value={uploadTerm}
              onChange={(e) => setUploadTerm(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="Fall">Fall</option>
              <option value="Spring">Spring</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Year</label>
            <select
              value={uploadYear}
              onChange={(e) => setUploadYear(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 3 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
            <Upload size={14} />
            {uploadFile ? uploadFile.name : 'Choose File'}
            <input
              type="file"
              accept=".html,.htm"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          <button
            onClick={handleUpload}
            disabled={uploading || !uploadFile}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-md disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-opacity"
            style={{ backgroundColor: 'var(--harvard-crimson)' }}
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Uploading...' : `Upload as QReports_${uploadYear}${uploadTerm}.htm`}
          </button>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Run Pipeline */}
      <div>
        <p className="text-xs text-gray-500 mb-2">
          Run the full Q-Guide pipeline: parse index → download reports → analyze → merge with course data. Requires cookie to be saved and at least one index HTML uploaded.
        </p>

        {running && (
          <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            <span>Q-Guide pipeline running{elapsed !== null ? ` · ${Math.floor(elapsed / 60)}m ${elapsed % 60}s elapsed` : ''}...</span>
          </div>
        )}

        {isComplete && runStatus?.conclusion && (
          <div className={`mb-2 p-3 rounded-md border text-sm flex items-center gap-2 ${
            runStatus.conclusion === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {runStatus.conclusion === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            Q-Guide pipeline {runStatus.conclusion}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunPipeline}
            disabled={running}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {running ? 'Running...' : 'Download & Analyze'}
          </button>

          {runId && (
            <button
              onClick={() => setLogsOpen(!logsOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
            >
              {logsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Logs
            </button>
          )}

          {runStatus?.htmlUrl && (
            <a
              href={runStatus.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ExternalLink size={14} />
              GitHub
            </a>
          )}
        </div>

        {logsOpen && runLogs.length > 0 && (
          <div className="mt-2 p-3 bg-gray-900 rounded-md text-xs text-gray-300 font-mono overflow-x-auto max-h-60 overflow-y-auto">
            {runLogs.map((line, i) => (
              <div key={i} className="whitespace-pre">{line}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Admin Dashboard ---
function AdminDashboard({ onLogout }) {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scrapeStates, setScrapeStates] = useState({}); // { [term]: { runId, status, conclusion, ... } }

  // Add semester form
  const [newTerm, setNewTerm] = useState('Fall');
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [adding, setAdding] = useState(false);

  const pollTimers = useRef({});

  // Fetch semesters
  const fetchSemesters = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/semesters');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setSemesters(data.semesters || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSemesters();
  }, [fetchSemesters]);

  // Cleanup poll timers on unmount
  useEffect(() => {
    return () => {
      Object.values(pollTimers.current).forEach(clearInterval);
    };
  }, []);

  // Poll scrape status
  const pollScrapeStatus = useCallback((term, runId) => {
    // Clear any existing poll for this term
    if (pollTimers.current[term]) clearInterval(pollTimers.current[term]);

    const poll = async () => {
      try {
        const statusRes = await fetch(`/api/admin/scrape-status?runId=${runId}`);
        const statusData = await statusRes.json();

        const logsRes = await fetch(`/api/admin/scrape-logs?runId=${runId}`);
        const logsData = await logsRes.json();

        setScrapeStates(prev => ({
          ...prev,
          [term]: {
            runId,
            status: statusData.status,
            conclusion: statusData.conclusion,
            startedAt: statusData.startedAt,
            htmlUrl: statusData.htmlUrl,
            logs: logsData.steps || [],
          },
        }));

        // Stop polling when completed
        if (statusData.status === 'completed') {
          clearInterval(pollTimers.current[term]);
          delete pollTimers.current[term];
          // Refresh semester data (config.json may have been updated by the workflow)
          setTimeout(fetchSemesters, 5000);
        }
      } catch {
        // Silently retry on next poll
      }
    };

    poll(); // Immediate first check
    pollTimers.current[term] = setInterval(poll, 8000);
  }, [fetchSemesters]);

  // Trigger scrape
  const handleScrape = async (term) => {
    const [termName, year] = term.split(' ');
    try {
      const res = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: termName, year }),
      });
      const data = await res.json();

      if (data.runId) {
        setScrapeStates(prev => ({
          ...prev,
          [term]: { runId: data.runId, status: data.status, conclusion: null },
        }));
        pollScrapeStatus(term, data.runId);
      }
    } catch (err) {
      setError(`Failed to start scrape: ${err.message}`);
    }
  };

  // Publish/unpublish
  const handlePublish = async (term, published) => {
    try {
      await fetch('/api/admin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term, published }),
      });
      fetchSemesters();
    } catch (err) {
      setError(`Failed to update: ${err.message}`);
    }
  };

  // Remove semester
  const handleRemove = async (term) => {
    try {
      await fetch('/api/admin/semesters', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term }),
      });
      fetchSemesters();
    } catch (err) {
      setError(`Failed to remove: ${err.message}`);
    }
  };

  // Set default semester
  const handleSetDefault = async (term) => {
    try {
      await fetch('/api/admin/set-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term }),
      });
      fetchSemesters();
    } catch (err) {
      setError(`Failed to set default: ${err.message}`);
    }
  };

  // Add semester
  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch('/api/admin/semesters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: newTerm, year: newYear }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to add');
      } else {
        fetchSemesters();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    onLogout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--harvard-crimson)' }}>
            <Lock size={14} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">CrimsonCal Admin</h1>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 cursor-pointer transition-colors"
        >
          <LogOut size={14} />
          Logout
        </button>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 cursor-pointer">×</button>
          </div>
        )}

        {/* Semester cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Semesters</h2>
          </div>

          {semesters.length === 0 && (
            <p className="text-sm text-gray-500">No semesters configured yet.</p>
          )}

          {semesters.map((sem, idx) => (
            <SemesterCard
              key={sem.term}
              semester={sem}
              isDefault={idx === 0 && sem.published}
              onScrape={handleScrape}
              onPublish={handlePublish}
              onRemove={handleRemove}
              onSetDefault={handleSetDefault}
              scrapeState={scrapeStates[sem.term]}
            />
          ))}
        </div>

        {/* Add semester */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Semester</h3>
          <form onSubmit={handleAdd} className="flex items-end gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Term</label>
              <select
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
              >
                <option value="Fall">Fall</option>
                <option value="Spring">Spring</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Year</label>
              <select
                value={newYear}
                onChange={(e) => setNewYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={adding}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-opacity"
              style={{ backgroundColor: 'var(--harvard-crimson)' }}
            >
              <Plus size={14} />
              {adding ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>

        {/* Harvard cookie management */}
        <CookieManager />

        {/* Q-Guide management */}
        <QGuideManager />
      </main>
    </div>
  );
}

// --- Main Admin Component (auth gate) ---
export default function Admin() {
  const [authenticated, setAuthenticated] = useState(null); // null = checking, true/false

  useEffect(() => {
    fetch('/api/admin/session')
      .then(res => res.json())
      .then(data => setAuthenticated(data.authenticated))
      .catch(() => setAuthenticated(false));
  }, []);

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (!authenticated) {
    return <AdminLogin onLogin={() => setAuthenticated(true)} />;
  }

  return <AdminDashboard onLogout={() => setAuthenticated(false)} />;
}
