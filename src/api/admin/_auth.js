// Shared auth helper for admin API endpoints
import { jwtVerify, SignJWT } from 'jose';
import crypto from 'crypto';

const getSecret = () => new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);

export async function createToken() {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret());
}

export async function verifyToken(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/(?:^|;\s*)admin_token=([^;]+)/);
  if (!match) return false;

  try {
    await jwtVerify(match[1], getSecret());
    return true;
  } catch {
    return false;
  }
}

export function checkPassword(input) {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (input.length !== expected.length) {
    // Still do timing-safe compare to avoid leaking length via early return timing
    crypto.timingSafeEqual(
      Buffer.from(input.padEnd(expected.length, '\0')),
      Buffer.from(expected)
    );
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(input), Buffer.from(expected));
}

// Simple in-memory rate limiting per function instance
const attempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(ip) {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now - record.windowStart > WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }

  record.count++;
  return true;
}

// GitHub API helper
const GITHUB_OWNER = 'andreaslordos';
const GITHUB_REPO = 'crimsoncal';

export async function githubFetch(path, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN not configured');

  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body}`);
  }

  return res;
}

export async function getConfigFromGitHub() {
  const res = await githubFetch('/contents/public/data/config.json');
  const data = await res.json();
  const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
  return { content, sha: data.sha };
}

export async function updateConfigOnGitHub(config, sha, message) {
  await githubFetch('/contents/public/data/config.json', {
    method: 'PUT',
    body: JSON.stringify({
      message: message || 'Update config.json via admin panel',
      content: Buffer.from(JSON.stringify(config, null, 2) + '\n').toString('base64'),
      sha,
    }),
  });
}
