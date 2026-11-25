import { createSign } from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API_BASE = 'https://searchconsole.googleapis.com/webmasters/v3';

export type SearchConsoleKeyword = {
  keyword: string;
  impressions: number;
  clicks: number;
  position: number;
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`إعداد ${name} غير موجود في متغيرات البيئة.`);
  return value;
}

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function getServiceAccountToken() {
  const email = requiredEnv('GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL');
  const privateKey = requiredEnv('GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY').replace(/\\n/g, '\n');
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(JSON.stringify({
    iss: email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claim}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${base64url(signer.sign(privateKey))}`;
  return fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
    cache: 'no-store',
  });
}

export function isSearchConsoleConfigured() {
  return Boolean(process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim()
    && process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL?.trim()
    && process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY?.trim());
}

/** Fetches the most recent complete 28-day query window from Search Console. */
export async function fetchSearchConsoleKeywords(): Promise<{ siteUrl: string; startDate: string; endDate: string; rows: SearchConsoleKeyword[] }> {
  const siteUrl = requiredEnv('GOOGLE_SEARCH_CONSOLE_SITE_URL');
  const tokenResponse = await getServiceAccountToken();
  const tokenData = await tokenResponse.json() as { access_token?: string; error_description?: string; error?: string };
  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(`تعذر الحصول على رمز Google: ${tokenData.error_description ?? tokenData.error ?? tokenResponse.status}`);
  }

  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 3); // Search Console data can be delayed.
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 27);
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  const startDate = iso(start);
  const endDate = iso(end);
  const encodedSite = encodeURIComponent(siteUrl);
  const allRows: SearchConsoleKeyword[] = [];

  const maxRows = 100000; // Bound each sync; Search Analytics is sampled/limited by Google.
  for (let startRow = 0; startRow < maxRows; startRow += 25000) {
    const response = await fetch(`${API_BASE}/sites/${encodedSite}/searchAnalytics/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate, endDate, dimensions: ['query'], rowLimit: 25000, startRow, type: 'web' }),
      cache: 'no-store',
      signal: AbortSignal.timeout(30000),
    });
    const data = await response.json() as { rows?: Array<{ keys?: string[]; impressions?: number; clicks?: number; position?: number }>; error?: { message?: string } };
    if (!response.ok) throw new Error(`خطأ Search Console: ${data.error?.message ?? response.status}`);
    const rows = (data.rows ?? []).flatMap(row => {
      const keyword = row.keys?.[0]?.trim();
      return keyword ? [{ keyword, impressions: Math.round(row.impressions ?? 0), clicks: Math.round(row.clicks ?? 0), position: Number((row.position ?? 0).toFixed(2)) }] : [];
    });
    allRows.push(...rows);
    if (rows.length < 25000) break;
  }
  return { siteUrl, startDate, endDate, rows: allRows };
}
